import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const baseUrl=(process.argv[2]||'http://localhost:5173').replace(/\/$/,'');
const output=resolve('.local-data/browser-qa');
const executablePath=process.env.BROWSER_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
await mkdir(output,{recursive:true});

const browser=await chromium.launch({headless:true,executablePath});
const errors=[];
function watch(page,label){
  page.on('pageerror',error=>errors.push(`${label}: ${error.message}`));
  page.on('console',message=>{if(message.type()==='error')errors.push(`${label}: ${message.text()}`);});
}
function assert(condition,message){if(!condition)throw Error(message);}

try{
  const desktop=await browser.newContext({viewport:{width:1440,height:1000},locale:'pt-BR'});
  const page=await desktop.newPage();watch(page,'desktop');
  await page.goto(baseUrl,{waitUntil:'networkidle',timeout:120000});
  assert(await page.getByRole('heading',{name:/encontre seu caminho/i}).isVisible(),'A página inicial não apresentou o conteúdo principal.');
  assert(await page.locator('.vite-error-overlay').count()===0,'O Vite exibiu uma sobreposição de erro.');

  await page.goto(`${baseUrl}/buscar?city=Andradina`,{waitUntil:'domcontentloaded',timeout:120000});
  await page.getByRole('heading',{name:'8 cursos em fontes oficiais'}).waitFor({timeout:120000});
  await page.locator('.map-result-strip').waitFor({timeout:120000});
  await page.waitForTimeout(1000);
  assert(await page.getByText('Medicina',{exact:true}).first().isVisible(),'Medicina não apareceu em Andradina.');
  assert(await page.getByText('Agronomia',{exact:true}).first().isVisible(),'Agronomia não apareceu em Andradina.');
  const mapLayout=await page.evaluate(()=>{
    const names=['.radius-control','.map-viewport','.map-result-strip','.map-notice'];
    const rects=Object.fromEntries(names.map(name=>{const r=document.querySelector(name)?.getBoundingClientRect();return [name,r&&{top:r.top,bottom:r.bottom,left:r.left,right:r.right}];}));
    const overlap=(a,b)=>a&&b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    const marker=document.querySelector('.leaflet-overlay-pane path')?.getBoundingClientRect();
    return {rects,markerSize:marker&&{width:marker.width,height:marker.height},complete:Object.values(rects).every(Boolean),overlaps:Boolean(overlap(rects['.radius-control'],rects['.map-viewport'])||overlap(rects['.radius-control'],rects['.map-result-strip'])||overlap(rects['.map-result-strip'],rects['.map-notice'])),horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth};
  });
  assert(mapLayout.complete&&!mapLayout.overlaps&&!mapLayout.horizontalOverflow&&mapLayout.markerSize?.width<80&&mapLayout.markerSize?.height<80,'O mapa tem painel ausente, sobreposição, rolagem horizontal ou marcador desproporcional.');
  const range=page.getByRole('slider',{name:'Distância máxima da busca'});
  await range.focus();await range.press('End');
  assert(await range.getAttribute('aria-valuetext')==='100 quilômetros','O controle de distância não respondeu ao teclado.');
  await page.screenshot({path:resolve(output,'busca-andradina-desktop.png'),fullPage:true});

  await page.goto(`${baseUrl}/enem`,{waitUntil:'networkidle',timeout:120000});
  const inputs={languages:'700,5',humanities:'710',naturalSciences:'720',mathematics:'730',essay:'800'};
  for(const [name,value] of Object.entries(inputs))await page.locator(`#score-${name}`).fill(value);
  await page.getByRole('button',{name:'Calcular minha média'}).click();
  await page.getByText('Onde sua nota esteve competitiva?').waitFor();
  await page.getByLabel('Curso ou instituição').fill('Medicina');
  await page.getByLabel('Etapa do relatório').selectOption({label:'Chamada regular'});
  const responsePromise=page.waitForResponse(response=>response.url().includes('/api/v1/enem/possibilities')&&response.request().method()==='POST',{timeout:120000});
  await page.getByRole('button',{name:'Comparar com o histórico oficial'}).click();
  const response=await responsePromise;assert(response.ok(),'A API de possibilidades não respondeu com sucesso.');
  const payload=await response.json();
  assert(payload.data.some(item=>item.canonical_name==='MEDICINA'&&item.comparison?.comparable),'A resposta não trouxe Medicina/UFMG com comparação ponderada.');
  await page.getByRole('heading',{name:'MEDICINA',exact:true}).waitFor();
  assert(!(await page.locator('body').innerText()).toLowerCase().includes('você vai passar'),'A interface apresentou uma promessa de aprovação.');
  assert(await page.getByRole('link',{name:/relatório oficial/i}).first().getAttribute('href').then(value=>value?.startsWith('https://www.ufmg.br/sisu/')),'A fonte oficial não ficou acessível no resultado.');
  await page.screenshot({path:resolve(output,'enem-possibilidades-desktop.png'),fullPage:true});
  await desktop.close();

  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,locale:'pt-BR'});
  const mobilePage=await mobile.newPage();watch(mobilePage,'mobile');
  await mobilePage.goto(`${baseUrl}/buscar?city=Andradina`,{waitUntil:'domcontentloaded',timeout:120000});
  await mobilePage.getByRole('heading',{name:'8 cursos em fontes oficiais'}).waitFor({timeout:120000});
  await mobilePage.getByRole('button',{name:'Mapa'}).click();
  await mobilePage.locator('.map-viewport').waitFor();
  const mobileLayout=await mobilePage.evaluate(()=>({overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
    toggleVisible:Boolean(document.querySelector('.mobile-toggle')),mapVisible:getComputedStyle(document.querySelector('.map-panel')).visibility!=='hidden'}));
  assert(!mobileLayout.overflow&&mobileLayout.toggleVisible&&mobileLayout.mapVisible,'A alternância Lista/Mapa falhou no celular.');
  await mobilePage.screenshot({path:resolve(output,'busca-andradina-mobile.png'),fullPage:true});
  await mobile.close();

  const relevantErrors=errors.filter(message=>!message.includes('tile.openstreetmap.org')&&!message.includes('favicon.ico'));
  assert(relevantErrors.length===0,`Erros no console: ${relevantErrors.join(' | ')}`);
  console.log({status:'teste visual aprovado',baseUrl,screenshots:3,consoleErrors:relevantErrors.length,mapLayout});
}finally{await browser.close();}
