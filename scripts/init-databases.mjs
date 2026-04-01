import pg from 'pg';

const DB_BASE_URL = process.env.DATABASE_URL_BASE || "postgresql://postgres:postgres@localhost:5432";
const dbs = ["auth_db", "billing_db", "data_db", "analytics_db", "training_db", "prediction_db", "fraud_db"];

async function createDbs() {
  const client = new pg.Client({ connectionString: `${DB_BASE_URL}/postgres` });
  await client.connect();
  console.log("Connected to postgres instance...");

  try {
    for (const db of dbs) {
      const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [db]);
      if (res.rowCount === 0) {
        console.log(`Creating database ${db}...`);
        await client.query(`CREATE DATABASE ${db}`);
      } else {
        console.log(`Database ${db} already exists.`);
      }
    }
  } catch (err) {
    console.error("Error creating databases:", err.message);
  } finally {
    await client.end();
  }
}

createDbs();
