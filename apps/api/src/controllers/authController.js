import * as service from '../services/authService.js';
import { clearSessionCookie, setSessionCookie } from '../http/sessionCookie.js';

const publicSession = ({ expiresAt, user }) => ({ expiresAt, user });

export const register=async(req,res,next)=>{try{const session=await service.register(req.validated.body);setSessionCookie(res,session.token);res.status(201).json({data:publicSession(session)})}catch(e){next(e)}};
export const login=async(req,res,next)=>{try{const session=await service.login(req.validated.body);setSessionCookie(res,session.token);res.json({data:publicSession(session)})}catch(e){next(e)}};
export const logout=async(req,res,next)=>{try{await service.logout(req.authToken);clearSessionCookie(res);res.status(204).end()}catch(e){next(e)}};
export const me=async(req,res)=>res.json({data:req.user});
export const plan=async(req,res,next)=>{try{res.json({data:await service.getPlan(req.user)})}catch(e){next(e)}};
export const addPlan=async(req,res,next)=>{try{res.status(201).json({data:await service.addPlan(req.user,req.validated.body)})}catch(e){next(e)}};
export const removePlan=async(req,res,next)=>{try{await service.removePlan(req.user,req.validated.params.id);res.status(204).end()}catch(e){next(e)}};
export const corrections=async(req,res,next)=>{try{res.json({data:await service.reviewQueue(req.user)})}catch(e){next(e)}};
export const updateCorrection=async(req,res,next)=>{try{res.json({data:await service.updateReview(req.user,req.validated.params.id,req.validated.body.status)})}catch(e){next(e)}};
