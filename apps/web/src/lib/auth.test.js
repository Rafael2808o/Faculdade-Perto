// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, getStoredUser, hasSession, saveSession } from './auth.js';

describe('sessão do navegador',()=>{
  beforeEach(()=>localStorage.clear());

  it('guarda apenas o perfil e apaga tokens legados',()=>{
    localStorage.setItem('faculdade_perto_token','segredo-antigo');
    saveSession({token:'nao-deve-ser-salvo',user:{id:1,name:'Rafael'}});
    expect(localStorage.getItem('faculdade_perto_token')).toBeNull();
    expect(getStoredUser()).toEqual({id:1,name:'Rafael'});
    expect(hasSession()).toBe(true);
  });

  it('limpa perfil e qualquer token legado',()=>{
    const listener=vi.fn();
    window.addEventListener('faculdade-auth',listener);
    saveSession({user:{id:1,name:'Rafael'}});
    clearSession();
    expect(hasSession()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener('faculdade-auth',listener);
  });
});
