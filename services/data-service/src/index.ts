import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import { createPublicKey, randomUUID, createHash, type KeyObject } from "node:crypto";
import amqp from "amqplib";
import { HeadBucketCommand, CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage"; // Add this if available, otherwise manual stream
import { z } from "zod";
import { jwtVerify } from "jose";
import { decodeBase64Pem, loadEnv, createLogger } from "@ai-loan/config";
import { datasetMappingSchema, eventTopics, type DatasetMapping } from "@ai-loan/contracts";
import { createPool, runMigrations, checkHealth, mapRows, withTransaction } from "@ai-loan/db";

import { validateFileSize, validateFileType } from "./validation/fileValidation.js";
import { uploadFile, deleteFile } from "./storage/fileStorage.js";

const env = loadEnv(
  "data-service",
  z.object({
    PORT: z.coerce.number().default(4003),
    DATA_DATABASE_URL: z.string(),
    RABBITMQ_URL: z.string(),
    S3_REGION: z.string(),
    S3_BUCKET_DATASETS: z.string(),
    MINIO_ENDPOINT: z.string(),
    MINIO_PORT: z.coerce.number(),
    MINIO_USE_SSL: z
      .string()
      .default("false")
      .transform((value) => value === "true"),
    MINIO_ACCESS_KEY: z.string(),
    MINIO_SECRET_KEY: z.string(),
    JWT_PUBLIC_KEY_BASE64: z.string(),
    JWT_ISSUER: z.string(),
    JWT_AUDIENCE: z.string(),
  }),
);

const logger = createLogger("data-service");
const pool = createPool(env.DATA_DATABASE_URL, "data-service");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const app = express();
app.use((req, _res, next) => {
  const correlationId = req.header("x-correlation-id");
  if (correlationId) {
    (req as any).correlationId = correlationId;
  }
  next();
});

app.use((req, res, next) => {
  if (req.headers["content-type"]?.includes("multipart/form-data") || req.url.includes("/upload")) {
    return next();
  }
  return express.json({ limit: "1mb" })(req, res, next);
});

const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: `${env.MINIO_USE_SSL ? "https" : "http"}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
});

const exchangeName = "platform.events";
let channel: amqp.Channel | undefined;
const publicKey: KeyObject = createPublicKey(decodeBase64Pem(env.JWT_PUBLIC_KEY_BASE64));

// Middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

type DatasetValue = string | number | boolean | null;

interface ColumnValueCount {
  value: DatasetValue;
  count: number;
}

interface DatasetColumnStats {
  uniqueCount: number;
  nullCount: number;
  nonNullCount: number;
  topValues: ColumnValueCount[];
  truncated: boolean;
  isBinaryCandidate: boolean;
  candidateLabels: DatasetValue[];
  looksLikeIdentifier?: boolean;
}

interface DatasetColumnSummary {
  name: string;
  inferredType: string;
  sampleValues: DatasetValue[];
  stats: DatasetColumnStats | null;
}

interface DatasetRecord {
  id: string;
  tenantId: string;
  userId: string;
  fileName: string;
  objectKey: string;
  status: string;
  profileStatus: string;
  mapping?: DatasetMapping | null;
  [key: string]: unknown;
}

const migrations = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,
  `CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    object_key TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    row_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'uploaded',
    profile_status TEXT NOT NULL DEFAULT 'pending',
    preview JSONB NOT NULL DEFAULT '[]'::jsonb,
    mapping JSONB,
    columns JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS dataset_columns (
    id UUID PRIMARY KEY,
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    inferred_type TEXT NOT NULL,
    sample_values JSONB NOT NULL DEFAULT '[]'::jsonb,
    stats JSONB
  );`,
  `CREATE TABLE IF NOT EXISTS dataset_mappings (
    id UUID PRIMARY KEY,
    dataset_id UUID NOT NULL UNIQUE REFERENCES datasets(id) ON DELETE CASCADE,
    mapping JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `ALTER TABLE datasets ADD COLUMN IF NOT EXISTS mapping JSONB;`,
  `ALTER TABLE datasets ADD COLUMN IF NOT EXISTS columns JSONB;`,
  `ALTER TABLE datasets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `ALTER TABLE datasets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `ALTER TABLE datasets ADD COLUMN IF NOT EXISTS profile_status TEXT NOT NULL DEFAULT 'pending';`,
  `ALTER TABLE dataset_columns ADD COLUMN IF NOT EXISTS stats JSONB;`,
  `ALTER TABLE dataset_mappings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `ALTER TABLE dataset_mappings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `CREATE TABLE IF NOT EXISTS dataset_artifacts (
    id UUID PRIMARY KEY,
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    object_key TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS user_files (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    owner_id UUID NOT NULL,
    filename TEXT NOT NULL CHECK (length(filename) > 0 AND length(filename) <= 255),
    original_filename TEXT NOT NULL CHECK (length(original_filename) > 0 AND length(original_filename) <= 255),
    storage_key TEXT NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 104857600),
    content_type TEXT NOT NULL,
    checksum TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS user_files_owner_id_idx ON user_files(owner_id);`,
  `CREATE INDEX IF NOT EXISTS user_files_tenant_id_idx ON user_files(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS user_files_uploaded_at_idx ON user_files(uploaded_at DESC);`,
  `CREATE INDEX IF NOT EXISTS user_files_modified_at_idx ON user_files(modified_at DESC);`,
  `CREATE TABLE IF NOT EXISTS file_operation_logs (
    id UUID PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES user_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('upload', 'download', 'update', 'delete_attempt', 'rename_attempt')),
    status TEXT NOT NULL,
    error_message TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS file_operation_logs_file_id_idx ON file_operation_logs(file_id);`,
  `CREATE INDEX IF NOT EXISTS file_operation_logs_user_id_idx ON file_operation_logs(user_id);`,
  `CREATE INDEX IF NOT EXISTS file_operation_logs_created_at_idx ON file_operation_logs(created_at DESC);`,
];

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
    logger.error({ error }, "Internal session validation failed");
    return res.status(401).json({ error: "Unauthorized." });
  }
}

