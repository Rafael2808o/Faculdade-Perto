// Reviewed mappings: course pages on the FEA domain + institutional identity in Censo 2024.
export const feaCourses = [
  {code:'direito',institution:'1844',course:'Direito',degree:'bacharelado',shift:'noturno',path:'20/direito'},
  {code:'educacao-fisica-bacharelado',institution:'1844',course:'Educação física',degree:'bacharelado',shift:'noturno',path:'21/educacao-fisica---bacharelado'},
  {code:'educacao-fisica-licenciatura',institution:'1844',course:'Educação física formação de professor',degree:'licenciatura',shift:'noturno',path:'22/educacao-fisica---licenciatura'},
  {code:'enfermagem',institution:'1844',course:'Enfermagem',degree:'bacharelado',shift:'noturno',path:'23/enfermagem'},
  {code:'servico-social',institution:'1844',course:'Serviço social',degree:'bacharelado',shift:'noturno',path:'24/servico-social'},
  {code:'agronomia',institution:'1844',course:'Agronomia',degree:'bacharelado',shift:'nao_confirmado',path:'19/agronomia',addressConflict:true,
    note:'A página do curso informa Rua Amazonas, 571, enquanto seu rodapé informa 751. Número e campus exato aguardam revisão; horário de atendimento não foi tratado como turno.'},
  {code:'medicina-veterinaria',institution:'1623',course:'Medicina veterinária',degree:'bacharelado',shift:'nao_confirmado',path:'25/medicina-veterinaria',reportedShift:'Integral/Noturno',
    note:'A fonte informa Integral/Noturno. Não foram inventadas turmas ou ofertas independentes para cada turno.'}
];
