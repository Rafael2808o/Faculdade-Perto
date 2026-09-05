import { pool } from '../database/pool.js';
import { foldText, foldedSql } from '../database/sqlText.js';

export async function listAdmissionHistory({ page=1,limit=20,q,city,state,competitionModality,year,roundKind,round,shift }) {
  const values=[],conditions=[];
  let relevanceOrder='h.course_name,h.shift,h.competition_modality,h.round_kind,h.id';
  const add=(sql,value)=>{values.push(value);conditions.push(sql.replaceAll('?',`$${values.length}`));};
  if(q){
    const normalized=foldText(q);
    add(`(${foldedSql('h.course_name')} LIKE ? OR ${foldedSql('i.name')} LIKE ? OR ${foldedSql("COALESCE(i.acronym,'')")} LIKE ?)`,`%${normalized}%`);
    values.push(normalized);const exact=`$${values.length}`;
    relevanceOrder=`CASE WHEN ${foldedSql('h.course_name')}=${exact} THEN 0 WHEN ${foldedSql('i.name')}=${exact} OR ${foldedSql("COALESCE(i.acronym,'')")}=${exact} THEN 1 WHEN ${foldedSql('h.course_name')} LIKE concat(${exact},'%') THEN 2 ELSE 3 END,h.course_name,h.shift,h.competition_modality,h.round_kind,h.id`;
  }
  if(city)add(`${foldedSql('m.name')} = ?`,foldText(city));
  if(state)add('s.abbreviation = ?',state.toUpperCase());
  if(competitionModality)add(`${foldedSql('h.competition_modality')} = ?`,foldText(competitionModality==='AC'?'Ampla concorrência':competitionModality));
  if(year)add('h.year = ?',year);
  if(roundKind)add('h.round_kind = ?',roundKind);
  if(round)add('h.round = ?',round);
  if(shift)add('h.shift LIKE ?',`${shift}%`);
  const where=conditions.length?'WHERE '+conditions.join(' AND '):'';
  values.push(limit,(page-1)*limit);
  return (await pool.query(`SELECT h.*,h.course_name canonical_name,i.name institution_name,i.acronym,
    m.name municipality_name,s.abbreviation state_abbreviation,src.name source_name,ss.original_url source_url,
    ss.reference_period,ss.published_at,ss.imported_at,sr.raw_payload->>'reportPage' source_page,count(*) OVER() total
    FROM admission_history h JOIN institutions i ON i.id=h.institution_id
    LEFT JOIN municipalities m ON m.id=h.municipality_id LEFT JOIN states s ON s.id=m.state_id
    JOIN source_records sr ON sr.id=h.source_record_id JOIN source_snapshots ss ON ss.id=sr.snapshot_id
    JOIN sources src ON src.id=ss.source_id ${where}
    ORDER BY h.year DESC,${relevanceOrder}
    LIMIT $${values.length-1} OFFSET $${values.length}`,values)).rows;
}

export async function admissionHistoryCoverage() {
  return (await pool.query(`SELECT i.name,i.acronym,h.year,count(*)::int scenarios,
    count(DISTINCT h.course_code)::int courses,count(DISTINCT concat(h.course_code,'|',h.shift))::int course_shifts,
    count(DISTINCT h.round)::int rounds,max(h.updated_at) updated_at
    FROM admission_history h JOIN institutions i ON i.id=h.institution_id GROUP BY i.name,i.acronym,h.year
    ORDER BY h.year DESC,i.name`)).rows;
}
