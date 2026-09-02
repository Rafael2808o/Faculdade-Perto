import { AppError } from '../errors/AppError.js';
import { readSessionCookie } from '../http/sessionCookie.js';
import { authenticate as resolveUser } from '../services/authService.js';

export async function authenticate(req,_res,next){
  try{
    const header=req.headers.authorization||'';
    const bearerToken=header.startsWith('Bearer ')?header.slice(7).trim():null;
    const token=bearerToken||readSessionCookie(req.headers.cookie);
    const user=await resolveUser(token);
    if(!user)throw new AppError('AUTENTICACAO_NECESSARIA','Entre na sua conta para continuar.',{status:401,hint:'Faça login e envie novamente.'});
    req.user=user;
    req.authToken=token;
    next();
  }catch(e){next(e)}
}
