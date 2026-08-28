import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Bookmark,CheckCircle2,Circle,LockKeyhole,Trash2} from 'lucide-react';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Breadcrumbs} from '../components/Breadcrumbs.jsx';
import {Seo} from '../components/Seo.jsx';
import {getToken} from '../lib/auth.js';
import {checklistProgress,decisionChecklist,readDecisionChecklist,writeDecisionChecklist} from '../lib/decisionPlan.js';
import {api} from '../services/api.js';

export function PlanPage(){
  const client=useQueryClient();
  const logged=Boolean(getToken());
  const [checks,setChecks]=useState(readDecisionChecklist);
  const progress=checklistProgress(checks);
  const query=useQuery({queryKey:['plan'],queryFn:()=>api('/me/plan'),enabled:logged});
  async function remove(id){await api(`/me/plan/${id}`,{method:'DELETE'});client.invalidateQueries({queryKey:['plan']})}
  function toggle(id){setChecks(current=>{const next={...current,[id]:!current[id]};writeDecisionChecklist(next);return next})}
  return <><Seo title="Meu Plano | Faculdade Perto" description="Organize opções, comparações e próximos passos para escolher onde estudar." path="/meu-plano" noindex/>
    <header className="page-header"><Breadcrumbs items={[{label:'Meu Plano'}]}/><p className="eyebrow"><Bookmark size={16}/> Seu espaço de decisão</p><h1>Meu Plano</h1><p>Reúna opções, acompanhe o que já verificou e transforme pesquisa em próximos passos concretos.</p></header>
    <section className="section compact-section plan-layout">
      <div className="plan-main"><div className="section-heading"><div><p className="eyebrow">Opções salvas</p><h2>Cursos para revisar com calma</h2></div>{logged&&<Link className="secondary-button" to="/buscar">Adicionar opção</Link>}</div>
      {!logged?<div className="empty-state"><LockKeyhole/><h3>Entre para guardar cursos na sua conta.</h3><p>O checklist abaixo já funciona e fica somente neste aparelho. Ao entrar, suas opções salvas aparecem aqui.</p><Link className="primary-button" to="/entrar?voltar=/meu-plano">Entrar ou criar conta</Link></div>:query.isLoading?<div className="loading-state">Carregando seu plano…</div>:query.isError?<div className="error-state"><h3>Não foi possível abrir o plano.</h3><p>{query.error.message}</p><Link className="secondary-button" to="/entrar?voltar=/meu-plano">Entrar novamente</Link></div>:query.data.data.length===0?<div className="empty-state"><h3>Seu plano ainda está vazio.</h3><p>Abra um curso e escolha “Salvar no Meu Plano”.</p><Link className="primary-button" to="/buscar">Buscar cursos</Link></div>:<div className="saved-grid">{query.data.data.map(item=><article className="saved-card" key={item.plan_item_id}><div><span>{item.degree||'Grau não confirmado'} · {item.modality||'Modalidade não confirmada'}</span><h3><Link to={`/ofertas/${item.id}`}>{item.canonical_name||item.original_name}</Link></h3><p>{item.institution_name}</p><small>{item.municipality_name}, {item.state_abbreviation}</small>{item.notes&&<p className="plan-note">“{item.notes}”</p>}</div><button className="icon-button" onClick={()=>remove(item.plan_item_id)} aria-label={`Remover ${item.canonical_name} do plano`}><Trash2 size={18}/></button></article>)}</div>}</div>
      <aside className="decision-checklist"><div className="checklist-heading"><div><p className="eyebrow">Jornada de decisão</p><h2>Próximos passos</h2></div><strong>{progress.completed}/{progress.total}</strong></div><div className="checklist-progress" aria-label={`${progress.percentage}% concluído`}><span style={{width:`${progress.percentage}%`}}/></div><p>Marque o que você realmente conferiu. As etapas ficam salvas somente neste aparelho.</p><ul>{decisionChecklist.map(item=><li key={item.id}><button type="button" aria-pressed={Boolean(checks[item.id])} onClick={()=>toggle(item.id)}>{checks[item.id]?<CheckCircle2/>:<Circle/>}<span>{item.label}</span></button>{item.to&&!checks[item.id]&&<Link to={item.to}>Fazer agora</Link>}</li>)}</ul><p className="notice">Os dados do Censo ajudam a descobrir caminhos, mas a decisão final deve ser confirmada com a instituição e nos canais oficiais.</p></aside>
    </section></>;
}
