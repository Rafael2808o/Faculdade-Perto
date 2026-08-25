import { config } from 'dotenv';
import pg from 'pg';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env') });

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;
if (!sourceUrl || !targetUrl) throw new Error('Defina SOURCE_DATABASE_URL e DATABASE_URL no .env.');
if (sourceUrl === targetUrl) throw new Error('Os bancos de origem e destino não podem ser iguais.');

const { Pool } = pg;
const source = new Pool({ connectionString: sourceUrl, max: 2 });
const target = new Pool({ connectionString: targetUrl, max: 2, ssl: { rejectUnauthorized: true } });
const requiredCatalogConstraints = [
  'course_catalog_records_course_id_fkey',
  'course_catalog_records_institution_id_fkey',
  'course_catalog_records_municipality_id_fkey',
  'course_catalog_records_snapshot_id_fkey',
  'course_catalog_records_source_record_id_fkey'
];
const requiredCatalogIndexes = [
  'course_catalog_records_natural_key_idx',
  'catalog_search_idx',
  'catalog_course_name_lookup_idx',
  'catalog_institution_lookup_idx'
];

const quote = (value) => `"${value.replaceAll('"', '""')}"`;
const normalize = (value) => {
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString('hex');
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
};
const comparable = (row) => JSON.stringify(normalize(row));

async function tableNames(pool) {
  const result = await pool.query(`SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> 'schema_migrations'
    ORDER BY table_name`);
  return result.rows.map((row) => row.table_name);
}

async function columns(pool, table) {
  const result = await pool.query(`SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [table]);
  return result.rows.map((row) => row.column_name);
}

async function metrics(pool, table, hasId) {
  const idMetrics = hasId ? ', min(id)::text min_id, max(id)::text max_id' : '';
  const result = await pool.query(`SELECT count(*)::text count${idMetrics} FROM ${quote(table)}`);
  return result.rows[0];
}

async function sampleRows(pool, table, columnsList, tableMetrics) {
  if (!Number(tableMetrics.count)) return [];
  const list = columnsList.map(quote).join(',');
  if (columnsList.includes('id')) {
    const ids = [...new Set([tableMetrics.min_id, tableMetrics.max_id])];
    const result = await pool.query(`SELECT ${list} FROM ${quote(table)} WHERE id::text = ANY($1::text[]) ORDER BY id`, [ids]);
    return result.rows;
  }
  const result = await pool.query(`SELECT ${list} FROM ${quote(table)} ORDER BY 1 LIMIT 2`);
  return result.rows;
}

async function verifyStructure() {
  const constraints = await target.query(`SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='course_catalog_records' AND constraint_type='FOREIGN KEY'`);
  const constraintNames = new Set(constraints.rows.map((row) => row.constraint_name));
  for (const name of requiredCatalogConstraints) {
    if (!constraintNames.has(name)) throw new Error(`Constraint ausente no destino: ${name}`);
  }

  const indexes = await target.query('SHOW INDEXES FROM course_catalog_records');
  const indexNames = new Set(indexes.rows.map((row) => row.index_name));
  for (const name of requiredCatalogIndexes) {
    if (!indexNames.has(name)) throw new Error(`Índice ausente no destino: ${name}`);
  }
}

try {
  const [sourceTables, targetTables] = await Promise.all([tableNames(source), tableNames(target)]);
  const missing = sourceTables.filter((table) => !targetTables.includes(table));
  if (missing.length) throw new Error(`Tabelas ausentes no destino: ${missing.join(', ')}`);

  let total = 0;
  for (const table of sourceTables) {
    const [sourceColumns, targetColumns] = await Promise.all([columns(source, table), columns(target, table)]);
    const missingColumns = sourceColumns.filter((column) => !targetColumns.includes(column));
    if (missingColumns.length) throw new Error(`${table}: colunas ausentes no destino: ${missingColumns.join(', ')}`);
    const sharedColumns = sourceColumns.filter((column) => targetColumns.includes(column));
    const hasId = sharedColumns.includes('id');
    const [sourceMetrics, targetMetrics] = await Promise.all([
      metrics(source, table, hasId), metrics(target, table, hasId)
    ]);
    if (sourceMetrics.count !== targetMetrics.count) {
      throw new Error(`${table}: contagem divergente (${targetMetrics.count}/${sourceMetrics.count}).`);
    }
    if (hasId && (sourceMetrics.min_id !== targetMetrics.min_id || sourceMetrics.max_id !== targetMetrics.max_id)) {
      throw new Error(`${table}: intervalo de IDs divergente.`);
    }
    const [sourceSamples, targetSamples] = await Promise.all([
      sampleRows(source, table, sharedColumns, sourceMetrics),
      sampleRows(target, table, sharedColumns, targetMetrics)
    ]);
    if (comparable(sourceSamples) !== comparable(targetSamples)) throw new Error(`${table}: amostras de borda divergentes.`);
    total += Number(sourceMetrics.count);
    console.log(`${table}: ${Number(sourceMetrics.count).toLocaleString('pt-BR')} registros conferidos`);
  }

  await verifyStructure();
  console.log({ status: 'paridade confirmada', tables: sourceTables.length, totalRows: total });
} finally {
  await Promise.allSettled([source.end(), target.end()]);
}
