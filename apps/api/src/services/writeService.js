import * as repository from '../repositories/writeRepository.js';
import { env } from '../config/env.js';
import { addCorrection as addDemoCorrection } from '../repositories/demoAuthRepository.js';

const demoSubmissions=[];
async function write(name,data){
  if(env.DATA_MODE==='demo') return name==='createCorrection'?addDemoCorrection(data):{id:demoSubmissions.push({type:name,...data}),created_at:new Date(),status:'pendente'};
  try{return await repository[name](data)}catch(error){if(env.DATA_MODE==='auto'&&['ECONNREFUSED','ENOTFOUND','57P01'].includes(error.code))return {id:demoSubmissions.push({type:name,...data}),created_at:new Date(),status:'pendente'};throw error}
}

export async function submitContact(data) {
  const result = await write('createContact',data);
  return { id: result.id, receivedAt: result.created_at, message: 'Mensagem recebida. Nossa equipe fará a triagem e responderá pelo e-mail informado.' };
}

export async function submitCorrection(data) {
  const result = await write('createCorrection',data);
  return { id: result.id, receivedAt: result.created_at, status: result.status, message: 'Correção recebida e enviada para revisão. O dado público não será alterado sem verificação.' };
}
