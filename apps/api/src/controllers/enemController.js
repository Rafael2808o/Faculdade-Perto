import { calculateEnemScore } from '../services/enemService.js';
export const score = (req,res,next) => { try { res.json({data:calculateEnemScore(req.validated.body)}); } catch (e) { next(e); } };
