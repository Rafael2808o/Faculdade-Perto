// @vitest-environment jsdom
import {cleanup,render,fireEvent,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {SearchBar} from './SearchBar.jsx';
import {api} from '../services/api.js';
vi.mock('../services/api.js',()=>({api:vi.fn()}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
describe('sugestões da busca nacional',()=>{
  it('prioriza cursos completos e permite selecionar com teclado',async()=>{
    api.mockResolvedValue({data:[{id:'2',canonical_name:'Engenharia de Computação',record_count:120,institution_count:42}]});
    render(<MemoryRouter><SearchBar/></MemoryRouter>);
    const input=screen.getByRole('combobox',{name:'Curso ou faculdade'});
    fireEvent.change(input,{target:{value:'Engenharia da Computação'}});
    await waitFor(()=>expect(screen.getAllByRole('option')).toHaveLength(1));
    expect(screen.getByRole('option').textContent).toContain('Engenharia de Computação');
    expect(api.mock.calls.some(([path])=>path.startsWith('/courses')&&path.includes('q=Engenharia'))).toBe(true);
    expect(api.mock.calls.some(([path])=>path.startsWith('/institutions'))).toBe(false);
    fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Enter'});
    expect(input.value).toBe('Engenharia de Computação');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
  it('sugere cidade com UF e preserva a cidade selecionada para a busca',async()=>{
    api.mockImplementation((path)=>path.startsWith('/municipalities')?Promise.resolve({data:[{name:'Andradina',slug:'andradina',state:'SP',recordCount:8}]}):Promise.resolve({data:[]}));
    render(<MemoryRouter><SearchBar/></MemoryRouter>);
    const input=screen.getByRole('combobox',{name:'Cidade ou UF'});
    fireEvent.change(input,{target:{value:'Andradina'}});
    await waitFor(()=>expect(screen.getByRole('option',{name:/Andradina — SP/i})).toBeTruthy());
    fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Enter'});
    expect(input.value).toBe('Andradina, SP');
    expect(api.mock.calls.some(([path])=>path.startsWith('/municipalities')&&path.includes('q=Andradina'))).toBe(true);
  });
});
