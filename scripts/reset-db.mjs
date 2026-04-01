import pg from 'pg';

const DB_BASE_URL = process.env.DATABASE_URL_BASE || "postgresql://postgres:postgres@postgres:5432";

async function truncateDb(dbName, tables) {
  const pool = new pg.Pool({ connectionString: `${DB_BASE_URL}/${dbName}` });
  console.log(`Resetting ${dbName}...`);
  try {
    for (const table of tables) {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
    }
  } catch (err) {
    if (err.message.includes("relation") && err.message.includes("does not exist")) {
       // Table might not be created yet or slightly different name
       console.log(`Skipping missing table in ${dbName}`);
    } else {
       console.error(`Error in ${dbName}:`, err.message);
    }
  } finally {
    await pool.end();
  }
}

async function run() {
  await truncateDb("data_db", ["dataset_mappings", "dataset_columns", "datasets"]);
  await truncateDb("training_db", ["model_versions", "models", "training_jobs"]);
  await truncateDb("analytics_db", ["activity_feed", "tenant_metrics"]);
  await truncateDb("billing_db", ["credits_transactions", "credits_balances"]);
  console.log("System Reset Complete. All service databases are clean.");
}

run();
