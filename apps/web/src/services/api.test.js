import { describe, expect, it } from 'vitest';
import { queryString } from './api.js';

describe('queryString', () => {
  it('remove filtros vazios e preserva acentos', () => {
    const result = queryString({ q: 'Medicina', city: 'São Paulo', degree: '' });
    expect(result).toContain('q=Medicina');
    expect(result).toContain('city=S%C3%A3o+Paulo');
    expect(result).not.toContain('degree');
  });
});
