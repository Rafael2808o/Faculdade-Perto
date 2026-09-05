import { beforeEach,describe,expect,it,vi } from 'vitest';

vi.mock('../database/pool.js',()=>({pool:{query:vi.fn()}}));

const { pool }=await import('../database/pool.js');
const {
  administrativeCategoryValues,courseRelevanceOrderSql,exactCityMatchSql,foldedInstitutionSearchSql,
  greatCircleDistanceSql,institutionOrganizationValues,parseLocationFilter,searchCatalog
}=await import('./catalogRepository.js');

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

  it('prioriza nome exato antes de prefixo no autocomplete de cursos',()=>{
    const sql=courseRelevanceOrderSql('$2','$3');
    expect(sql).toContain('= $2 THEN 0');
    expect(sql).toContain('LIKE $3 THEN 1');
  });

  it('não mistura Andradina com Nova Andradina no filtro de cidade',()=>{
    expect(exactCityMatchSql()).toContain(' = ?');
    expect(exactCityMatchSql()).not.toContain('LIKE');
  });
});

describe('paginação alfabética do catálogo',()=>{
  beforeEach(()=>pool.query.mockReset());

  it('pagina por curso e instituição antes de carregar os registros',async()=>{
    pool.query
      .mockResolvedValueOnce({rows:[{total:'5'}]})
      .mockResolvedValueOnce({rows:[{id:'10',canonical_name:'Administração'}]})
      .mockResolvedValueOnce({rows:[{group_count:'5'}]})
      .mockResolvedValueOnce({rows:[{name:'Universidade Exemplo',group_count:'5'}]})
      .mockResolvedValueOnce({rows:[{id:'101',canonical_name:'Administração',institution_name:'Universidade Exemplo',total:'5'}]});

    const rows=await searchCatalog({page:1,limit:1,sort:'name'});

    expect(rows).toEqual([{id:'101',canonical_name:'Administração',institution_name:'Universidade Exemplo',total:'5'}]);
    expect(pool.query).toHaveBeenCalledTimes(5);
    expect(pool.query.mock.calls[4][0]).toContain('ORDER BY ccr.id');
    expect(pool.query.mock.calls[4][0]).not.toContain('count(*) OVER()');
  });

  it('não percorre os grupos quando a página está além do total',async()=>{
    pool.query
      .mockResolvedValueOnce({rows:[{total:'5'}]})
      .mockResolvedValueOnce({rows:[{id:'10',canonical_name:'Administração'}]});

    await expect(searchCatalog({page:2,limit:5,sort:'name'})).resolves.toEqual([]);
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});
