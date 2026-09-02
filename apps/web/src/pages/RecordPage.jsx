import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link,useNavigate,useParams } from 'react-router-dom';
import { AlertTriangle,BookOpen,Bookmark,Columns3,MapPin } from 'lucide-react';
import { api } from '../services/api.js';
import { clearSession, hasSession } from '../lib/auth.js';
import { readCompare,writeCompare } from './ComparePage.jsx';
import { Seo } from '../components/Seo.jsx';
import { Breadcrumbs } from '../components/Breadcrumbs.jsx';
import { DataBadge } from '../components/DataBadge.jsx';

const fieldWords={NU:'Número',NO:'Nome',CO:'Código',SG:'Sigla',TP:'Tipo',IN:'Indicador',QT:'Quantidade',DS:'Descrição',ANO:'ano',CENSO:'Censo',REGIAO:'região',UF:'UF',MUNICIPIO:'município',CAPITAL:'capital',IES:'IES',CURSO:'curso',CINE:'CINE Brasil',GRAU:'grau',ACADEMICO:'acadêmico',MODALIDADE:'modalidade',ENSINO:'ensino',GRATUITO:'gratuito',VAGAS:'vagas',VG:'vagas',MAT:'matrículas',CONC:'concluintes',ING:'ingressantes',INSCRITO:'inscritos',TOTAL:'total',FEM:'mulheres',MASC:'homens',PUBLICA:'pública',PRIVADA:'privada'};
const fieldLabel=(key)=>key.split('_').map((part)=>fieldWords[part]||part.toLowerCase()).join(' ').replace(/^./,(letter)=>letter.toUpperCase());
const fieldValue=(value)=>value===''||value===null||value===undefined?'Não informado':value==='(.)'?'Não se aplica / não informado':String(value);

export function RecordPage(){
  const {id}=useParams();const navigate=useNavigate();const [feedback,setFeedback]=useState('');
  const query=useQuery({queryKey:['record',id],queryFn:()=>api(`/catalog-records/${id}`)});
  if(query.isLoading)return <div className="page-header"><div className="skeleton"/></div>;
  if(query.isError)return <><Seo title="Registro não encontrado | Faculdade Perto" description="O registro de curso solicitado não foi encontrado." path={`/ofertas/${id}`} noindex/><div className="page-header error-state"><h1>Registro não encontrado</h1><p>{query.error.message}</p><Link to="/buscar" className="primary-button">Voltar para a busca</Link></div></>;
  const item=query.data.data;const rawFields=Object.entries(item.rawCensusData||{}).sort(([a],[b])=>a.localeCompare(b));
  const place=item.location.city?`${item.location.city}, ${item.location.state}`:'abrangência nacional';
  const title=`${item.course.name} em ${place} — ${item.institution.name}`;
  const ld={'@context':'https://schema.org','@type':'Course',name:item.course.name,provider:{'@type':'EducationalOrganization',name:item.institution.name},description:item.granularityNotice};
  async function save(){if(!hasSession()){navigate(`/entrar?voltar=${encodeURIComponent(`/ofertas/${id}`)}`);return}try{await api('/me/plan',{method:'POST',body:JSON.stringify({recordId:Number(id)})});setFeedback('Salvo no Meu Plano.')}catch(error){if(error.status===401){clearSession();navigate(`/entrar?voltar=${encodeURIComponent(`/ofertas/${id}`)}`);return}setFeedback(error.message)}}
  function compare(){const ids=readCompare();if(ids.some((value)=>String(value)===String(id))){navigate('/comparar');return}if(ids.length>=4){setFeedback('A comparação já tem quatro cursos. Remova um para continuar.');return}writeCompare([...ids,Number(id)]);setFeedback('Adicionado à comparação.')}
  return <>
    <Seo title={`${title} | Faculdade Perto`} description={`Registro do Censo 2024 para ${item.course.name}, com todos os campos oficiais e suas limitações.`} path={`/ofertas/${id}`} jsonLd={ld}/>
    <header className="page-header"><Breadcrumbs items={[...(item.location.state?[{label:item.location.state,to:`/buscar?state=${item.location.state}`}]:[]),...(item.location.city?[{label:item.location.city,to:`/br/${item.location.state.toLowerCase()}/${item.location.citySlug}`}]:[]),{label:item.institution.name,to:`/instituicoes/${item.institution.slug}`},{label:item.course.name}]}/><p className="eyebrow"><BookOpen size={16}/> Registro agregado do Censo 2024</p><h1>{item.course.name}</h1><p>{item.institution.name} · {place}</p><div className="record-actions"><button className="primary-button" onClick={save}><Bookmark size={17}/>Salvar no Meu Plano</button><button className="secondary-button" onClick={compare}><Columns3 size={17}/>Comparar</button>{feedback&&<span role="status">{feedback}</span>}</div></header>
    <div className="detail-grid"><section className="detail-main"><div className="notice"><AlertTriangle size={18}/> {item.granularityNotice}</div>
      <article className="info-card"><h2>Dados do curso</h2><dl className="fact-list"><div><dt>Grau</dt><dd>{item.degree.value||'Não confirmado'}</dd><DataBadge field={item.degree}/></div><div><dt>Modalidade</dt><dd>{item.modality.value||'Não confirmado'}</dd><DataBadge field={item.modality}/></div><div><dt>Gratuidade</dt><dd>{item.free.value===true?'Gratuito':item.free.value===false?'Não gratuito':'Não confirmado'}</dd><DataBadge field={item.free}/></div><div><dt>Vagas em 2024</dt><dd>{item.censusSeats.value??'Não confirmado'}</dd><DataBadge field={item.censusSeats}/></div><div><dt>Mensalidade</dt><dd>Não confirmado</dd><DataBadge field={item.tuition}/></div><div><dt>Nota de corte</dt><dd>Não confirmado</dd><DataBadge field={item.cutoff}/></div></dl></article>
      <article className="info-card"><h2>Localização</h2><p><MapPin size={16}/> {item.location.city?`O registro foi agregado ao município de ${item.location.city}.`:'Este agregado tem abrangência nacional.'} Não há endereço de campus neste snapshot.</p><div className="notice">{item.location.reason}</div></article>
      {rawFields.length>0&&<article className="info-card"><details><summary><strong>Todos os {rawFields.length} campos oficiais deste registro</strong></summary><p>Valores originais do Censo Superior 2024. A coluna técnica do INEP permanece visível para auditoria.</p><div className="raw-fields-wrap"><table className="raw-fields"><thead><tr><th>Campo</th><th>O que significa</th><th>Valor</th></tr></thead><tbody>{rawFields.map(([key,value])=><tr key={key}><td><code>{key}</code></td><td>{fieldLabel(key)}</td><td>{fieldValue(value)}</td></tr>)}</tbody></table></div></details></article>}
    </section><aside className="detail-aside"><article className="info-card"><h2>Fonte</h2><p><strong>{item.source.name}</strong></p><p>Ano de referência: {item.source.referenceYear}</p><p>Importado em {new Date(item.source.importedAt).toLocaleDateString('pt-BR')}</p><a href={item.source.url} target="_blank" rel="noreferrer">Abrir arquivo original</a></article><Link className="secondary-button" to={`/corrigir?entityType=offering&entityId=${item.id}`}>Encontrou um erro?</Link></aside></div>
  </>;
}
