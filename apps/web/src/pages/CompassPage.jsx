import {ArrowLeft,ArrowRight,Compass,MapPinned,RefreshCw,ShieldCheck,Sparkles} from 'lucide-react';
import {useMemo,useState} from 'react';
import {useNavigate,useSearchParams} from 'react-router-dom';
import {Seo} from '../components/Seo.jsx';
import {states} from '../data/searchFilterOptions.js';
import {compassSearchParams,defaultCompassProfile,saveCompassProfile} from '../lib/compass.js';

const steps=['Seu ponto de partida','Lugar e distância','Formato de estudo','O que pesa na decisão'];
const intentLabels={course:'Já sei o curso',compare:'Tenho algumas opções',explore:'Quero explorar caminhos',nearby:'Quero estudar perto',public:'Quero opções públicas',scenarios:'Quero comparar cenários'};

export function CompassPage(){
  const [params]=useSearchParams();const navigate=useNavigate();const initialIntent=params.get('intent')||'explore';
  const [step,setStep]=useState(0);const [profile,setProfile]=useState({...defaultCompassProfile,intent:initialIntent,network:initialIntent==='public'?'publica':''});
  const progress=(step+1)/steps.length*100;
  const summary=useMemo(()=>[profile.course,profile.city||profile.state,profile.modality,profile.network,profile.degree,profile.shift,profile.free==='sim'?'gratuito':null].filter(Boolean),[profile]);
  function change(key,value){setProfile(current=>({...current,[key]:value}))}
  function weight(key,value){setProfile(current=>({...current,weights:{...current.weights,[key]:Number(value)}}))}
  function finish(){saveCompassProfile(profile);navigate(`/buscar?${compassSearchParams(profile)}`)}
  function reset(){setProfile({...defaultCompassProfile,intent:initialIntent});setStep(0)}
  return <>
    <Seo title="Bússola da Escolha | Faculdade Perto" description="Transforme suas preferências em opções de cursos explicáveis, sem rankings ou propaganda." path="/bussola"/>
    <header className="page-header compass-header"><p className="eyebrow"><Compass size={16}/> Bússola da Escolha</p><h1>Suas prioridades viram caminhos para explorar.</h1><p>Não escolhemos por você. Usamos apenas suas preferências e dados oficiais para explicar quais opções combinam mais com o que procura.</p></header>
    <section className="section compact-section"><div className="compass-shell">
      <div className="compass-progress" aria-label={`Etapa ${step+1} de ${steps.length}`}><span style={{width:`${progress}%`}}/></div>
      <div className="compass-step-heading"><div><small>Etapa {step+1} de {steps.length}</small><h2>{steps[step]}</h2></div><button className="text-button" onClick={reset}><RefreshCw size={16}/> Recomeçar</button></div>
      {step===0&&<div className="compass-fields"><p className="compass-intent"><Sparkles size={18}/> {intentLabels[profile.intent]||intentLabels.explore}</p><label className="form-field"><span>Qual curso ou área você quer explorar?</span><input value={profile.course} onChange={event=>change('course',event.target.value)} placeholder="Ex.: Medicina, tecnologia ou educação"/><small>Você pode deixar em branco e começar somente pelas preferências.</small></label></div>}
      {step===1&&<div className="compass-fields form-grid"><label className="form-field"><span>Cidade de referência</span><input value={profile.city} onChange={event=>change('city',event.target.value)} placeholder="Ex.: Campinas"/></label><label className="form-field"><span>Estado</span><select value={profile.state} onChange={event=>change('state',event.target.value)}><option value="">Todo o Brasil</option>{states.map(state=><option key={state}>{state}</option>)}</select></label><label className="form-field full"><span>Distância máxima desejada</span><select value={profile.maxDistance} onChange={event=>change('maxDistance',event.target.value)}><option value="">Ainda não defini</option><option value="10">Até 10 km</option><option value="25">Até 25 km</option><option value="50">Até 50 km</option><option value="100">Até 100 km</option></select><small>A distância só entra no cálculo quando o navegador consegue estimá-la; município não significa endereço do campus.</small></label></div>}
      {step===2&&<div className="compass-fields form-grid"><Select label="Modalidade" value={profile.modality} onChange={value=>change('modality',value)} options={[['','Tanto faz'],['presencial','Presencial'],['ead','EAD']]}/><Select label="Rede" value={profile.network} onChange={value=>change('network',value)} options={[['','Tanto faz'],['publica','Pública'],['privada','Privada']]}/><Select label="Grau" value={profile.degree} onChange={value=>change('degree',value)} options={[['','Ainda não sei'],['bacharelado','Bacharelado'],['licenciatura','Licenciatura'],['tecnologo','Tecnólogo']]}/><Select label="Turno" value={profile.shift} onChange={value=>change('shift',value)} options={[['','Tanto faz'],['diurno','Diurno'],['noturno','Noturno']]}/><Select label="Gratuidade" value={profile.free} onChange={value=>change('free',value)} options={[['','Tanto faz'],['sim','Somente gratuito'],['nao','Pode ser não gratuito']]}/><label className="form-field"><span>Mínimo de vagas no Censo</span><input type="number" min="1" value={profile.minSeats} onChange={event=>change('minSeats',event.target.value)} placeholder="Sem mínimo"/></label></div>}
      {step===3&&<div className="compass-fields"><p>Defina o peso de cada critério. Isso altera apenas a compatibilidade com você — nunca a qualidade da instituição.</p><div className="weight-grid">{[['location','Localização'],['free','Gratuidade'],['modality','Modalidade'],['shift','Turno'],['network','Tipo de instituição'],['degree','Grau'],['seats','Quantidade de vagas']].map(([key,label])=><label className="weight-field" key={key}><span>{label}<strong>{profile.weights[key]}/5</strong></span><input type="range" min="1" max="5" value={profile.weights[key]} onChange={event=>weight(key,event.target.value)}/></label>)}</div><div className="compass-summary"><ShieldCheck/><div><strong>Resumo das suas escolhas</strong><p>{summary.length?summary.join(' · '):'Você deixou os critérios abertos. A busca mostrará opções para começar a explorar.'}</p><small>A pontuação será explicada em cada resultado e nunca será tratada como ranking.</small></div></div></div>}
      <div className="compass-actions"><button className="secondary-button" disabled={step===0} onClick={()=>setStep(value=>Math.max(0,value-1))}><ArrowLeft size={17}/> Voltar</button>{step<steps.length-1?<button className="primary-button" onClick={()=>setStep(value=>value+1)}>Continuar <ArrowRight size={17}/></button>:<button className="primary-button" onClick={finish}><MapPinned size={17}/> Ver caminhos compatíveis</button>}</div>
    </div></section>
  </>;
}

function Select({label,value,onChange,options}){return <label className="form-field"><span>{label}</span><select value={value} onChange={event=>onChange(event.target.value)}>{options.map(([option,labelText])=><option value={option} key={option}>{labelText}</option>)}</select></label>}
