import 'dotenv/config';
import { Pool } from 'pg';

const baseUrl=(process.env.BASE_URL||process.argv[2]||'https://faculdade-perto.onrender.com').replace(/\/$/,'');
const expected={institutions:2561,courses:353,records:720349};
const states=['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const checks=[];
const marker=`qa-${Date.now()}`;
const email=`${marker}@example.com`;
const password='TesteSeguro#2026';

function assert(condition,message){if(!condition)throw new Error(message)}

async function request(path,{method='GET',body,token,expectedStatus=200}={}){
  const startedAt=performance.now();
  const response=await fetch(`${baseUrl}${path}`,{
    method,signal:AbortSignal.timeout(120000),
    headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},
    ...(body?{body:JSON.stringify(body)}:{})
  });
  const durationMs=Math.round(performance.now()-startedAt);
  if(response.status!==expectedStatus){
    const payload=await response.text();
    throw new Error(`${method} ${path}: HTTP ${response.status}; esperado ${expectedStatus}; ${payload.slice(0,300)}`);
  }
  checks.push({method,path,status:response.status,durationMs});
  if(response.status===204)return null;
  const type=response.headers.get('content-type')||'';
  return type.includes('application/json')?response.json():response.text();
}

async function assertSearch(query,predicate,label){
  const payload=await request(`/api/v1/search?${query}&limit=5`);
  assert(payload.pagination.total>0,`${label}: nenhum resultado.`);
  assert(payload.data.length>0&&payload.data.every(predicate),`${label}: o filtro não foi respeitado.`);
  return payload;
}

async function cleanup(){
  if(!process.env.DATABASE_URL)return;
  const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true},max:1});
  try{
    await pool.query('DELETE FROM contacts WHERE email=$1',[email]);
    await pool.query('DELETE FROM corrections WHERE email=$1',[email]);
    await pool.query('DELETE FROM users WHERE email=$1',[email]);
  }finally{await pool.end()}
}

