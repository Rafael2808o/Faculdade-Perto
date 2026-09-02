import request from 'supertest';
import { describe,expect,it } from 'vitest';
import { createApp } from './app.js';

describe('conta e Meu Plano',()=>{
  const app=createApp();
  const session=request.agent(app);

  it('cria conta sem expor o segredo da sessão ao JavaScript',async()=>{
    const res=await session.post('/api/v1/auth/register').send({name:'Pessoa Teste',email:'pessoa.teste@example.com',password:'senha-segura-123'});
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeUndefined();
    expect(res.body.data.user).toEqual(expect.objectContaining({email:'pessoa.teste@example.com',role:'admin'}));
    expect(res.headers['set-cookie']?.[0]).toMatch(/^faculdade_perto_session=.*HttpOnly.*SameSite=Lax/i);
  });

  it('protege dados pessoais sem sessão',async()=>{
    const res=await request(app).get('/api/v1/me/plan');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTENTICACAO_NECESSARIA');
  });

  it('salva, lista e remove registro do plano com cookie HttpOnly',async()=>{
    const created=await session.post('/api/v1/me/plan').send({recordId:1,notes:'Minha primeira opção'});
    expect(created.status).toBe(201);
    const listed=await session.get('/api/v1/me/plan');
    expect(listed.status).toBe(200);
    expect(listed.body.data[0]).toEqual(expect.objectContaining({canonical_name:'Medicina',notes:'Minha primeira opção'}));
    const removed=await session.delete(`/api/v1/me/plan/${listed.body.data[0].plan_item_id}`);
    expect(removed.status).toBe(204);
  });

  it('rejeita senha incorreta',async()=>{
    const res=await request(app).post('/api/v1/auth/login').send({email:'pessoa.teste@example.com',password:'senha-errada'});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('CREDENCIAIS_INVALIDAS');
  });

  it('revoga a sessão e remove o cookie no logout',async()=>{
    const logout=await session.delete('/api/v1/auth/session');
    expect(logout.status).toBe(204);
    expect(logout.headers['set-cookie']?.[0]).toMatch(/^faculdade_perto_session=;.*Expires=/i);
    expect((await session.get('/api/v1/me')).status).toBe(401);
  });
});
