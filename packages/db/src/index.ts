import pg from "pg";

const { Pool } = pg;

export type DbQueryResult<T extends pg.QueryResultRow = any> = pg.QueryResult<T>;
export type PoolClient = pg.PoolClient;

export function createPool(connectionString: string, applicationName: string): pg.Pool {
  const pool = new Pool({
    connectionString,
    application_name: applicationName,
    max: 20, // Limit connections per service
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on("error", (err) => {
    console.error(`Unexpected error on idle client (${applicationName}):`, err);
  });

  return pool;
}

export async function runMigrations(pool: pg.Pool, statements: string[]): Promise<void> {
  let client: PoolClient | undefined;
  try {
    console.info(`[DB] Running ${statements.length} migration statements...`);
    client = await pool.connect();
    console.info(`[DB] Connection established for migrations.`);
    
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(12345)");
    console.info(`[DB] Advisory lock acquired.`);
    
    for (const statement of statements) {
      console.info(`[DB] Executing: ${statement.substring(0, 50)}...`);
      await client.query(statement);
    }
    
    await client.query("COMMIT");
    console.info(`[DB] Migrations committed successfully.`);
  } catch (error) {
    if (client) {
      try { await client.query("ROLLBACK"); } catch (e) { /* ignore rollback error */ }
    }
    console.error(`[DB] Migration FAILED:`, error);
    throw error;
  } finally {
    if (client) client.release();
  }
}

export async function withTransaction<T>(
  pool: pg.Pool,
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    try {
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  } finally {
    if (client) client.release();
  }
}

export function keysToCamel<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v)) as any;
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/gi, ($1) =>
        $1.toUpperCase().replace("-", "").replace("_", "")
      );
      return {
        ...result,
        [camelKey]: keysToCamel(obj[key]),
      };
    }, {}) as T;
  }
  return obj;
}

export function mapRows<T extends pg.QueryResultRow = any>(result: DbQueryResult<T>, camelCase = false): T[] {
  const rows = result.rows || [];
  return camelCase ? keysToCamel(rows) : rows;
}

export function logEvent(service: string, eventType: string, details: any, correlationId?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    service,
    event: eventType,
    correlationId,
    details,
  };
  console.log(JSON.stringify(logData));
}

export async function checkHealth(
  pool: pg.Pool,
  dependencies: { rabbitmqUrl?: string; s3Client?: any; s3Bucket?: string } = {},
): Promise<{ status: string; dependencies: Record<string, string> }> {
  const status: { status: string; dependencies: Record<string, string> } = {
    status: "ok",
    dependencies: {},
  };

  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      status.dependencies.database = "healthy";
    } finally {
      client.release();
    }
  } catch (error: any) {
    status.status = "unhealthy";
    status.dependencies.database = `error: ${error.message}`;
  }

  if (dependencies.rabbitmqUrl) {
    try {
      const amqp = await import("amqplib");
      const conn = await amqp.connect(dependencies.rabbitmqUrl);
      await conn.close();
      status.dependencies.rabbitmq = "healthy";
    } catch (error: any) {
      status.status = "unhealthy";
      status.dependencies.rabbitmq = `error: ${error.message}`;
    }
  }

  if (dependencies.s3Client && dependencies.s3Bucket) {
    try {
      const { HeadBucketCommand } = await import("@aws-sdk/client-s3");
      await dependencies.s3Client.send(new HeadBucketCommand({ Bucket: dependencies.s3Bucket }));
      status.dependencies.s3 = "healthy";
    } catch (error: any) {
      status.status = "unhealthy";
      status.dependencies.s3 = `error: ${error.message}`;
    }
  }

  return status;
}
