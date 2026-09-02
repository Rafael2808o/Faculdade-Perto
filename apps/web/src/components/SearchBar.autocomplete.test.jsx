// @vitest-environment jsdom
import {render,fireEvent,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {describe,it,expect,vi} from 'vitest';
import {SearchBar} from './SearchBar.jsx';
import {api} from '../services/api.js';
vi.mock('../services/api.js',()=>({api:vi.fn()}));
describe('sugestões da busca nacional',()=>{
  it('consulta instituições e cursos e permite selecionar com teclado',async()=>{
    api.mockImplementation((path)=>path.startsWith('/institutions')?Promise.resolve({data:[{id:'1',name:{value:'Universidade de São Paulo'},acronym:{value:'USP'},academicOrganization:{value:'Universidade'},headquarters:{value:{city:'São Paulo',state:'SP'}}}]}):Promise.resolve({data:[{id:'2',canonical_name:'Medicina',record_count:120,institution_count:42}]}));
    render(<MemoryRouter><SearchBar/></MemoryRouter>);
    const input=screen.getByRole('combobox');
    fireEvent.change(input,{target:{value:'USP'}});
    await waitFor(()=>expect(screen.getAllByRole('option')).toHaveLength(2));
    expect(api.mock.calls.some(([path])=>path.startsWith('/institutions')&&path.includes('q=USP'))).toBe(true);
    expect(api.mock.calls.some(([path])=>path.startsWith('/courses')&&path.includes('q=USP'))).toBe(true);
    fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Enter'});
    expect(input.value).toBe('Universidade de São Paulo');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
});
