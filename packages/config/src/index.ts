import { z } from "zod";
// @ts-ignore
import pino from "pino";

export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  RABBITMQ_URL: z.string().default("amqp://guest:guest@localhost:5672"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;

export function loadEnv<T extends z.ZodRawShape>(
  serviceName: string,
  schema: z.ZodObject<T>,
) {
  const mergedSchema = baseEnvSchema.merge(schema);
  const parsed = mergedSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`[${serviceName}] Invalid environment configuration\n${issues}`);
  }

  return parsed.data;
}

export function decodeBase64Pem(value: string): string {
  return Buffer.from(value, "base64").toString("utf8");
}

export function createLogger(serviceName: string) {
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || "info",
    transport: process.env.NODE_ENV === "development" ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    } : undefined,
  });
}
