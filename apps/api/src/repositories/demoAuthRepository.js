import { findCatalogRecord } from './demoRepository.js';
import { env } from '../config/env.js';
const users=[];const sessions=new Map();const plan=[];const corrections=[];let userId=1;let planId=1;
export async function findUserByEmail(email){return users.find((u)=>u.email===email)||null}
export async function createUser({name,email,passwordHash,role}){if(users.some((user)=>user.email===email)){const error=new Error('duplicate email');error.code='23505';throw error}const user={id:userId++,name,email,password_hash:passwordHash,role:role||(env.NODE_ENV!=='production'&&users.length===0?'admin':'user'),created_at:new Date()};users.push(user);return user}
export async function createSession(id,tokenHash,expiresAt){sessions.set(tokenHash,{userId:id,expiresAt})}
export async function findUserBySession(tokenHash){const session=sessions.get(tokenHash);if(!session||session.expiresAt<new Date())return null;const user=users.find((u)=>u.id===session.userId);return user?{id:user.id,name:user.name,email:user.email,role:user.role}:null}
export async function deleteSession(tokenHash){return sessions.delete(tokenHash)}
export async function listPlan(id){return Promise.all(plan.filter((x)=>x.userId===id).map(async({userId,...item})=>{const record=await findCatalogRecord(item.id);return {...item,original_name:record?.original_name,canonical_name:record?.canonical_name||`Registro ${item.id}`,degree:record?.degree,modality:record?.modality,institution_name:record?.institution_name||'Instituição não encontrada',institution_slug:record?.institution_slug,municipality_name:record?.municipality_name||'Não confirmado',state_abbreviation:record?.state_abbreviation||''}}))}
export async function addPlanItem(userId,recordId,notes){if(!await findCatalogRecord(recordId))return null;let item=plan.find((x)=>x.userId===userId&&x.id===recordId);if(!item){item={plan_item_id:planId++,userId,id:recordId,notes:notes||null,created_at:new Date()};plan.push(item)}else item.notes=notes||null;return {id:item.plan_item_id,created_at:item.created_at}}
export async function removePlanItem(userId,id){const index=plan.findIndex((x)=>x.userId===userId&&String(x.plan_item_id)===String(id));if(index<0)return false;plan.splice(index,1);return true}
export async function listCorrections(){return corrections}
export async function updateCorrection(id,status){const item=corrections.find((x)=>String(x.id)===String(id));if(item)item.status=status;return item||null}
export function addCorrection(data){const item={id:corrections.length+1,...data,status:'pendente',created_at:new Date()};corrections.push(item);return item}
