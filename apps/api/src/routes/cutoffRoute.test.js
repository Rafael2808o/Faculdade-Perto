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
});
