const bands=[
  {minimum:20,key:'favorable',label:'Acima da faixa histórica',description:'A nota informada ficou pelo menos 20 pontos acima deste corte histórico.'},
  {minimum:0,key:'competitive',label:'Na faixa histórica',description:'A nota informada ficou igual ou acima deste corte, com margem menor que 20 pontos.'},
  {minimum:-20,key:'close',label:'Próxima da faixa',description:'A diferença foi de até 20 pontos abaixo deste corte histórico.'},
  {minimum:-Infinity,key:'difficult',label:'Abaixo da faixa histórica',description:'A nota ficou mais de 20 pontos abaixo deste corte histórico.'}
];

export function classifyCutoff(score,cutoff){
  const difference=Number((Number(score)-Number(cutoff)).toFixed(2));
  const band=bands.find((item)=>difference>=item.minimum);
  return {...band,difference};
}

export function describeRound(round=''){
  const value=String(round).trim();
  if(!value)return 'Rodada não informada';
  if(/espera/i.test(value))return `Lista de espera · ${value}`;
  if(/regular/i.test(value))return `Chamada regular · ${value}`;
  return value;
}
