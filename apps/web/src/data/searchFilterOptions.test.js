import { describe,expect,it } from 'vitest';
import { categoryOptions,organizationOptions,states } from './searchFilterOptions.js';

describe('opções de filtro',()=>{
  it('oferece as 27 UFs uma única vez',()=>{
    expect(states).toHaveLength(27);
    expect(new Set(states).size).toBe(27);
    expect(states).toEqual(expect.arrayContaining(['AC','AM','DF','SP','TO']));
  });

  it('cobre os tipos de instituição e categorias do Censo',()=>{
    expect(organizationOptions.map(([value])=>value)).toEqual(expect.arrayContaining(['universidade','centro_universitario','faculdade','instituto_federal','cefet']));
    expect(categoryOptions.map(([value])=>value)).toEqual(expect.arrayContaining(['publica_federal','publica_estadual','publica_municipal','privada_com_fins','privada_sem_fins','especial']));
  });
});
