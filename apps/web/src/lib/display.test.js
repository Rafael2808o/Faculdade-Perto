import {describe,expect,it} from 'vitest';
import {displayCatalogValue,formatCount} from './display.js';

describe('apresentação de dados do catálogo',()=>{
  it('não expõe códigos internos do Censo na interface',()=>{
    expect(displayCatalogValue('nao_confirmado')).toBe('Não confirmado');
    expect(displayCatalogValue('centro_universitario')).toBe('Centro universitário');
    expect(displayCatalogValue('tecnologo')).toBe('Tecnólogo');
  });
  it('formata contagens grandes para leitura humana',()=>{
    expect(formatCount(720349)).toBe('720.349');
  });
});
