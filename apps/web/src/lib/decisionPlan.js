export const PLAN_CHECKLIST_KEY='fp_decision_checklist_v1';
export const decisionChecklist=[
  {id:'priorities',label:'Definir minhas prioridades na Bússola',to:'/bussola'},
  {id:'options',label:'Salvar pelo menos três opções',to:'/buscar'},
  {id:'compare',label:'Comparar minhas opções lado a lado',to:'/comparar'},
  {id:'official',label:'Confirmar oferta, campus e situação no canal oficial'},
  {id:'admission',label:'Anotar formas de ingresso, prazos e documentos'},
  {id:'costs',label:'Estimar mensalidade, transporte, moradia e bolsas'},
  {id:'visit',label:'Visitar o campus ou conversar com estudantes'}
];
export function readDecisionChecklist(storage=globalThis.localStorage){try{const value=JSON.parse(storage?.getItem(PLAN_CHECKLIST_KEY)||'{}');return value&&typeof value==='object'?value:{}}catch{return {}}}
export function writeDecisionChecklist(value,storage=globalThis.localStorage){storage?.setItem(PLAN_CHECKLIST_KEY,JSON.stringify(value))}
export function checklistProgress(value){const completed=decisionChecklist.filter(item=>Boolean(value?.[item.id])).length;return {completed,total:decisionChecklist.length,percentage:Math.round(completed/decisionChecklist.length*100)}}
