import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs.jsx';
import { Seo } from '../components/Seo.jsx';
import { api } from '../services/api.js';
import {AdmissionPossibilities} from '../components/AdmissionPossibilities.jsx';
import './EnemPage.css';
const areas=[['languages','Linguagens'],['humanities','Ciências humanas'],['naturalSciences','Ciências da natureza'],['mathematics','Matemática'],['essay','Redação']];
const number=value=>Number(value.replace(',','.'));
export function EnemPage(){
  const [scores,setScores]=useState(Object.fromEntries(areas.map(([k])=>[k,''])));
  const [weights,setWeights]=useState(Object.fromEntries(areas.map(([k])=>[k,'1'])));
  const [weighted,setWeighted]=useState(false),[trainee,setTrainee]=useState(false),[result,setResult]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  function updateScore(key,value){setScores({...scores,[key]:value});setResult(null);}
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
    {result&&<AdmissionPossibilities scores={Object.fromEntries(areas.map(([key])=>[key,number(scores[key])]))} trainee={trainee}/>}
    </section></>;
}
