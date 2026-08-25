import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;
const moltPath = resolve(process.cwd(), '.tools', 'molt', 'molt.exe');

if (!sourceUrl || !targetUrl) {
  throw new Error('Defina SOURCE_DATABASE_URL e DATABASE_URL no .env.');
}
if (sourceUrl === targetUrl) {
  throw new Error('Os bancos de origem e destino não podem ser iguais.');
}
if (!existsSync(moltPath)) {
  throw new Error('MOLT não encontrado em .tools/molt/molt.exe.');
}

const { Client } = pg;
const target = new Client({
  connectionString: targetUrl,
  ssl: { rejectUnauthorized: true },
  statement_timeout: 0,
  query_timeout: 0
});

const droppedConstraints = [
  'course_catalog_records_institution_id_fkey',
  'course_catalog_records_course_id_fkey',
  'course_catalog_records_municipality_id_fkey',
  'course_catalog_records_source_record_id_fkey',
  'course_catalog_records_snapshot_id_fkey'
];

const droppedIndexes = [
  'catalog_search_idx',
  'catalog_course_name_lookup_idx',
  'catalog_institution_lookup_idx',
  'course_catalog_records_natural_key_idx'
];

const constraintDefinitions = new Map([
  ['course_catalog_records_institution_id_fkey',
    'FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE'],
  ['course_catalog_records_course_id_fkey',
    'FOREIGN KEY (course_id) REFERENCES courses(id)'],
  ['course_catalog_records_municipality_id_fkey',
    'FOREIGN KEY (municipality_id) REFERENCES municipalities(id)'],
  ['course_catalog_records_source_record_id_fkey',
    'FOREIGN KEY (source_record_id) REFERENCES source_records(id)'],
  ['course_catalog_records_snapshot_id_fkey',
    'FOREIGN KEY (snapshot_id) REFERENCES source_snapshots(id)']
]);

const indexDefinitions = [
  'CREATE INDEX IF NOT EXISTS catalog_search_idx ON course_catalog_records (municipality_id, modality, degree, census_year)',
  'CREATE INDEX IF NOT EXISTS catalog_course_name_lookup_idx ON course_catalog_records (course_id, census_year)',
  'CREATE INDEX IF NOT EXISTS catalog_institution_lookup_idx ON course_catalog_records (institution_id, census_year)',
  'CREATE UNIQUE INDEX IF NOT EXISTS course_catalog_records_natural_key_idx ON course_catalog_records (natural_key)'
];

async function prepareTarget() {
  const result = await target.query(`SELECT
    (SELECT count(*)::int FROM course_catalog_records) catalog,
    (SELECT count(*)::int FROM course_statistics) statistics,
    (SELECT count(*)::int FROM field_observations) observations`);
  const counts = Object.fromEntries(
    Object.entries(result.rows[0]).map(([name, value]) => [name, Number(value)])
  );
  if (counts.catalog || counts.statistics || counts.observations) {
    throw new Error(`Carga otimizada exige tabelas-alvo vazias: ${JSON.stringify(counts)}.`);
  }

  console.log('Preparando a tabela vazia para carga em massa...');
  for (const name of droppedConstraints) {
    await target.query(`ALTER TABLE course_catalog_records DROP CONSTRAINT IF EXISTS ${name}`);
  }
  for (const name of droppedIndexes) {
    await target.query(`DROP INDEX IF EXISTS course_catalog_records@${name}`);
  }
}

async function restoreTarget() {
  console.log('Restaurando índices e integridade referencial...');
  for (const statement of indexDefinitions) await target.query(statement);

  const existing = await target.query(`SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'course_catalog_records'`);
  const names = new Set(existing.rows.map((row) => row.constraint_name));
  for (const [name, definition] of constraintDefinitions) {
    if (!names.has(name)) {
      await target.query(`ALTER TABLE course_catalog_records ADD CONSTRAINT ${name} ${definition}`);
    }
  }
}

function runMolt() {
  const args = [
    'fetch',
    '--source', sourceUrl,
    '--target', targetUrl,
    '--schema-filter', '^public$',
    '--table-filter', '^course_catalog_records$',
    '--table-exclusion-filter', '^$',
    '--table-handling', 'none',
    '--direct-copy',
    '--export-concurrency', '4',
    '--table-concurrency', '1',
    '--row-batch-size', '1000',
    '--ignore-replication-check',
    '--allow-tls-mode-disable',
    '--non-interactive',
    '--opt-out-telemetry',
    '--log-file', 'stdout',
    '--logging', 'info'
  ];

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(moltPath, args, { stdio: 'inherit', windowsHide: true });
    child.once('error', rejectPromise);
    child.once('exit', (code, signal) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`MOLT terminou com código ${code ?? 'nulo'}${signal ? ` (${signal})` : ''}.`));
    });
  });
}

let connected = false;
let prepared = false;
try {
  await target.connect();
  connected = true;
  await prepareTarget();
  prepared = true;
  await runMolt();
} finally {
  if (prepared) await restoreTarget();
  if (connected) await target.end();
}
