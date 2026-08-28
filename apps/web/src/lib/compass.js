export const COMPASS_STORAGE_KEY='faculdade-perto:bussola:v1';

export const defaultCompassProfile={
  intent:'explore',course:'',city:'',state:'',maxDistance:'',modality:'',network:'',degree:'',shift:'',free:'',minSeats:'',
  weights:{location:4,free:4,modality:3,shift:3,network:3,degree:2,seats:1}
};

export function readCompassProfile(storage=globalThis.localStorage){
  try{const value=JSON.parse(storage?.getItem(COMPASS_STORAGE_KEY)||'null');return value?{...defaultCompassProfile,...value,weights:{...defaultCompassProfile.weights,...value.weights}}:null}catch{return null}
}

export function saveCompassProfile(profile,storage=globalThis.localStorage){storage?.setItem(COMPASS_STORAGE_KEY,JSON.stringify(profile))}
export function clearCompassProfile(storage=globalThis.localStorage){storage?.removeItem(COMPASS_STORAGE_KEY)}

function criterion(label,desired,actual,weight,formatter=(value)=>String(value)){
  if(desired===''||desired===null||desired===undefined)return null;
  const available=actual!==null&&actual!==undefined&&actual!=='';
  const matched=available&&String(actual).toLowerCase()===String(desired).toLowerCase();
  return {label,desired:formatter(desired),actual:available?formatter(actual):null,weight:Number(weight)||1,matched,available};
}

export function calculateCompatibility(item,profile){
  if(!profile)return null;
  const shifts=item.shifts?.value||{};
  const shiftMatch=profile.shift==='diurno'?shifts.daytimeSeats>0:profile.shift==='noturno'?shifts.nighttimeSeats>0:null;
  const distance=Number.isFinite(item.location?.distanceKm)?item.location.distanceKm:null;
  const criteria=[
    profile.city?criterion('Cidade',profile.city,item.location?.city,profile.weights.location):profile.state?criterion('Estado',profile.state,item.location?.state,profile.weights.location):null,
    profile.maxDistance?{label:'Distância',desired:`até ${profile.maxDistance} km`,actual:distance===null?null:`${distance.toFixed(1)} km`,weight:Number(profile.weights.location)||1,matched:distance!==null&&distance<=Number(profile.maxDistance),available:distance!==null}:null,
    criterion('Modalidade',profile.modality,item.modality?.value,profile.weights.modality),
    criterion('Rede',profile.network,item.institution?.network,profile.weights.network),
    criterion('Grau',profile.degree,item.degree?.value,profile.weights.degree),
    profile.shift?{label:'Turno',desired:profile.shift,actual:shiftMatch===null?null:(shiftMatch?profile.shift:'outro turno'),weight:Number(profile.weights.shift)||1,matched:shiftMatch===true,available:shiftMatch!==null}:null,
    profile.free?criterion('Gratuidade',profile.free==='sim',item.free?.value,profile.weights.free,(value)=>value===true||value==='true'?'gratuito':'não gratuito'):null,
    profile.minSeats?{label:'Vagas',desired:`pelo menos ${profile.minSeats}`,actual:item.censusSeats?.value??null,weight:Number(profile.weights.seats)||1,matched:Number(item.censusSeats?.value)>=Number(profile.minSeats),available:item.censusSeats?.value!==null&&item.censusSeats?.value!==undefined}:null
  ].filter(Boolean);
  if(!criteria.length)return null;
  const total=criteria.reduce((sum,item)=>sum+item.weight,0);
  const earned=criteria.reduce((sum,item)=>sum+(item.matched?item.weight:0),0);
  return {
    score:Math.round(earned/total*100),
    matches:criteria.filter(item=>item.matched).map(item=>item.label),
    gaps:criteria.filter(item=>item.available&&!item.matched).map(item=>item.label),
    missing:criteria.filter(item=>!item.available).map(item=>item.label),
    criteria
  };
}

export function compassSearchParams(profile){
  const params=new URLSearchParams({compass:'1'});
  const mapping={course:'q',city:'city',state:'state',modality:'modality',network:'network',degree:'degree',shift:'shift',free:'free',minSeats:'minSeats'};
  for(const [key,param] of Object.entries(mapping))if(profile[key])params.set(param,String(profile[key]));
  return params;
}
