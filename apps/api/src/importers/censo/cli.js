import { parseArgs } from 'node:util';import { CensoImporter } from './CensoImporter.js';import { pool } from '../../database/pool.js';
const {values}=parseArgs({options:{ies:{type:'string'},courses:{type:'string'},sha256:{type:'string'},url:{type:'string',default:'https://download.inep.gov.br/microdados/microdados_censo_da_educacao_superior_2024.zip'},year:{type:'string',default:'2024'}}});
if(!values.ies||!values.courses||!values.sha256){console.error('Uso: npm run import:censo -- --ies arquivo.csv --courses arquivo.csv --sha256 HASH');process.exit(1)}
const importer=new CensoImporter({iesFile:values.ies,coursesFile:values.courses,snapshot:{year:values.year,url:values.url,sha256:values.sha256,retrievedAt:new Date()}});
try{console.log(await importer.run())}finally{await pool.end()}
