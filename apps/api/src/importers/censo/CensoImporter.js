import { createReadStream } from 'node:fs';
import { open } from 'node:fs/promises';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { from as copyFrom } from 'pg-copy-streams';
import { env } from '../../config/env.js';
import { pool } from '../../database/pool.js';
import { slugSql as normalizedSlugSql } from '../../database/sqlText.js';

const q = (identifier) => `"${identifier.replaceAll('"', '""')}"`;
const clean = (column) => `NULLIF(NULLIF(btrim(${q(column)}), ''), '(.)')`;
const numeric = (column) => `${clean(column)}::numeric`;
const slugSql = (column, suffix) => `${normalizedSlugSql(q(column))} || '-' || ${q(suffix)}`;
const isCockroach = env.DATABASE_PROVIDER === 'cockroach';

function latin1ToUtf8() {
  return new Transform({
    transform(chunk, _encoding, callback) {
      callback(null, Buffer.from(chunk.toString('latin1'), 'utf8'));
    }
  });
}

async function csvHeaders(file) {
  const handle = await open(file, 'r');
  try {
    const buffer = Buffer.alloc(64 * 1024);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const firstLine = buffer.subarray(0, bytesRead).toString('latin1').split(/\r?\n/, 1)[0].replace(/^\uFEFF/, '');
    return firstLine.split(';').map((value) => value.replace(/^"|"$/g, '').trim());
  } finally { await handle.close(); }
}

export class CensoImporter {
  constructor({ iesFile, coursesFile, snapshot }) {
    this.iesFile = iesFile; this.coursesFile = coursesFile; this.snapshot = snapshot;
    this.stats = { read: 0, imported: 0, rejected: 0 };
  }

  async prepare() {
    const source = await pool.query(`INSERT INTO sources(name,publisher,canonical_url,license) VALUES ('Censo da Educação Superior 2024','INEP',$1,'CC BY-ND 3.0') ON CONFLICT(name,publisher) DO UPDATE SET canonical_url=EXCLUDED.canonical_url RETURNING id`, [this.snapshot.url]);
    const snap = await pool.query(`INSERT INTO source_snapshots(source_id,reference_period,retrieved_at,sha256,original_url,schema_version) VALUES ($1,$2,$3,$4,$5,'censo-superior-2024-national-v2') ON CONFLICT(source_id,sha256) DO UPDATE SET retrieved_at=EXCLUDED.retrieved_at RETURNING id`, [source.rows[0].id, this.snapshot.year, this.snapshot.retrievedAt, this.snapshot.sha256, this.snapshot.url]);
    this.snapshotId = snap.rows[0].id;
    const run = await pool.query(`INSERT INTO import_runs(snapshot_id,importer_version,status) VALUES ($1,'2.0.0','executando') ON CONFLICT(snapshot_id,importer_version) DO UPDATE SET status='executando',rows_read=0,rows_imported=0,rows_rejected=0,started_at=now(),finished_at=NULL RETURNING id`, [this.snapshotId]);
    this.runId = run.rows[0].id;
    await pool.query('DELETE FROM import_rejections WHERE import_run_id=$1', [this.runId]);
  }

  async stage(table, file) {
    const headers = await csvHeaders(file);
    if (!headers.length || new Set(headers).size !== headers.length) throw new Error(`Cabeçalho inválido em ${file}`);
    await pool.query(`DROP TABLE IF EXISTS ${q(table)}`);
    await pool.query(`CREATE ${isCockroach ? '' : 'UNLOGGED '}TABLE ${q(table)} (${headers.map((name) => `${q(name)} text`).join(',')})`);
    const client = await pool.connect();
    try {
      const encoding = isCockroach ? '' : ", ENCODING 'LATIN1'";
      const stream = client.query(copyFrom(`COPY ${q(table)} (${headers.map(q).join(',')}) FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ';'${encoding})`));
      if (isCockroach) await pipeline(createReadStream(file), latin1ToUtf8(), stream);
      else await pipeline(createReadStream(file), stream);
    } finally { client.release(); }
    await pool.query(`ANALYZE ${q(table)}`);
    const count = Number((await pool.query(`SELECT count(*) count FROM ${q(table)}`)).rows[0].count);
    console.log(`${table}: ${count.toLocaleString('pt-BR')} linhas carregadas no staging`);
    return { headers, count };
  }

