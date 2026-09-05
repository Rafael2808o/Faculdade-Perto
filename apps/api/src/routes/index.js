import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import * as catalog from '../controllers/catalogController.js';
import * as write from '../controllers/writeController.js';
import * as enem from '../controllers/enemController.js';
import * as auth from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { getAdmissionHistory } from '../services/admissionHistoryService.js';
import { admissionHistoryQuery, admissionPossibilityBody } from './schemas.js';
import { contactBody, correctionBody, correctionReviewBody, courseQuery, cutoffQuery, enemBody, idParams, institutionQuery, loginBody, nearbyQuery, numericIdParams, offeringQuery, paginationSchema, planBody, registerBody, searchQuery } from './schemas.js';

const writeLimiter = rateLimit({ windowMs:env.RATE_LIMIT_WINDOW_MS, limit:env.RATE_LIMIT_MAX, standardHeaders:'draft-8', legacyHeaders:false, message:{error:{code:'MUITAS_TENTATIVAS',message:'Muitas mensagens foram enviadas deste endereço.',hint:'Aguarde alguns minutos antes de tentar novamente.'}} });
const loginLimiter = rateLimit({ windowMs:env.RATE_LIMIT_WINDOW_MS, limit:10, standardHeaders:'draft-8', legacyHeaders:false, skipSuccessfulRequests:true, message:{error:{code:'MUITAS_TENTATIVAS',message:'Muitas tentativas de acesso foram feitas deste endereço.',hint:'Aguarde alguns minutos antes de tentar novamente.'}} });
const apiLimiter = rateLimit({ windowMs:env.RATE_LIMIT_WINDOW_MS, limit:Math.max(env.RATE_LIMIT_MAX*10,120), standardHeaders:'draft-8', legacyHeaders:false, message:{error:{code:'MUITAS_TENTATIVAS',message:'Muitas consultas foram feitas deste endereço.',hint:'Aguarde alguns minutos e tente novamente.'}} });
export const apiRouter = Router();
apiRouter.use(apiLimiter);
apiRouter.get('/institutions',validate(institutionQuery),catalog.listInstitutions);
apiRouter.get('/institutions/:id',validate(idParams,'params'),validate(paginationSchema),catalog.getInstitution);
apiRouter.get('/campuses',validate(paginationSchema),(_req,res)=>res.json({data:[],notice:'Campi aguardam uma fonte oficial complementar; a sede da IES não é tratada como campus.'}));
apiRouter.get('/campuses/nearby',validate(nearbyQuery),catalog.nearby);
apiRouter.get('/courses',validate(courseQuery),catalog.listCourses);
apiRouter.get('/offerings',validate(offeringQuery),catalog.listOfferings);
apiRouter.get('/offerings/:id',validate(idParams,'params'),catalog.getOffering);
apiRouter.get('/catalog-records/:id',validate(idParams,'params'),catalog.getRecord);
apiRouter.get('/search',validate(searchQuery),catalog.search);
apiRouter.get('/search/map',validate(searchQuery),catalog.searchMap);
apiRouter.get('/cutoffs',validate(cutoffQuery),catalog.listCutoffs);
apiRouter.get('/admission-history',validate(admissionHistoryQuery),async(req,res,next)=>{
  try{res.json(await getAdmissionHistory(req.validated.query));}catch(error){next(error);}
});
apiRouter.post('/enem/possibilities',validate(admissionPossibilityBody,'body'),async(req,res,next)=>{
  res.set('Cache-Control','no-store');
  try{res.json(await getAdmissionHistory(req.validated.body));}catch(error){next(error);}
});
apiRouter.post('/enem/score',validate(enemBody,'body'),enem.score);
apiRouter.post('/contact',writeLimiter,validate(contactBody,'body'),write.contact);
apiRouter.post('/corrections',writeLimiter,validate(correctionBody,'body'),write.correction);
apiRouter.post('/auth/register',writeLimiter,validate(registerBody,'body'),auth.register);
apiRouter.post('/auth/login',loginLimiter,validate(loginBody,'body'),auth.login);
apiRouter.delete('/auth/session',authenticate,auth.logout);
apiRouter.get('/me',authenticate,auth.me);
apiRouter.get('/me/plan',authenticate,auth.plan);
apiRouter.post('/me/plan',authenticate,validate(planBody,'body'),auth.addPlan);
apiRouter.delete('/me/plan/:id',authenticate,validate(numericIdParams,'params'),auth.removePlan);
apiRouter.get('/admin/corrections',authenticate,auth.corrections);
apiRouter.patch('/admin/corrections/:id',authenticate,validate(numericIdParams,'params'),validate(correctionReviewBody,'body'),auth.updateCorrection);
apiRouter.get('/sitemap-data',catalog.sitemapData);
