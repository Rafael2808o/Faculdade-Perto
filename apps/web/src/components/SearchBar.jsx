import { Search,MapPin } from 'lucide-react';
import { useEffect,useId,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildSearchParams } from '../lib/searchParams.js';
import { api } from '../services/api.js';
import './SearchBar.css';
export function SearchBar({initialCourse='',initialCity='',large=false}){
  const [course,setCourse]=useState(initialCourse),[city,setCity]=useState(initialCity);
  const [suggestions,setSuggestions]=useState([]),[open,setOpen]=useState(false),[highlight,setHighlight]=useState(-1),[loading,setLoading]=useState(false);
  const [citySuggestions,setCitySuggestions]=useState([]),[cityOpen,setCityOpen]=useState(false),[cityHighlight,setCityHighlight]=useState(-1),[cityLoading,setCityLoading]=useState(false);
  const listId=useId(),cityListId=useId();const navigate=useNavigate();
  useEffect(()=>{
    const controller=new AbortController();setSuggestions([]);setHighlight(-1);
    if(!open||course.trim().length<2){setLoading(false);return ()=>controller.abort();}
    setLoading(true);
    const timer=setTimeout(async()=>{
      try{const query=encodeURIComponent(course.trim());
        const courseResult=await api('/courses?limit=8&q='+query,{signal:controller.signal});
        if(!controller.signal.aborted)setSuggestions((courseResult.data||[]).map(item=>({key:`course-${item.id}`,type:'course',label:item.canonical_name,meta:`${item.record_count.toLocaleString('pt-BR')} registros em ${item.institution_count.toLocaleString('pt-BR')} instituições`})));
      }catch{if(!controller.signal.aborted)setSuggestions([]);}
      finally{if(!controller.signal.aborted)setLoading(false);}
    },300);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[course,open]);
  useEffect(()=>{
    const controller=new AbortController();setCitySuggestions([]);setCityHighlight(-1);
    if(!cityOpen||city.trim().length<2||/^[a-z]{2}$/i.test(city.trim())){setCityLoading(false);return ()=>controller.abort();}
    setCityLoading(true);
    const timer=setTimeout(async()=>{
      try{
        const result=await api('/municipalities?limit=6&q='+encodeURIComponent(city.trim()),{signal:controller.signal});
        if(!controller.signal.aborted)setCitySuggestions(result.data||[]);
      }catch{if(!controller.signal.aborted)setCitySuggestions([]);}
      finally{if(!controller.signal.aborted)setCityLoading(false);}
    },250);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[city,cityOpen]);
  function select(item){setCourse(item.label);setOpen(false);setHighlight(-1);}
  function selectCity(item){setCity(`${item.name}, ${item.state}`);setCityOpen(false);setCityHighlight(-1);}
  function submit(e){e.preventDefault();setOpen(false);navigate('/buscar?'+buildSearchParams(course,city));}
  function keys(e){
    if(e.key==='Escape'){setOpen(false);return;}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);setHighlight(n=>Math.max(0,Math.min(suggestions.length-1,n+(e.key==='ArrowDown'?1:-1))));}
    if(e.key==='Enter'&&open&&highlight>=0&&suggestions[highlight]){e.preventDefault();select(suggestions[highlight]);}
  }
  function cityKeys(e){
    if(e.key==='Escape'){setCityOpen(false);return;}
    if((e.key==='ArrowDown'||e.key==='ArrowUp')&&citySuggestions.length){e.preventDefault();setCityOpen(true);setCityHighlight(n=>Math.max(0,Math.min(citySuggestions.length-1,n+(e.key==='ArrowDown'?1:-1))));}
    if(e.key==='Enter'&&cityOpen&&cityHighlight>=0&&citySuggestions[cityHighlight]){e.preventDefault();selectCity(citySuggestions[cityHighlight]);}
  }
  return <form className={'search-bar '+(large?'large':'')} onSubmit={submit} aria-label="Buscar cursos e faculdades">
    <div className="institution-autocomplete" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}>
      <label htmlFor={listId+'-input'}>Curso ou faculdade</label>
      <div className="autocomplete-input"><Search/><input id={listId+'-input'} role="combobox" aria-autocomplete="list" aria-expanded={open&&course.trim().length>=2} aria-controls={listId} aria-activedescendant={open&&highlight>=0?listId+'-'+highlight:undefined} autoComplete="off" value={course} onFocus={()=>setOpen(true)} onKeyDown={keys} onChange={e=>{setCourse(e.target.value);setOpen(true);}} placeholder="Ex.: Engenharia da Computação, Medicina"/></div>
      {open&&course.trim().length>=2&&<div className="institution-suggestions">
        <small role="status">{loading?'Buscando cursos…':suggestions.length?'Cursos da base nacional':'Nenhum curso próximo. Tente outro termo ou busque o texto digitado.'}</small>
        <ul role="listbox" id={listId} aria-label="Sugestões de cursos">
          {suggestions.map((item,index)=><li role="option" aria-selected={highlight===index} id={listId+'-'+index} key={item.key} onMouseDown={e=>e.preventDefault()} onClick={()=>select(item)}><small>Curso</small><strong>{item.label}</strong><span>{item.meta}</span></li>)}
        </ul>
      </div>}
    </div>
    <div className="city-autocomplete" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setCityOpen(false);}}>
      <label htmlFor={cityListId+'-input'}>Cidade ou UF</label>
      <div className="autocomplete-input"><MapPin/><input id={cityListId+'-input'} role="combobox" aria-autocomplete="list" aria-expanded={cityOpen&&city.trim().length>=2&&!/^[a-z]{2}$/i.test(city.trim())} aria-controls={cityListId} aria-activedescendant={cityOpen&&cityHighlight>=0?cityListId+'-'+cityHighlight:undefined} autoComplete="off" value={city} onFocus={()=>setCityOpen(true)} onKeyDown={cityKeys} onChange={e=>{setCity(e.target.value);setCityOpen(true);}} placeholder="Ex.: Campinas ou SP"/></div>
      {cityOpen&&city.trim().length>=2&&!/^[a-z]{2}$/i.test(city.trim())&&<div className="institution-suggestions city-suggestions">
        <small role="status">{cityLoading?'Buscando cidades…':citySuggestions.length?'Sugestões da base nacional':'Nenhuma cidade encontrada. Você pode buscar o texto digitado.'}</small>
        <ul role="listbox" id={cityListId} aria-label="Sugestões de cidades">
          {citySuggestions.map((item,index)=><li role="option" aria-selected={cityHighlight===index} id={cityListId+'-'+index} key={`${item.slug}-${item.state}`} onMouseDown={e=>e.preventDefault()} onClick={()=>selectCity(item)}><small>Cidade</small><strong>{item.name} — {item.state}</strong><span>{item.recordCount.toLocaleString('pt-BR')} registros no Censo 2024</span></li>)}
        </ul>
      </div>}
    </div>
    <button className="primary-button" type="submit">Buscar agora</button>
  </form>;
}
