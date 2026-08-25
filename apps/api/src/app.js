import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { requestId } from './middlewares/requestId.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';
import { mountDocs } from './swagger/index.js';
import { getSitemapCoreData, getSitemapRecordCount, getSitemapRecordsPage } from './services/catalogService.js';
import { pool } from './database/pool.js';

const sitemapPageSize = 40000;
const xmlEscape = (value) => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const sitemapUrlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(([path,date])=>`<url><loc>${xmlEscape(`${env.PUBLIC_SITE_URL}${path}`)}</loc><lastmod>${new Date(date).toISOString()}</lastmod></url>`).join('')}</urlset>`;
const sitemapIndex = (paths) => `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path)=>`<sitemap><loc>${xmlEscape(`${env.PUBLIC_SITE_URL}${path}`)}</loc></sitemap>`).join('')}</sitemapindex>`;

export function createApp() {
  const app = express();
  if (env.TRUST_PROXY) app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'",'https://fonts.googleapis.com'],fontSrc:["'self'",'https://fonts.gstatic.com'],imgSrc:["'self'",'data:','https://*.tile.openstreetmap.org'],connectSrc:["'self'"]}} }));
  app.use(cors({ origin: env.WEB_ORIGIN.split(',').map((item) => item.trim()), credentials: false }));
  app.use(compression());
  app.use(express.json({ limit: '200kb' }));
  app.use(requestId);
  app.get('/api/health', async(_req, res) => {
    if(env.DATA_MODE==='database'){
      try{
        const database=await pool.query("SELECT current_database() name,current_setting('server_version') version");
        return res.json({status:'ok',service:'faculdade-perto-api',dataMode:env.DATA_MODE,database:{status:'available',provider:env.DATABASE_PROVIDER,name:database.rows[0].name,version:database.rows[0].version},dataset:'censo-superior-2024-nacional'});
      }catch(error){
        return res.status(503).json({status:'degraded',service:'faculdade-perto-api',dataMode:env.DATA_MODE,database:{status:'unavailable',provider:env.DATABASE_PROVIDER,code:error.code||'CONNECTION_ERROR'}});
      }
    }
    return res.json({ status: 'ok', service:'faculdade-perto-api', dataMode:env.DATA_MODE, database:{status:'not_required',provider:'demo'}, dataset:'amostra-oficial-censo-2024' });
  });
  app.get('/robots.txt',(_req,res)=>res.type('text/plain').send(env.DATA_MODE==='demo'?`User-agent: *\nDisallow: /\n`:`User-agent: *\nAllow: /\nDisallow: /obrigado\nSitemap: ${env.PUBLIC_SITE_URL}/sitemap.xml\n`));
  app.get('/sitemap.xml', async (_req,res,next) => { try {
    if(env.DATA_MODE==='demo')return res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    const count=await getSitemapRecordCount();
    const pages=Math.ceil(count/sitemapPageSize);
    const paths=['/sitemaps/core.xml',...Array.from({length:pages},(_,index)=>`/sitemaps/records-${index+1}.xml`)];
    res.set('Cache-Control','public, max-age=3600').type('application/xml').send(sitemapIndex(paths));
  } catch(e){next(e)} });
  app.get('/sitemaps/core.xml', async (_req,res,next) => { try {
    if(env.DATA_MODE==='demo')return res.status(404).end();
    const data=await getSitemapCoreData();
    const now=new Date().toISOString();
    const urls=[
      ['/',now],['/buscar',now],['/duvidas',now],['/enem',now],['/contato',now],['/privacidade',now],['/termos',now],
      ...data.institutions.map((item)=>[`/instituicoes/${item.slug}`,item.updated_at||now]),
      ...data.municipalities.map((item)=>[`/br/${item.abbreviation.toLowerCase()}/${item.slug}`,now])
    ];
    res.set('Cache-Control','public, max-age=3600').type('application/xml').send(sitemapUrlset(urls));
  } catch(e){next(e)} });
  app.get('/sitemaps/records-:page.xml', async (req,res,next) => { try {
    if(env.DATA_MODE==='demo')return res.status(404).end();
    const page=Number(req.params.page);
    const count=await getSitemapRecordCount();
    const totalPages=Math.ceil(count/sitemapPageSize);
    if(!Number.isInteger(page)||page<1||page>totalPages)return res.status(404).type('text/plain').send('Sitemap não encontrado.');
    const records=await getSitemapRecordsPage(page,sitemapPageSize);
    const now=new Date().toISOString();
    const urls=records.map((item)=>[`/ofertas/${item.id}`,item.imported_at||now]);
    res.set('Cache-Control','public, max-age=3600').type('application/xml').send(sitemapUrlset(urls));
  } catch(e){next(e)} });
  mountDocs(app);
  app.use('/api/v1', apiRouter);
  const webDist=join(dirname(fileURLToPath(import.meta.url)),'../../web/dist');
  if(env.NODE_ENV==='production'&&existsSync(webDist)){
    app.use(express.static(webDist,{maxAge:'1h',setHeaders:(res,filePath)=>{
      if(filePath.includes(`${join('assets','')}`))res.setHeader('Cache-Control','public, max-age=31536000, immutable');
      else if(filePath.endsWith('index.html'))res.setHeader('Cache-Control','no-cache');
    }}));
    const publicRoutes=[/^\/$/,/^\/buscar\/?$/, /^\/instituicoes\/[^/]+\/?$/, /^\/ofertas\/[^/]+\/?$/, /^\/br\/[a-z]{2}\/[^/]+\/?$/, /^\/(duvidas|contato|corrigir|enem|entrar|meu-plano|comparar|obrigado|privacidade|termos)\/?$/, /^\/admin\/correcoes\/?$/];
    app.get('/{*path}',(req,res,next)=>{if(req.path.startsWith('/api/'))return next();const known=publicRoutes.some((pattern)=>pattern.test(req.path));res.set('Cache-Control','no-cache');return res.status(known?200:404).sendFile(join(webDist,'index.html'))});
  }
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
