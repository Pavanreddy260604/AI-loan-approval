import express, { Request, Response, NextFunction } from "express";
import amqp from "amqplib";
import nodemailer from "nodemailer";
import { jwtVerify } from "jose";
import { createPublicKey, type KeyObject } from "node:crypto";
import { z } from "zod";
import { decodeBase64Pem, loadEnv, createLogger } from "@ai-loan/config";
import { eventTopics } from "@ai-loan/contracts";

const env = loadEnv(
  "notification-service",
  z.object({
    PORT: z.coerce.number().default(4005),
    RABBITMQ_URL: z.string(),
    SMTP_HOST: z.string().default("smtp.gmail.com"),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().email(),
    SMTP_SECURE: z.coerce.boolean().default(false),
    JWT_PUBLIC_KEY_BASE64: z.string(),
    JWT_ISSUER: z.string(),
    JWT_AUDIENCE: z.string(),
  }),
);

const logger = createLogger("notification-service");
const app = express();
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

const transporterParams: any = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  pool: true,
  maxConnections: 1,
  maxMessages: 100,
  auth: (env.SMTP_USER && (env.SMTP_PASS || env.SMTP_PASSWORD)) 
    ? { user: env.SMTP_USER, pass: env.SMTP_PASS || env.SMTP_PASSWORD } 
    : undefined,
  tls: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  },
};

if (env.SMTP_PORT === 587) {
  transporterParams.requireTLS = true;
}

const transporter = nodemailer.createTransport(transporterParams);

app.get("/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    service: "notification-service",
    timestamp: new Date().toISOString(),
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER ? "configured" : "missing",
      from: env.SMTP_FROM
    }
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
    logger.error({ error }, "Internal auth verification failed");
    return res.status(401).json({ error: "Unauthorized." });
  }
}

app.use("/internal", authenticateInternal);

app.post("/internal/test-email", express.json(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden." });
    }
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Missing 'to' field" });
    
    await sendMail({
      to,
      subject: "SMTP Integration Test",
      html: `<h2>SMTP Verification Success</h2><p>This is a test email sent from the <strong>notification-service</strong> at ${new Date().toISOString()}.</p>`,
    });
    
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error: any) {
    logger.error({ error, to: req.body?.to }, "SMTP integration test sequence failed");
    res.status(500).json({ error: "SMTP Delivery Failed", details: error.message });
  }
});

async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  logger.info({ to, subject }, "Dispatching outgoing email");
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
  logger.info({ to }, "Email delivery confirmed by upstream SMTP");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      logger.error({ error, label }, `Connection to ${label} failed during startup. Retrying in 2 seconds.`);
      await delay(2000);
    }
  }
}

async function startConsumer(): Promise<void> {
  const connection = await connectAmqpWithRetry(env.RABBITMQ_URL, "RabbitMQ");
  const channel = await connection.createChannel();
  await channel.assertExchange(exchangeName, "topic", { durable: true });
  const queue = await channel.assertQueue("notification-service.events", { durable: true });

  const topics = [
    eventTopics.USER_REGISTERED,
    eventTopics.PASSWORD_RESET_REQUESTED,
    eventTopics.TRAINING_COMPLETED,
    eventTopics.FRAUD_FLAGGED,
  ];

  for (const topic of topics) {
    await channel.bindQueue(queue.queue, exchangeName, topic);
  }

  channel.consume(queue.queue, async (message) => {
    if (!message) return;
    try {
      const payload = JSON.parse(message.content.toString());
      const topic = message.fields.routingKey;

      if (topic === eventTopics.USER_REGISTERED) {
        await sendMail({
          to: payload.email,
          subject: "Verify your AI Loan Intelligence account",
          html: `<h2>Welcome, ${payload.fullName}</h2><p>Your verification OTP is <strong>${payload.otp}</strong>. It expires at ${payload.expiresAt}.</p>`,
        });
      }

      if (topic === eventTopics.PASSWORD_RESET_REQUESTED) {
        await sendMail({
          to: payload.email,
          subject: "Reset your AI Loan Intelligence password",
          html: `<p>Your password reset OTP is <strong>${payload.otp}</strong>. It expires at ${payload.expiresAt}.</p>`,
        });
      }

      if (topic === eventTopics.TRAINING_COMPLETED && payload.email) {
        await sendMail({
          to: payload.email,
          subject: "Training completed",
          html: `<p>Your dataset training finished successfully. Champion model: <strong>${payload.championModelFamily}</strong>.</p>`,
        });
      }

      if (topic === eventTopics.FRAUD_FLAGGED && payload.email) {
        await sendMail({
          to: payload.email,
          subject: "Fraud risk alert",
          html: `<p>A high-risk prediction was flagged for review. Risk band: <strong>${payload.riskBand}</strong>.</p>`,
        });
      }

      channel.ack(message);
    } catch (error) {
      logger.error({ error }, "Notification consumer processing failure");
      channel.nack(message, false, false);
    }
  });
}

async function start() {
  logger.info({ host: env.SMTP_HOST, port: env.SMTP_PORT }, "Auditing SMTP connection string...");
  try {
    await transporter.verify();
    logger.info("SMTP handshake verification successful");
  } catch (error: any) {
    logger.error({ error, code: error.code }, "CRITICAL: SMTP handshake failed. Notifications are offline.");
  }

  await startConsumer();
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Notification service operational");
  });
}

start().catch((error) => {
  logger.error({ error }, "Notification service bootstrap failure");
  process.exit(1);
});
