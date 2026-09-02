import { useState } from 'react';
import { Calculator,Search,ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs.jsx';
import { Seo } from '../components/Seo.jsx';
import { api } from '../services/api.js';
import {classifyCutoff,describeRound} from '../lib/cutoffPossibility.js';
import './EnemPage.css';
const areas=[['languages','Linguagens'],['humanities','Ciências humanas'],['naturalSciences','Ciências da natureza'],['mathematics','Matemática'],['essay','Redação']];
const number=value=>Number(value.replace(',','.'));
export function EnemPage(){
  const [scores,setScores]=useState(Object.fromEntries(areas.map(([k])=>[k,''])));
  const [weights,setWeights]=useState(Object.fromEntries(areas.map(([k])=>[k,'1'])));
  const [weighted,setWeighted]=useState(false),[trainee,setTrainee]=useState(false),[result,setResult]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [goal,setGoal]=useState({course:'',city:'',state:'',competitionModality:''}),[possibilities,setPossibilities]=useState(null),[possibilityError,setPossibilityError]=useState(''),[checking,setChecking]=useState(false);
  function updateScore(key,value){setScores({...scores,[key]:value});setResult(null);setPossibilities(null);}
  async function submit(e){
    e.preventDefault();setError('');setResult(null);
    const parsed=Object.fromEntries(areas.map(([key])=>[key,number(scores[key])]));
    if(areas.some(([key])=>!scores[key].trim()||!Number.isFinite(parsed[key])||parsed[key]<0||parsed[key]>1000)){setError('Informe as cinco notas entre 0 e 1000.');return;}
    if(!Number.isInteger(parsed.essay)){setError('Informe a redação em pontos inteiros, por exemplo 800.');return;}
    setBusy(true);
    try{setResult((await api('/enem/score',{method:'POST',body:JSON.stringify({scores:parsed,trainee,...(weighted?{weights:Object.fromEntries(areas.map(([key])=>[key,number(weights[key])]))}:{})})})).data);}
    catch(e){setError(e.payload?.error?.message||e.message);}
    finally{setBusy(false);}
  }
  async function checkPossibilities(e){
    e.preventDefault();setPossibilityError('');setPossibilities(null);
    if(!goal.course.trim()){setPossibilityError('Informe o curso que você deseja pesquisar.');return;}
    setChecking(true);
    try{
      const params=new URLSearchParams({q:goal.course.trim(),score:String(result.score),limit:'20'});
      if(goal.city.trim())params.set('city',goal.city.trim());if(goal.state)params.set('state',goal.state);if(goal.competitionModality.trim())params.set('competitionModality',goal.competitionModality.trim());
      setPossibilities(await api(`/cutoffs?${params}`));
    }catch(e){setPossibilityError(e.payload?.error?.message||e.message);}
    finally{setChecking(false);}
  }
  return <><Seo title="Calculadora de nota do Enem | Faculdade Perto" description="Média simples ou ponderada com as notas do seu boletim." path="/enem"/>
    <header className="page-header"><Breadcrumbs items={[{label:'Calculadora Enem'}]}/><p className="eyebrow"><Calculator size={16}/> Planeje seu próximo passo</p><h1>Sua nota, com clareza.</h1><p>Copie as cinco notas do boletim. Notas objetivas podem ter decimais; redação é preenchida em pontos inteiros.</p></header>
    <section className="section enem-section"><form className="form-card enem-card" onSubmit={submit}>
      <header><h2>Notas do seu boletim</h2><p>De 0 a 1000 pontos · os exemplos abaixo não preenchem suas notas.</p></header>
      {error&&<div className="form-error" role="alert">{error}</div>}
      <div className="enem-score-grid">{areas.map(([key,label],index)=><div className={'enem-score-field '+(key==='essay'?'essay-field':'')} key={key}>
        <label htmlFor={'score-'+key}><span className="area-number">{String(index+1).padStart(2,'0')}</span>{label}</label>
        <div className="score-input-wrap"><input id={'score-'+key} required type="text" inputMode={key==='essay'?'numeric':'decimal'} pattern={key==='essay'?'[0-9]{1,4}':'[0-9]{1,4}([.,][0-9]{1,2})?'} maxLength={7} placeholder={key==='essay'?'Ex.: 800':'Ex.: 650,5'} value={scores[key]} onChange={e=>updateScore(key,e.target.value)}/><span>pontos</span></div>
        <small>{key==='essay'?'Sem casas decimais.':'Use a nota exata, sem arredondar.'}</small>
        {weighted&&<label className="enem-weight">Peso de {label}<input required aria-label={'Peso de '+label} type="number" min="0.01" step="any" value={weights[key]} onChange={e=>{setWeights({...weights,[key]:e.target.value});setResult(null);}}/></label>}
      </div>)}</div>
      <div className="enem-options"><label><input type="checkbox" checked={weighted} onChange={e=>{setWeighted(e.target.checked);setResult(null);}}/><span><strong>Usar pesos do processo seletivo</strong><small>Ative somente se o edital definir pesos diferentes.</small></span></label><label><input type="checkbox" checked={trainee} onChange={e=>{setTrainee(e.target.checked);setResult(null);}}/><span>Fiz o Enem como treineiro</span></label></div>
      <button className="primary-button" type="submit" disabled={busy}><Calculator size={18}/>{busy?'Calculando…':'Calcular minha média'}</button>
      {result&&<div className="score-output" role="status"><span>Média {result.method}</span><div className="score-number">{result.score.toLocaleString('pt-BR',{maximumFractionDigits:2})}</div><p>{result.disclaimer}</p>{result.traineeWarning&&<div className="notice">{result.traineeWarning}</div>}</div>}
    </form>
    {result&&<section className="enem-opportunities" aria-labelledby="opportunities-title">
      <div className="opportunities-intro"><span><Search size={18}/> Próximo passo</span><h2 id="opportunities-title">Veja onde sua nota esteve competitiva</h2><p>Comparamos sua média somente com notas históricas oficiais já importadas. Isso mostra cenários passados, não calcula uma probabilidade e não garante aprovação.</p></div>
      <form className="opportunities-form" onSubmit={checkPossibilities}>
        <label><span>Curso desejado</span><input required value={goal.course} onChange={e=>setGoal({...goal,course:e.target.value})} placeholder="Ex.: Medicina"/></label>
        <label><span>Cidade (opcional)</span><input value={goal.city} onChange={e=>setGoal({...goal,city:e.target.value})} placeholder="Ex.: Campinas"/></label>
        <label><span>Estado (opcional)</span><select value={goal.state} onChange={e=>setGoal({...goal,state:e.target.value})}><option value="">Todo o Brasil</option>{['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(state=><option key={state}>{state}</option>)}</select></label>
        <label><span>Modalidade de concorrência (opcional)</span><input value={goal.competitionModality} onChange={e=>setGoal({...goal,competitionModality:e.target.value})} placeholder="Ex.: ampla concorrência"/></label>
        <button className="primary-button" disabled={checking} type="submit"><Search size={17}/>{checking?'Consultando histórico…':'Consultar histórico oficial'}</button>
      </form>
      {possibilityError&&<div className="form-error" role="alert">{possibilityError}</div>}
      {possibilities?.empty&&<div className="opportunities-empty" role="status"><ShieldCheck size={24}/><div><strong>{possibilities.empty.message}</strong><p>{possibilities.empty.hint}</p><a href="https://sisu.mec.gov.br/selecionados/" target="_blank" rel="noreferrer">Consultar o portal oficial do SiSU</a></div></div>}
      {possibilities?.data?.length>0&&<div className="opportunity-results" aria-live="polite">{possibilities.data.map(item=>{const band=classifyCutoff(result.score,item.score);return <article className={`opportunity-card ${band.key}`} key={item.id}><div><span className="opportunity-band">{band.label}</span><h3>{item.canonical_name}</h3><p>{item.institution_name}{item.acronym?` (${item.acronym})`:''}</p><small>{[item.campus_name,item.municipality_name,item.state_abbreviation].filter(Boolean).join(' · ')||'Local não informado'}</small></div><dl><div><dt>Sua média</dt><dd>{result.score.toLocaleString('pt-BR',{maximumFractionDigits:2})}</dd></div><div><dt>Corte histórico</dt><dd>{Number(item.score).toLocaleString('pt-BR',{maximumFractionDigits:2})}</dd></div><div><dt>Diferença</dt><dd>{band.difference>0?'+':''}{band.difference.toLocaleString('pt-BR',{maximumFractionDigits:2})}</dd></div></dl><p>{band.description}</p><footer><span>{item.year} · {describeRound(item.round)} · {item.competition_modality}</span>{item.source_url&&<a href={item.source_url} target="_blank" rel="noreferrer">Ver fonte oficial</a>}</footer></article>})}<div className="opportunity-method"><ShieldCheck size={18}/><p>{possibilities.methodology.message} {possibilities.methodology.rounds}</p></div></div>}
    </section>}
    </section></>;
}
