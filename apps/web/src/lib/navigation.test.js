import { describe,expect,it } from 'vitest';
import { safeInternalPath } from './navigation.js';

describe('safeInternalPath',()=>{
  it('aceita apenas caminhos internos absolutos',()=>{
    expect(safeInternalPath('/meu-plano','/')).toBe('/meu-plano');
    expect(safeInternalPath('//site-malicioso.test','/meu-plano')).toBe('/meu-plano');
    expect(safeInternalPath('https://site-malicioso.test','/meu-plano')).toBe('/meu-plano');
  });
});