app.use("/internal", authenticateInternal);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectAmqpWithRetry(url: string, label: string) {
  while (true) {
    try {
      return await amqp.connect(url);
    } catch (error) {
      logger.error({ error, label }, `${label} endpoint unreachable during bootstrap. Retrying in 2 seconds.`);
      await delay(2000);
    }
  }
}

function normalizeComparableValue(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function toDatasetValue(value: unknown): DatasetValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return String(value);
}

function dedupeDatasetValues(values: unknown[]): DatasetValue[] {
  const seen = new Set<string>();
  const result: DatasetValue[] = [];
  for (const value of values) {
    const comparable = normalizeComparableValue(value);
    if (seen.has(comparable)) {
      continue;
    }
    seen.add(comparable);
    result.push(toDatasetValue(value));
  }
  return result;
}

function mergeColumnValueCounts(entries: unknown[]): ColumnValueCount[] {
  const merged = new Map<string, ColumnValueCount>();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const value = toDatasetValue((entry as { value?: unknown }).value ?? null);
    const rawCount = (entry as { count?: unknown }).count;
    const count = Number.isFinite(rawCount) ? Number(rawCount) : Number(rawCount ?? 0);
    const comparable = normalizeComparableValue(value);
    const existing = merged.get(comparable);
    if (existing) {
      existing.count += count;
      continue;
    }
    merged.set(comparable, { value, count });
  }
  return Array.from(merged.values());
}

function normalizeColumnStats(stats: unknown): DatasetColumnStats | null {
  if (!stats || typeof stats !== "object") {
    return null;
  }

  const record = stats as Record<string, unknown>;
  const topValues = mergeColumnValueCounts(Array.isArray(record.topValues) ? record.topValues : []);
  const candidateLabels = dedupeDatasetValues(Array.isArray(record.candidateLabels) ? record.candidateLabels : []);

  return {
    uniqueCount: Number(record.uniqueCount ?? 0),
    nullCount: Number(record.nullCount ?? 0),
    nonNullCount: Number(record.nonNullCount ?? 0),
    topValues,
    truncated: Boolean(record.truncated),
    isBinaryCandidate: Boolean(record.isBinaryCandidate),
    candidateLabels,
    looksLikeIdentifier: Boolean(record.looksLikeIdentifier),
  };
}

