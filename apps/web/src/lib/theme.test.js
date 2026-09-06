import {describe,expect,it} from 'vitest';
import {THEME_STORAGE_KEY,applyTheme,getPreferredTheme,saveTheme} from './theme.js';

describe('preferência de tema',()=>{
  it('prioriza uma escolha persistida da pessoa',()=>{
    const storage={getItem:key=>key===THEME_STORAGE_KEY?'dark':null};
    expect(getPreferredTheme(storage,()=>({matches:false}))).toBe('dark');
  });
  it('usa o sistema apenas quando não existe escolha persistida',()=>{
    expect(getPreferredTheme({getItem:()=>null},()=>({matches:true}))).toBe('dark');
    expect(getPreferredTheme({getItem:()=>null},()=>({matches:false}))).toBe('light');
  });
  it('aplica e salva o tema sem expor estado global',()=>{
    const documentElement={dataset:{},style:{}};
    const values=new Map();
    applyTheme('dark',documentElement);saveTheme('dark',{setItem:(key,value)=>values.set(key,value)});
    expect(documentElement.dataset.theme).toBe('dark');
    expect(documentElement.style.colorScheme).toBe('dark');
    expect(values.get(THEME_STORAGE_KEY)).toBe('dark');
  });
});
