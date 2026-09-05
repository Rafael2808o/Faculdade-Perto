import {describe,expect,it} from 'vitest';
import {compareAdmissionScore} from './admissionHistoryService.js';
const scores={languages:700,humanities:700,naturalSciences:700,mathematics:900,essay:800};
const row={score:780,weights:{languages:1,humanities:1,naturalSciences:1,mathematics:3,essay:2},minimum_scores:{essay:0.01},weights_source_url:'https://www.ufmg.br/termo.pdf'};
describe('comparação pelos pesos oficiais',()=>{
  it('usa pesos da edição, sem reutilizar uma média livre digitada pelo usuário',()=>{
    expect(compareAdmissionScore(row,scores)).toMatchObject({comparable:true,score:800,difference:20});
  });
  it('não sugere possibilidade a treineiro, redação zero ou pesos ausentes',()=>{
    expect(compareAdmissionScore(row,scores,true).comparable).toBe(false);
    expect(compareAdmissionScore(row,{...scores,essay:0}).comparable).toBe(false);
    expect(compareAdmissionScore({...row,weights:null},scores).comparable).toBe(false);
    expect(compareAdmissionScore({...row,weights:{...row.weights,essay:null}},scores).comparable).toBe(false);
  });
});
