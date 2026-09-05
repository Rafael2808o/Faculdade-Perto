import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const repositoryUrl='https://www.ufmg.br/sisu/repositorio/?edicao=sisu-ufmg-2026&repositorio_tipo=nota-corte';
const termUrl='https://www.ufmg.br/sisu/wp-content/uploads/2026/01/termo_adesao_575_UFMG-16-ASSINADO.pdf';
const reports=[
  ['ufmg-2026-regular.pdf','Chamada regular','https://www.ufmg.br/sisu/wp-content/uploads/2026/02/Notas-maximas-e-minimas.pdf'],
  ['ufmg-2026-espera-01.pdf','Após a 1ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/02/Notas-maximas-e-minimas-1.pdf'],
  ['ufmg-2026-espera-02.pdf','Após a 2ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/02/Notas-maximas-e-minimas-2.pdf'],
  ['ufmg-2026-espera-03.pdf','Após a 3ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/03/Notas-maximas-e-minimas-1.pdf'],
  ['ufmg-2026-espera-04.pdf','Após a 4ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/03/Notas-maximas-e-minimas-1-1.pdf'],
  ['ufmg-2026-espera-05.pdf','Após a 5ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/03/Notas-maximas-e-minimas-1-2.pdf'],
  ['ufmg-2026-espera-06.pdf','Após a 6ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/03/Notas-maximas-e-minimas-1-3.pdf'],
  ['ufmg-2026-espera-07.pdf','Após a 7ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/03/Notas-maximas-e-minimas.pdf'],
  ['ufmg-2026-espera-08.pdf','Após a 8ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/06/Notas-maximas-e-minimas.pdf'],
  ['ufmg-2026-espera-09.pdf','Após a 9ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/07/Notas-maximas-e-minimas.pdf'],
  ['ufmg-2026-espera-10.pdf','Após a 10ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/07/Notas-maximas-e-minimas-1.pdf'],
  ['ufmg-2026-espera-11.pdf','Após a 11ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/08/Notas-maximas-e-minimas.pdf'],
  ['ufmg-2026-espera-12.pdf','Após a 12ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/08/Notas-maximas-e-minimas-1.pdf'],
  ['ufmg-2026-espera-13.pdf','Após a 13ª chamada da lista de espera','https://www.ufmg.br/sisu/wp-content/uploads/2026/08/Notas-maximas-e-minimas-1-1.pdf']
].map(([file,round,url])=>({file,year:2026,round,url}));

const output=resolve(process.argv[2]||'.local-data/official-2026');
const sha256=value=>createHash('sha256').update(value).digest('hex');

async function download(url,file){
  const target=new URL(url);
  if(target.protocol!=='https:'||target.hostname!=='www.ufmg.br'||!target.pathname.startsWith('/sisu/'))throw Error('Fonte fora da lista oficial permitida.');
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(60_000)});
  if(!response.ok)throw Error(`Falha ao baixar ${url}: HTTP ${response.status}`);
  const data=Buffer.from(await response.arrayBuffer());
  if(data.length<10_000||data.subarray(0,4).toString()!=='%PDF')throw Error(`Arquivo inesperado em ${url}`);
  await writeFile(join(output,file),data);
  return {bytes:data.length,sha256:sha256(data)};
}

await mkdir(output,{recursive:true});
const repository=await fetch(repositoryUrl,{redirect:'error',signal:AbortSignal.timeout(30_000)});
if(!repository.ok)throw Error(`Repositório oficial indisponível: HTTP ${repository.status}`);
const html=await repository.text();
for(const report of reports){
  if(!html.includes(report.url))throw Error(`O relatório não está mais referenciado pelo repositório oficial: ${report.round}`);
  Object.assign(report,await download(report.url,report.file));
  console.log(`${report.round}: ${report.bytes} bytes`);
}
const term={file:'ufmg-2026-termo.pdf',year:2026,url:termUrl,...await download(termUrl,'ufmg-2026-termo.pdf')};
const manifest={repositoryUrl,retrievedAt:new Date().toISOString(),reports,term};
await writeFile(join(output,'ufmg-manifest.json'),JSON.stringify(manifest,null,2),'utf8');
console.log(`Manifesto validado: ${reports.length} relatórios e 1 termo de adesão.`);
