import type { QueryResultRow } from 'pg';
import { Pool } from 'pg';
import { getEnv } from '../config/env';

let pool: Pool | null = null;

export function getPool() {
  if (pool) return pool;
  const { databaseUrl } = getEnv();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[]
) {
  const activePool = getPool();
  return activePool.query<T>(text, values);
}
