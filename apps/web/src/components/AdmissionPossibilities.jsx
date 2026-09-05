import { useEffect, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { api } from '../services/api.js';
import { classifyCutoff } from '../lib/cutoffPossibility.js';

const format=value=>Number(value).toLocaleString('pt-BR',{maximumFractionDigits:2});
const competitionLabels={AC:'Ampla concorrência',LI_EP:'LI_EP · escola pública',LI_PCD:'LI_PCD · pessoa com deficiência',LI_Q:'LI_Q · quilombola',LI_PPI:'LI_PPI · pretos, pardos e indígenas',LB_EP:'LB_EP · escola pública e renda',LB_PCD:'LB_PCD · deficiência e renda',LB_Q:'LB_Q · quilombola e renda',LB_PPI:'LB_PPI · pretos, pardos, indígenas e renda'};

export function AdmissionPossibilities({scores,trainee}) {
  const [goal,setGoal]=useState({q:'',city:'',state:'',competitionModality:'AC',year:'',round:'',shift:''});
  const [response,setResponse]=useState(null),[coverage,setCoverage]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState([]),[submitted,setSubmitted]=useState(null);
  useEffect(()=>{let active=true;api('/admission-history?limit=1').then(result=>{if(active)setCoverage(result.coverage);}).catch(()=>{});return()=>{active=false;};},[]);
  async function search(page=1,filters=goal) {
    setBusy(true);setError('');
    try {
      const body=Object.fromEntries(Object.entries(filters).filter(([,value])=>value!==''));
      const result=await api('/enem/possibilities',{method:'POST',body:JSON.stringify({...body,page,limit:12,scores,trainee})});
      setResponse(result);setCoverage(result.coverage);setSubmitted({...filters});
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  const field=(name,value)=>setGoal(current=>({...current,[name]:value}));
  const choose=item=>setSelected(current=>current.some(value=>value.id===item.id)?current.filter(value=>value.id!==item.id):current.length<4?[...current,item]:current);
  return <section className="enem-opportunities" aria-labelledby="opportunities-title">
    <div className="opportunities-intro"><span><Search size={18}/> Próximo passo</span><h2 id="opportunities-title">Onde sua nota esteve competitiva?</h2><p>Compare suas cinco notas com os pesos oficiais de cada curso. O resultado é histórico e educacional: não prevê aprovação nem valida sua elegibilidade às cotas.</p></div>
    {coverage&&<div className="history-coverage"><strong>Históricos disponíveis</strong><p>{coverage.institutions.length?coverage.institutions.map(item=>`${item.acronym||item.name} ${item.year}: ${item.courses} códigos, ${item.courseShifts} combinações de curso/turno, ${item.rounds} etapas e ${item.scenarios.toLocaleString('pt-BR')} cenários`).join(' · '):'Ainda não há relatórios oficiais importados.'}</p><small>{coverage.message}</small></div>}
    <form className="opportunities-form" onSubmit={event=>{event.preventDefault();setSelected([]);search();}}>
      <label><span>Curso ou instituição</span><input required value={goal.q} onChange={event=>field('q',event.target.value)} placeholder="Ex.: Medicina ou UFMG"/></label>
      <label><span>Cidade (opcional)</span><input value={goal.city} onChange={event=>field('city',event.target.value)} placeholder="Ex.: Belo Horizonte"/></label>
      <label><span>Estado</span><select value={goal.state} onChange={event=>field('state',event.target.value)}><option value="">Todos os estados com histórico</option>{['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(value=><option key={value}>{value}</option>)}</select></label>
      <label><span>Modalidade de concorrência</span><select value={goal.competitionModality} onChange={event=>field('competitionModality',event.target.value)}><option value="">Ver modalidades separadamente</option>{Object.entries(competitionLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Etapa do relatório</span><select value={goal.round} onChange={event=>field('round',event.target.value)}><option value="">Regular e todas as chamadas disponíveis</option><option>Chamada regular</option>{Array.from({length:13},(_,index)=><option key={index+1}>{`Após a ${index+1}ª chamada da lista de espera`}</option>)}</select></label>
      <label><span>Turno</span><select value={goal.shift} onChange={event=>field('shift',event.target.value)}><option value="">Todos os turnos</option>{['matutino','vespertino','noturno','integral'].map(value=><option key={value} value={value}>{value}</option>)}</select></label>
      <p className="history-filter-note">As siglas e critérios de reserva de vagas dependem do edital da edição. Nenhuma informação de renda, raça ou deficiência é solicitada ou salva aqui.</p>
      <button className="primary-button" disabled={busy} type="submit"><Search size={17}/>{busy?'Consultando histórico…':'Comparar com o histórico oficial'}</button>
    </form>
    {error&&<div className="form-error" role="alert">{error}</div>}
    {response?.empty&&<div className="opportunities-empty" role="status"><ShieldCheck size={24}/><div><strong>{response.empty.message}</strong><p>{response.empty.hint}</p><a href="https://sisu.mec.gov.br/" target="_blank" rel="noreferrer">Consultar o portal oficial do SiSU</a></div></div>}
    {response?.data?.length>0&&<div className="opportunity-results" aria-live="polite">
      <p>{response.pagination.total} cenários encontrados · página {response.pagination.page} de {response.pagination.totalPages}</p>
      {response.data.map(item=>{
        const comparison=item.comparison;
        const band=comparison?.comparable?classifyCutoff(comparison.score,item.score):{key:'insufficient',label:'Comparação indisponível',description:comparison?.reason};
        const checked=selected.some(value=>value.id===item.id);
        return <article className={`opportunity-card ${band.key}`} key={item.id}>
          <div><span className="opportunity-band">{band.label}</span><h3>{item.canonical_name}</h3><p>{item.institution_name} · {item.shift}</p><small>{[item.campus_name,item.municipality_name,item.state_abbreviation].filter(Boolean).join(' · ')}</small></div>
          <dl><div><dt>Sua nota com os pesos oficiais</dt><dd>{comparison?.comparable?format(comparison.score):'Não comparada'}</dd></div><div><dt>Faixa histórica publicada</dt><dd>{format(item.score)}{item.maximum_score!==null?` – ${format(item.maximum_score)}`:''}</dd></div><div><dt>Diferença para o mínimo</dt><dd>{comparison?.comparable?`${comparison.difference>0?'+':''}${format(comparison.difference)}`:'—'}</dd></div></dl>
          <p>{band.description}</p><p className="history-round"><strong>{item.year} · {item.round}</strong><br/>{item.competition_modality}{item.round_kind==='waiting_snapshot'&&<><br/>Mínimo acumulado após essa convocação; não é a nota exclusiva dos convocados nessa chamada.</>}</p>
          <details><summary>Pesos, fonte e limites da comparação</summary><p>Pesos: Linguagens {item.weights?.languages}; Humanas {item.weights?.humanities}; Natureza {item.weights?.naturalSciences}; Matemática {item.weights?.mathematics}; Redação {item.weights?.essay}.</p><p>O curso, a cidade e os pesos foram cruzados com o termo de adesão da mesma edição. A nota mínima não comprova matrícula, aprovação documental ou posição em desempates.</p>{item.weights_source_url&&<a href={item.weights_source_url} target="_blank" rel="noreferrer">Termo oficial com pesos e vagas</a>}</details>
          <footer><a href={item.source_url} target="_blank" rel="noreferrer">Relatório oficial · página {item.source_page}</a><label><input type="checkbox" checked={checked} disabled={!checked&&selected.length>=4} onChange={()=>choose(item)}/> Comparar cenário</label></footer>
        </article>;
      })}
      <nav className="history-pagination" aria-label="Páginas de cenários"><button className="secondary-button" disabled={busy||response.pagination.page<=1} onClick={()=>search(response.pagination.page-1,submitted)}>Anterior</button><button className="secondary-button" disabled={busy||response.pagination.page>=response.pagination.totalPages} onClick={()=>search(response.pagination.page+1,submitted)}>Próxima</button></nav>
      <div className="opportunity-method"><ShieldCheck size={18}/><p>{response.methodology.message} {response.methodology.rounds}</p></div>
    </div>}
    {selected.length>0&&<section className="history-comparison"><h3>Seus cenários lado a lado ({selected.length}/4)</h3><div className="history-table-wrap" tabIndex={0} role="region" aria-label="Tabela comparativa de cenários"><table><thead><tr><th>Cenário</th><th>Sua nota</th><th>Mínimo</th><th>Diferença</th></tr></thead><tbody>{selected.map(item=><tr key={item.id}><th scope="row">{item.canonical_name} · {item.shift}<small>{item.year} · {item.round} · {item.competition_modality}</small></th><td>{item.comparison?.comparable?format(item.comparison.score):'—'}</td><td>{format(item.score)}</td><td>{item.comparison?.comparable?format(item.comparison.difference):'—'}</td></tr>)}</tbody></table></div><p>Compare a mesma modalidade e considere o turno. Estar acima de um mínimo passado não garante uma vaga futura.</p></section>}
  </section>;
}
