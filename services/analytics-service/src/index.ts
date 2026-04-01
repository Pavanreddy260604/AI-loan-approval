import express, { Request, Response, NextFunction } from "express";
import { createPublicKey, randomUUID, type KeyObject } from "node:crypto";
import amqp from "amqplib";
import { jwtVerify } from "jose";
import { z } from "zod";
import { decodeBase64Pem, loadEnv, createLogger } from "@ai-loan/config";
import { eventTopics } from "@ai-loan/contracts";
import { createPool, runMigrations, checkHealth, mapRows } from "@ai-loan/db";

const env = loadEnv(
  "analytics-service",
  z.object({
    PORT: z.coerce.number().default(4006),
    ANALYTICS_DATABASE_URL: z.string(),
    RABBITMQ_URL: z.string(),
    JWT_PUBLIC_KEY_BASE64: z.string(),
    JWT_ISSUER: z.string(),
    JWT_AUDIENCE: z.string(),
  }),
);

const logger = createLogger("analytics-service");
const app = express();
app.use(express.json({ limit: "1mb" }));

app.use((req, _res, next) => {
  const correlationId = req.header("x-correlation-id");
  if (correlationId) {
    (req as any).correlationId = correlationId;
  }
  
  if (req.path !== "/health") {
    logger.info({ 
      method: req.method, 
      path: req.path, 
      correlationId: (req as any).correlationId 
    }, `Inbound request: ${req.method} ${req.path}`);
  }
  next();
});
const pool = createPool(env.ANALYTICS_DATABASE_URL, "analytics-service");
const exchangeName = "platform.events";
const publicKey: KeyObject = createPublicKey(decodeBase64Pem(env.JWT_PUBLIC_KEY_BASE64));

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

const migrations = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,
  `CREATE TABLE IF NOT EXISTS tenant_metrics (
    tenant_id UUID PRIMARY KEY,
    total_datasets INTEGER NOT NULL DEFAULT 0,
    total_models INTEGER NOT NULL DEFAULT 0,
    total_predictions INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    fraud_alerts INTEGER NOT NULL DEFAULT 0,
    last_training_status TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    topic TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
];

async function ensureTenantMetric(tenantId: string): Promise<void> {
  await pool.query(
    `INSERT INTO tenant_metrics (tenant_id) VALUES ($1) ON CONFLICT (tenant_id) DO NOTHING`,
    [tenantId],
  );
}

app.get("/health", async (_req: Request, res: Response) => {
  const health = await checkHealth(pool, { rabbitmqUrl: env.RABBITMQ_URL });
  res.status(health.status === "ok" ? 200 : 503).json({ 
    ...health, 
    service: "analytics-service",
    timestamp: new Date().toISOString()
  });
});

async function authenticateInternal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token." });
    }

    const token = header.replace("Bearer ", "");
    const verified = await jwtVerify(token, publicKey, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (verified.payload.tokenType !== "access") {
      return res.status(401).json({ error: "Invalid access token." });
    }

    req.user = {
      id: verified.payload.sub as string,
      tenantId: verified.payload.tenantId as string,
      email: verified.payload.email as string,
      role: verified.payload.role as string,
    };
    return next();
  } catch (error) {
    logger.error({ error }, "Identity verification failed");
    return res.status(401).json({ error: "Unauthorized." });
  }
}

app.use("/internal", authenticateInternal);

app.get("/internal/analytics/tenant/:tenantId", async (req: AuthenticatedRequest, res: Response) => {
  const { tenantId } = req.params;
  if (tenantId !== req.user!.tenantId) {
    return res.status(403).json({ error: "Forbidden." });
  }
  await ensureTenantMetric(tenantId);
  const metricsResult = await pool.query(`SELECT * FROM tenant_metrics WHERE tenant_id = $1`, [tenantId]);
  const metrics = mapRows(metricsResult, true)[0];
  
  const activitiesResult = await pool.query(
    `SELECT topic, payload, created_at FROM activity_feed WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 10`,
    [tenantId],
  );
  const activities = mapRows(activitiesResult, true);
  
  res.json({ metrics, activities });
});

app.get("/internal/analytics/admin", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "ADMIN") {
    logger.warn({ userId: req.user?.id, role: req.user?.role }, "Unauthorized admin access attempt");
    return res.status(403).json({ error: "Forbidden." });
  }
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total_tenants,
       COALESCE(SUM(total_datasets), 0)::int AS total_datasets,
       COALESCE(SUM(total_models), 0)::int AS total_models,
       COALESCE(SUM(total_predictions), 0)::int AS total_predictions,
       COALESCE(SUM(credits_used), 0)::int AS credits_used,
       COALESCE(SUM(fraud_alerts), 0)::int AS fraud_alerts
     FROM tenant_metrics`,
  );
  res.json(mapRows(result, true)[0]);
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectAmqpWithRetry(url: string, label: string) {
  while (true) {
    try {
      const connection = await amqp.connect(url);
      connection.on("error", (err) => {
        logger.error({ err }, "RabbitMQ connection error - terminating for restart");
        process.exit(1);
      });
      connection.on("close", () => {
        logger.warn("RabbitMQ connection closed - terminating for restart");
        process.exit(1);
      });
      return connection;
    } catch (error) {
      logger.error({ error, label }, `${label} endpoint unreachable. Retrying in 2 seconds.`);
      await delay(2000);
    }
  }
}