try{
  const health=await request('/api/health');
  assert(health.status==='ok'&&health.database?.status==='available','Banco de produção indisponível.');
  assert(health.database?.provider==='cockroach','A produção não está usando CockroachDB.');

  const sitemap=await request('/api/v1/sitemap-data');
  assert(sitemap.data.institutions.length===expected.institutions,`Esperadas ${expected.institutions} instituições.`);
  assert(sitemap.data.municipalities.length===3551,'Esperados 3.551 municípios presentes no catálogo.');
  assert(sitemap.data.recordCount===expected.records,`Esperados ${expected.records} registros de cursos.`);

  const institutions=await request('/api/v1/institutions?limit=1');
  const courses=await request('/api/v1/courses?limit=1');
  assert(institutions.pagination.total===expected.institutions,'Total público de instituições divergente.');
  assert(courses.pagination.total===expected.courses,'Total público de cursos canônicos divergente.');

  for(const state of states){
    await assertSearch(`state=${state}`,(item)=>item.location.state===state,`UF ${state}`);
  }

  const facets=[
    ['network=publica',(x)=>x.institution.network==='publica','rede pública'],
    ['network=privada',(x)=>x.institution.network==='privada','rede privada'],
    ['modality=presencial',(x)=>x.modality.value==='presencial','presencial'],
    ['modality=ead',(x)=>x.modality.value==='ead','EAD'],
    ['degree=bacharelado',(x)=>x.degree.value==='bacharelado','bacharelado'],
    ['degree=licenciatura',(x)=>x.degree.value==='licenciatura','licenciatura'],
    ['degree=tecnologo',(x)=>x.degree.value==='tecnologo','tecnólogo'],
    ['degree=nao_confirmado',(x)=>x.degree.value==='nao_confirmado','grau não informado'],
    ['organization=universidade',(x)=>x.institution.academicOrganization==='Universidade','universidade'],
    ['organization=centro_universitario',(x)=>x.institution.academicOrganization==='Centro Universitário','centro universitário'],
    ['organization=faculdade',(x)=>x.institution.academicOrganization==='Faculdade','faculdade'],
    ['organization=instituto_federal',(x)=>x.institution.academicOrganization==='Instituto Federal','instituto federal'],
    ['organization=cefet',(x)=>x.institution.academicOrganization==='CEFET','CEFET'],
    ['category=publica_federal',(x)=>x.institution.administrativeCategory==='Pública Federal','pública federal'],
    ['category=publica_estadual',(x)=>x.institution.administrativeCategory==='Pública Estadual','pública estadual'],
    ['category=publica_municipal',(x)=>x.institution.administrativeCategory==='Pública Municipal','pública municipal'],
    ['category=privada_com_fins',(x)=>x.institution.administrativeCategory==='Privada com fins lucrativos','privada com fins'],
    ['category=privada_sem_fins',(x)=>x.institution.administrativeCategory==='Privada sem fins lucrativos','privada sem fins'],
    ['category=especial',(x)=>x.institution.administrativeCategory==='Especial','categoria especial'],
    ['free=sim',(x)=>x.free.value===true,'gratuito'],
    ['free=nao',(x)=>x.free.value===false,'não gratuito'],
    ['shift=diurno',(x)=>x.shifts.value.daytimeSeats>0,'turno diurno'],
    ['shift=noturno',(x)=>x.shifts.value.nighttimeSeats>0,'turno noturno'],
    ['dimension=municipio',(x)=>x.dimension.value==='municipio','abrangência municipal'],
    ['dimension=ead_brasil',(x)=>x.dimension.value==='ead_brasil','EAD Brasil'],
    ['dimension=ead_brasil_agregado',(x)=>x.dimension.value==='ead_brasil_agregado','EAD Brasil agregado'],
    ['dimension=ead_exterior',(x)=>x.dimension.value==='ead_exterior','EAD exterior'],
    ['minSeats=200',(x)=>x.censusSeats.value>=200,'mínimo de vagas']
  ];
  for(const [query,predicate,label] of facets)await assertSearch(query,predicate,label);

  const combined=await assertSearch('q=Medicina&state=SP&network=publica&modality=presencial&degree=bacharelado&organization=universidade&category=publica_estadual&free=sim&shift=diurno&dimension=municipio&minSeats=1&sort=seats',(x)=>x.location.state==='SP'&&x.institution.network==='publica'&&x.modality.value==='presencial'&&x.degree.value==='bacharelado'&&x.institution.academicOrganization==='Universidade'&&x.institution.administrativeCategory==='Pública Estadual'&&x.free.value===true&&x.shifts.value.daytimeSeats>0&&x.dimension.value==='municipio'&&x.censusSeats.value>=1,'combinação completa');
  assert(combined.data.every((item,index,array)=>index===0||array[index-1].censusSeats.value>=item.censusSeats.value),'Ordenação por vagas incorreta.');

  const alphabetical=await assertSearch('sort=name',(x)=>Boolean(x.course.name),'ordenação alfabética');
  const names=alphabetical.data.map((x)=>x.course.name);
  assert(names.every((name,index)=>index===0||names[index-1].localeCompare(name,'pt-BR')<=0),'Ordenação por nome incorreta.');
  await assertSearch('lat=-23.5505&lng=-46.6333&sort=distance',(x)=>Number.isFinite(x.location.distanceKm),'ordenação por distância');
  await request('/api/v1/search?shift=integral',{expectedStatus:400});

  const first=combined.data[0];
  const detail=await request(`/api/v1/catalog-records/${first.id}`);
  assert(detail.data.id===first.id,'Detalhe do registro divergente.');
  await request(`/api/v1/institutions/${first.institution.id}?limit=5`);
  await request('/api/v1/campuses');
  await request('/api/v1/campuses/nearby?lat=-23.5505&lng=-46.6333&radiusKm=25');
  await request('/api/v1/offerings?limit=5');
  await request('/api/v1/cutoffs');

  const score=await request('/api/v1/enem/score',{method:'POST',body:{scores:{languages:650,humanities:700,naturalSciences:680,mathematics:750,essay:800}}});
  assert(Number.isFinite(score.data?.score),'Simulador ENEM não calculou a nota.');

  const contact=await request('/api/v1/contact',{method:'POST',expectedStatus:201,body:{name:'Teste de qualidade',email,subject:`Auditoria ${marker}`,message:'Mensagem automática temporária para verificar o formulário de contato.'}});
  assert(contact.data.id,'Contato não foi gravado.');
  const correction=await request('/api/v1/corrections',{method:'POST',expectedStatus:201,body:{entityType:'other',description:'Registro temporário para verificar o fluxo completo de correções em produção.',name:'Teste de qualidade',email,evidenceUrl:''}});
  assert(correction.data.status==='pendente','Correção não entrou como pendente.');

  const registration=await request('/api/v1/auth/register',{method:'POST',expectedStatus:201,body:{name:'Teste de qualidade',email,password}});
  let token=registration.data.token;
  const me=await request('/api/v1/me',{token});
  assert(me.data.email===email,'Sessão autenticada divergente.');
  const plan=await request('/api/v1/me/plan',{method:'POST',expectedStatus:201,token,body:{recordId:first.id,notes:`Plano temporário ${marker}`}});
  const planItems=await request('/api/v1/me/plan',{token});
  assert(planItems.data.some((item)=>item.plan_item_id===plan.data.id),'Item não apareceu no Meu Plano.');
  await request(`/api/v1/me/plan/${plan.data.id}`,{method:'DELETE',expectedStatus:204,token});
  await request('/api/v1/admin/corrections',{token,expectedStatus:403});
  await request('/api/v1/auth/session',{method:'DELETE',expectedStatus:204,token});
  await request('/api/v1/me',{token,expectedStatus:401});
  const login=await request('/api/v1/auth/login',{method:'POST',body:{email,password}});
  token=login.data.token;
  await request('/api/v1/auth/session',{method:'DELETE',expectedStatus:204,token});

  for(const path of ['/','/buscar','/enem','/comparar','/entrar','/meu-plano','/contato','/corrigir','/privacidade','/termos',`/ofertas/${first.id}`]){
    const html=await request(path);
    assert(html.includes('<div id="root">'),`${path}: React não foi entregue.`);
  }
  await request('/pagina-inexistente-auditoria',{expectedStatus:404});

  console.table(checks);
  console.log({status:'auditoria de produção aprovada',baseUrl,checks:checks.length,states:states.length,facets:facets.length});
}finally{
  await cleanup();
}
