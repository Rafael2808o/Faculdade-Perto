import request from 'supertest';
import {describe,expect,it} from 'vitest';
import {createApp} from '../app.js';

describe('consulta histórica de notas de corte',()=>{
  const app=createApp();
  it('responde honestamente quando ainda não há histórico importado',async()=>{
    const response=await request(app).get('/api/v1/cutoffs?q=Medicina&score=710&limit=20');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.empty.message).toMatch(/histórico oficial/i);
    expect(response.body.methodology.guarantee).toBe(false);
  });
  it('rejeita notas e paginações abusivas',async()=>{
    expect((await request(app).get('/api/v1/cutoffs?score=1001')).status).toBe(422);
    expect((await request(app).get('/api/v1/cutoffs?limit=1000')).status).toBe(422);
  });
  it('consulta possibilidades por POST sem armazenar notas na URL ou no cache',async()=>{
    const scores={languages:700,humanities:700,naturalSciences:700,mathematics:700,essay:800};
    const response=await request(app).post('/api/v1/enem/possibilities').send({q:'Medicina',scores});
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.coverage.message).toMatch(/parcial/);
    expect((await request(app).post('/api/v1/enem/possibilities').send({scores:{...scores,essay:800.1}})).status).toBe(422);
    expect((await request(app).post('/api/v1/enem/possibilities').send({scores,weights:{essay:100}})).status).toBe(422);
  });
});
