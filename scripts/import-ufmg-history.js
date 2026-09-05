import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pool, withTransaction } from '../apps/api/src/database/pool.js';
import { normalizeUFMGReport } from '../apps/api/src/importers/verified/ufmg.js';
import { saveSource, sha256 } from '../apps/api/src/importers/verified/source.js';

const apply=process.argv.includes('--apply');
const folder=resolve(process.argv.find(value=>!value.startsWith('--')&&value!==process.argv[0]&&value!==process.argv[1])||'.local-data/official-2026');
const extracted=JSON.parse(await readFile(resolve(folder,'ufmg-extracted.json'),'utf8'));
const manifest=JSON.parse(await readFile(resolve(folder,'ufmg-manifest.json'),'utf8'));
const reports=extracted.reports.filter(report=>report.year===2026);
const normalized=reports.map(report=>({report,...normalizeUFMGReport(report,extracted.term)}));

if(reports.length!==14||normalized.some(item=>item.records.length!==738||item.rejected.length)){
  throw Error(`Cobertura inesperada: ${reports.length} relatórios; ${normalized.map(item=>`${item.records.length}/${item.rejected.length}`).join(', ')}`);
}
console.log({mode:apply?'apply':'dry-run',reports:reports.length,records:normalized.reduce((sum,item)=>sum+item.records.length,0),rejected:0});

function valuesSql(rows,width,start=1){
  return rows.map((_,row)=>`(${Array.from({length:width},(_,column)=>`$${start+row*width+column}`).join(',')})`).join(',');
}

try{
  if(!apply)process.exitCode=0;
  else{
    const institution=(await pool.query("SELECT id FROM institutions WHERE inep_code='575'")).rows;
    if(institution.length!==1)throw Error('A UFMG não foi reconciliada de forma única pelo código INEP 575.');
    const municipalities=(await pool.query(`SELECT m.id,m.name FROM municipalities m JOIN states s ON s.id=m.state_id
      WHERE s.abbreviation='MG' AND m.name IN ('Belo Horizonte','Montes Claros')`)).rows;
    if(municipalities.length!==2)throw Error('Municípios da UFMG não foram reconciliados.');
    const municipalityIds=new Map(municipalities.map(item=>[item.name,item.id]));
    for(const item of normalized){
      const meta=manifest.reports.find(report=>report.file===item.report.file);
      if(!meta||meta.sha256!==item.report.sha256)throw Error(`Hash divergente para ${item.report.file}.`);
      await withTransaction(async client=>{
        const snapshotId=await saveSource(client,{name:`UFMG SiSU 2026 — ${item.report.round}`,publisher:'Universidade Federal de Minas Gerais',
          url:item.report.url,hash:item.report.sha256,referencePeriod:`SiSU/UFMG 1ª edição de 2026 · ${item.report.round}`,
          retrievedAt:manifest.retrievedAt,publishedAt:item.report.published,schemaVersion:'ufmg-maximos-minimos-v1',
          sourceType:'processo_seletivo_oficial',geographicScope:'UFMG — Minas Gerais'});
        for(let offset=0;offset<item.records.length;offset+=100){
          const batch=item.records.slice(offset,offset+100).map(record=>{
            const payload={institutionInepCode:'575',courseCode:record.code,courseName:record.name,campus:record.campus,
              city:record.city,state:record.state,degree:record.degree,shift:record.shift,competition:record.competition,
              minimum:record.minimum,maximum:record.maximum,round:record.round,roundKind:record.roundKind,
              reportPage:record.reportPage,weightsPage:record.weightsPage,weights:record.weights,minima:record.minima,
              sourceUrl:item.report.url,weightsSourceUrl:record.weightsSourceUrl};
            const raw=JSON.stringify(payload);
            return {record,payload,raw,rowHash:sha256(raw)};
          });
          const sourceParams=batch.flatMap(({record,raw,rowHash})=>[snapshotId,'ufmg_admission_history',record.naturalKey,raw,rowHash]);
          const saved=(await client.query(`INSERT INTO source_records(snapshot_id,dataset,natural_key,raw_payload,row_hash) VALUES ${valuesSql(batch,5)}
            ON CONFLICT(snapshot_id,dataset,natural_key) DO UPDATE SET raw_payload=EXCLUDED.raw_payload,row_hash=EXCLUDED.row_hash
            RETURNING id,natural_key`,sourceParams)).rows;
          const sourceIds=new Map(saved.map(row=>[row.natural_key,row.id]));
          const admissionParams=batch.flatMap(({record})=>[record.naturalKey,institution[0].id,municipalityIds.get(record.city),record.name,record.code,
            record.campus,record.degree,record.shift,'SiSU','UFMG 1ª edição de 2026',item.report.year,record.competition,record.round,record.roundKind,
            record.minimum,record.maximum,JSON.stringify(record.weights),JSON.stringify(record.minima),record.weightsSourceUrl,
            sourceIds.get(record.naturalKey),item.report.published]);
          await client.query(`INSERT INTO admission_history(natural_key,institution_id,municipality_id,course_name,course_code,campus_name,degree,shift,
            program,edition,year,competition_modality,round,round_kind,score,maximum_score,weights,minimum_scores,weights_source_url,source_record_id,updated_at)
            VALUES ${valuesSql(batch,21)} ON CONFLICT(natural_key) DO UPDATE SET institution_id=EXCLUDED.institution_id,
            municipality_id=EXCLUDED.municipality_id,course_name=EXCLUDED.course_name,course_code=EXCLUDED.course_code,campus_name=EXCLUDED.campus_name,
            degree=EXCLUDED.degree,shift=EXCLUDED.shift,program=EXCLUDED.program,edition=EXCLUDED.edition,year=EXCLUDED.year,
            competition_modality=EXCLUDED.competition_modality,round=EXCLUDED.round,round_kind=EXCLUDED.round_kind,score=EXCLUDED.score,
            maximum_score=EXCLUDED.maximum_score,weights=EXCLUDED.weights,minimum_scores=EXCLUDED.minimum_scores,
            weights_source_url=EXCLUDED.weights_source_url,source_record_id=EXCLUDED.source_record_id,updated_at=EXCLUDED.updated_at`,admissionParams);
        }
      });
      console.log(`Importado: ${item.report.round} (${item.records.length} cenários)`);
    }
    const verification=(await pool.query(`SELECT count(*)::int records,count(DISTINCT round)::int rounds,
      count(DISTINCT concat(course_code,'|',shift))::int course_shifts
      FROM admission_history WHERE institution_id=$1 AND year=2026`,[institution[0].id])).rows[0];
    if(Number(verification.records)!==10332||Number(verification.rounds)!==14||Number(verification.course_shifts)!==94)throw Error(`Verificação final divergente: ${JSON.stringify(verification)}`);
    console.log({verified:verification});
  }
}catch(error){console.error({code:error.code||'IMPORT_FAILED',message:error.message});process.exitCode=1;}
finally{await pool.end();}
