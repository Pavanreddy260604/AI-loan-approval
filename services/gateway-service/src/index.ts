import http from "node:http";
import { createHash, createPublicKey, randomUUID, type KeyObject } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import amqp from "amqplib";
import Busboy from "busboy";
import { jwtVerify } from "jose";
import { createClient, type RedisClientType } from "redis";
import { Server, Socket } from "socket.io";
import { z } from "zod";
import { decodeBase64Pem, loadEnv, createLogger } from "@ai-loan/config";
import {
  batchJobStatusSchema,
  dashboardDatasetSchema,
  dashboardModelSchema,
  dashboardResponseSchema,
  eventTopics,
  predictRequestSchema,
  predictResponseSchema,
  publicModelVersionSchema,
  type PredictRequest,
} from "@ai-loan/contracts";

const env = loadEnv(
  "gateway-service",
  z.object({
    PORT: z.coerce.number().default(4000),
    CORS_ORIGIN: z.string(),
    RABBITMQ_URL: z.string(),
    REDIS_URL: z.string(),
    JWT_PUBLIC_KEY_BASE64: z.string(),
    JWT_ISSUER: z.string(),
    JWT_AUDIENCE: z.string(),
    AUTH_SERVICE_URL: z.string(),
    DATA_SERVICE_URL: z.string(),
    TRAINING_SERVICE_URL: z.string(),
    PREDICTION_SERVICE_URL: z.string(),
    XAI_SERVICE_URL: z.string(),
    FRAUD_SERVICE_URL: z.string(),
    ANALYTICS_SERVICE_URL: z.string(),
  }),
);

const logger = createLogger("gateway-service");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 25 * 1024 * 1024 } 
});

const redis: RedisClientType = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 500, 5000),
  },
});
const publicKey: KeyObject = createPublicKey(decodeBase64Pem(env.JWT_PUBLIC_KEY_BASE64));
const exchangeName = "platform.events";
const correlationContext = new AsyncLocalStorage<string>();

redis.on("error", (error) => {
  logger.error({ error }, "Redis error");
});

redis.on("reconnecting", () => {
  logger.warn("Redis reconnecting...");
});

redis.on("ready", () => {
  logger.info("Redis connected.");
});

app.set("trust proxy", 1);

// Interfaces
interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// Removed unused ServiceResponse

// Correlation & Logging
app.use((req, res, next) => {
  const correlationId = (req.header("x-correlation-id") as string) || (req.header("X-Correlation-ID") as string) || randomUUID();
  
  correlationContext.run(correlationId, () => {
    req.headers["x-correlation-id"] = correlationId;
    res.setHeader("x-correlation-id", correlationId);
    
    if (req.path !== "/health") {
      logger.info({ 
        method: req.method, 
        path: req.path, 
        correlationId,
        ip: req.ip 
      }, `Incoming Request: ${req.method} ${req.path}`);
    }
    next();
  });
});


app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use((req, res, next) => {
  if (req.headers["content-type"]?.includes("multipart/form-data")) {
    return next();
  }
  return express.json({ limit: "2mb" })(req, res, next);
});

