import {describe,expect,it} from 'vitest';
import {calculateCompatibility,compassSearchParams,defaultCompassProfile} from './compass.js';

const item={location:{city:'Campinas',state:'SP',distanceKm:18},modality:{value:'presencial'},degree:{value:'bacharelado'},free:{value:true},censusSeats:{value:120},institution:{network:'publica'},shifts:{value:{daytimeSeats:80,nighttimeSeats:40}}};

describe('Bússola da Escolha',()=>{
  it('calcula compatibilidade somente com critérios explícitos e auditáveis',()=>{
    const profile={...defaultCompassProfile,state:'SP',modality:'presencial',network:'publica',degree:'bacharelado',shift:'noturno',free:'sim',minSeats:'100'};
    const result=calculateCompatibility(item,profile);
    expect(result.score).toBe(100);expect(result.matches).toContain('Gratuidade');expect(result.criteria.length).toBe(7);
  });
  it('não transforma dado ausente em correspondência',()=>{
    const result=calculateCompatibility({...item,free:{value:null}},{...defaultCompassProfile,free:'sim'});
    expect(result.score).toBe(0);expect(result.missing).toEqual(['Gratuidade']);
  });
  it('gera uma busca compartilhável sem dados pessoais',()=>{
    const params=compassSearchParams({...defaultCompassProfile,course:'Medicina',state:'SP',free:'sim'});
    expect(params.get('q')).toBe('Medicina');expect(params.get('state')).toBe('SP');expect(params.get('compass')).toBe('1');
  });
});
