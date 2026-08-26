import { useQuery } from '@tanstack/react-query';
import { AlertCircle,List,Map } from 'lucide-react';
import { useMemo,useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Seo } from '../components/Seo.jsx';
import { SearchBar } from '../components/SearchBar.jsx';
import { SearchFilters } from '../components/SearchFilters.jsx';
import { ResultCard } from '../components/ResultCard.jsx';
import { ResultsMap } from '../components/ResultsMap.jsx';
import { api,queryString } from '../services/api.js';
import { readSearchFilters } from '../lib/searchParams.js';

export function SearchPage(){
  const [params,setParams]=useSearchParams();const [active,setActive]=useState(null);const [radius,setRadius]=useState(25);const [mode,setMode]=useState('list');const [userLocation,setUserLocation]=useState(null);
  const filters=useMemo(()=>readSearchFilters(params,userLocation),[params,userLocation]);
  const query=useQuery({queryKey:['search',filters],queryFn:()=>api(`/search?${queryString(filters)}`)});
  function change(key,value){const next=new URLSearchParams(params);if(value&&value!=='relevance')next.set(key,value);else next.delete(key);if(key!=='page')next.delete('page');setParams(next)}
  function clearFilters(){const next=new URLSearchParams();if(filters.q)next.set('q',filters.q);setParams(next)}
  function showMode(nextMode){setMode(nextMode);setTimeout(()=>document.querySelector(nextMode==='map'?'.map-panel':'.results-panel')?.scrollIntoView({behavior:'smooth',block:'start'}),0)}
  const items=query.data?.data||[];const pagination=query.data?.pagination;
  return <div className="search-page">
    <Seo title={`${filters.q||'Cursos e faculdades'}${filters.city||filters.state?` em ${filters.city||filters.state}`:''} — Faculdade Perto`} description="Resultados educacionais com fonte, data e status de confirmação." path={`/buscar?${params}`}/>
    <div className="search-toolbar"><SearchBar key={`${filters.q}|${filters.city}|${filters.state}`} initialCourse={filters.q} initialCity={filters.city||filters.state}/></div>
    <div className={`search-body ${mode==='map'?'map-mode':''}`}>
      <section className="results-panel" aria-live="polite"><div className="results-meta"><h1>{query.isLoading?'Buscando…':`${pagination?.total||0} registros encontrados`}</h1><small>Censo INEP 2024 · catálogo nacional</small></div>
        <SearchFilters filters={filters} onChange={change} onClear={clearFilters}/>
        {query.isLoading&&<><div className="skeleton"/><div className="skeleton"/></>}
        {query.isError&&<div className="error-state"><AlertCircle/><h2>Não foi possível carregar os resultados</h2><p>{query.error.message} {query.error.payload?.error?.hint}</p><button className="secondary-button" onClick={()=>query.refetch()}>Tentar novamente</button></div>}
        {!query.isLoading&&!query.isError&&!items.length&&<div className="empty-state"><AlertCircle/><h2>{query.data?.empty?.message||'Nenhum resultado encontrado'}</h2><p>{query.data?.empty?.hint}</p></div>}
        {items.map((item)=><ResultCard key={item.id} item={item} active={active===item.id} onHover={setActive}/>)}
        {pagination?.totalPages>1&&<nav className="pagination" aria-label="Paginação"><button className="secondary-button" disabled={pagination.page<=1} onClick={()=>change('page',String(pagination.page-1))}>Anterior</button><span>Página {pagination.page} de {pagination.totalPages}</span><button className="secondary-button" disabled={pagination.page>=pagination.totalPages} onClick={()=>change('page',String(pagination.page+1))}>Próxima</button></nav>}
      </section>
      <ResultsMap items={items} active={active} onActive={setActive} radiusKm={radius} setRadiusKm={setRadius} userLocation={userLocation} onUserLocation={setUserLocation}/>
      <div className="mobile-toggle"><button className={mode==='list'?'active':''} onClick={()=>showMode('list')}><List size={17}/> Lista</button><button className={mode==='map'?'active':''} onClick={()=>showMode('map')}><Map size={17}/> Mapa</button></div>
    </div>
  </div>;
}
