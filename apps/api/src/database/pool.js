import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

function isLocalDatabase(connectionString) {
  try {
    const host = new URL(connectionString).hostname;
    return ['localhost','127.0.0.1','::1'].includes(host);
  } catch {
    return false;
  }
}

function sslConfiguration() {
  if (env.DATABASE_SSL === 'false') return false;
  if (env.DATABASE_SSL === 'true') return { rejectUnauthorized: true };
  return isLocalDatabase(env.DATABASE_URL) ? false : { rejectUnauthorized: true };
}

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  application_name: 'faculdade-perto-api',
  max: env.DATABASE_POOL_MAX,
  connectionTimeoutMillis: env.DATABASE_CONNECTION_TIMEOUT_MS,
  idleTimeoutMillis: env.DATABASE_IDLE_TIMEOUT_MS,
  statement_timeout: env.DATABASE_STATEMENT_TIMEOUT_MS,
  ssl: sslConfiguration()
});

pool.on('error', (error) => {
  console.error('Conexão ociosa com o banco foi encerrada inesperadamente.', { code: error.code });
});

export async function withTransaction(work) {
  const maxAttempts = env.DATABASE_PROVIDER === 'cockroach' ? 5 : 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code !== '40001' || attempt === maxAttempts) throw error;
    } finally {
      client.release();
    }
    await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
  }
}
