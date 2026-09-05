import { describe, expect, it } from 'vitest';
import { matchUFMGTerm, normalizeUFMGReport } from './ufmg.js';
const weights = { languages:1,humanities:1,naturalSciences:1,mathematics:1,essay:1 };
const medicine = { code:'1',name:'MEDICINA',shift:'matutino',city:'Belo Horizonte',degree:'Bacharelado',weights };
describe('reconciliação do histórico UFMG',()=>{
  it('não mistura turnos, cursos ou locais ambíguos',()=>{
    expect(matchUFMGTerm({name:'Medicina',shift:'noturno'},[medicine])).toBeNull();
    expect(matchUFMGTerm({name:'Medicina',shift:'matutino'},[medicine,medicine])).toBeNull();
    expect(matchUFMGTerm({name:'Medicina veterinária',shift:'matutino'},[medicine])).toBeNull();
    expect(matchUFMGTerm({name:'Medicina',shift:'matutino'},[medicine])).toEqual(medicine);
    expect(matchUFMGTerm({name:'Medicina',shift:'integral'},[{...medicine,shift:'integral (matutino/vespertino)'}]).shift).toMatch(/^integral/);
  });
  it('preserva a modalidade, a rodada e a natureza cumulativa do relatório',()=>{
    const report={year:2026,round:'Após a 2ª chamada da lista de espera',rows:[{name:'MEDICINA',shift:'matutino',competition:'LB_EP',minimum:700,maximum:800,page:4}]};
    const result=normalizeUFMGReport(report,{year:2026,url:'https://www.ufmg.br/termo.pdf',rows:[medicine]});
    expect(result.records[0]).toMatchObject({competition:'LB_EP',roundKind:'waiting_snapshot',reportPage:4});
    expect(()=>normalizeUFMGReport(report,{year:2025,rows:[medicine]})).toThrow(/mesma edição/);
  });
});
