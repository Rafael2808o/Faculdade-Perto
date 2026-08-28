import * as service from '../services/catalogService.js';

export const listInstitutions = async (req,res,next) => { try { res.json(await service.getInstitutions(req.validated.query)); } catch (e) { next(e); } };
export const getInstitution = async (req,res,next) => { try { res.json({data:await service.getInstitution(req.validated.params.id,req.validated.query)}); } catch (e) { next(e); } };
export const listCourses = async (req,res,next) => { try { res.json(await service.getCourses(req.validated.query)); } catch (e) { next(e); } };
export const search = async (req,res,next) => { try { res.json(await service.search(req.validated.query)); } catch (e) { next(e); } };
export const searchMap = async (req,res,next) => { try { res.json(await service.searchMap(req.validated.query)); } catch (e) { next(e); } };
export const getRecord = async (req,res,next) => { try { res.json({data:await service.getCatalogRecord(req.validated.params.id)}); } catch (e) { next(e); } };
export const nearby = async (req,res,next) => { try { res.json(await service.getNearby(req.validated.query)); } catch (e) { next(e); } };
export const listOfferings = async (req,res,next) => { try { res.json(await service.getOfferings(req.validated.query)); } catch (e) { next(e); } };
export const getOffering = async (req,res,next) => { try { res.json({data:await service.getOffering(req.validated.params.id)}); } catch (e) { next(e); } };
export const listCutoffs = async (_req,res,next) => { try { res.json({data:await service.getCutoffs()}); } catch (e) { next(e); } };
export const sitemapData = async (_req,res,next) => { try { res.json({data:await service.getSitemapData()}); } catch (e) { next(e); } };
