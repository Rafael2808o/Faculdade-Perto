import * as repository from '../repositories/writeRepository.js';
import { env } from '../config/env.js';
import { addCorrection as addDemoCorrection } from '../repositories/demoAuthRepository.js';
import { sendContactEmails } from './emailService.js';

const demoSubmissions=[];
async function write(name,data){
  if(env.DATA_MODE==='demo') return name==='createCorrection'?addDemoCorrection(data):{id:demoSubmissions.push({type:name,...data}),created_at:new Date(),status:'pendente'};
  try{return await repository[name](data)}catch(error){if(env.DATA_MODE==='auto'&&['ECONNREFUSED','ENOTFOUND','57P01'].includes(error.code))return {id:demoSubmissions.push({type:name,...data}),created_at:new Date(),status:'pendente'};throw error}
}

export async function submitContact(data) {
  const result = await write('createContact',data);
  let emailStatus = 'nao_configurado';
  try {
    const delivery = await sendContactEmails(data);
    emailStatus = !delivery.enabled
      ? 'nao_configurado'
      : delivery.confirmationId
        ? 'enviado'
        : 'notificacao_enviada';
  } catch (error) {
    emailStatus = 'pendente';
    console.error(JSON.stringify({ level: 'error', event: 'contact_email_failed', message: error.message, contactId: result.id }));
  }
  return {
    id: result.id,
    receivedAt: result.created_at,
    emailStatus,
    message: emailStatus === 'enviado'
      ? 'Mensagem recebida. Enviamos uma confirmação para o e-mail informado.'
      : emailStatus === 'notificacao_enviada'
        ? 'Mensagem recebida. Nossa equipe já foi avisada e responderá pelo e-mail informado.'
        : 'Mensagem recebida. Nossa equipe fará a triagem e responderá pelo e-mail informado.'
  };
}

export async function submitCorrection(data) {
  const result = await write('createCorrection',data);
  return { id: result.id, receivedAt: result.created_at, status: result.status, message: 'Correção recebida e enviada para revisão. O dado público não será alterado sem verificação.' };
}
