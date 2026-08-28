import { describe,expect,it } from 'vitest';
import { administrativeCategoryValues,foldedInstitutionSearchSql,greatCircleDistanceSql,institutionOrganizationValues,parseLocationFilter } from './catalogRepository.js';

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

  it('gera distância geográfica com tipos compatíveis com o CockroachDB',()=>{
    const sql=greatCircleDistanceSql('m.latitude','m.longitude','$1','$2');
    expect(sql).toContain('6371.0::float8');
    expect(sql).toContain('m.latitude::float8-$1::float8');
    expect(sql).toContain('m.longitude::float8-$2::float8');
  });

  it('mantém aliases institucionais como parte da busca nacional',()=>{
    expect(foldedInstitutionSearchSql()).toContain('institution_aliases');
  });
});
