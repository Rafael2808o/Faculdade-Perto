import { Building2,CircleDollarSign,Clock,GraduationCap,MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataBadge } from './DataBadge.jsx';

export function ResultCard({item,active,onHover}){
  const place=item.location.city?`${item.location.city}, ${item.location.state}`:'Abrangência nacional';
  const shifts=[item.shifts?.value?.daytimeSeats>0?'Diurno':null,item.shifts?.value?.nighttimeSeats>0?'Noturno':null].filter(Boolean).join(' e ');
  return <Link to={`/ofertas/${item.id}`} className={`result-card ${active?'active':''}`} onMouseEnter={()=>onHover(item.id)} onFocus={()=>onHover(item.id)}>
    <div className="card-top"><div><h2>{item.course.name}</h2><p className="institution-name">{item.institution.name}</p></div><DataBadge field={item.degree} compact/></div>
    <div className="card-meta"><span><MapPin size={15}/>{place}</span>{Number.isFinite(item.location.distanceKm)&&<span title="Distância em linha reta até o centroide municipal do IBGE"><MapPin size={15}/>{item.location.distanceKm.toFixed(1)} km aprox.</span>}<span><Building2 size={15}/>{item.institution.academicOrganization||(item.institution.network==='publica'?'Pública':'Privada')}</span><span><GraduationCap size={15}/>{item.degree.value||'Grau não confirmado'}</span>{shifts&&<span title="Turno com vagas informado no Censo 2024"><Clock size={15}/>{shifts}</span>}{typeof item.free?.value==='boolean'&&<span><CircleDollarSign size={15}/>{item.free.value?'Gratuito':'Não gratuito'}</span>}</div>
    <div className="card-values"><div className="value-row"><div><span className="value-label">Vagas no Censo 2024</span><span className="value-number">{item.censusSeats.value??'Não confirmado'}</span></div><DataBadge field={item.censusSeats} compact/></div><div className="value-row"><div><span className="value-label">Mensalidade</span><span className="value-number">Não confirmado</span></div><DataBadge field={item.tuition} compact/></div></div>
  </Link>;
}