function hydrateColumn(row: any): DatasetColumnSummary {
  return {
    name: row.name,
    inferredType: row.inferredType ?? row.inferred_type,
    sampleValues: dedupeDatasetValues(Array.isArray(row.sampleValues ?? row.sample_values) ? (row.sampleValues ?? row.sample_values) : []),
    stats: normalizeColumnStats(row.stats),
  };
}

function hasDatasetStats(column: DatasetColumnSummary): boolean {
  return Boolean(column.stats && typeof column.stats.uniqueCount === "number");
}

function describeColumnSuitability(column: DatasetColumnSummary): { selectable: boolean; reason?: string } {
  const stats = column.stats;
  if (!stats) {
    return { selectable: false, reason: "Dataset insights are still refreshing for this field." };
  }
  if (stats.looksLikeIdentifier) {
    return { selectable: false, reason: "Identifier-like columns are not suitable as an outcome variable." };
  }
  if (stats.uniqueCount <= 1) {
    return { selectable: false, reason: "Columns with only one detected value cannot train a classifier." };
  }
  if (stats.uniqueCount > 12) {
    return { selectable: false, reason: "Columns with more than 12 distinct values are treated as high-cardinality targets." };
  }
  return { selectable: true };
}

function getCandidateLabelCount(stats: DatasetColumnStats, label: unknown): number {
  const comparable = normalizeComparableValue(label);
  return stats.topValues.reduce(
    (total, entry) => total + (normalizeComparableValue(entry.value) === comparable ? entry.count : 0),
    0,
  );
}

async function queueDatasetReprofile(dataset: DatasetRecord): Promise<boolean> {
  const update = await pool.query(
    `UPDATE datasets
     SET profile_status = 'processing', updated_at = NOW()
     WHERE id = $1 AND profile_status <> 'processing'
     RETURNING id`,
    [dataset.id],
  );

  if (!update.rowCount) {
    return false;
  }

  await publish(eventTopics.DATASET_UPLOADED, {
    datasetId: dataset.id,
    tenantId: dataset.tenantId,
    userId: dataset.userId,
    datasetObjectKey: dataset.objectKey,
    objectKey: dataset.objectKey,
    fileName: dataset.fileName,
    rowCount: 0,
  });
  return true;
}

function columnsLookBogus(columns: DatasetColumnSummary[]): boolean {
  if (!columns.length) return false;
  // Real loan-data column names are never short integers like "1","2","3"
  // or pandas' "Unnamed: N" placeholders. If we see those, the profiler
  // read a data row as the header and the dataset needs re-profiling.
  const names = columns.map((c) => String(c.name ?? "").trim());
  const shortInt = names.filter((n) => /^-?\d{1,3}$/.test(n));
  const unnamed = names.filter((n) => /^Unnamed:\s*\d+$/i.test(n) || n === "");
  return shortInt.length >= 2 || unnamed.length >= 1;
}

async function ensureDatasetInsights(dataset: DatasetRecord, columns: DatasetColumnSummary[]) {
  const statsReady = columns.length > 0 && columns.every(hasDatasetStats);
  const bogus = columnsLookBogus(columns);
  if (statsReady && !bogus) {
    return { profileStatus: dataset.profileStatus ?? "ready", statsReady: true };
  }

  if (dataset.profileStatus === "processing") {
    return { profileStatus: "processing", statsReady: false };
  }

  const queued = await queueDatasetReprofile(dataset);
  return {
    profileStatus: queued ? "processing" : dataset.profileStatus ?? "pending",
    statsReady: false,
  };
}