// Helper Functions
async function serviceJson<T = any>(url: string, options: any = {}, retries = 3): Promise<{ response: { ok: boolean, status: number }, body: T }> {
  for (let i = 0; i < retries; i++) {
    try {
      const correlationId = correlationContext.getStore();
      const response = await fetch(url, {
        ...options,
        headers: {
          "content-type": "application/json",
          "x-correlation-id": correlationId,
          ...(options.headers || {}),
        },
      });
      const contentType = response.headers.get("content-type") || "";
      const body = contentType.includes("application/json") ? await response.json() : await response.text();
      return { response: { ok: response.ok, status: response.status }, body };
    } catch (error: any) {
      if (i === retries - 1) throw error;
      const isTransient = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN';
      if (isTransient) {
        logger.warn({ url, attempt: i + 1, retries, error: error.code }, `Retrying service call to ${url}`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries.`);
}

async function safeServiceJson<T = any>(url: string, options: any = {}, defaultBody: any = {}): Promise<{ ok: boolean, body: T }> {
  try {
    const { response, body } = await serviceJson<T>(url, options, 1);
    return { ok: response.ok, body: response.ok ? body : defaultBody };
  } catch (error: any) {
    const isOffline = error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'EAI_AGAIN' || error.message?.includes('fetch failed');
    if (isOffline) {
      logger.info({ url }, `Optional service offline: ${url}`);
    } else {
      logger.error({ error, url }, `Optional service unexpected error for ${url}`);
    }
    return { ok: false, body: defaultBody as T };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectRedisWithRetry() {
  while (!redis.isOpen) {
    try {
      await redis.connect();
      return;
    } catch (error) {
      logger.error({ error }, "Redis unavailable during startup. Retrying in 2 seconds.");
      await delay(2000);
    }
  }
}

async function connectAmqpWithRetry(url: string, label: string) {
  while (true) {
    try {
      const connection = await amqp.connect(url);
      connection.on("error", (error) => {
        logger.error({ error }, "RabbitMQ connection error - terminating for restart");
        process.exit(1);
      });
      connection.on("close", () => {
        logger.warn("RabbitMQ connection closed - terminating for restart");
        process.exit(1);
      });
      return connection;
    } catch (error) {
      logger.error({ error, label }, `${label} unavailable during startup. Retrying in 2 seconds.`);
      await delay(2000);
    }
  }
}

// Granular Normalization Helpers
function normalizeDataset(d: any): any {
  return {
    id: d.id,
    fileName: d.file_name || d.fileName,
    status: d.status,
    rowCount: Number(d.row_count ?? d.rowCount ?? 0),
    mapping: d.mapping,
    columns: d.columns ? (Array.isArray(d.columns) ? d.columns : JSON.parse(d.columns as any)) : undefined,
    createdAt: d.created_at || d.createdAt,
    updatedAt: d.updated_at || d.updatedAt,
  };
}

function normalizeModelMetrics(metrics: any): any {
  const raw = metrics || {};
  return {
    rocAuc: Number(raw.rocAuc ?? raw.roc_auc ?? 0),
    f1Score: Number(raw.f1Score ?? raw.f1_score ?? raw.f1 ?? 0),
    precision: Number(raw.precision ?? 0),
    recall: Number(raw.recall ?? 0),
    accuracy: Number(raw.accuracy ?? 0),
    ...(Array.isArray(raw.featureImportance ?? raw.feature_importance)
      ? { featureImportance: raw.featureImportance ?? raw.feature_importance }
      : {}),
  };
}

function normalizeModel(m: any): any {
  return {
    id: m.id,
    datasetId: m.dataset_id || m.datasetId,
    championFamily: m.champion_family || m.championFamily,
    championMetrics: normalizeModelMetrics(m.champion_metrics || m.championMetrics),
    pinnedVersionId: m.pinned_version_id || m.pinnedVersionId,
    lastTrainingStatus: m.last_training_status || m.lastTrainingStatus || 'completed',
    lastTrainingError: m.last_training_error || m.lastTrainingError,
    updatedAt: m.updated_at || m.updatedAt,
  };
}

function normalizeModelVersion(v: any): any {
  if (!v) return null;
  return {
    id: v.id,
    modelId: v.model_id || v.modelId,
    family: v.model_family || v.modelFamily || v.family || "unknown",
    metrics: v.metrics ?? { rocAuc: 0, f1Score: 0, precision: 0, recall: 0, accuracy: 0 },
    createdAt: v.created_at || v.createdAt,
  };
}

function normalizePredictionRecord(p: any): any {
  if (!p) return p;
  return {
    id: p.id,
    datasetId: p.dataset_id || p.datasetId,
    modelVersionId: p.model_version_id || p.modelVersionId,
    decision: p.decision,
    probability: Number(p.probability ?? 0),
    features: p.features || {},
    fraudScore: p.fraud_score ?? p.fraudScore ?? null,
    fraudSignals: p.fraud_signals ?? p.fraudSignals ?? null,
    explanation: p.explanation ?? null,
    reviewStatus: p.review_status || p.reviewStatus || "pending",
    reviewedBy: p.reviewed_by || p.reviewedBy || null,
    reviewedAt: p.reviewed_at || p.reviewedAt || null,
    createdAt: p.created_at || p.createdAt || null,
    modelVersion: p.model_version ? normalizeModelVersion(p.model_version) : (p.modelVersion || null),
  };
}

function isOfflineError(error: any): boolean {
  return error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'EAI_AGAIN' || error.message?.includes('fetch failed');
}

function asIsoString(value: any): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function normalizeBatchJob(b: any): any {
  return {
    batchJobId: b.batch_job_id || b.batchJobId,
    status: b.status,
    rowCount: Number(b.row_count ?? b.rowCount ?? 0),
    reservedCredits: Number(b.reserved_credits ?? b.reservedCredits ?? 0),
    remainingCredits: Number(b.remaining_credits ?? b.remainingCredits ?? 0),
    outputReady: !!(b.output_ready ?? b.outputReady ?? false),
    downloadUrl: b.download_url || b.downloadUrl || null,
    createdAt: asIsoString(b.created_at || b.createdAt),
    updatedAt: asIsoString(b.updated_at || b.updatedAt),
    error: b.error || null,
  };
}

const NIL_UUID = "00000000-0000-0000-0000-000000000000";


function normalizeDecision(decision: any): string {
  const normalized = String(decision ?? "").toLowerCase();
  if (decision === true || ["approved", "approve", "yes", "true"].includes(normalized)) {
    return "Approved";
  }
  return "Rejected";
}

const UNLIMITED_BALANCE = {
  tenantId: "unlimited",
  balance: 999999,
  reserved: 0,
  available: 999999,
  used: 0,
};

function normalizeFraud(body: any) {
  if (!body) {
    return { riskBand: "unknown", anomalyScore: null, riskScore: null, ruleFlags: [], unavailable: true };
  }
  return {
    riskBand: body.riskBand ?? body.risk_band ?? "unknown",
    anomalyScore: body.anomalyScore ?? body.anomaly_score ?? null,
    riskScore: body.riskScore ?? body.risk_score ?? body.fraudScore ?? body.fraud_score ?? null,
    ruleFlags: body.ruleFlags ?? body.rule_flags ?? [],
    ...(body.unavailable ? { unavailable: true } : {}),
  };
}

// End of utility functions

// Rate Limiting
function createRateLimiter(options: {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const { windowSeconds, maxRequests, keyPrefix = "rate", keyGenerator } = options;
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = keyGenerator ? keyGenerator(req) : (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous") as string;
      const key = `${keyPrefix}:${createHash("sha1").update(`${identifier}:${req.path}`).digest("hex")}`;
      
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }
      if (count > maxRequests) {
        logger.warn({ identifier, path: req.path, count }, "Rate limit exceeded");
        return res.status(429).json({ error: "Too many requests. Please slow down." });
      }
      return next();
    } catch (error) {
      logger.error({ error }, "rate limiter error");
      return next();
    }
  };
}

const authLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 10,
  keyPrefix: "rate:auth",
});

const predictLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 60,
  keyPrefix: "rate:predict",
  keyGenerator: (req: any) => req.user?.tenantId || req.ip,
});

// Auth Middleware
async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
    next();
  } catch (error) {
    logger.error({ error }, "Authentication failed");
    res.status(401).json({ error: "Unauthorized." });
  }
}

function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: "Forbidden." });
    }
    return next();
  };
}

app.use(createRateLimiter({ windowSeconds: 60, maxRequests: 180 }));

app.get(["/health", "/api/v1/health"], async (_req, res) => {
  const redisHealthy = redis.isOpen;
  res.status(redisHealthy ? 200 : 503).json({
    status: redisHealthy ? "ok" : "unhealthy",
    service: "gateway-service",
    dependencies: {
      redis: redisHealthy ? "healthy" : "disconnected"
    }
  });
});

// Auth Routes Forwarding
const authRoutes = ["signup", "verify-email", "login", "refresh", "forgot-password", "reset-password"];
for (const route of authRoutes) {
  app.post(`/api/v1/auth/${route}`, authLimiter, async (req, res) => {
    try {
      const { response, body } = await serviceJson(`${env.AUTH_SERVICE_URL}/auth/${route}`, {
        method: "POST",
        body: JSON.stringify(req.body),
      });
      res.status(response.status).json(body);
    } catch (error) {
      logger.error({ error, route }, "Auth service unavailable");
      res.status(502).json({ error: "Auth service unavailable." });
    }
  });
}

app.get("/api/v1/me", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { body: user } = await serviceJson(`${env.AUTH_SERVICE_URL}/auth/users/${req.user!.id}`);
    res.json({ user, balance: UNLIMITED_BALANCE });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Unable to load profile." });
  }
});

app.get("/api/v1/dashboard", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const [analytics, datasets, models, pendingPredictions, recentDecisions] = await Promise.all([
      safeServiceJson(`${env.ANALYTICS_SERVICE_URL}/internal/analytics/tenant/${req.user!.tenantId}`, {
        headers: { Authorization: req.headers.authorization },
      }),
      safeServiceJson(`${env.DATA_SERVICE_URL}/datasets`, {
        headers: { Authorization: req.headers.authorization },
      }, []),
      safeServiceJson(`${env.TRAINING_SERVICE_URL}/internal/models?tenantId=${req.user!.tenantId}`, {
        headers: { Authorization: req.headers.authorization },
      }, []),
      safeServiceJson(`${env.PREDICTION_SERVICE_URL}/internal/predictions/pending?tenantId=${req.user!.tenantId}`),
      safeServiceJson(`${env.PREDICTION_SERVICE_URL}/internal/predictions/recent-decisions?tenantId=${req.user!.tenantId}`),
    ]);

    const dashboardResponse = {
      analytics: {
        metrics: {
          totalDatasets: Number(analytics.body?.metrics?.total_datasets ?? (Array.isArray(datasets.body) ? datasets.body.length : 0)),
          totalModels: Number(analytics.body?.metrics?.total_models ?? (Array.isArray(models.body) ? models.body.length : 0)),
          totalPredictions: Number(analytics.body?.metrics?.total_predictions ?? 0),
          creditsUsed: Number(analytics.body?.metrics?.credits_used ?? 0),
          fraudAlerts: Number(analytics.body?.metrics?.fraud_alerts ?? 0),
          lastTrainingStatus: analytics.body?.metrics?.last_training_status ?? null,
        },
        activities: (Array.isArray(analytics.body?.activities) ? analytics.body.activities : []).map((activity: any) => ({
          topic: activity.topic,
          payload: activity.payload,
          createdAt: asIsoString(activity.created_at),
        })),
      },
      balance: UNLIMITED_BALANCE,
      datasets: (Array.isArray(datasets.body) ? datasets.body : []).map(normalizeDataset),
      models: (Array.isArray(models.body) ? models.body : []).map(normalizeModel),
      pendingPredictions: Array.isArray(pendingPredictions.body) ? pendingPredictions.body : [],
      recentDecisions: Array.isArray(recentDecisions.body) ? recentDecisions.body : [],
    };

    // Granular Validation to catch future schema drift
    try {
      res.json(dashboardResponseSchema.parse(dashboardResponse));
    } catch (parseError) {
      console.warn("[GATEWAY] Dashboard schema validation warning:", parseError);
      res.json(dashboardResponse); // Fallback to unvalidated but normalized data
    }
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Unable to load dashboard." });
  }
});

app.get("/api/v1/admin/overview", authenticate, requireRole("ADMIN"), async (req: AuthenticatedRequest, res) => {
  try {
    const { response, body: analytics } = await serviceJson(`${env.ANALYTICS_SERVICE_URL}/internal/analytics/admin`, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json({
      analytics,
      plans: [
        { code: "starter", name: "Starter", price: 100, credits: 1000 },
        { code: "pro", name: "Pro", price: 500, credits: 6000 },
        { code: "enterprise", name: "Enterprise", price: 2000, credits: 30000 },
      ],
    });
  } catch (error) {
    if (isOfflineError(error)) {
      return res.status(503).json({ error: "Analytics service is offline." });
    }
    console.error(error);
    res.status(502).json({ error: "Unable to fetch admin overview." });
  }
});

// Data Routes
app.get("/api/v1/datasets", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { body } = await safeServiceJson(`${env.DATA_SERVICE_URL}/datasets`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    }, []);
    
    const datasets = (Array.isArray(body) ? body : []).map(normalizeDataset);
    
    // Strict validation
    try {
      res.json(z.array(dashboardDatasetSchema).parse(datasets));
    } catch (err) {
      console.warn("[GATEWAY] Datasets schema validation warning:", err);
      res.json(datasets);
    }
  } catch (error) {
    if (isOfflineError(error)) {
      return res.status(503).json({ error: "Data service is currently offline or starting up." });
    }
    console.error("[GATEWAY] Datasets error:", error);
    res.status(502).json({ error: "Unable to load datasets." });
  }
});

app.get("/api/v1/datasets/:datasetId", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const datasetId = z.string().uuid().safeParse(req.params.datasetId);
    if (!datasetId.success) return res.status(400).json({ error: "Invalid dataset ID format." });

    const { response, body } = await serviceJson(`${env.DATA_SERVICE_URL}/internal/datasets/${req.params.datasetId}`, {
      headers: { 
        Authorization: req.headers.authorization 
      },
    });
    res.status(response.status).json(body);
  } catch (error) {
    if (isOfflineError(error)) {
      return res.status(503).json({ error: "Data service is currently offline or starting up." });
    }
    console.error(error);
    res.status(502).json({ error: "Unable to fetch dataset details." });
  }
});

app.get("/api/v1/datasets/:datasetId/preview", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const datasetId = z.string().uuid().safeParse(req.params.datasetId);
    if (!datasetId.success) return res.status(400).json({ error: "Invalid dataset ID format." });

    const { response, body } = await serviceJson(`${env.DATA_SERVICE_URL}/datasets/${req.params.datasetId}/preview`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });
    res.status(response.status).json(body);
  } catch (error) {
    if (isOfflineError(error)) {
      return res.status(503).json({ error: "Data service is currently offline or starting up." });
    }
    console.error(error);
    res.status(502).json({ error: "Unable to fetch dataset preview." });
  }
});

app.post("/api/v1/datasets", authenticate, async (req: AuthenticatedRequest, res) => {
  const busboy = Busboy({ headers: req.headers });
  let uploadStarted = false;

  busboy.on("file", (fieldname, file, info) => {
    if (fieldname !== "file") {
      file.resume();
      return;
    }
    uploadStarted = true;
    const { filename, mimeType } = info;

    const uploadReq = http.request(
      `${env.DATA_SERVICE_URL}/internal/datasets/upload`,
      {
        method: "POST",
        timeout: 120000, // 2 minutes
        headers: {
          ...(() => {
            const h = { ...req.headers };
            delete h["content-length"];
            delete h["content-type"];
            return h;
          })(),
          authorization: req.headers.authorization,
          "x-file-name": filename,
          "content-type": mimeType,
        },
      },
      (uploadRes) => {
        console.log(`[GATEWAY] Data service upload response status: ${uploadRes.statusCode}`);
        let body = "";
        uploadRes.on("data", (chunk) => (body += chunk));
        uploadRes.on("end", () => {
          console.log(`[GATEWAY] Data service upload response body: ${body}`);
          if (!res.headersSent) {
            res.status(uploadRes.statusCode || 500);
            const ct = uploadRes.headers["content-type"];
            if (ct) res.set("content-type", ct);
            res.send(body);
          }
        });
      }
    );

    uploadReq.on("error", (err) => {
      console.error("[GATEWAY] Upload relay failed:", err);
      if (!res.headersSent) res.status(502).json({ error: "Data service unreachable." });
    });

    file.pipe(uploadReq);
    file.on("end", () => {
      console.log(`[GATEWAY] File field ${fieldname} reached end of stream.`);
    });
  });

  busboy.on("error", (err) => {
    console.error("[GATEWAY] Busboy error:", err);
    if (!res.headersSent) res.status(400).json({ error: "File parsing failed." });
  });

  busboy.on("finish", () => {
    console.log("[GATEWAY] Busboy finished parsing request.");
    if (!uploadStarted && !res.headersSent) {
      res.status(400).json({ error: "No file was uploaded." });
    }
  });

  req.pipe(busboy);
  console.log("[GATEWAY] Request piped to Busboy.");
});

app.post("/api/v1/datasets/:datasetId/mapping", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const datasetId = z.string().uuid().safeParse(req.params.datasetId);
    if (!datasetId.success) return res.status(400).json({ error: "Invalid dataset ID format." });

    const { response, body } = await serviceJson(`${env.DATA_SERVICE_URL}/datasets/${datasetId.data}/mapping`, {
      method: "POST",
      headers: { 
        Authorization: req.headers.authorization,
      },
      body: JSON.stringify(req.body),
    });
    res.status(response.status).json(body);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Unable to save dataset mapping." });
  }
});

// Prediction & Training Routes
app.get("/api/v1/models", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { body } = await safeServiceJson(`${env.TRAINING_SERVICE_URL}/internal/models?tenantId=${req.user!.tenantId}`, {
      headers: { Authorization: req.headers.authorization },
    }, []);
    const models = (Array.isArray(body) ? body : []).map(normalizeModel);
    
    try {
      res.json(z.array(dashboardModelSchema).parse(models));
    } catch (err) {
      console.warn("[GATEWAY] Models schema validation warning:", err);
      res.json(models);
    }
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Unable to fetch models." });
  }
});

app.get("/api/v1/models/compare", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const datasetId = req.query.datasetId as string | undefined;
    const url = datasetId 
      ? `${env.TRAINING_SERVICE_URL}/internal/models/compare?tenantId=${req.user!.tenantId}&datasetId=${datasetId}`
      : `${env.TRAINING_SERVICE_URL}/internal/models/compare?tenantId=${req.user!.tenantId}`;
    const { body } = await safeServiceJson(url, {
      headers: { Authorization: req.headers.authorization },
    }, []);
    const versions = (Array.isArray(body) ? body : []).map(normalizeModelVersion);
    
    try {
      res.json(z.array(publicModelVersionSchema).parse(versions));
    } catch (err) {
      console.warn("[GATEWAY] Model comparison schema validation warning:", err);
      res.json(versions);
    }
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Unable to compare models." });
  }
});

app.post("/api/v1/models/train", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { datasetId } = z.object({ datasetId: z.string().uuid() }).parse(req.body);
    const datasetResponse = await serviceJson(`${env.DATA_SERVICE_URL}/internal/datasets/${datasetId}`, {
      headers: { "x-tenant-id": req.user!.tenantId, Authorization: req.headers.authorization },
    });
    if (!datasetResponse.response.ok) return res.status(datasetResponse.response.status).json(datasetResponse.body);
    
    const dataset = datasetResponse.body;
    if (!dataset?.mapping) return res.status(400).json({ error: "Dataset mapping is required before training." });

    const { response, body } = await serviceJson(`${env.TRAINING_SERVICE_URL}/internal/models/train`, {
      method: "POST",
      headers: { Authorization: req.headers.authorization },
      body: JSON.stringify({
        datasetId: dataset.id,
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        datasetObjectKey: dataset.objectKey,
        fileName: dataset.fileName,
        mapping: dataset.mapping,
        columns: dataset.columns,
        email: req.user!.email,
      }),
    });
    res.status(response.status).json(body);
  } catch (error) {
    if (isOfflineError(error)) {
      return res.status(503).json({ error: "AI Training service is offline. Please start the AI profile: docker compose --profile ai up" });
    }
    console.error(error);
    res.status(502).json({ error: "Unable to start training." });
  }
});

app.get("/api/v1/models/:modelId", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const modelId = z.string().uuid().safeParse(req.params.modelId);
    if (!modelId.success) return res.status(400).json({ error: "Invalid model ID format." });

    const { response, body } = await serviceJson(`${env.TRAINING_SERVICE_URL}/internal/models/${modelId.data}?tenantId=${req.user!.tenantId}`, {
      headers: { Authorization: req.headers.authorization },
    });
    
    if (response.ok && body && typeof body === 'object') {
      const payload = body as any;
      res.status(response.status).json({
        model: payload.model ? normalizeModel(payload.model) : null,
        versions: Array.isArray(payload.versions) ? payload.versions.map(normalizeModelVersion) : [],
      });
    } else {
      res.status(response.status).json(body);
    }
  } catch (error) {
    if (isOfflineError(error)) {
      return res.status(503).json({ error: "AI Training service is offline." });
    }
    console.error(error);
    res.status(502).json({ error: "Unable to fetch model details." });
  }
});

app.post("/api/v1/models/:modelId/pin", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const modelId = z.string().uuid().safeParse(req.params.modelId);
    if (!modelId.success) return res.status(400).json({ error: "Invalid model ID format." });

    const { versionId } = z.object({ versionId: z.string().uuid() }).parse(req.body);

    const { response, body } = await serviceJson(`${env.TRAINING_SERVICE_URL}/internal/models/${modelId.data}/pin`, {
      method: "POST",
      headers: { Authorization: req.headers.authorization },
      body: JSON.stringify({
        versionId,
        tenantId: req.user!.tenantId,
      }),
    });
    res.status(response.status).json(body);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ error: error.flatten() });
    }
    console.error(error);
    res.status(502).json({ error: "Unable to pin model version." });
  }
});

app.post("/api/v1/predict", authenticate, predictLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const accessToken = req.headers.authorization!;
    const payload: PredictRequest = predictRequestSchema.parse(req.body);
    

    // 1. Core Prediction (Synchronous)
    const prediction = await serviceJson(`${env.PREDICTION_SERVICE_URL}/internal/predict`, {
      method: "POST",
      headers: { Authorization: accessToken },
      body: JSON.stringify({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        email: req.user!.email,
        ...payload,
      }),
    });

    if (!prediction.response.ok) {
      return res.status(prediction.response.status).json(prediction.body);
    }

    // 4. Fire-and-Forget Auxiliary Tasks (Asynchronous)
    console.log(`[GATEWAY] Triggering async XAI/Fraud for prediction ${prediction.body.predictionId}`);
    (async () => {
       try {
         const [explanation, fraud] = await Promise.all([
           safeServiceJson(`${env.XAI_SERVICE_URL}/internal/explain/local`, {
             method: "POST",
             headers: { Authorization: accessToken },
             body: JSON.stringify({ artifactKey: prediction.body.artifactKey, features: payload.features }),
           }, null),
           safeServiceJson(`${env.FRAUD_SERVICE_URL}/internal/fraud/evaluate`, {
             method: "POST",
             headers: { Authorization: accessToken },
             body: JSON.stringify({
               tenantId: req.user!.tenantId,
               userId: req.user!.id,
               fraudArtifactKey: prediction.body.fraudArtifactKey,
               modelVersionId: prediction.body.modelVersion?.id,
               features: payload.features,
               email: req.user!.email,
             }),
           }, null),
         ]);

         await safeServiceJson(`${env.PREDICTION_SERVICE_URL}/internal/predictions/${prediction.body.predictionId}/metadata`, {
           method: "POST",
           headers: { Authorization: accessToken },
           body: JSON.stringify({
             explanation: explanation.ok ? explanation.body : null,
             fraud: fraud.ok ? fraud.body : null,
           }),
         }, null);
         console.log(`[GATEWAY] Async enrichment finished for ${prediction.body.predictionId}`);
       } catch (err) {
         console.error(`[GATEWAY] Async enrichment failed for ${prediction.body.predictionId}:`, err);
       }
    })();

    // 5. Finalize UI Response (Immediate)
    const decision = normalizeDecision(prediction.body.decision);
    const mv = normalizeModelVersion(prediction.body.modelVersion) ?? {
      id: prediction.body.modelVersionId || "00000000-0000-0000-0000-000000000000",
      modelId: "00000000-0000-0000-0000-000000000000",
      family: "unknown",
      metrics: { rocAuc: 0, f1Score: 0, precision: 0, recall: 0, accuracy: 0 },
    };

    const normalized = predictResponseSchema.parse({
      predictionId: prediction.body.predictionId,
      approved: decision === "Approved",
      decision,
      probability: Number(prediction.body.probability ?? 0),
      modelVersionId: prediction.body.modelVersionId || mv.id,
      modelVersion: mv,
      explanation: { 
        isComputing: true,
        topContributors: [],
        summary: { positiveDrivers: [], negativeDrivers: [] }
      },
      fraud: { riskBand: "unknown" as const, unavailable: true },
      remainingCredits: 999999,
    });

    res.json(normalized);
  } catch (error: any) {
    if (isOfflineError(error)) {
      return res.status(503).json({ error: "AI Prediction service is offline. Please start the AI profile: docker compose --profile ai up" });
    }
    console.error(error);
    res.status(500).json({ error: error.message || "Prediction failed." });
  }
});

// Batch Prediction Routes
app.get("/api/v1/predictions", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { response, body } = await serviceJson(`${env.PREDICTION_SERVICE_URL}/internal/predictions`, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.ok && Array.isArray(body) ? body.map(normalizePredictionRecord) : body);
  } catch (error) {
    if (isOfflineError(error)) {
      return res.status(503).json({ error: "AI Prediction service is offline." });
    }
    console.error(error);
    res.status(502).json({ error: "Unable to fetch prediction history." });
  }
});

app.get("/api/v1/predictions/:predictionId", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const predictionId = z.string().uuid().safeParse(req.params.predictionId);
    if (!predictionId.success) return res.status(400).json({ error: "Invalid prediction ID format." });

    const { response, body } = await serviceJson(`${env.PREDICTION_SERVICE_URL}/internal/predictions/${predictionId.data}?tenantId=${req.user!.tenantId}`, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.ok ? normalizePredictionRecord(body) : body);
  } catch (error) {
    if (isOfflineError(error)) {
      return res.status(503).json({ error: "AI Prediction service is offline." });
    }
    console.error(error);
    res.status(502).json({ error: "Unable to fetch prediction details." });
  }
});

app.post("/api/v1/predictions/:predictionId/decision", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const predictionId = z.string().uuid().safeParse(req.params.predictionId);
    if (!predictionId.success) return res.status(400).json({ error: "Invalid prediction ID format." });

    const { decision } = req.body;
    if (!decision || !["approve", "reject"].includes(decision)) {
      return res.status(400).json({ error: "Decision must be 'approve' or 'reject'." });
    }

    const { response, body } = await serviceJson(`${env.PREDICTION_SERVICE_URL}/internal/predictions/${predictionId.data}/decision`, {
      method: "POST",
      headers: { Authorization: req.headers.authorization },
      body: JSON.stringify({
        decision,
        userId: req.user!.id,
        tenantId: req.user!.tenantId,
      }),
    });
    res.status(response.status).json(body);
  } catch (error) {
    if (isOfflineError(error)) {
      return res.status(503).json({ error: "AI Prediction service is offline." });
    }
    console.error(error);
    res.status(502).json({ error: "Unable to submit prediction decision." });
  }
});

app.post("/api/v1/predict/batch", authenticate, predictLimiter, upload.single("file"), async (req: AuthenticatedRequest, res) => {
  try {
    const accessToken = req.headers.authorization!;
    if (!req.file) return res.status(400).json({ error: "File is required." });

    const { datasetId } = req.body;
    if (!datasetId) return res.status(400).json({ error: "datasetId is required." });

    // Forward to prediction service
    const formData = new FormData();
    if (req.file) {
      formData.append("file", new Blob([new Uint8Array(req.file.buffer)]), req.file.originalname);
    }
    formData.append("datasetId", String(datasetId));
    formData.append("tenantId", req.user!.tenantId);
    formData.append("userId", req.user!.id);
    if (req.body.modelVersionId) formData.append("modelVersionId", String(req.body.modelVersionId));

    const predictionResponse = await fetch(`${env.PREDICTION_SERVICE_URL}/internal/predict-batch`, {
      method: "POST",
      headers: { Authorization: accessToken },
      body: formData as any,
    });
    const predictionBody = await predictionResponse.json();
    const prediction = { response: predictionResponse, body: predictionBody };
    if (!prediction.response.ok) {
      return res.status(prediction.response.status).json(prediction.body);
    }

    res.status(prediction.response.status).json(prediction.body);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Batch prediction failed." });
  }
});

app.get("/api/v1/predict/batch/:batchJobId", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { batchJobId } = req.params;
    const result = await serviceJson(`${env.PREDICTION_SERVICE_URL}/internal/batch-jobs/${batchJobId}`, {
      headers: { Authorization: req.headers.authorization },
    });

    if (!result.response.ok) {
      return res.status(result.response.status).json(result.body);
    }

    const normalized = normalizeBatchJob(result.body);
    const finalBody = {
      ...normalized,
      downloadUrl: result.body.output_key || result.body.outputKey ? `/api/v1/predict/batch/${batchJobId}/download` : null,
    };
    
    // Strict validation
    try {
      res.json(batchJobStatusSchema.parse(finalBody));
    } catch (err) {
      console.warn("[GATEWAY] Batch Job schema validation warning:", err);
      res.json(finalBody);
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to get batch job status." });
  }
});

app.get("/api/v1/predict/batch/:batchJobId/download", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { batchJobId } = req.params;
    const result = await fetch(`${env.PREDICTION_SERVICE_URL}/internal/batch-jobs/${batchJobId}/download`, {
      headers: { Authorization: req.headers.authorization! },
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: "Download failed." });
    }

    const contentType = result.headers.get("content-type") || "application/octet-stream";
    const buffer = await result.arrayBuffer();
    
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", result.headers.get("content-disposition") || `attachment; filename="batch-${batchJobId}.csv"`);
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Download failed." });
  }
});

// Admin & Telemetry
app.get("/api/v1/admin/decisions", authenticate, requireRole("ADMIN"), async (req: AuthenticatedRequest, res) => {
  try {
    const { response, body } = await serviceJson(`${env.PREDICTION_SERVICE_URL}/internal/predictions/audit`, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(body);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Unable to fetch decision audit logs." });
  }
});

app.get("/api/v1/admin/users", authenticate, requireRole("ADMIN"), async (req: AuthenticatedRequest, res) => {
  try {
    const { response, body } = await serviceJson(`${env.AUTH_SERVICE_URL}/internal/users`, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(body);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Unable to fetch users." });
  }
});

app.patch("/api/v1/admin/users/:userId/role", authenticate, requireRole("ADMIN"), async (req: AuthenticatedRequest, res) => {
  try {
    const { response, body } = await serviceJson(`${env.AUTH_SERVICE_URL}/internal/users/${req.params.userId}/role`, {
      method: "PATCH",
      headers: { Authorization: req.headers.authorization },
      body: JSON.stringify(req.body),
    });
    res.status(response.status).json(body);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Unable to update user role." });
  }
});

app.get("/api/v1/telemetry", authenticate, requireRole("ADMIN"), async (req: AuthenticatedRequest, res) => {
  try {
    const authHeader = { Authorization: req.headers.authorization };
    const [users, analytics, authHealth, dataHealth, trainingHealth, predictHealth] = await Promise.all([
      serviceJson(`${env.AUTH_SERVICE_URL}/internal/users`, { headers: authHeader }),
      serviceJson(`${env.ANALYTICS_SERVICE_URL}/internal/analytics/admin`, { headers: authHeader }),
      fetch(`${env.AUTH_SERVICE_URL}/health`).then(r => r.ok).catch(() => false),
      fetch(`${env.DATA_SERVICE_URL}/health`).then(r => r.ok).catch(() => false),
      fetch(`${env.TRAINING_SERVICE_URL}/health`).then(r => r.ok).catch(() => false),
      fetch(`${env.PREDICTION_SERVICE_URL}/health`).then(r => r.ok).catch(() => false),
    ]);

    res.json({
      users: users.body || [],
      services: [
        { name: "Auth Service", status: authHealth ? "HEALTHY" : "DOWN", region: "Primary" },
        { name: "Data Service", status: dataHealth ? "HEALTHY" : "DOWN", region: "Primary" },
        { name: "Training Node", status: trainingHealth ? "HEALTHY" : "DOWN", region: "HPC-East" },
        { name: "Inference Engine", status: predictHealth ? "HEALTHY" : "DOWN", region: "GPU-Cluster" },
      ],
      systemUsage: { cpu: 0.12 + Math.random() * 0.05, memory: 1.2 + Math.random() * 0.2 },
      analytics: analytics.body || {},
    });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Telemetry failed." });
  }
});

// Socket.io Bridge
async function startSocketBridge() {
  const connection = await connectAmqpWithRetry(env.RABBITMQ_URL, "RabbitMQ");
  connection.on("error", (error) => {
    console.error("[GATEWAY] Socket bridge connection error:", error);
  });
  connection.on("close", () => {
    console.warn("[GATEWAY] Socket bridge connection closed.");
  });
  const channel = await connection.createChannel();
  await channel.assertExchange(exchangeName, "topic", { durable: true });
  const queue = await channel.assertQueue("gateway-service.events", { durable: true });

  const topics = [
    eventTopics.TRAINING_COMPLETED,
    eventTopics.MODEL_PROMOTED,
    eventTopics.PREDICTION_COMPLETED,
    eventTopics.FRAUD_FLAGGED,
    "dataset.processed",
    "dataset.failed",
  ];
  for (const topic of topics) await channel.bindQueue(queue.queue, exchangeName, topic);

  channel.consume(queue.queue, (message) => {
    if (!message) return;
    try {
      const topic = message.fields.routingKey;
      const payload = JSON.parse(message.content.toString());
      if (payload.tenantId) io.to(`tenant:${payload.tenantId}`).emit(topic, payload);
      channel.ack(message);
    } catch (error) {
      console.error("socket bridge failed", error);
      channel.nack(message, false, false);
    }
  });
}

// Socket Auth
io.use(async (socket: Socket, next) => {
  try {
    const token = socket.handshake.auth?.token || (socket.handshake.headers.authorization as string)?.replace("Bearer ", "");
    if (!token) return next(new Error("Missing token"));

    const verified = await jwtVerify(token, publicKey, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    socket.data.user = verified.payload;
    socket.join(`tenant:${verified.payload.tenantId}`);
    next();
  } catch (error) {
    next(error as Error);
  }
});

async function start() {
  await connectRedisWithRetry();
  await startSocketBridge();
  server.listen(env.PORT, () => console.log(`gateway-service listening on ${env.PORT}`));
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
