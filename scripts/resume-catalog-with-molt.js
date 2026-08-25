import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;
const moltPath = resolve(process.cwd(), '.tools', 'molt', 'molt.exe');
const filterPath = resolve(process.cwd(), '.tools', 'molt', 'catalog-missing-filter.json');
if (!sourceUrl || !targetUrl) throw new Error('Defina SOURCE_DATABASE_URL e DATABASE_URL no .env.');
if (sourceUrl === targetUrl) throw new Error('Os bancos de origem e destino não podem ser iguais.');
if (!existsSync(moltPath)) throw new Error('MOLT não encontrado em .tools/molt/molt.exe.');

const { Client } = pg;
const source = new Client({ connectionString: sourceUrl, statement_timeout: 0, query_timeout: 0 });

// Intervalos que ficaram pendentes após a primeira carga. A retomada pode ser
// executada várias vezes: cada intervalo é reduzido ao trecho que ainda falta.
const catalogResumeRanges = [
  [100519, 185128],
  [280380, 362523],
  [460799, 540934],
  [640096, 720349]
];

const constraints = new Map([
  ['course_catalog_records_institution_id_fkey', 'FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE'],
  ['course_catalog_records_course_id_fkey', 'FOREIGN KEY (course_id) REFERENCES courses(id)'],
  ['course_catalog_records_municipality_id_fkey', 'FOREIGN KEY (municipality_id) REFERENCES municipalities(id)'],
  ['course_catalog_records_source_record_id_fkey', 'FOREIGN KEY (source_record_id) REFERENCES source_records(id)'],
  ['course_catalog_records_snapshot_id_fkey', 'FOREIGN KEY (snapshot_id) REFERENCES source_snapshots(id)']
]);
const indexes = [
  'CREATE INDEX IF NOT EXISTS catalog_search_idx ON course_catalog_records (municipality_id, modality, degree, census_year)',
  'CREATE INDEX IF NOT EXISTS catalog_course_name_lookup_idx ON course_catalog_records (course_id, census_year)',
  'CREATE INDEX IF NOT EXISTS catalog_institution_lookup_idx ON course_catalog_records (institution_id, census_year)',
  'CREATE UNIQUE INDEX IF NOT EXISTS course_catalog_records_natural_key_idx ON course_catalog_records (natural_key)'
];

const delay = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

async function targetQuery(text, values = []) {
  let lastError;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const client = new Client({
      connectionString: targetUrl,
      ssl: { rejectUnauthorized: true },
      statement_timeout: 0,
      query_timeout: 0,
      connectionTimeoutMillis: 30_000
    });
    try {
      await client.connect();
      return await client.query(text, values);
    } catch (error) {
      lastError = error;
      if (!['ECONNRESET', 'ETIMEDOUT', 'EPIPE', '57P01'].includes(error.code) || attempt === 6) throw error;
      console.warn(`Conexão transitória encerrada pelo CockroachDB; nova tentativa ${attempt}/6...`);
      await delay(attempt * 2_000);
    } finally {
      await client.end().catch(() => {});
    }
  }
  throw lastError;
}

async function missingRanges() {
  const sourceBounds = (await source.query(`SELECT min(id)::text min_id, max(id)::text max_id, count(*)::text count
    FROM course_catalog_records`)).rows[0];
  const targetBounds = (await targetQuery(`SELECT min(id)::text min_id, max(id)::text max_id, count(*)::text count
    FROM course_catalog_records`)).rows[0];
  const expectedMissing = Number(sourceBounds.count) - Number(targetBounds.count);
  if (expectedMissing === 0) {
    return { expression: '', ranges: [], sourceCount: Number(sourceBounds.count), targetCount: Number(targetBounds.count) };
  }

  const ranges = [];
  for (const [start, end] of catalogResumeRanges) {
    const bounds = (await targetQuery(`SELECT count(*)::text count, min(id)::text min_id, max(id)::text max_id
      FROM course_catalog_records WHERE id BETWEEN $1 AND $2`, [start, end])).rows[0];
    const count = Number(bounds.count);
    if (count === end - start + 1) continue;

    const minId = Number(bounds.min_id);
    const maxId = Number(bounds.max_id);
    if (count === 0) {
      ranges.push([start, end]);
    } else if (minId === start && count === maxId - start + 1) {
      ranges.push([maxId + 1, end]);
    } else {
      const internalGaps = (await targetQuery(`WITH ordered AS (
          SELECT id, lag(id) OVER (ORDER BY id) previous_id
          FROM course_catalog_records WHERE id BETWEEN $1 AND $2
        ) SELECT (previous_id + 1)::text start_id, (id - 1)::text end_id
        FROM ordered WHERE previous_id IS NOT NULL AND id > previous_id + 1 ORDER BY id`, [start, end])).rows;
      if (minId > start) ranges.push([start, minId - 1]);
      ranges.push(...internalGaps.map((row) => [Number(row.start_id), Number(row.end_id)]));
      if (maxId < end) ranges.push([maxId + 1, end]);
    }
  }

  const expression = ranges.map(([start, end]) => `(id BETWEEN ${start} AND ${end})`).join(' OR ');
  const selected = expression
    ? Number((await source.query(`SELECT count(*)::text count FROM course_catalog_records WHERE ${expression}`)).rows[0].count)
    : 0;
  if (selected !== expectedMissing) {
    throw new Error(`Intervalos calculados não correspondem à diferença: ${selected}/${expectedMissing}.`);
  }
  return { expression, ranges, sourceCount: Number(sourceBounds.count), targetCount: Number(targetBounds.count) };
}

