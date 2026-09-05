import { pool, withTransaction } from '../apps/api/src/database/pool.js';
import { foldText, foldedSql } from '../apps/api/src/database/sqlText.js';
import { feaCourses } from '../apps/api/src/importers/verified/fea.js';
import { saveSource, saveRecord, sha256 } from '../apps/api/src/importers/verified/source.js';

const apply=process.argv.includes('--apply');
const collectedAt=new Date().toISOString();
try {
  const prepared=[];
  for(const course of feaCourses){
    const url=`https://www.fea.br/portal/secretarias/${course.path}`;
    const response=await fetch(url,{signal:AbortSignal.timeout(30000),redirect:'error'});
    if(!response.ok)throw Error(`Fonte indisponível: HTTP ${response.status}`);
    const html=await response.text();
    if(Buffer.byteLength(html)>3_000_000||!html.includes('Fundação Educacional'))throw Error('Página oficial fora do formato esperado.');
    const normalized=foldText(html);
    if(course.shift==='noturno'&&!normalized.includes('noturno'))throw Error(`Turno não encontrado na fonte de ${course.code}.`);
    const matches=(await pool.query(`SELECT DISTINCT i.id institution_id,c.id course_id,m.id municipality_id
      FROM institutions i JOIN course_catalog_records ccr ON ccr.institution_id=i.id JOIN courses c ON c.id=ccr.course_id
      JOIN municipalities m ON m.id=ccr.municipality_id JOIN states s ON s.id=m.state_id
      WHERE i.inep_code=$1 AND ${foldedSql('c.canonical_name')}=$2 AND ccr.degree=$3 AND ccr.modality='presencial'
      AND m.name='Andradina' AND s.abbreviation='SP'`,[course.institution,foldText(course.course),course.degree])).rows;
    if(matches.length!==1)throw Error(`Reconciliação ambígua: ${course.code}.`);
    prepared.push({...course,...matches[0],url,hash:sha256(html)});
  }
  console.log({mode:apply?'apply':'dry-run',verifiedSources:prepared.length,conflicts:prepared.filter(c=>c.addressConflict).map(c=>c.code)});
  if(apply)for(const course of prepared)await withTransaction(async client=>{
    const snapshot=await saveSource(client,{name:`FEA — ${course.code}`,publisher:'Fundação Educacional de Andradina',url:course.url,hash:course.hash,
      referencePeriod:'Catálogo institucional consultado em 2026-09-03',retrievedAt:collectedAt,schemaVersion:'reviewed-course-page-v2'});
    const key=`fea:${course.code}:2026`;
    const payload={...course,degreeModalitySource:'Censo Superior 2024: vínculo institucional e modalidade presencial reconciliados.',
      notice:course.note||'Curso listado no portal institucional. Confirme calendário de ingresso e disponibilidade de vagas diretamente com a instituição.',retrievedAt:collectedAt};
    const record=await saveRecord(client,snapshot,'verified_course_offering',key,payload);
    const slug=course.addressConflict?'fea-agronomia-endereco-em-revisao':'fea-stella-maris';
    const address={street:'Rua Amazonas',number:course.addressConflict?null:'751',neighborhood:'Stella Maris',postalCode:'16901-160',note:course.addressConflict?course.note:null};
    const campus=(await client.query(`INSERT INTO campuses(institution_id,municipality_id,external_code,name,slug,address,location_status,status,source_record_id,updated_at)
      VALUES ($1,$2,$3,$4,$3,$5::jsonb,$6,'confirmado',$7,$8) ON CONFLICT(institution_id,slug)
      DO UPDATE SET address=EXCLUDED.address,source_record_id=EXCLUDED.source_record_id,updated_at=EXCLUDED.updated_at RETURNING id`,
      [course.institution_id,course.municipality_id,slug,course.addressConflict?'FEA — Agronomia (endereço em revisão)':'FEA — Stella Maris',JSON.stringify(address),course.addressConflict?'nao_confirmado':'confirmado',record,collectedAt])).rows[0];
    const existing=(await client.query('SELECT id FROM course_offerings WHERE institution_id=$1 AND external_code=$2',[course.institution_id,key])).rows;
    if(existing.length>1)throw Error('Oferta duplicada: revisão necessária.');
    if(existing.length)await client.query(`UPDATE course_offerings SET campus_id=$2,source_record_id=$3,updated_at=$4,shift=$5 WHERE id=$1`,[existing[0].id,campus.id,record,collectedAt,course.shift]);
    else await client.query(`INSERT INTO course_offerings(institution_id,course_id,campus_id,external_code,degree,modality,shift,regulatory_status,data_status,source_record_id,updated_at)
      VALUES ($1,$2,$3,$4,$5,'presencial',$6,'nao_confirmado','confirmado',$7,$8)`,[course.institution_id,course.course_id,campus.id,key,course.degree,course.shift,record,collectedAt]);
    await client.query(`INSERT INTO institution_aliases(institution_id,alias,normalized_alias,source_record_id)
      VALUES ($1,'FEA Andradina','fea andradina',$2) ON CONFLICT(institution_id,normalized_alias) DO UPDATE SET source_record_id=EXCLUDED.source_record_id`,[course.institution_id,record]);
    console.log('Importado:',course.code);
  });
}catch(error){console.error({code:error.code||'IMPORT_FAILED',message:error.message});process.exitCode=1;}
finally{await pool.end();}