async function startConsumer(): Promise<void> {
  const connection = await connectAmqpWithRetry(env.RABBITMQ_URL, "RabbitMQ");
  const channel = await connection.createChannel();
  await channel.assertExchange(exchangeName, "topic", { durable: true });
  const queue = await channel.assertQueue("analytics-service.events", { durable: true });

  const topics = Object.values(eventTopics);
  for (const topic of topics) {
    await channel.bindQueue(queue.queue, exchangeName, topic);
  }

  channel.consume(queue.queue, async (message) => {
    if (!message) return;
    try {
      const payload = JSON.parse(message.content.toString());
      const topic = message.fields.routingKey;
      const tenantId = payload.tenantId || null;

      if (tenantId) {
        await ensureTenantMetric(tenantId);
        await pool.query(
          `INSERT INTO activity_feed (id, tenant_id, topic, payload) VALUES ($1, $2, $3, $4::jsonb)`,
          [randomUUID(), tenantId, topic, JSON.stringify(payload)],
        );
      }

      if (topic === eventTopics.DATASET_UPLOADED) {
        await pool.query(
          `UPDATE tenant_metrics SET total_datasets = total_datasets + 1, updated_at = NOW() WHERE tenant_id = $1`,
          [tenantId],
        );
      }

      if (topic === eventTopics.TRAINING_COMPLETED) {
        await pool.query(
          `UPDATE tenant_metrics
           SET total_models = total_models + 1, last_training_status = 'completed', updated_at = NOW()
           WHERE tenant_id = $1`,
          [tenantId],
        );
      }

      if (topic === eventTopics.PREDICTION_COMPLETED) {
        const count = payload.count || 1;
        await pool.query(
          `UPDATE tenant_metrics
           SET total_predictions = total_predictions + $2, credits_used = credits_used + $2, updated_at = NOW()
           WHERE tenant_id = $1`,
          [tenantId, count],
        );
      }

      if (topic === eventTopics.FRAUD_FLAGGED) {
        await pool.query(
          `UPDATE tenant_metrics SET fraud_alerts = fraud_alerts + 1, updated_at = NOW() WHERE tenant_id = $1`,
          [tenantId],
        );
      }

      channel.ack(message);
    } catch (error) {
      logger.error({ error }, "Analytics projections consumer reached exception state");
      channel.nack(message, false, false);
    }
  });
}

async function start() {
  logger.info("Analytics service bootstrap initiating...");
  await runMigrations(pool, migrations);
  logger.info("Schema migrations confirmed");
  await startConsumer();

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Analytics service operational");
  });
}

start().catch((error) => {
  logger.error({ error }, "Analytics service critical startup failure");
  process.exit(1);
});
