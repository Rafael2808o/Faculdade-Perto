import { describe,expect,it } from 'vitest';
import { administrativeCategoryValues,institutionOrganizationValues,parseLocationFilter } from './catalogRepository.js';

describe('parseLocationFilter',()=>{
  it('interpreta uma UF digitada no campo de cidade',()=>{
    expect(parseLocationFilter('sp')).toEqual({city:'',state:'SP'});
  });

  it('separa cidade e UF quando ambas são informadas',()=>{
    expect(parseLocationFilter('Campinas, SP')).toEqual({city:'Campinas',state:'SP'});
    expect(parseLocationFilter('Campinas - sp')).toEqual({city:'Campinas',state:'SP'});
  });

  it('preserva nomes de cidade completos e respeita o filtro de UF explícito',()=>{
    expect(parseLocationFilter('São Paulo')).toEqual({city:'São Paulo',state:''});
    expect(parseLocationFilter('Campinas','sp')).toEqual({city:'Campinas',state:'SP'});
  });

  it('mantém os valores oficiais usados pelos filtros institucionais',()=>{
    expect(institutionOrganizationValues).toMatchObject({
      universidade:'Universidade',centro_universitario:'Centro Universitário',instituto_federal:'Instituto Federal'
    });
    expect(administrativeCategoryValues).toMatchObject({
      publica_federal:'Pública Federal',publica_estadual:'Pública Estadual',privada_com_fins:'Privada com fins lucrativos'
    });
  });
});
