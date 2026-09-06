const catalogLabels=Object.freeze({
  abi:'ABI',
  bacharelado:'Bacharelado',
  cefet:'CEFET',
  centro_universitario:'Centro universitário',
  ead:'EAD',
  faculdade:'Faculdade',
  instituto_federal:'Instituto federal',
  licenciatura:'Licenciatura',
  matutino:'Matutino',
  nao_confirmado:'Não confirmado',
  noturno:'Noturno',
  presencial:'Presencial',
  privada:'Privada',
  publica:'Pública',
  diurno:'Diurno',
  integral:'Integral',
  tecnologo:'Tecnólogo',
  universidade:'Universidade',
  vespertino:'Vespertino'
});

export function displayCatalogValue(value,fallback='Não confirmado'){
  if(value===null||value===undefined||value==='')return fallback;
  return catalogLabels[value]||String(value);
}

export function formatCount(value,fallback='0'){
  const count=Number(value);
  return Number.isFinite(count)?count.toLocaleString('pt-BR'):fallback;
}
