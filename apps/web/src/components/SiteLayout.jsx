import { Outlet,Link,NavLink } from 'react-router-dom';
import { Bookmark,Columns3,Compass,Database,LogIn,LogOut,Menu,Moon,Search,Sun } from 'lucide-react';
import { useEffect,useState } from 'react';
import { clearSession,getStoredUser } from '../lib/auth.js';
import { applyTheme,getPreferredTheme,saveTheme } from '../lib/theme.js';
import { api } from '../services/api.js';
import { BrandLogo } from './BrandLogo.jsx';

export function SiteLayout(){
  const [open,setOpen]=useState(false);
  const [user,setUser]=useState(getStoredUser);
  const [demo,setDemo]=useState(false);
  const [theme,setTheme]=useState(getPreferredTheme);
  useEffect(()=>{
    applyTheme(theme);
    saveTheme(theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#0b1220':'#f4f7f9');
  },[theme]);
  useEffect(()=>{
    const controller=new AbortController();
    const sync=()=>setUser(getStoredUser());
    window.addEventListener('faculdade-auth',sync);
    fetch('/api/health',{signal:controller.signal}).then(response=>response.json()).then(status=>setDemo(status.dataMode==='demo')).catch(()=>{});
    return()=>{controller.abort();window.removeEventListener('faculdade-auth',sync)};
  },[]);
  async function logout(){try{await api('/auth/session',{method:'DELETE'})}finally{clearSession()}}
  const nextTheme=theme==='dark'?'light':'dark';
  return <div className="site-shell">
    <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Faculdade Perto — início"><BrandLogo/></Link>
      <span className="header-dataset">Censo Superior 2024</span>
      <button className="theme-toggle" type="button" onClick={()=>setTheme(nextTheme)} aria-pressed={theme==='dark'} aria-label={`Ativar modo ${nextTheme==='dark'?'escuro':'claro'}`} title={`Ativar modo ${nextTheme==='dark'?'escuro':'claro'}`}>
        {theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}<span>{theme==='dark'?'Claro':'Escuro'}</span>
      </button>
      <button className="menu-button" type="button" onClick={()=>setOpen(value=>!value)} aria-expanded={open} aria-controls="main-nav" aria-label="Abrir menu"><Menu/></button>
      <nav id="main-nav" className={open?'nav open':'nav'} aria-label="Navegação principal" onClick={()=>setOpen(false)}>
        <NavLink to="/bussola"><Compass size={17}/>Bússola</NavLink><NavLink to="/buscar"><Search size={17}/>Buscar</NavLink><NavLink to="/comparar"><Columns3 size={17}/>Comparar</NavLink><NavLink to="/meu-plano"><Bookmark size={17}/>Meu Plano</NavLink><NavLink to="/enem">Nota Enem</NavLink>
        {user?<button className="nav-session" type="button" onClick={logout} title={`Sair da conta de ${user.name}`}><LogOut size={17}/>Sair</button>:<NavLink className="nav-login" to="/entrar"><LogIn size={17}/>Entrar</NavLink>}
      </nav>
    </header>
    {demo?<div className="demo-banner" role="status"><strong>Modo demonstração:</strong> esta é uma amostra oficial de 10 registros do Censo 2024, não o catálogo nacional completo.</div>:null}
    <main id="conteudo" tabIndex="-1"><Outlet/></main>
    <footer className="site-footer"><div><Link className="brand footer-brand" to="/"><BrandLogo/></Link><p>Dados educacionais oficiais para escolhas mais claras.</p></div><div><strong>Explore</strong><Link to="/bussola">Bússola da Escolha</Link><Link to="/buscar">Buscar cursos</Link><Link to="/comparar">Comparar cursos</Link><Link to="/meu-plano">Meu Plano</Link><Link to="/enem">Calcular nota</Link></div><div><strong>Transparência</strong><a href="/api/docs"><Database size={15}/>Documentação da API</a><Link to="/duvidas">Entenda os dados</Link><Link to="/corrigir">Encontrou um erro?</Link></div><div><strong>Legal</strong><Link to="/privacidade">Privacidade</Link><Link to="/termos">Termos de uso</Link><Link to="/contato">Contato</Link></div><p className="footer-note">Não somos vinculados ao MEC ou ao INEP. Reorganizamos dados públicos e mostramos a proveniência de cada informação.</p></footer>
  </div>;
}
