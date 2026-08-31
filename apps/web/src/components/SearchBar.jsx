import { Search,MapPin } from 'lucide-react';
import { useEffect,useId,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildSearchParams } from '../lib/searchParams.js';
import { api } from '../services/api.js';
import './SearchBar.css';
export function SearchBar({initialCourse='',initialCity='',large=false}){
  const [course,setCourse]=useState(initialCourse),[city,setCity]=useState(initialCity);
  const [suggestions,setSuggestions]=useState([]),[open,setOpen]=useState(false),[highlight,setHighlight]=useState(-1),[loading,setLoading]=useState(false);
  const listId=useId();const navigate=useNavigate();
  useEffect(()=>{
    const controller=new AbortController();setSuggestions([]);setHighlight(-1);
    if(!open||course.trim().length<2){setLoading(false);return ()=>controller.abort();}
    setLoading(true);
    const timer=setTimeout(async()=>{
      try{const result=await api('/institutions?limit=8&q='+encodeURIComponent(course.trim()),{signal:controller.signal});
        if(!controller.signal.aborted)setSuggestions(result.data||[]);
      }catch{if(!controller.signal.aborted)setSuggestions([]);}
      finally{if(!controller.signal.aborted)setLoading(false);}
    },300);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[course,open]);
  function select(item){setCourse(item.name.value);setOpen(false);setHighlight(-1);}
  function submit(e){e.preventDefault();setOpen(false);navigate('/buscar?'+buildSearchParams(course,city));}
  function keys(e){
    if(e.key==='Escape'){setOpen(false);return;}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);setHighlight(n=>Math.max(0,Math.min(suggestions.length-1,n+(e.key==='ArrowDown'?1:-1))));}
    if(e.key==='Enter'&&open&&highlight>=0&&suggestions[highlight]){e.preventDefault();select(suggestions[highlight]);}
  }
  return <form className={'search-bar '+(large?'large':'')} onSubmit={submit} aria-label="Buscar cursos e faculdades">
    <div className="institution-autocomplete" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}>
      <label htmlFor={listId+'-input'}>Curso ou faculdade</label>
      <div className="autocomplete-input"><Search/><input id={listId+'-input'} role="combobox" aria-autocomplete="list" aria-expanded={open&&course.trim().length>=2} aria-controls={listId} aria-activedescendant={open&&highlight>=0?listId+'-'+highlight:undefined} autoComplete="off" value={course} onFocus={()=>setOpen(true)} onKeyDown={keys} onChange={e=>{setCourse(e.target.value);setOpen(true);}} placeholder="Ex.: Medicina, USP, FEA"/></div>
      {open&&course.trim().length>=2&&<div className="institution-suggestions">
        <small role="status">{loading?'Buscando instituições…':suggestions.length?'Instituições da base nacional':'Nenhuma sugestão. Você pode buscar o texto digitado.'}</small>
        <ul role="listbox" id={listId} aria-label="Sugestões de faculdades">
          {suggestions.map((item,index)=><li role="option" aria-selected={highlight===index} id={listId+'-'+index} key={item.id} onMouseDown={e=>e.preventDefault()} onClick={()=>select(item)}><strong>{item.name.value}</strong><span>{item.acronym?.value} · {item.headquarters?.value?.city}, {item.headquarters?.value?.state}</span></li>)}
        </ul>
      </div>}
    </div>
    <label><span>Cidade ou UF</span><div><MapPin/><input value={city} onChange={e=>setCity(e.target.value)} placeholder="Ex.: Campinas ou SP"/></div></label>
    <button className="primary-button" type="submit">Buscar agora</button>
  </form>;
}
