import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;
const moltPath = resolve(process.cwd(), '.tools', 'molt', 'molt.exe');
if (!sourceUrl || !targetUrl) throw new Error('Defina SOURCE_DATABASE_URL e DATABASE_URL no .env.');
if (sourceUrl === targetUrl) throw new Error('Os bancos de origem e destino não podem ser iguais.');
if (!existsSync(moltPath)) throw new Error('MOLT não encontrado em .tools/molt/molt.exe.');

const { Client } = pg;
const target = new Client({ connectionString: targetUrl, ssl: { rejectUnauthorized: true }, statement_timeout: 0, query_timeout: 0 });
const uniqueConstraint = 'source_records_snapshot_id_dataset_natural_key_key';
const catalogConstraints = new Map([
  ['course_catalog_records_institution_id_fkey', 'FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE'],
  ['course_catalog_records_course_id_fkey', 'FOREIGN KEY (course_id) REFERENCES courses(id)'],
  ['course_catalog_records_municipality_id_fkey', 'FOREIGN KEY (municipality_id) REFERENCES municipalities(id)'],
  ['course_catalog_records_source_record_id_fkey', 'FOREIGN KEY (source_record_id) REFERENCES source_records(id)'],
  ['course_catalog_records_snapshot_id_fkey', 'FOREIGN KEY (snapshot_id) REFERENCES source_snapshots(id)']
]);

function runMolt() {
  const args = [
    'fetch', '--source', sourceUrl, '--target', targetUrl,
    '--schema-filter', '^public$', '--table-filter', '^source_records$', '--table-exclusion-filter', '^$',
    '--table-handling', 'none', '--direct-copy', '--export-concurrency', '4', '--table-concurrency', '1',
    '--row-batch-size', '1000', '--ignore-replication-check', '--allow-tls-mode-disable',
    '--non-interactive', '--opt-out-telemetry', '--log-file', 'stdout', '--logging', 'info'
  ];
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(moltPath, args, { stdio: 'inherit', windowsHide: true });
    child.once('error', rejectPromise);
    child.once('exit', (code, signal) => code === 0
      ? resolvePromise()
      : rejectPromise(new Error(`MOLT terminou com código ${code ?? 'nulo'}${signal ? ` (${signal})` : ''}.`)));
  });
}

async function waitForCatalog() {
  const source = new Client({ connectionString: sourceUrl });
  await source.connect();
  try {
    const expected = Number((await source.query('SELECT count(*)::text count FROM course_catalog_records')).rows[0].count);
    for (;;) {
      const actual = Number((await target.query('SELECT count(*)::text count FROM course_catalog_records')).rows[0].count);
      if (actual === expected) return;
      console.log(`Aguardando catálogo: ${actual.toLocaleString('pt-BR')} / ${expected.toLocaleString('pt-BR')}`);
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 10000));
    }
  } finally {
    await source.end();
  }
}

async function restoreIntegrity() {
  console.log('Restaurando unicidade dos registros brutos...');
  const sourceConstraints = await target.query(`SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='source_records'`);
  const sourceNames = new Set(sourceConstraints.rows.map((row) => row.constraint_name));
  if (!sourceNames.has(uniqueConstraint)) {
    await target.query(`ALTER TABLE source_records ADD CONSTRAINT ${uniqueConstraint} UNIQUE (snapshot_id, dataset, natural_key)`);
  }

  await waitForCatalog();
  console.log('Confirmando integridade referencial do catálogo...');
  const existing = await target.query(`SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='course_catalog_records'`);
  const names = new Set(existing.rows.map((row) => row.constraint_name));
  for (const [name, definition] of catalogConstraints) {
    if (!names.has(name)) await target.query(`ALTER TABLE course_catalog_records ADD CONSTRAINT ${name} ${definition}`);
  }
}

let connected = false;
let prepared = false;
try {
  await target.connect();
  connected = true;
  const count = Number((await target.query('SELECT count(*)::text count FROM source_records')).rows[0].count);
  if (count) throw new Error(`source_records precisa estar vazia para a carga otimizada; encontrado: ${count}.`);
  await target.query(`ALTER TABLE source_records DROP CONSTRAINT IF EXISTS ${uniqueConstraint}`);
  prepared = true;
  await runMolt();
  await restoreIntegrity();
} finally {
  if (prepared && connected) {
    const current = await target.query(`SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_schema='public' AND table_name='source_records' AND constraint_name=$1`, [uniqueConstraint]);
    if (!current.rowCount) {
      await target.query(`ALTER TABLE source_records ADD CONSTRAINT ${uniqueConstraint} UNIQUE (snapshot_id, dataset, natural_key)`);
    }
  }
  if (connected) await target.end();
}
