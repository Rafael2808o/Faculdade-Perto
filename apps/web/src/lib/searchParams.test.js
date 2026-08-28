import { describe,expect,it } from 'vitest';
import { readSearchFilters } from './searchParams.js';

describe('readSearchFilters',()=>{
  it('ordena por distância ao usar a localização do usuário',()=>{
    const filters=readSearchFilters(new URLSearchParams(),{lat:-20.89,lng:-51.38});
    expect(filters.sort).toBe('distance');
    expect(filters.lat).toBe(-20.89);
    expect(filters.lng).toBe(-51.38);
  });
});
