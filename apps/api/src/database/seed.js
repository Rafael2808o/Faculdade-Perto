import { createHash } from 'node:crypto';
import slugify from 'slugify';
import { pool, withTransaction } from './pool.js';
import { catalogNaturalKey } from './sqlText.js';

const sourceUrl = 'https://download.inep.gov.br/microdados/microdados_censo_da_educacao_superior_2024.zip';
const snapshotHash = 'e8e11899efe2b348a7e80e3a3c610c3bdd1ced3362ccdf2c9f9abe9bf8988386';
const slug = (value) => slugify(value, { lower: true, strict: true, locale: 'pt' });
const rowHash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

const institutions = [
  { code: '54', name: 'UNIVERSIDADE ESTADUAL DE CAMPINAS', acronym: 'UNICAMP', maintainerCode: '12575', maintainer: 'UNIVERSIDADE ESTADUAL DE CAMPINAS', network: 'publica', category: 'Pública Estadual', organization: 'Universidade', municipalityCode: '3509502', municipality: 'Campinas', address: ['Cidade Universitária', 'S/N', 'Barão Geraldo', '13083970'] },
  { code: '19', name: 'PONTIFÍCIA UNIVERSIDADE CATÓLICA DE CAMPINAS', acronym: 'PUC-CAMPINAS', maintainerCode: '19', maintainer: 'SOCIEDADE CAMPINEIRA DE EDUCACAO E INSTRUCAO', network: 'privada', category: 'Privada sem fins lucrativos', organization: 'Universidade', municipalityCode: '3509502', municipality: 'Campinas', address: ['Rua Professor Doutor Euryclides de Jesus Zerbini', '1516', 'Parque Rural Fazenda Santa Cândida', '13087571'] },
  { code: '322', name: 'UNIVERSIDADE PAULISTA', acronym: 'UNIP', maintainerCode: '2415', maintainer: 'ASSUPERO ENSINO SUPERIOR LTDA.', network: 'privada', category: 'Privada com fins lucrativos', organization: 'Universidade', municipalityCode: '3550308', municipality: 'São Paulo', address: ['Avenida Torres de Oliveira', '330', 'Jaguaré', '05347020'] },
  { code: '22', name: 'UNIVERSIDADE PRESBITERIANA MACKENZIE', acronym: 'MACKENZIE', maintainerCode: '22', maintainer: 'INSTITUTO PRESBITERIANO MACKENZIE', network: 'privada', category: 'Privada sem fins lucrativos', organization: 'Universidade', municipalityCode: '3550308', municipality: 'São Paulo', address: ['Rua da Consolação', '896', 'Consolação', '01302907'] }
];

const courseRows = [
  ['54','2695','Medicina','0912M01','Saúde e bem-estar','bacharelado',true,122,731],
  ['54','2700','Pedagogia','0113P01','Educação','licenciatura',true,51,221],
  ['19','1654','Administração','0413A01','Negócios, administração e direito','bacharelado',false,854,1358],
  ['19','1642','Direito','0421D01','Negócios, administração e direito','bacharelado',false,574,1910],
  ['19','1629','Medicina','0912M01','Saúde e bem-estar','bacharelado',false,134,868],
  ['322','7299','Administração','0413A01','Negócios, administração e direito','bacharelado',false,407,285],
  ['322','7300','Direito','0421D01','Negócios, administração e direito','bacharelado',false,526,561],
  ['322','5001416','Medicina','0912M01','Saúde e bem-estar','bacharelado',false,105,210],
  ['322','18694','Pedagogia','0113P01','Educação','licenciatura',false,240,107],
  ['22','108112','Administração','0413A01','Negócios, administração e direito','bacharelado',false,162,283]
];

