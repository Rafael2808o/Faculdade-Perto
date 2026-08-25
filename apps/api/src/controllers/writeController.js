import * as service from '../services/writeService.js';
export const contact = async (req,res,next) => { try { res.status(201).json({data:await service.submitContact(req.validated.body)}); } catch (e) { next(e); } };
export const correction = async (req,res,next) => { try { res.status(201).json({data:await service.submitCorrection(req.validated.body)}); } catch (e) { next(e); } };
