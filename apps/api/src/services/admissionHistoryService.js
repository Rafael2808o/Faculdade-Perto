import * as repository from '../repositories/admissionHistoryRepository.js';
import { env } from '../config/env.js';

const areas=['languages','humanities','naturalSciences','mathematics','essay'];
export function compareAdmissionScore(row,scores,trainee=false) {
  if(!scores)return null;
  if(trainee)return { comparable:false,reason:'Treineiro: este histórico não representa elegibilidade para ingresso.' };
  const weights=row.weights;
  if(!weights||areas.some(key=>!Number.isFinite(Number(weights[key]))||weights[key]===null||weights[key]===undefined)
    ||areas.some(key=>Number(weights[key])<0)||areas.reduce((sum,key)=>sum+Number(weights[key]),0)<=0)
    return { comparable:false,reason:'Pesos oficiais da edição não confirmados. Não comparamos médias incompatíveis.' };
  const belowMinimum=areas.filter(key=>row.minimum_scores?.[key]!==undefined&&scores[key]<Number(row.minimum_scores[key]));
  if(scores.essay===0||belowMinimum.length)return { comparable:false,reason:'As notas informadas não atendem aos mínimos de prova conhecidos deste processo.' };
  const score=Number((areas.reduce((sum,key)=>sum+scores[key]*Number(weights[key]),0)/areas.reduce((sum,key)=>sum+Number(weights[key]),0)).toFixed(2));
  return { comparable:true,score,difference:Number((score-Number(row.score)).toFixed(2)),weights,weightsSourceUrl:row.weights_source_url,
    notice:'Comparação numérica histórica; não verifica documentação, cotas, desempates nem garante vaga.' };
}

export async function getAdmissionHistory({scores,trainee=false,...filters}) {
  const [rows,coverage]=env.DATA_MODE==='demo'?[[],[]]:await Promise.all([
    repository.listAdmissionHistory(filters),repository.admissionHistoryCoverage()
  ]);
  const total=Number(rows[0]?.total||0);
  return {
    data:rows.map(({total,...row})=>({...row,score:Number(row.score),maximum_score:row.maximum_score===null?null:Number(row.maximum_score),comparison:compareAdmissionScore(row,scores,trainee)})),
    pagination:{page:filters.page,limit:filters.limit,total,totalPages:Math.ceil(total/filters.limit)},
    coverage:{institutions:coverage.map(item=>({...item,year:Number(item.year),scenarios:Number(item.scenarios),courses:Number(item.courses),courseShifts:Number(item.course_shifts),rounds:Number(item.rounds)})),message:'Cobertura parcial: somente as instituições, edições e relatórios listados foram importados.'},
    methodology:{guarantee:false,message:'As notas são comparadas com os pesos oficiais da própria edição. Modalidades de concorrência e turnos não são misturados.',
      rounds:'“Após a chamada” é um retrato acumulado do relatório publicado, não o corte exclusivo de quem entrou naquela chamada. Estar acima do mínimo não garante convocação.'},
    empty:rows.length?null:{message:'Ainda não há histórico oficial importado para este cenário.',hint:'Confira a cobertura disponível ou remova um filtro. Não preenchemos lacunas com notas estimadas.'}
  };
}
