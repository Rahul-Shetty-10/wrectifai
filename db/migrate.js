#!/usr/bin/env node
/**
 * Simple migration runner for Render (or any environment without Docker init).
 * Reads all *.sql files from db/migrations/ in sort order and executes them.
 *
 * Usage:  node db/migrate.js
 * Env:    DATABASE_URL (required)
 */

const { readdirSync, readFileSync } = require('fs');
const { join } = require('path');
const { Client } = require('pg');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  // Ensure migrations tracking table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const applied = await client.query('SELECT filename FROM _migrations');
  const appliedSet = new Set(applied.rows.map((r) => r.filename));

  let ran = 0;
  for (const file of files) {
    if (appliedSet.has(file)) {
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    console.log(`Applying ${file}...`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`  ✓ ${file}`);
      ran++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ✗ ${file} failed:`, err.message);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log(`\nDone. ${ran} migration(s) applied, ${files.length - ran} already applied.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
