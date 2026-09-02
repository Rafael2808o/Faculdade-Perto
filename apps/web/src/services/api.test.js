import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, queryString } from './api.js';

afterEach(()=>vi.restoreAllMocks());

describe('queryString', () => {
  it('remove filtros vazios e preserva acentos', () => {
    const result = queryString({ q: 'Medicina', city: 'São Paulo', degree: '' });
    expect(result).toContain('q=Medicina');
    expect(result).toContain('city=S%C3%A3o+Paulo');
    expect(result).not.toContain('degree');
  });
});

describe('api',()=>{
  it('envia a sessão apenas pelo cookie protegido do navegador',async()=>{
    const fetchMock=vi.spyOn(globalThis,'fetch').mockResolvedValue({ok:true,json:async()=>({data:{ok:true}})});
    await api('/me');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/me',expect.objectContaining({credentials:'same-origin'}));
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });
});
