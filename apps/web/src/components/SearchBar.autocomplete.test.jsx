// @vitest-environment jsdom
import {render,fireEvent,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {describe,it,expect,vi} from 'vitest';
import {SearchBar} from './SearchBar.jsx';
import {api} from '../services/api.js';
vi.mock('../services/api.js',()=>({api:vi.fn()}));
describe('sugestões de instituições',()=>{
  it('consulta a base nacional e permite selecionar com teclado',async()=>{
    api.mockResolvedValue({data:[{id:'1',name:{value:'Universidade de São Paulo'},acronym:{value:'USP'},headquarters:{value:{city:'São Paulo',state:'SP'}}}]});
    render(<MemoryRouter><SearchBar/></MemoryRouter>);
    const input=screen.getByRole('combobox');
    fireEvent.change(input,{target:{value:'USP'}});
    await waitFor(()=>expect(screen.getByRole('option')).toBeTruthy());
    expect(api.mock.calls[0][0]).toContain('q=USP');
    fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Enter'});
    expect(input.value).toBe('Universidade de São Paulo');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
});
