import swaggerUi from 'swagger-ui-express';
import { openapi } from './openapi.js';
export function mountDocs(app) {
  app.get('/api/docs/openapi.json',(_req,res)=>res.json(openapi));
  app.use('/api/docs',swaggerUi.serve,swaggerUi.setup(openapi,{customSiteTitle:'Faculdade Perto — API'}));
}
