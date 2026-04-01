import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand 
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { createLogger, loadEnv } from "@ai-loan/config";
import { z } from "zod";

const logger = createLogger("data-service:fileStore");

// Match the S3 environment config from data-service/src/index.ts
const env = loadEnv("data-service:fileStorage", z.object({
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET_DATASETS: z.string(),
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z.string().default("false").transform(v => v === "true"),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
}));

const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: `${env.MINIO_USE_SSL ? "https" : "http"}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
});

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;

// Internal utility to implement exponential backoff
async function withRetries<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (attempt > MAX_RETRIES || !isTransientError(error)) {
        logger.error({ error, operationName, attempt }, `Operation ${operationName} failed permanently after ${attempt} attempts.`);
        throw error;
      }
      const delayMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      logger.warn({ operationName, attempt, delayMs, error: error.message }, "Transient error encountered. Retrying...");
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

// Determines if an S3 error is transient and should be retried
function isTransientError(error: any): boolean {
  if (!error) return false;
  // Network errors, timeouts, or specific HTTP status codes (500, 502, 503, 504)
  const isNetworkError = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.name === 'TimeoutError';
  const isTransientStatusCode = error.$metadata?.httpStatusCode >= 500;
  // S3 specific throttling 
  const isThrottling = error.name === 'ThrottlingException' || error.name === 'TooManyRequestsException';
  
  return isNetworkError || isTransientStatusCode || isThrottling;
}

/**
 * Uploads a new file to the S3 compatible storage object store.
 * Requirement: 8.4, 9.5
 */
export async function uploadFile(
  tenantId: string,
  buffer: Buffer, 
  filename: string, 
  contentType: string
): Promise<string> {
  // We namespace by tenant for isolation
  const storageKey = `${tenantId}/${randomUUID()}/${filename}`;

  await withRetries(async () => {
    // lib-storage Upload handles both small buffers and large multi-part transparently
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: env.S3_BUCKET_DATASETS,
        Key: storageKey,
        Body: buffer,
        ContentType: contentType,
      },
      queueSize: 4,
      partSize: 5 * 1024 * 1024,
    });
    await upload.done();
  }, "uploadFile");

  return storageKey;
}

/**
 * Generates a signed download URL valid for 15 minutes.
 * Requirement: 8.4
 */
export async function getSignedDownloadUrl(storageKey: string): Promise<string> {
  return await withRetries(async () => {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET_DATASETS,
      Key: storageKey,
    });
    // Valid for 15 minutes (900 seconds)
    return await getSignedUrl(s3Client, command, { expiresIn: 900 });
  }, "getSignedDownloadUrl");
}

/**
 * Updates an existing file's content in place in S3.
 * Requirement: 8.4
 */
export async function updateFileContent(
  storageKey: string,
  buffer: Buffer,
  contentType?: string
): Promise<boolean> {
  await withRetries(async () => {
    const params: any = {
      Bucket: env.S3_BUCKET_DATASETS,
      Key: storageKey,
      Body: buffer,
    };
    
    if (contentType) params.ContentType = contentType;

    const command = new PutObjectCommand(params);
    await s3Client.send(command);
  }, "updateFileContent");

  return true;
}

/**
 * Deletes a file from S3. Useful for rollback scenarios.
 */
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function deleteFile(storageKey: string): Promise<boolean> {
  await withRetries(async () => {
    const command = new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_DATASETS,
      Key: storageKey,
    });
    await s3Client.send(command);
  }, "deleteFile");

  return true;
}
