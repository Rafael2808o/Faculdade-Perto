import {BookOpenCheck,Building2,Clock,MapPin,ShieldCheck} from 'lucide-react';
import {useQuery} from '@tanstack/react-query';
import {Link,useParams} from 'react-router-dom';
import {Breadcrumbs} from '../components/Breadcrumbs.jsx';
import {Seo} from '../components/Seo.jsx';
import {api} from '../services/api.js';

export function OfferingPage(){
  const {id}=useParams();
  const query=useQuery({queryKey:['verified-offering',id],queryFn:()=>api(`/offerings/${id}`)});
  if(query.isLoading)return <div className="page-header"><div className="skeleton"/></div>;
  if(query.isError)return <div className="page-header error-state"><h1>Oferta não encontrada</h1><p>{query.error.message}</p><Link className="primary-button" to="/buscar">Voltar para a busca</Link></div>;
  const item=query.data.data;const address=item.campus.address||{};const fullAddress=[address.street,address.number,address.neighborhood,item.location.city,item.location.state,address.postalCode].filter(Boolean).join(', ');const verifiedAt=new Date(item.updatedAt||item.source.importedAt).toLocaleDateString('pt-BR',{timeZone:'UTC'});
  return <><Seo title={`${item.course.name} em ${item.location.city} | Faculdade Perto`} description={`Oferta verificada de ${item.course.name} em ${item.institution.name}, com campus, modalidade e fonte oficial.`} path={`/ofertas-verificadas/${id}`}/>
    <header className="page-header"><Breadcrumbs items={[{label:item.location.state,to:`/buscar?state=${item.location.state}`},{label:item.location.city,to:`/buscar?city=${encodeURIComponent(item.location.city)}`},{label:item.course.name}]}/><p className="eyebrow"><ShieldCheck size={16}/> Oferta atual verificada</p><h1>{item.course.name}</h1><p>{item.institution.name}{item.institution.acronym?` (${item.institution.acronym})`:''}</p></header>
    <div className="detail-grid"><section className="detail-main"><article className="info-card"><h2>Curso e unidade</h2><dl className="fact-list"><div><dt>Grau</dt><dd><BookOpenCheck size={15}/>{item.course.degree}</dd></div><div><dt>Modalidade</dt><dd>{item.course.modality}</dd></div><div><dt>Turno</dt><dd><Clock size={15}/>{item.course.shift||'Não informado'}</dd></div><div><dt>Instituição</dt><dd><Building2 size={15}/>{item.institution.name}</dd></div><div><dt>Unidade</dt><dd>{item.campus.name}</dd></div><div><dt>Endereço confirmado</dt><dd><MapPin size={15}/>{fullAddress}</dd></div></dl></article><div className="notice"><ShieldCheck size={18}/> O endereço e a oferta foram vinculados a uma página oficial da instituição. Como a fonte não publica coordenadas verificáveis, esta unidade não recebe um marcador de campus exato no mapa.</div></section>
    <aside className="detail-aside"><article className="info-card"><h2>Fonte e atualização</h2><p><strong>{item.source.name}</strong></p><p>Referência: {item.source.referencePeriod}</p><p>Verificado em {verifiedAt}</p><a href={item.source.url} target="_blank" rel="noreferrer">Abrir fonte oficial</a></article><Link className="secondary-button" to={`/corrigir?entityType=offering&entityId=${item.id}`}>Encontrou um erro?</Link></aside></div>
  </>;
}
