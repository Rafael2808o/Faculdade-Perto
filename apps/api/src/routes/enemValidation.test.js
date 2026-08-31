import {describe,it,expect} from 'vitest';
import {enemBody} from './schemas.js';
const scores={languages:650.5,humanities:700,naturalSciences:600,mathematics:780.4,essay:800};
describe('notas do boletim',()=>{
  it('preserva decimais nas provas objetivas',()=>expect(enemBody.parse({scores}).scores.languages).toBe(650.5));
  it('rejeita redação fracionária',()=>expect(()=>enemBody.parse({scores:{...scores,essay:0.05}})).toThrow());
});
