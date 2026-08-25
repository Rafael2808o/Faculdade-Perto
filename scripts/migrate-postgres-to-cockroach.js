import { config } from 'dotenv';
import pg from 'pg';
import { from as copyFrom, to as copyTo } from 'pg-copy-streams';
import { resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

config({ path: resolve(process.cwd(), '.env') });

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;
if (!sourceUrl || !targetUrl) throw new Error('Defina SOURCE_DATABASE_URL e DATABASE_URL no .env.');
if (sourceUrl === targetUrl) throw new Error('Os bancos de origem e destino não podem ser iguais.');

const { Pool } = pg;
const source = new Pool({ connectionString: sourceUrl, max: 2 });
const target = new Pool({ connectionString: targetUrl, max: 2, ssl: { rejectUnauthorized: true } });
const batchSize = Number(process.env.MIGRATION_BATCH_SIZE || 2500);
const tables = [
  'sources', 'source_snapshots', 'source_records', 'states', 'municipalities',
  'maintainers', 'institutions', 'campuses', 'poles', 'courses',
  'course_catalog_records', 'course_statistics', 'course_offerings',
  'field_observations', 'verifications', 'tuitions', 'admission_offers',
  'cutoff_scores', 'contacts', 'corrections', 'users', 'user_sessions',
  'plan_items', 'audit_logs', 'import_runs', 'import_rejections'
];
const quote = (value) => `"${value.replaceAll('"', '""')}"`;

async function columns(pool, table) {
  const result = await pool.query(`SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [table]);
  return result.rows.map((row) => row.column_name);
}

async function copyTable(table) {
  const [sourceColumns, targetColumns, sourceCountResult, targetCountResult] = await Promise.all([
    columns(source, table), columns(target, table),
    source.query(`SELECT count(*) count FROM ${quote(table)}`),
    target.query(`SELECT count(*) count FROM ${quote(table)}`)
  ]);
  const targetSet = new Set(targetColumns);
  const shared = sourceColumns.filter((column) => targetSet.has(column));
  const sourceCount = Number(sourceCountResult.rows[0].count);
  const targetCount = Number(targetCountResult.rows[0].count);
  if (targetCount === sourceCount) {
    console.log(`${table}: ${sourceCount.toLocaleString('pt-BR')} registros já conferidos`);
    return;
  }
  if (!sourceCount) {
    console.log(`${table}: vazio`);
    return;
  }
  const list = shared.map(quote).join(',');

  let copied = targetCount;
  let cursor = 0;
  if (targetCount) {
    const targetMax = await target.query(`SELECT max(id)::text max_id FROM ${quote(table)}`);
    cursor = Number(targetMax.rows[0].max_id);
    const prefix = Number((await source.query(`SELECT count(*) count FROM ${quote(table)} WHERE id <= $1`, [cursor])).rows[0].count);
    if (prefix !== targetCount) throw new Error(`${table}: o destino parcial não é um prefixo íntegro; interrompido para evitar duplicação.`);
    console.log(`${table}: retomando após ${targetCount.toLocaleString('pt-BR')} registros`);
  }

  while (copied < sourceCount) {
    const ids = await source.query(`SELECT id::text id FROM ${quote(table)} WHERE id > $1 ORDER BY id LIMIT $2`, [cursor, batchSize]);
    if (!ids.rowCount) throw new Error(`${table}: não foi possível localizar o próximo lote após id=${cursor}.`);
    const batchEnd = Number(ids.rows.at(-1).id);
    const sourceClient = await source.connect();
    const targetClient = await target.connect();
    try {
      await targetClient.query('BEGIN');
      const output = sourceClient.query(copyTo(`COPY (SELECT ${list} FROM ${quote(table)} WHERE id > ${cursor} AND id <= ${batchEnd} ORDER BY id) TO STDOUT WITH (FORMAT csv)`));
      const input = targetClient.query(copyFrom(`COPY ${quote(table)} (${list}) FROM STDIN WITH (FORMAT csv)`));
      await pipeline(output, input);
      await targetClient.query('COMMIT');
    } catch (error) {
      await targetClient.query('ROLLBACK');
      throw error;
    } finally {
      sourceClient.release();
      targetClient.release();
    }
    cursor = batchEnd;
    copied += ids.rowCount;
    if (copied === sourceCount || copied % 25000 < batchSize) {
      console.log(`${table}: ${copied.toLocaleString('pt-BR')} / ${sourceCount.toLocaleString('pt-BR')}`);
    }
  }

  const verified = Number((await target.query(`SELECT count(*) count FROM ${quote(table)}`)).rows[0].count);
  if (verified !== sourceCount) throw new Error(`${table}: contagem divergente (${verified}/${sourceCount}).`);
  console.log(`${table}: ${verified.toLocaleString('pt-BR')} registros migrados`);
}

try {
  const [sourceInfo, targetInfo] = await Promise.all([
    source.query('SELECT current_database() database, version() version'),
    target.query('SELECT current_database() database, version() version')
  ]);
  console.log({ source: sourceInfo.rows[0].database, target: targetInfo.rows[0].database });
  for (const table of tables) await copyTable(table);
  const totals = await target.query(`SELECT
    (SELECT count(*) FROM institutions) institutions,
    (SELECT count(*) FROM courses) courses,
    (SELECT count(*) FROM municipalities) municipalities,
    (SELECT count(*) FROM course_catalog_records) catalog_records`);
  console.log({ status: 'migração concluída', totals: totals.rows[0] });
} finally {
  await Promise.allSettled([source.end(), target.end()]);
}
