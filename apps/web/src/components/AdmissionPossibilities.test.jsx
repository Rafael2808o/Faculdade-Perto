// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../services/api.js';
import { AdmissionPossibilities } from './AdmissionPossibilities.jsx';

vi.mock('../services/api.js',()=>({api:vi.fn()}));

const scores={languages:700,humanities:710,naturalSciences:720,mathematics:730,essay:800};
const scenario={id:'1',canonical_name:'Medicina',institution_name:'Universidade Federal de Minas Gerais',shift:'integral (matutino/vespertino)',
  campus_name:'Campus Pampulha',municipality_name:'Belo Horizonte',state_abbreviation:'MG',year:2026,round:'Chamada regular',
  round_kind:'regular',competition_modality:'Ampla concorrência',score:780,maximum_score:835,weights:{languages:1,humanities:1,naturalSciences:1,mathematics:1,essay:1},
  weights_source_url:'https://www.ufmg.br/sisu/termo.pdf',source_url:'https://www.ufmg.br/sisu/notas.pdf',source_page:'4',
  comparison:{comparable:true,score:732,difference:-48}};

describe('possibilidades pela nota do Enem',()=>{
  it('envia as notas por POST e identifica a chamada sem prometer aprovação',async()=>{
    api.mockImplementation((path,options)=>options?.method==='POST'?Promise.resolve({data:[scenario],pagination:{total:1,page:1,totalPages:1},
      coverage:{institutions:[{acronym:'UFMG',year:2026,courses:75,courseShifts:94,rounds:14,scenarios:10332}],message:'Cobertura parcial.'},
      methodology:{message:'Comparação histórica.',rounds:'Sem garantia.'}}):Promise.resolve({coverage:{institutions:[],message:'Cobertura parcial.'}}));
    render(<AdmissionPossibilities scores={scores} trainee={false}/>);
    fireEvent.change(screen.getByLabelText('Curso ou instituição'),{target:{value:'Medicina'}});
    fireEvent.change(screen.getByLabelText('Etapa do relatório'),{target:{value:'Chamada regular'}});
    fireEvent.click(screen.getByRole('button',{name:/comparar com o histórico oficial/i}));
    await waitFor(()=>expect(screen.getByText('Universidade Federal de Minas Gerais · integral (matutino/vespertino)')).toBeTruthy());
    const [,options]=api.mock.calls.find(([,request])=>request?.method==='POST');
    expect(JSON.parse(options.body)).toMatchObject({q:'Medicina',round:'Chamada regular',competitionModality:'AC',scores});
    expect(screen.getByText(/não prevê aprovação/i)).toBeTruthy();
    expect(screen.getByRole('link',{name:/relatório oficial/i}).getAttribute('href')).toContain('ufmg.br');
  });
});