  async validate() {
    const result = await pool.query(`SELECT count(*) FILTER (WHERE ${clean('CO_IES')} IS NULL OR ${clean('CO_CURSO')} IS NULL) missing_keys, count(*) FILTER (WHERE ${clean('TP_MODALIDADE_ENSINO')} NOT IN ('1','2')) invalid_modality, count(*) FILTER (WHERE ${clean('NU_ANO_CENSO')} !~ '^[0-9]{4}$') invalid_year, count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM stg_ies_2024 i WHERE i."CO_IES"=c."CO_IES")) missing_institution FROM stg_courses_2024 c`);
    const errors = Object.entries(result.rows[0]).filter(([, value]) => Number(value) > 0);
    if (errors.length) throw new Error(`Carga oficial reprovada na validação: ${errors.map(([key, value]) => `${key}=${value}`).join(', ')}`);
  }

  async transform() {
    console.log('Normalizando estados, municípios, IES e cursos…');
    await pool.query(`INSERT INTO states(ibge_code,name,abbreviation) SELECT DISTINCT ${clean('CO_UF_IES')},${clean('NO_UF_IES')},${clean('SG_UF_IES')} FROM stg_ies_2024 WHERE ${clean('CO_UF_IES')} IS NOT NULL ON CONFLICT(ibge_code) DO UPDATE SET name=EXCLUDED.name,abbreviation=EXCLUDED.abbreviation`);
    await pool.query(`INSERT INTO municipalities(ibge_code,state_id,name,slug,location_note) SELECT DISTINCT ON (${clean('CO_MUNICIPIO_IES')}) ${clean('CO_MUNICIPIO_IES')},s.id,${clean('NO_MUNICIPIO_IES')},${normalizedSlugSql(q('NO_MUNICIPIO_IES'))},'Centroide da malha municipal IBGE 2024; referência aproximada, não endereço de campus.' FROM stg_ies_2024 x JOIN states s ON s.abbreviation=${clean('SG_UF_IES')} WHERE ${clean('CO_MUNICIPIO_IES')} IS NOT NULL ON CONFLICT(ibge_code) DO UPDATE SET state_id=EXCLUDED.state_id,name=EXCLUDED.name,slug=EXCLUDED.slug`);
    await pool.query(`INSERT INTO municipalities(ibge_code,state_id,name,slug,location_note) SELECT DISTINCT ON (${clean('CO_MUNICIPIO')}) ${clean('CO_MUNICIPIO')},s.id,${clean('NO_MUNICIPIO')},${normalizedSlugSql(q('NO_MUNICIPIO'))},'Centroide da malha municipal IBGE 2024; referência aproximada, não endereço de campus.' FROM stg_courses_2024 x JOIN states s ON s.abbreviation=${clean('SG_UF')} WHERE ${clean('CO_MUNICIPIO')} IS NOT NULL ON CONFLICT(ibge_code) DO UPDATE SET state_id=EXCLUDED.state_id,name=EXCLUDED.name,slug=EXCLUDED.slug`);
    await pool.query(`INSERT INTO maintainers(inep_code,name) SELECT DISTINCT ON (${clean('CO_MANTENEDORA')}) ${clean('CO_MANTENEDORA')},${clean('NO_MANTENEDORA')} FROM stg_ies_2024 WHERE ${clean('CO_MANTENEDORA')} IS NOT NULL ORDER BY ${clean('CO_MANTENEDORA')},${clean('NO_MANTENEDORA')} ON CONFLICT(inep_code) DO UPDATE SET name=EXCLUDED.name`);
    await pool.query(`INSERT INTO institutions(inep_code,maintainer_id,headquarters_municipality_id,name,acronym,slug,academic_organization,administrative_category,education_network,headquarters_address,raw_payload,snapshot_id) SELECT ${clean('CO_IES')},mt.id,m.id,${clean('NO_IES')},${clean('SG_IES')},${slugSql('NO_IES','CO_IES')},CASE ${clean('TP_ORGANIZACAO_ACADEMICA')} WHEN '1' THEN 'Universidade' WHEN '2' THEN 'Centro Universitário' WHEN '3' THEN 'Faculdade' WHEN '4' THEN 'Instituto Federal' WHEN '5' THEN 'CEFET' END,CASE ${clean('TP_CATEGORIA_ADMINISTRATIVA')} WHEN '1' THEN 'Pública Federal' WHEN '2' THEN 'Pública Estadual' WHEN '3' THEN 'Pública Municipal' WHEN '4' THEN 'Privada com fins lucrativos' WHEN '5' THEN 'Privada sem fins lucrativos' WHEN '7' THEN 'Especial' END,CASE ${clean('TP_REDE')} WHEN '1' THEN 'publica' WHEN '2' THEN 'privada' END,jsonb_build_object('street',${clean('DS_ENDERECO_IES')},'number',${clean('DS_NUMERO_ENDERECO_IES')},'complement',${clean('DS_COMPLEMENTO_ENDERECO_IES')},'neighborhood',${clean('NO_BAIRRO_IES')},'postalCode',${clean('NU_CEP_IES')}),to_jsonb(x),$1 FROM stg_ies_2024 x LEFT JOIN maintainers mt ON mt.inep_code=${clean('CO_MANTENEDORA')} LEFT JOIN municipalities m ON m.ibge_code=${clean('CO_MUNICIPIO_IES')} ON CONFLICT(inep_code) DO UPDATE SET maintainer_id=EXCLUDED.maintainer_id,headquarters_municipality_id=EXCLUDED.headquarters_municipality_id,name=EXCLUDED.name,acronym=EXCLUDED.acronym,slug=EXCLUDED.slug,academic_organization=EXCLUDED.academic_organization,administrative_category=EXCLUDED.administrative_category,education_network=EXCLUDED.education_network,headquarters_address=EXCLUDED.headquarters_address,raw_payload=EXCLUDED.raw_payload,snapshot_id=EXCLUDED.snapshot_id,updated_at=now()`, [this.snapshotId]);
    await pool.query(`INSERT INTO courses(cine_code,canonical_name,slug,cine_general_area_code,cine_general_area_name,cine_specific_area_code,cine_specific_area_name,cine_detailed_area_code,cine_detailed_area_name) SELECT DISTINCT ON (cine_code) cine_code,canonical_name,${normalizedSlugSql('canonical_name')} || '-' || lower(cine_code),general_code,general_name,specific_code,specific_name,detailed_code,detailed_name FROM (SELECT COALESCE(${clean('CO_CINE_ROTULO')},'inep-'||${clean('CO_CURSO')}) cine_code,COALESCE(${clean('NO_CINE_ROTULO')},${clean('NO_CURSO')}) canonical_name,${clean('CO_CINE_AREA_GERAL')} general_code,${clean('NO_CINE_AREA_GERAL')} general_name,${clean('CO_CINE_AREA_ESPECIFICA')} specific_code,${clean('NO_CINE_AREA_ESPECIFICA')} specific_name,${clean('CO_CINE_AREA_DETALHADA')} detailed_code,${clean('NO_CINE_AREA_DETALHADA')} detailed_name FROM stg_courses_2024) normalized ORDER BY cine_code,canonical_name ON CONFLICT(cine_code) DO UPDATE SET canonical_name=EXCLUDED.canonical_name,cine_general_area_code=EXCLUDED.cine_general_area_code,cine_general_area_name=EXCLUDED.cine_general_area_name,cine_specific_area_code=EXCLUDED.cine_specific_area_code,cine_specific_area_name=EXCLUDED.cine_specific_area_name,cine_detailed_area_code=EXCLUDED.cine_detailed_area_code,cine_detailed_area_name=EXCLUDED.cine_detailed_area_name`);
    console.log('Gravando os registros censitários completos (223 campos por linha)…');
    await pool.query(`INSERT INTO course_catalog_records(institution_id,course_id,municipality_id,inep_course_code,original_name,dimension,degree,modality,academic_level,free_indicator,census_year,census_seats,enrolled,raw_payload,snapshot_id,natural_key) SELECT i.id,c.id,m.id,${clean('CO_CURSO')},${clean('NO_CURSO')},CASE ${clean('TP_DIMENSAO')} WHEN '1' THEN 'municipio' WHEN '2' THEN 'ead_brasil' WHEN '3' THEN 'ead_brasil_agregado' WHEN '4' THEN 'ead_exterior' ELSE 'nao_confirmado' END,CASE ${clean('TP_GRAU_ACADEMICO')} WHEN '1' THEN 'bacharelado' WHEN '2' THEN 'licenciatura' WHEN '3' THEN 'tecnologo' WHEN '4' THEN 'abi' ELSE 'nao_confirmado' END,CASE ${clean('TP_MODALIDADE_ENSINO')} WHEN '1' THEN 'presencial' WHEN '2' THEN 'ead' END,CASE ${clean('TP_NIVEL_ACADEMICO')} WHEN '1' THEN 'graduacao' WHEN '2' THEN 'sequencial' END,CASE ${clean('IN_GRATUITO')} WHEN '1' THEN true WHEN '0' THEN false END,${clean('NU_ANO_CENSO')}::integer,${numeric('QT_VG_TOTAL')},${numeric('QT_MAT')},to_jsonb(x),$1,concat($1::text,'|',i.id::text,'|',${clean('CO_CURSO')},'|',CASE ${clean('TP_DIMENSAO')} WHEN '1' THEN 'municipio' WHEN '2' THEN 'ead_brasil' WHEN '3' THEN 'ead_brasil_agregado' WHEN '4' THEN 'ead_exterior' ELSE 'nao_confirmado' END,'|',COALESCE(m.id::text,'∅'),'|',CASE ${clean('TP_GRAU_ACADEMICO')} WHEN '1' THEN 'bacharelado' WHEN '2' THEN 'licenciatura' WHEN '3' THEN 'tecnologo' WHEN '4' THEN 'abi' ELSE 'nao_confirmado' END,'|',CASE ${clean('TP_MODALIDADE_ENSINO')} WHEN '1' THEN 'presencial' WHEN '2' THEN 'ead' END,'|',COALESCE(CASE ${clean('TP_NIVEL_ACADEMICO')} WHEN '1' THEN 'graduacao' WHEN '2' THEN 'sequencial' END,'∅')) FROM stg_courses_2024 x JOIN institutions i ON i.inep_code=${clean('CO_IES')} JOIN courses c ON c.cine_code=COALESCE(${clean('CO_CINE_ROTULO')},'inep-'||${clean('CO_CURSO')}) LEFT JOIN municipalities m ON m.ibge_code=${clean('CO_MUNICIPIO')} ON CONFLICT(natural_key) DO UPDATE SET original_name=EXCLUDED.original_name,free_indicator=EXCLUDED.free_indicator,census_seats=EXCLUDED.census_seats,enrolled=EXCLUDED.enrolled,raw_payload=EXCLUDED.raw_payload`, [this.snapshotId]);
  }

  async run() {
    await this.prepare();
    try {
      const ies = await this.stage('stg_ies_2024', this.iesFile);
      const courses = await this.stage('stg_courses_2024', this.coursesFile);
      this.stats.read = ies.count + courses.count;
      await this.validate(); await this.transform(); this.stats.imported = this.stats.read;
      await pool.query(`UPDATE import_runs SET status='concluido',rows_read=$2,rows_imported=$3,rows_rejected=0,finished_at=now() WHERE id=$1`, [this.runId, this.stats.read, this.stats.imported]);
      return this.stats;
    } catch (error) {
      await pool.query(`UPDATE import_runs SET status='falhou',rows_read=$2,finished_at=now() WHERE id=$1`, [this.runId, this.stats.read]);
      throw error;
    }
  }
}
