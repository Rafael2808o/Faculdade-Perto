import {BookOpenCheck,Building2,Clock,MapPin,ShieldCheck} from 'lucide-react';
import {Link} from 'react-router-dom';

export function VerifiedOfferingCard({item}){
  const address=item.campus.address;
  const addressText=address?[address.street,address.number,address.neighborhood].filter(Boolean).join(', '):null;
  return <Link className="result-card verified-offering-card" to={`/ofertas-verificadas/${item.id}`}>
    <div className="card-top"><div><span className="verified-label"><ShieldCheck size={15}/> Oferta atual verificada</span><h2>{item.course.name}</h2><p className="institution-name">{item.institution.name}{item.institution.acronym?` (${item.institution.acronym})`:''}</p></div></div>
    <div className="card-meta"><span><MapPin size={15}/>{item.location.city}, {item.location.state}</span><span><Building2 size={15}/>{item.campus.name}</span><span><BookOpenCheck size={15}/>{item.course.degree} · {item.course.modality}</span>{item.course.shift&&<span><Clock size={15}/>{item.course.shift}</span>}</div>
    {addressText&&<p className="verified-address">{addressText}</p>}
    <footer><span>Fonte: {item.source.name}</span><strong>Ver informações e origem</strong></footer>
  </Link>;
}
