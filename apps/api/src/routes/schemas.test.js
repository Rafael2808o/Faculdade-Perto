import { describe,expect,it } from 'vitest';
import { numericIdParams,searchQuery } from './schemas.js';

describe('searchQuery',()=>{
  it('aceita uma combinação completa de filtros oficiais',()=>{
    const parsed=searchQuery.parse({
      q:'Medicina',state:'SP',network:'publica',modality:'presencial',degree:'bacharelado',
      organization:'universidade',category:'publica_estadual',free:'sim',shift:'diurno',
      dimension:'municipio',minSeats:'50',sort:'seats',page:'2',limit:'30'
    });
    expect(parsed).toMatchObject({state:'SP',organization:'universidade',category:'publica_estadual',free:'sim',shift:'diurno',minSeats:50,page:2});
  });

  it.each([
    ['shift','integral'],['organization','escola'],['category','comunitaria'],['free','talvez'],['dimension','campus']
  ])('rejeita %s fora da lista documentada',(key,value)=>{
    expect(()=>searchQuery.parse({[key]:value})).toThrow();
  });

  it('exige localização para ordenar por distância',()=>{
    expect(()=>searchQuery.parse({sort:'distance'})).toThrow(/localização/);
    expect(searchQuery.parse({sort:'distance',lat:'-23.55',lng:'-46.63'}).sort).toBe('distance');
  });

  it('aceita raio somente junto da localização',()=>{
    expect(()=>searchQuery.parse({radiusKm:'25'})).toThrow(/raio exige/);
    expect(searchQuery.parse({radiusKm:'25',lat:'-20.83',lng:'-51.32'}).radiusKm).toBe(25);
  });

  it('preserva IDs BIGINT do CockroachDB sem perda de precisão',()=>{
    expect(numericIdParams.parse({id:'1205140709989515265'}).id).toBe('1205140709989515265');
    expect(()=>numericIdParams.parse({id:'12.5'})).toThrow(/identificador/);
  });
});
