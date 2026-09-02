import {describe,expect,it} from 'vitest';
import {classifyCutoff,describeRound} from './cutoffPossibility.js';

describe('comparação histórica de nota',()=>{
  it('classifica pela diferença sem prometer aprovação',()=>{
    expect(classifyCutoff(720,690)).toMatchObject({key:'favorable',difference:30});
    expect(classifyCutoff(700,690)).toMatchObject({key:'competitive',difference:10});
    expect(classifyCutoff(680,690)).toMatchObject({key:'close',difference:-10});
    expect(classifyCutoff(650,690)).toMatchObject({key:'difficult',difference:-40});
  });
  it('não transforma lista de espera em chamada regular',()=>{
    expect(describeRound('lista de espera 2')).toContain('Lista de espera');
    expect(describeRound('chamada regular')).toContain('Chamada regular');
  });
});