async function publish(topic: string, payload: any): Promise<void> {
  if (!channel) {
    logger.warn({ topic }, "Event publication skipped - messaging layer not ready");
    return;
  }
  channel.publish(exchangeName, topic, Buffer.from(JSON.stringify(payload)), {
    contentType: "application/json",
    persistent: true,
  });
}

async function ensureBucket(bucket: string): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (_error) {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

app.get("/health", async (_req: Request, res: Response) => {
  const health = await checkHealth(pool, { rabbitmqUrl: env.RABBITMQ_URL, s3Client: s3, s3Bucket: env.S3_BUCKET_DATASETS });
  res.status(health.status === "ok" ? 200 : 503).json({ 
    ...health, 
    service: "data-service",
    timestamp: new Date().toISOString()
  });
});

app.get("/datasets", authenticateInternal, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const result = await pool.query(
    `SELECT d.*, dm.mapping
     FROM datasets d
     LEFT JOIN dataset_mappings dm ON dm.dataset_id = d.id
     WHERE tenant_id = $1
     ORDER BY created_at DESC`,
    [tenantId],
  );
  res.json(mapRows(result, true));
});

app.post("/internal/datasets/upload", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const fileName = req.headers["x-file-name"] as string || "dataset.csv";
    const fileType = req.headers["content-type"] || "application/octet-stream";
    const fileSize = Number(req.headers["content-length"]) || 0;
    
    const datasetId = randomUUID();
    const objectKey = `${tenantId}/${datasetId}/${fileName}`;

    // World Class: Stream directly from the request to S3
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: env.S3_BUCKET_DATASETS,
        Key: objectKey,
        Body: req,
        ContentType: fileType,
      },
    });

    logger.info({ objectKey, fileName }, "Initiating multi-part stream to S3");
    await upload.done();
    logger.info({ objectKey }, "S3 archive stream completed successfully");

    const result = await pool.query(
      `INSERT INTO datasets (id, tenant_id, user_id, file_name, object_key, file_size, file_type, row_count, status, profile_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [datasetId, tenantId, userId, fileName, objectKey, fileSize, fileType, 0, "processing", "processing"],
    );
    const dataset = mapRows(result, true)[0];

    logger.info({ datasetId, tenantId }, "Registering transactional dataset record");
    channel?.publish(exchangeName, "dataset.uploaded", Buffer.from(JSON.stringify({
      datasetId,
      tenantId,
      datasetObjectKey: objectKey,
      fileName,
    })));

    res.status(201).json(dataset);
  } catch (error) {
    logger.error({ error }, "Transactional stream-to-S3 upload failed");
    res.status(500).json({ error: "Unable to process raw upload." });
  }
});

app.post("/api/files/upload", authenticateInternal, upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "File is required." });
    }

    // ── Validation (Req 8.1, 8.2, 8.3) ─────────────────────────
    const sizeValidation = validateFileSize(file.size);
    if (!sizeValidation.valid) {
      return res.status(400).json({ error: sizeValidation.error });
    }

    const typeValidation = validateFileType(file.mimetype);
    if (!typeValidation.valid) {
      return res.status(400).json({ error: typeValidation.error });
    }

    // ── Prepare File Metadata ──────────────────────────────────
    const fileId = randomUUID();
    const originalFilename = file.originalname;
    // Generate a secure, unique filename for storage
    const secureFilename = `\${fileId}_\${originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    logger.info({ fileId, tenantId, size: file.size, type: file.mimetype }, "Initiating secure file upload");

    // ── Upload to S3-compatible storage (Req 8.4) ──────────────
    const storageKey = await uploadFile(tenantId, file.buffer, secureFilename, file.mimetype);
    let dbSuccess = false;

    try {
      // ── Create Database Record (Req 8.4, 8.5) ────────────────
      await pool.query(
        `INSERT INTO user_files (id, tenant_id, owner_id, filename, original_filename, storage_key, size_bytes, content_type, checksum)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [fileId, tenantId, userId, secureFilename, originalFilename, storageKey, file.size, file.mimetype, checksum]
      );

      // Audit log (Req 11.4)
      await pool.query(
        `INSERT INTO file_operation_logs (id, file_id, user_id, operation, status)
         VALUES ($1, $2, $3, 'upload', 'success')`,
        [randomUUID(), fileId, userId]
      );

      dbSuccess = true;

      // ── Return Response ──────────────────────────────────────
      res.status(201).json({
        id: fileId,
        filename: originalFilename,
        sizeBytes: file.size,
        contentType: file.mimetype,
        checksum,
        message: "File uploaded successfully."
      });

    } finally {
      // ── Rollback on Database Failure ─────────────────────────
      if (!dbSuccess) {
        logger.error({ fileId, storageKey }, "Database insertion failed, rolling back S3 upload");
        await deleteFile(storageKey).catch(err => {
          logger.error({ error: err, storageKey }, "Failed to orchestrate rollback deletion from S3");
        });
      }
    }
  } catch (error: any) {
    logger.error({ error, fileName: req.file?.originalname }, "File upload request failed");
    res.status(500).json({ error: "An unexpected error occurred during file upload." });
  }
});

app.post("/datasets", authenticateInternal, upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "File is required." });
    }

    const datasetId = randomUUID();
    const objectKey = `${tenantId}/${datasetId}/${file.originalname}`;

    // World Class: Stream processing using Upload from lib-storage
    const parallelUploads3 = new Upload({
      client: s3,
      params: {
        Bucket: env.S3_BUCKET_DATASETS,
        Key: objectKey,
        Body: file.buffer, // Ideally this should be a stream, but with memoryStorage it's a buffer
        ContentType: file.mimetype,
      },
      queueSize: 4,
      partSize: 5 * 1024 * 1024, // 5MB chunks
      leavePartsOnError: false,
    });

    await parallelUploads3.done();

    await pool.query(
      `INSERT INTO datasets (id, tenant_id, user_id, file_name, object_key, file_size, file_type, row_count, preview, status, profile_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)`,
      [
        datasetId,
        tenantId,
        userId,
        file.originalname,
        objectKey,
        file.size,
        file.mimetype,
        0, // Initial row count is 0, updated asynchronously
        JSON.stringify([]), // Initial preview is empty
        'processing', // Status is processing
        'processing',
      ],
    );

    await publish(eventTopics.DATASET_UPLOADED || "dataset.uploaded", {
      tenantId,
      userId,
      datasetId,
      objectKey, // S3 key for backend worker to download
      datasetObjectKey: objectKey, // for compatibility with training-service
      fileName: file.originalname,
      rowCount: 0,
    });

    res.status(201).json({
      id: datasetId,
      fileName: file.originalname,
      objectKey,
      status: 'processing',
      message: 'Dataset uploaded and processing started.'
    });
  } catch (error: any) {
    logger.error({ error, fileName: req.file?.originalname }, "Standard multi-part upload failed");
    const isClientError = error.message.includes("Unsupported") || 
                         error.message.includes("empty") || 
                         error.message.includes("malformed") ||
                         error.message.includes("parse");
    res.status(isClientError ? 400 : 500).json({ 
      error: error.message || "An unexpected error occurred during dataset upload." 
    });
  }
});

app.get("/datasets/:datasetId/preview", authenticateInternal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const datasetResult = await pool.query(
      `SELECT d.*, dm.mapping
       FROM datasets d
       LEFT JOIN dataset_mappings dm ON dm.dataset_id = d.id
       WHERE d.id = $1 AND d.tenant_id = $2`,
      [req.params.datasetId, tenantId],
    );
    const dataset = mapRows(datasetResult, true)[0];
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found." });
    }

    const columnResult = await pool.query(
      `SELECT name, inferred_type, sample_values, stats FROM dataset_columns WHERE dataset_id = $1`, 
      [dataset.id]
    );
    const columns = mapRows(columnResult, true).map(hydrateColumn);
    const insights = await ensureDatasetInsights(dataset as DatasetRecord, columns);

    res.json({
      ...dataset,
      profileStatus: insights.profileStatus,
      statsReady: insights.statsReady,
      columns,
    });
  } catch (error) {
    logger.error({ error, datasetId: req.params.datasetId }, "Dataset preview retrieval failed");
    res.status(500).json({ error: "Unable to load dataset preview." });
  }
});

app.post("/datasets/:datasetId/mapping", authenticateInternal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const dataset = mapRows(
      await pool.query(`SELECT * FROM datasets WHERE id = $1 AND tenant_id = $2`, [req.params.datasetId, tenantId]),
      true,
    )[0] as DatasetRecord | undefined;
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found." });
    }

    const mapping = datasetMappingSchema.parse(req.body);
    const columns = mapRows(
      await pool.query(`SELECT name, inferred_type, sample_values, stats FROM dataset_columns WHERE dataset_id = $1`, [dataset.id]),
      true,
    ).map(hydrateColumn);

    const insights = await ensureDatasetInsights(dataset, columns);
    if (!insights.statsReady) {
      return res.status(409).json({ error: "Dataset insights are still processing. Please try again in a moment." });
    }

    const targetColumn = columns.find((column) => column.name === mapping.targetColumn);
    if (!targetColumn) {
      return res.status(422).json({ error: `Target column "${mapping.targetColumn}" was not found in this dataset.` });
    }

    const suitability = describeColumnSuitability(targetColumn);
    if (!suitability.selectable) {
      return res.status(422).json({ error: suitability.reason ?? "Selected target column is not suitable for model training." });
    }

    const stats = targetColumn.stats as DatasetColumnStats;
    const labelExists = stats.candidateLabels.some(
      (candidate) => normalizeComparableValue(candidate) === normalizeComparableValue(mapping.positiveLabel),
    );
    if (!labelExists) {
      return res.status(422).json({
        error: `The selected positive label was not detected in "${mapping.targetColumn}". Please choose one of the discovered target values.`,
      });
    }

    const positiveCount = getCandidateLabelCount(stats, mapping.positiveLabel);
    const negativeCount = stats.nonNullCount - positiveCount;
    if (positiveCount <= 0 || negativeCount <= 0) {
      return res.status(422).json({
        error: "The selected positive label must leave both a positive class and a negative class in the full dataset.",
      });
    }

    await pool.query(
      `INSERT INTO dataset_mappings (id, dataset_id, mapping)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (dataset_id) DO UPDATE SET mapping = EXCLUDED.mapping, updated_at = NOW()`,
      [randomUUID(), dataset.id, JSON.stringify(mapping)],
    );

    await pool.query(`UPDATE datasets SET status = 'mapped', updated_at = NOW() WHERE id = $1`, [dataset.id]);
    await publish(eventTopics.DATASET_MAPPED, {
      datasetId: dataset.id,
      tenantId,
      userId,
      datasetObjectKey: dataset.objectKey,
      fileName: dataset.fileName,
      mapping,
      columns: columns.map((column: DatasetColumnSummary) => ({
        name: column.name,
        inferredType: column.inferredType,
      })),
    });

    res.json({ message: "Dataset mapping saved.", datasetId: dataset.id, mapping });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ error: error.flatten() });
    }
    logger.error({ error, datasetId: req.params.datasetId }, "Dataset column mapping save failed");
    res.status(500).json({ error: "Unable to save dataset mapping." });
  }
});

app.delete("/datasets/:datasetId", authenticateInternal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const dataset = mapRows(
      await pool.query(`SELECT * FROM datasets WHERE id = $1 AND tenant_id = $2`, [req.params.datasetId, tenantId]),
      true,
    )[0] as DatasetRecord | undefined;
    if (!dataset) return res.status(404).json({ error: "Dataset not found." });

    // Cascade clean up: columns, mapping, then dataset row
    await pool.query(`DELETE FROM dataset_mappings WHERE dataset_id = $1`, [dataset.id]);
    await pool.query(`DELETE FROM dataset_columns WHERE dataset_id = $1`, [dataset.id]);
    await pool.query(`DELETE FROM datasets WHERE id = $1 AND tenant_id = $2`, [dataset.id, tenantId]);

    res.json({ message: "Dataset deleted.", datasetId: dataset.id });
  } catch (error: any) {
    logger.error({ error, datasetId: req.params.datasetId }, "Dataset delete failed");
    res.status(500).json({ error: "Unable to delete dataset." });
  }
});

app.get("/internal/datasets/:datasetId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const dataset = mapRows(
      await pool.query(
        `SELECT d.*, dm.mapping
         FROM datasets d
         LEFT JOIN dataset_mappings dm ON dm.dataset_id = d.id
         WHERE d.id = $1 AND d.tenant_id = $2 AND d.user_id = $3`,
        [req.params.datasetId, tenantId, userId],
      ),
      true,
    )[0] as DatasetRecord | undefined;
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found." });
    }
    const columns = mapRows(
      await pool.query(`SELECT name, inferred_type, sample_values, stats FROM dataset_columns WHERE dataset_id = $1`, [dataset.id]),
      true,
    ).map(hydrateColumn);
    const insights = await ensureDatasetInsights(dataset, columns);
    res.json({
      ...dataset,
      profileStatus: insights.profileStatus,
      statsReady: insights.statsReady,
      columns,
    });
  } catch (error) {
    logger.error({ error, datasetId: req.params.datasetId }, "Internal dataset lookup failure");
    res.status(500).json({ error: "Unable to load dataset details." });
  }
});

async function start() {
  await runMigrations(pool, migrations);
  await ensureBucket(env.S3_BUCKET_DATASETS);
  const connection = await connectAmqpWithRetry(env.RABBITMQ_URL, "RabbitMQ");
  connection.on("error", (error) => {
    logger.error({ error }, "RabbitMQ connection error - terminating for restart");
    process.exit(1);
  });
  connection.on("close", () => {
    logger.warn("RabbitMQ connection closed - terminating for restart");
    process.exit(1);
  });
  channel = await connection.createChannel();
  await channel.assertExchange(exchangeName, "topic", { durable: true });

  // World Class: Listen for processing results from Python worker
  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, exchangeName, "dataset.processed");
  await channel.bindQueue(q.queue, exchangeName, "dataset.failed");

  channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const routingKey = msg.fields.routingKey;
      const payload = JSON.parse(msg.content.toString());
      logger.info({ routingKey, datasetId: payload.datasetId }, "Processing inbound dataset event");

      if (routingKey === "dataset.processed") {
        const { datasetId, rowCount, columns, preview } = payload;
        await withTransaction(pool, async (client) => {
          await client.query(
            `UPDATE datasets
             SET row_count = $1,
                 preview = $2::jsonb,
                 profile_status = 'ready',
                 status = CASE WHEN status = 'processing' THEN 'uploaded' ELSE status END,
                 updated_at = NOW()
             WHERE id = $3`,
            [rowCount, JSON.stringify(preview), datasetId],
          );

          await client.query(`DELETE FROM dataset_columns WHERE dataset_id = $1`, [datasetId]);
          for (const col of columns) {
            await client.query(
              `INSERT INTO dataset_columns (id, dataset_id, name, inferred_type, sample_values, stats)
               VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
              [
                randomUUID(),
                datasetId,
                col.name,
                col.inferredType,
                JSON.stringify(dedupeDatasetValues(col.sampleValues ?? [])),
                JSON.stringify(normalizeColumnStats(col.stats)),
              ],
            );
          }
        });
      } else if (routingKey === "dataset.failed") {
        await pool.query(
          `UPDATE datasets
           SET profile_status = 'failed',
               status = CASE WHEN status = 'processing' THEN 'failed' ELSE status END,
               updated_at = NOW()
           WHERE id = $1`,
          [payload.datasetId],
        );
      }
      
      channel?.ack(msg);
    } catch (err) {
      logger.error({ error: err }, "Inbound event handler reached exception state");
      channel?.nack(msg);
    }
  });

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Data service operational");
  });
}

start().catch((error) => {
  logger.error({ error }, "Data service bootstrap failure - terminating");
  process.exit(1);
});
