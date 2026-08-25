import { Search,MapPin } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildSearchParams } from '../lib/searchParams.js';
export function SearchBar({initialCourse='',initialCity='',large=false}){const [course,setCourse]=useState(initialCourse);const [city,setCity]=useState(initialCity);const navigate=useNavigate();function submit(e){e.preventDefault();navigate(`/buscar?${buildSearchParams(course,city)}`)}return <form className={`search-bar ${large?'large':''}`} onSubmit={submit} aria-label="Buscar cursos e faculdades"><label><span>Curso ou faculdade</span><div><Search/><input value={course} onChange={(e)=>setCourse(e.target.value)} placeholder="Ex.: Medicina"/></div></label><label><span>Cidade ou UF</span><div><MapPin/><input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="Ex.: Campinas ou SP"/></div></label><button className="primary-button" type="submit">Buscar agora</button></form>}
