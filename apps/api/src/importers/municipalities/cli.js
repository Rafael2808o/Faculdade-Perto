import { createReadStream } from 'node:fs';
import { parseArgs } from 'node:util';
import { pipeline } from 'node:stream/promises';
import { from as copyFrom } from 'pg-copy-streams';
import { pool } from '../../database/pool.js';

const { values } = parseArgs({ options: { file: { type: 'string' } } });
if (!values.file) { console.error('Uso: npm run import:municipalities -- --file municipios.csv'); process.exit(1); }

try {
  await pool.query('CREATE TEMP TABLE municipality_coordinates(ibge_code text, latitude double precision, longitude double precision)');
  const client = await pool.connect();
  try {
    const destination = client.query(copyFrom(`COPY municipality_coordinates(ibge_code,latitude,longitude) FROM STDIN WITH (FORMAT csv,HEADER true)`));
    await pipeline(createReadStream(values.file), destination);
  } finally { client.release(); }
  const result = await pool.query(`UPDATE municipalities m SET reference_latitude=c.latitude,reference_longitude=c.longitude,location_note='Centroide geométrico calculado sobre a Malha Municipal Digital IBGE 2024; distância aproximada ao município, não a um campus.' FROM municipality_coordinates c WHERE c.ibge_code=m.ibge_code`);
  const missing = await pool.query(`SELECT count(*) count FROM municipalities WHERE reference_latitude IS NULL`);
  console.log({ updated: result.rowCount, municipalitiesWithoutCoordinates: Number(missing.rows[0].count) });
} finally { await pool.end(); }