async function prepare() {
  for (const name of constraints.keys()) {
    await targetQuery(`ALTER TABLE course_catalog_records DROP CONSTRAINT IF EXISTS ${name}`);
  }
  for (const name of ['catalog_search_idx', 'catalog_course_name_lookup_idx', 'catalog_institution_lookup_idx', 'course_catalog_records_natural_key_idx']) {
    await targetQuery(`DROP INDEX IF EXISTS course_catalog_records@${name}`);
  }
}

async function restore() {
  console.log('Restaurando índices e integridade referencial...');
  for (const statement of indexes) await targetQuery(statement);
  const existing = await targetQuery(`SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='course_catalog_records'`);
  const names = new Set(existing.rows.map((row) => row.constraint_name));
  for (const [name, definition] of constraints) {
    if (!names.has(name)) await targetQuery(`ALTER TABLE course_catalog_records ADD CONSTRAINT ${name} ${definition}`);
  }
}

function runMolt() {
  const args = [
    'fetch', '--source', sourceUrl, '--target', targetUrl,
    '--schema-filter', '^public$', '--table-filter', '^course_catalog_records$', '--table-exclusion-filter', '^$',
    '--filter-path', filterPath, '--table-handling', 'none', '--direct-copy',
    '--export-concurrency', '2', '--table-concurrency', '1', '--row-batch-size', '1000',
    '--use-stats-based-sharding=false', '--ignore-replication-check', '--allow-tls-mode-disable',
    '--non-interactive', '--opt-out-telemetry', '--metrics-listen-addr', '127.0.0.1:3130',
    '--pprof-listen-addr', '127.0.0.1:3131', '--log-file', 'stdout', '--logging', 'info'
  ];
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(moltPath, args, { stdio: 'inherit', windowsHide: true });
    child.once('error', rejectPromise);
    child.once('exit', (code, signal) => code === 0
      ? resolvePromise()
      : rejectPromise(new Error(`MOLT terminou com código ${code ?? 'nulo'}${signal ? ` (${signal})` : ''}.`)));
  });
}

let expectedCount = 0;
try {
  await source.connect();
  const missing = await missingRanges();
  expectedCount = missing.sourceCount;
  if (!missing.expression) {
    console.log('Catálogo já está completo; apenas a integridade será confirmada.');
  } else {
    console.log({ current: missing.targetCount, expected: missing.sourceCount, missing: missing.sourceCount - missing.targetCount, ranges: missing.ranges });
    await mkdir(dirname(filterPath), { recursive: true });
    await writeFile(filterPath, `${JSON.stringify({ filters: [{ resource_specifier: { schema: 'public', table: 'course_catalog_records' }, expr: missing.expression }] }, null, 2)}\n`, 'utf8');
    await prepare();
    await runMolt();
  }
  const finalCount = Number((await targetQuery('SELECT count(*)::text count FROM course_catalog_records')).rows[0].count);
  if (finalCount !== expectedCount) throw new Error(`Carga incompleta após MOLT: ${finalCount}/${expectedCount}.`);
  await restore();
  console.log({ status: 'catálogo completo', records: finalCount });
} finally {
  await source.end().catch(() => {});
}
