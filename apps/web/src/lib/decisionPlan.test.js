import {describe,expect,it} from 'vitest';
import {checklistProgress,readDecisionChecklist,writeDecisionChecklist} from './decisionPlan.js';
function storage(){let data={};return {getItem:key=>data[key]??null,setItem:(key,value)=>{data[key]=value}}}
describe('plano de decisão',()=>{
  it('salva o checklist somente no aparelho',()=>{const local=storage();writeDecisionChecklist({compare:true},local);expect(readDecisionChecklist(local)).toEqual({compare:true})});
  it('calcula o avanço sem transformar etapas em ranking',()=>{expect(checklistProgress({priorities:true,compare:true})).toEqual({completed:2,total:7,percentage:29})});
  it('ignora conteúdo local inválido',()=>{expect(readDecisionChecklist({getItem:()=>'{'})).toEqual({})});
});
