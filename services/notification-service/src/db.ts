import { Pool } from "pg";

export function createPool(databaseUrl: string) {
  return new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export async function initNotificationsTable(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        tenant_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('training', 'fraud', 'email', 'system', 'success', 'warning', 'info')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(500),
        read BOOLEAN DEFAULT FALSE,
        email_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    `);
    console.log("[NOTIFICATIONS] Database table initialized");
  } finally {
    client.release();
  }
}

export interface Notification {
  id: string;
  user_id: string;
  tenant_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  email_sent: boolean;
  created_at: Date;
  updated_at: Date;
}
