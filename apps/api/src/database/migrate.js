import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { pool } from './pool.js';

const directory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

function sqlForProvider(file, source) {
  if (env.DATABASE_PROVIDER !== 'cockroach') return source;
  if (file === '003_supabase_security.sql') return null;
  return source
    .replace(/^CREATE EXTENSION IF NOT EXISTS (?:pg_trgm|unaccent);\r?\n/gm, '')
    .replace(/,\r?\n  UNIQUE NULLS NOT DISTINCT \(snapshot_id, institution_id, inep_course_code, dimension, municipality_id, degree, modality, academic_level\)\r?\n\);/, '\n);')
    .replace(/^CREATE INDEX IF NOT EXISTS (?:institutions|courses|municipalities)_name_trgm_idx .*;\r?\n/gm, '');
}

function cockroachStatements(sql) {
  return sql.split(/;\s*(?:\r?\n|$)/).map((statement) => statement.trim()).filter(Boolean);
}

await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
for (const file of files) {
  const source = await readFile(join(directory, file), 'utf8');
  const sql = sqlForProvider(file, source);
  if (sql === null) continue;
  const exists = await pool.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
  if (exists.rowCount) continue;
  const client = await pool.connect();
  try {
    if (env.DATABASE_PROVIDER === 'cockroach') {
      for (const statement of cockroachStatements(sql)) await client.query(statement);
      await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [file]);
      console.log(`Migration aplicada: ${file}`);
      continue;
    }
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [file]);
    await client.query('COMMIT');
    console.log(`Migration aplicada: ${file}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
await pool.end();