await withTransaction(async (db) => {
  const source = await db.query(`INSERT INTO sources(name,publisher,canonical_url,license)
    VALUES ('Censo da Educação Superior 2024','INEP',$1,'CC BY-ND 3.0')
    ON CONFLICT(name,publisher) DO UPDATE SET canonical_url=EXCLUDED.canonical_url RETURNING id`, [sourceUrl]);
  const snapshot = await db.query(`INSERT INTO source_snapshots(source_id,reference_period,published_at,retrieved_at,sha256,original_url,schema_version)
    VALUES ($1,'2024','2025-10-17','2026-08-21',$2,$3,'censo-superior-2024')
    ON CONFLICT(source_id,sha256) DO UPDATE SET retrieved_at=EXCLUDED.retrieved_at RETURNING id`, [source.rows[0].id, snapshotHash, sourceUrl]);
  const snapshotId = snapshot.rows[0].id;

  const state = await db.query(`INSERT INTO states(ibge_code,name,abbreviation) VALUES ('35','São Paulo','SP')
    ON CONFLICT(ibge_code) DO UPDATE SET name=EXCLUDED.name RETURNING id`);
  const stateId = state.rows[0].id;
  const municipalities = [
    ['3509502','Campinas','campinas',-47.0608,-22.9056,'Referência aproximada do município; não representa um campus.'],
    ['3550308','São Paulo','sao-paulo',-46.6333,-23.5505,'Referência aproximada do município; não representa um campus.']
  ];
  for (const [code,name,citySlug,lng,lat,note] of municipalities) {
    await db.query(`INSERT INTO municipalities(ibge_code,state_id,name,slug,reference_longitude,reference_latitude,location_note)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(ibge_code) DO UPDATE SET name=EXCLUDED.name, reference_longitude=EXCLUDED.reference_longitude, reference_latitude=EXCLUDED.reference_latitude, location_note=EXCLUDED.location_note`, [code,stateId,name,citySlug,lng,lat,note]);
  }

  for (const item of institutions) {
    const raw = { NU_ANO_CENSO:'2024', CO_IES:item.code, NO_IES:item.name, SG_IES:item.acronym, CO_MANTENEDORA:item.maintainerCode, NO_MANTENEDORA:item.maintainer, CO_MUNICIPIO_IES:item.municipalityCode };
    const record = await db.query(`INSERT INTO source_records(snapshot_id,dataset,natural_key,raw_payload,row_hash)
      VALUES ($1,'MICRODADOS_ED_SUP_IES_2024.CSV',$2,$3,$4)
      ON CONFLICT(snapshot_id,dataset,natural_key) DO UPDATE SET raw_payload=EXCLUDED.raw_payload RETURNING id`, [snapshotId, `2024:${item.code}`, raw, rowHash(raw)]);
    const maintainer = await db.query(`INSERT INTO maintainers(inep_code,name) VALUES ($1,$2)
      ON CONFLICT(inep_code) DO UPDATE SET name=EXCLUDED.name RETURNING id`, [item.maintainerCode,item.maintainer]);
    const municipality = await db.query('SELECT id FROM municipalities WHERE ibge_code=$1',[item.municipalityCode]);
    await db.query(`INSERT INTO institutions(inep_code,maintainer_id,headquarters_municipality_id,name,acronym,slug,academic_organization,administrative_category,education_network,headquarters_address,source_record_id,snapshot_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT(inep_code) DO UPDATE SET name=EXCLUDED.name, acronym=EXCLUDED.acronym, updated_at=now()`, [item.code,maintainer.rows[0].id,municipality.rows[0].id,item.name,item.acronym,`${slug(item.name)}-${item.code}`,item.organization,item.category,item.network,{street:item.address[0],number:item.address[1],neighborhood:item.address[2],postalCode:item.address[3]},record.rows[0].id,snapshotId]);
  }

  for (const [iesCode,courseCode,name,cine,area,degree,free,seats,enrolled] of courseRows) {
    const institution = await db.query('SELECT id, headquarters_municipality_id FROM institutions WHERE inep_code=$1',[iesCode]);
    const canonical = await db.query(`INSERT INTO courses(cine_code,canonical_name,slug,cine_general_area_code,cine_general_area_name)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT(cine_code) DO UPDATE SET canonical_name=EXCLUDED.canonical_name RETURNING id`, [cine,name,`${slug(name)}-${cine.toLowerCase()}`,cine.slice(0,2),area]);
    const raw = { NU_ANO_CENSO:'2024',CO_IES:iesCode,CO_CURSO:courseCode,NO_CURSO:name,CO_CINE_ROTULO:cine,TP_GRAU_ACADEMICO:degree,IN_GRATUITO:free?'1':'0',TP_MODALIDADE_ENSINO:'1',CO_MUNICIPIO:'3509502',QT_VG_TOTAL:String(seats),QT_MAT:String(enrolled) };
    const naturalKey = `2024:${iesCode}:${courseCode}:1:3509502:${degree}:presencial:graduacao`;
    const record = await db.query(`INSERT INTO source_records(snapshot_id,dataset,natural_key,raw_payload,row_hash)
      VALUES ($1,'MICRODADOS_CADASTRO_CURSOS_2024.CSV',$2,$3,$4)
      ON CONFLICT(snapshot_id,dataset,natural_key) DO UPDATE SET raw_payload=EXCLUDED.raw_payload RETURNING id`, [snapshotId,naturalKey,raw,rowHash(raw)]);
    const catalogKey = catalogNaturalKey([snapshotId,institution.rows[0].id,courseCode,'municipio',institution.rows[0].headquarters_municipality_id,degree,'presencial','graduacao']);
    const catalog = await db.query(`INSERT INTO course_catalog_records(institution_id,course_id,municipality_id,inep_course_code,original_name,dimension,degree,modality,academic_level,free_indicator,census_year,census_seats,enrolled,raw_payload,source_record_id,snapshot_id,natural_key)
      VALUES ($1,$2,$3,$4,$5,'municipio',$6,'presencial','graduacao',$7,2024,$8,$9,$10,$11,$12,$13)
      ON CONFLICT(natural_key) DO UPDATE SET original_name=EXCLUDED.original_name,census_seats=EXCLUDED.census_seats,enrolled=EXCLUDED.enrolled,raw_payload=EXCLUDED.raw_payload RETURNING id`, [institution.rows[0].id,canonical.rows[0].id,institution.rows[0].headquarters_municipality_id,courseCode,name,degree,free,seats,enrolled,raw,record.rows[0].id,snapshotId,catalogKey]);
    for (const [metric,value] of [['QT_VG_TOTAL',seats],['QT_MAT',enrolled]]) {
      await db.query(`INSERT INTO course_statistics(catalog_record_id,metric,value,year,source_record_id) VALUES ($1,$2,$3,2024,$4)
        ON CONFLICT(catalog_record_id,metric,year) DO UPDATE SET value=EXCLUDED.value`, [catalog.rows[0].id,metric,value,record.rows[0].id]);
    }
  }
});

console.log('Amostra oficial do Censo 2024 carregada com proveniência.');
await pool.end();
