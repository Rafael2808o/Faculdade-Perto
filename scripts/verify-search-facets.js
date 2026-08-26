import 'dotenv/config';
import pg from 'pg';

const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true},max:1});
const expected={total:720349,daytime:16460,nighttime:24446};

function assert(condition,message){if(!condition)throw new Error(message)}

try{
  const rawCounts=(await pool.query(`SELECT count(*)::int total,
    count(*) FILTER (WHERE daytime_seats>0)::int daytime,
    count(*) FILTER (WHERE nighttime_seats>0)::int nighttime,
    count(*) FILTER (WHERE daytime_seats<0 OR nighttime_seats<0)::int invalid
    FROM course_catalog_records`)).rows[0];
  const counts=Object.fromEntries(Object.entries(rawCounts).map(([key,value])=>[key,Number(value)]));
  const applied=Number((await pool.query("SELECT count(*)::int count FROM schema_migrations WHERE version='005_search_facets.sql'")).rows[0].count);
  const indexes=(await pool.query(`SELECT index_name FROM [SHOW INDEXES FROM course_catalog_records]
    WHERE index_name IN ('catalog_daytime_seats_idx','catalog_nighttime_seats_idx','catalog_facets_idx')
    GROUP BY index_name ORDER BY index_name`)).rows.map(({index_name})=>index_name);

  assert(counts.total===expected.total,`Total divergente: ${counts.total}.`);
  assert(counts.daytime===expected.daytime,`Vagas diurnas divergentes: ${counts.daytime}.`);
  assert(counts.nighttime===expected.nighttime,`Vagas noturnas divergentes: ${counts.nighttime}.`);
  assert(counts.invalid===0,'Há valores negativos de turno.');
  assert(applied===1,'Migração 005 não foi registrada.');
  assert(indexes.length===3,'Nem todos os índices de filtros foram criados.');

  console.log({status:'facetas verificadas',counts,indexes});
}finally{
  await pool.end();
}
