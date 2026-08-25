import { describe, expect, it } from 'vitest';
import { catalogNaturalKey, foldText } from './sqlText.js';

describe('portabilidade textual do banco', () => {
  it('normaliza acentos para a busca sem extensão do PostgreSQL', () => {
    expect(foldText('São José — EDUCAÇÃO')).toBe('sao jose — educacao');
  });

  it('preserva a posição dos campos nulos na chave natural', () => {
    expect(catalogNaturalKey([1, 2, null, 'ead'])).toBe('1|2|∅|ead');
  });
});
