import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_MAPPING = {
    "auth_db": ["users", "email_otps", "password_reset_tokens", "refresh_tokens", "auth_audit_logs"],
    "billing_db": ["credits", "transactions", "subscriptions", "stripe_customers"],
    "data_db": ["datasets", "dataset_columns", "dataset_shares"],
    "training_db": ["models", "model_versions", "training_jobs"],
    "analytics_db": ["event_store"],
    "prediction_db": ["predictions"],
    "fraud_db": ["fraud_evaluations"]
}

def check_db(db_name, tables):
    try:
        conn = psycopg2.connect(
            dbname=db_name,
            user="postgres",
            password="postgres",
            host="localhost",
            port=5432
        )
        cursor = conn.cursor()
        print(f"\n[AUDIT] Checking database: {db_name}")
        for table in tables:
            cursor.execute(f"SELECT EXISts (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = %s);", (table,))
            exists = cursor.fetchone()[0]
            status = "✅ EXISTS" if exists else "❌ MISSING"
            print(f"  - Table '{table}': {status}")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"  - [ERROR] Could not connect to {db_name}: {e}")

if __name__ == "__main__":
    for db, tables in DB_MAPPING.items():
        check_db(db, tables)
