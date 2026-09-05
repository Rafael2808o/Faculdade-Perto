import { pool } from '../apps/api/src/database/pool.js';

try{
  const admission=(await pool.query(`SELECT count(*)::int records,count(DISTINCT round)::int rounds,
    count(DISTINCT concat(course_code,'|',shift))::int course_shifts
    FROM admission_history WHERE year=2026`)).rows[0];
  const andradina=(await pool.query(`SELECT count(*)::int offerings FROM course_offerings o JOIN campuses c ON c.id=o.campus_id
    JOIN municipalities m ON m.id=c.municipality_id WHERE m.name='Andradina'`)).rows[0];
  console.log({admission,andradina});
  if(Number(admission.records)!==10332||Number(admission.rounds)!==14||Number(admission.course_shifts)!==94||Number(andradina.offerings)<8){
    throw Error('A verificação de cobertura do banco remoto não atingiu o mínimo documentado.');
  }
}finally{await pool.end();}
