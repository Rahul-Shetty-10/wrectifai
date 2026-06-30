import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = path.join(rootDir, '.env');

function loadEnvFile() {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    process.env[key] ??= value;
  }
}

function getSeedUser() {
  return {
    phone: process.env.TEST_USER_PHONE ?? '+919876543210',
    otp: process.env.AUTH_OTP_CODE ?? '123456',
    name: process.env.TEST_USER_NAME ?? 'Test Customer',
    role: process.env.TEST_USER_ROLE ?? 'customer',
  };
}

async function createDatabaseIfMissing(databaseUrl) {
  const targetUrl = new URL(databaseUrl);
  const databaseName = targetUrl.pathname.replace(/^\//, '');

  if (!databaseName) {
    return;
  }

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';
  const adminClient = new Client({
    connectionString: adminUrl.toString(),
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  });

  await adminClient.connect();
  const existing = await adminClient.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [databaseName]
  );

  if (existing.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`);
    console.log(`Created database: ${databaseName}`);
  }

  await adminClient.end();
}

async function connectWithDatabaseCreation(databaseUrl) {
  const clientConfig = {
    connectionString: databaseUrl,
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  };
  const client = new Client(clientConfig);

  try {
    await client.connect();
    return client;
  } catch (error) {
    if (error?.code !== '3D000') {
      throw error;
    }

    await createDatabaseIfMissing(databaseUrl);

    const retryClient = new Client(clientConfig);
    await retryClient.connect();
    return retryClient;
  }
}

async function ensureSchema(client) {
  await client.query(`
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

  await client.query(`
    INSERT INTO roles ("_id", code, name)
    VALUES
      ('customer-role', 'customer', 'Customer'),
      ('garage-role', 'garage', 'Garage'),
      ('vendor-role', 'vendor', 'Vendor'),
      ('admin-role', 'admin', 'Admin')
    ON CONFLICT (code) DO NOTHING
  `);
}

async function seedUser(client) {
  const user = getSeedUser();
  const userResult = await client.query(
    `
      INSERT INTO users ("_id", "mobileNumber", name, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, 'active', NOW(), NOW())
      ON CONFLICT ("mobileNumber") WHERE "mobileNumber" IS NOT NULL
      DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()
      RETURNING "_id" AS id, "mobileNumber" AS phone, name
    `,
    [randomUUID(), user.phone, user.name]
  );

  const seededUser = userResult.rows[0];
  const roleResult = await client.query('SELECT "_id" AS id FROM roles WHERE code = $1', [
    user.role,
  ]);
  const roleId = roleResult.rows[0]?.id;

  if (!roleId) {
    throw new Error(`Role '${user.role}' is not configured`);
  }

  await client.query('DELETE FROM user_roles WHERE "userId" = $1', [seededUser.id]);
  await client.query(
    'INSERT INTO user_roles ("_id", "userId", "roleId") VALUES ($1, $2, $3) ON CONFLICT ("userId", "roleId") DO NOTHING',
    [randomUUID(), seededUser.id, roleId]
  );

  await client.query(
    `
      INSERT INTO otp_challenges ("mobileNumber", code, "expiresAt", "verifiedAt", "createdAt")
      VALUES ($1, $2, NOW() + INTERVAL '30 days', NULL, NOW())
      ON CONFLICT ("mobileNumber")
      DO UPDATE SET code = EXCLUDED.code, "expiresAt" = EXCLUDED."expiresAt", "verifiedAt" = NULL, "createdAt" = NOW()
    `,
    [user.phone, user.otp]
  );

  return user;
}

loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is missing. Add it to .env first.');
  process.exit(1);
}

let client;

try {
  client = await connectWithDatabaseCreation(databaseUrl);
  await ensureSchema(client);
  const user = await seedUser(client);
  console.log('Seeded test login:');
  console.log(`  phone: ${user.phone}`);
  console.log(`  otp:   ${user.otp}`);
  console.log(`  role:  ${user.role}`);
} catch (error) {
  if (error?.code === '28P01') {
    console.error(
      'Postgres rejected the password in DATABASE_URL. Update .env with the same password you use in pgAdmin, then run npm run seed:test-user again.'
    );
    process.exit(1);
  }

  if (error?.code === 'ECONNREFUSED') {
    console.error(
      'Could not connect to Postgres. Start PostgreSQL, then run npm run seed:test-user again.'
    );
    process.exit(1);
  }

  throw error;
} finally {
  await client?.end();
}
