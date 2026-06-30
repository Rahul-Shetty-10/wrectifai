import { Pool, type QueryResultRow } from 'pg';
import { getEnv } from './env';

const { databaseUrl } = getEnv();

export const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : undefined,
    })
  : null;

let schemaReady: Promise<void> | null = null;

export function hasDatabase() {
  return Boolean(pool);
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured');
  }

  return pool.query<T>(text, params);
}

export function ensureAuthSchema() {
  if (!pool) {
    return Promise.resolve();
  }

  schemaReady ??= (async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        "_id" TEXT PRIMARY KEY,
        email TEXT,
        "mobileNumber" TEXT,
        "passwordHash" TEXT,
        name TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended', 'pendingVerification')),
        CONSTRAINT users_email_or_mobile_check CHECK (email IS NOT NULL OR "mobileNumber" IS NOT NULL)
      );

      CREATE TABLE IF NOT EXISTS roles (
        "_id" TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT roles_code_check CHECK (code IN ('customer', 'garage', 'vendor', 'admin'))
      );

      CREATE TABLE IF NOT EXISTS user_roles (
        "_id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES users("_id") ON DELETE CASCADE,
        "roleId" TEXT NOT NULL REFERENCES roles("_id") ON DELETE CASCADE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT user_roles_user_role_unique UNIQUE ("userId", "roleId")
      );

      CREATE TABLE IF NOT EXISTS otp_challenges (
        "mobileNumber" TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "verifiedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
        ON users (email)
        WHERE email IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS users_mobile_number_unique_idx
        ON users ("mobileNumber")
        WHERE "mobileNumber" IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS roles_code_unique_idx
        ON roles (code);

      CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);
      CREATE INDEX IF NOT EXISTS users_created_at_idx ON users ("createdAt");
    `);

    await query(
      `
        INSERT INTO roles ("_id", code, name)
        VALUES
          ('customer-role', 'customer', 'Customer'),
          ('garage-role', 'garage', 'Garage'),
          ('vendor-role', 'vendor', 'Vendor'),
          ('admin-role', 'admin', 'Admin')
        ON CONFLICT (code) DO NOTHING
      `
    );
  })();

  return schemaReady;
}
