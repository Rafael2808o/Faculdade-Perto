import { z } from 'zod';

const text = z.string().trim().min(1).max(120).optional();
const httpUrl = z.string().max(500).refine((value)=>{try{return ['http:','https:'].includes(new URL(value).protocol)}catch{return false}},'Use uma URL válida iniciada por http:// ou https://.');
export const paginationSchema = z.object({ page:z.coerce.number().int().min(1).default(1), limit:z.coerce.number().int().min(1).max(100).default(20) }).passthrough();
export const institutionQuery = paginationSchema.extend({ q:text, state:z.string().trim().length(2).optional(), city:text, network:z.enum(['publica','privada']).optional() });
export const courseQuery = paginationSchema.extend({ q:text, degree:z.enum(['bacharelado','licenciatura','tecnologo','abi','nao_confirmado']).optional(), modality:z.enum(['presencial','ead']).optional() });
export const searchQuery = courseQuery.extend({
  state:z.string().trim().length(2).optional(), city:text, network:z.enum(['publica','privada']).optional(),
  organization:z.enum(['universidade','centro_universitario','faculdade','instituto_federal','cefet']).optional(),
  category:z.enum(['publica_federal','publica_estadual','publica_municipal','privada_com_fins','privada_sem_fins','especial']).optional(),
  free:z.enum(['sim','nao']).optional(), shift:z.enum(['diurno','noturno']).optional(),
  dimension:z.enum(['municipio','ead_brasil','ead_brasil_agregado','ead_exterior']).optional(),
  minSeats:z.coerce.number().int().min(0).max(100000).optional(),
  radiusKm:z.coerce.number().refine((value)=>[5,10,25,50,100].includes(value),'Use um raio de 5, 10, 25, 50 ou 100 km.').optional(),
  sort:z.enum(['relevance','name','distance','seats']).default('relevance'),
  lat:z.coerce.number().min(-90).max(90).optional(), lng:z.coerce.number().min(-180).max(180).optional()
}).refine((value)=>(value.lat===undefined)===(value.lng===undefined),{message:'Envie latitude e longitude juntas.'}).refine((value)=>value.sort!=='distance'||value.lat!==undefined,{message:'A ordenação por distância exige sua localização.'}).refine((value)=>value.radiusKm===undefined||value.lat!==undefined,{message:'O filtro de raio exige sua localização.'});
export const nearbyQuery = z.object({ lat:z.coerce.number().min(-90).max(90), lng:z.coerce.number().min(-180).max(180), radiusKm:z.coerce.number().refine((v)=>[5,10,25,50,100].includes(v),'Use um raio de 5, 10, 25, 50 ou 100 km.'), limit:z.coerce.number().int().min(1).max(100).default(50) });
export const cutoffQuery = paginationSchema.extend({
  q:text,
  city:text,
  state:z.string().trim().length(2).transform((value)=>value.toUpperCase()).optional(),
  competitionModality:z.string().trim().min(1).max(160).optional(),
  score:z.coerce.number().min(0).max(1000).optional()
});
export const offeringQuery = paginationSchema.extend({
  q:text,
  city:text,
  state:z.string().trim().length(2).transform((value)=>value.toUpperCase()).optional(),
  modality:z.enum(['presencial','ead']).optional(),
  degree:z.enum(['bacharelado','licenciatura','tecnologo','abi','nao_confirmado']).optional()
});
export const idParams = z.object({ id:z.string().trim().min(1).max(180) });
export const numericIdParams = z.object({ id:z.string().trim().regex(/^[1-9]\d{0,19}$/,'Use um identificador numérico válido.') });

export const registerBody = z.object({
  name:z.string().trim().min(2,'Informe seu nome.').max(100),
  email:z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(160),
  password:z.string().min(8,'A senha precisa ter pelo menos 8 caracteres.').max(128)
});
export const loginBody = registerBody.pick({email:true,password:true});
export const planBody = z.object({recordId:z.coerce.number().int().positive(),notes:z.string().trim().max(1000).optional().or(z.literal(''))});
export const correctionReviewBody = z.object({status:z.enum(['pendente','aceita','rejeitada','precisa_informacao'])});

export const contactBody = z.object({
  name:z.string().trim().min(2,'Informe seu nome.').max(100),
  email:z.string().trim().email('Informe um e-mail válido.').max(160),
  subject:z.string().trim().min(3,'Informe o assunto.').max(120),
  message:z.string().trim().min(10,'Escreva pelo menos 10 caracteres.').max(3000)
});
export const correctionBody = z.object({
  entityType:z.enum(['institution','campus','course','offering','other']), entityId:z.coerce.number().int().positive().optional(),
  description:z.string().trim().min(20,'Explique o erro em pelo menos 20 caracteres.').max(3000), evidenceUrl:z.literal('').or(httpUrl).optional(),
  name:z.string().trim().min(2).max(100).optional().or(z.literal('')), email:z.string().trim().email().max(160).optional().or(z.literal(''))
});
const score = z.coerce.number().min(0).max(1000);
const scores = z.object({ languages:score, humanities:score, naturalSciences:score, mathematics:score, essay:score.int('A nota de redação deve ser inteira.') });
const weights = z.object({ languages:z.coerce.number().positive(), humanities:z.coerce.number().positive(), naturalSciences:z.coerce.number().positive(), mathematics:z.coerce.number().positive(), essay:z.coerce.number().positive() });
export const enemBody = z.object({ scores, weights:weights.optional(), trainee:z.boolean().default(false) });
export const admissionHistoryQuery = cutoffQuery.omit({score:true}).extend({
  year:z.coerce.number().int().min(2010).max(2100).optional(),
  roundKind:z.enum(['regular','waiting_snapshot']).optional(),
  round:z.enum(['Chamada regular',...Array.from({length:13},(_,index)=>`Após a ${index+1}ª chamada da lista de espera`)]).optional(),
  shift:z.enum(['matutino','vespertino','noturno','integral']).optional()
}).strip();
export const admissionPossibilityBody = admissionHistoryQuery.extend({scores,trainee:z.boolean().default(false)}).strict();
