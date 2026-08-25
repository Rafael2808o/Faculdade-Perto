export const degreeMap={'1':'bacharelado','2':'licenciatura','3':'tecnologo','4':'abi'};
export const modalityMap={'1':'presencial','2':'ead'};
export const networkMap={'1':'publica','2':'privada'};
export const organizationMap={'1':'Universidade','2':'Centro Universitário','3':'Faculdade','4':'Instituto Federal','5':'CEFET'};
export const categoryMap={'1':'Pública Federal','2':'Pública Estadual','3':'Pública Municipal','4':'Privada com fins lucrativos','5':'Privada sem fins lucrativos','7':'Especial'};
export const levelMap={'1':'graduacao','2':'sequencial'};
export const dimensionMap={'1':'municipio','2':'ead_brasil','3':'ead_brasil_agregado','4':'ead_exterior'};

export function normalizeIdentifier(value){return value?.replace(/^"|"$/g,'').trim()||null}
export function nullish(value){const clean=value?.trim();return !clean||clean==='(.)'?null:clean}
export function buildCourseNaturalKey(row){return [row.NU_ANO_CENSO,row.CO_IES,row.CO_CURSO,row.TP_DIMENSAO,nullish(row.CO_MUNICIPIO)||'brasil',degreeMap[row.TP_GRAU_ACADEMICO]||'nao_confirmado',modalityMap[row.TP_MODALIDADE_ENSINO]||'nao_confirmado',levelMap[row.TP_NIVEL_ACADEMICO]||'nao_confirmado'].join(':')}
export function mapCourseValues(row){const modality=modalityMap[row.TP_MODALIDADE_ENSINO];if(!modality)throw new Error(`Modalidade desconhecida: ${row.TP_MODALIDADE_ENSINO||'vazia'}`);const censusYear=Number(row.NU_ANO_CENSO);if(!Number.isInteger(censusYear))throw new Error(`Ano do Censo inválido: ${row.NU_ANO_CENSO||'vazio'}`);return {dimension:dimensionMap[row.TP_DIMENSAO]||'nao_confirmado',degree:degreeMap[row.TP_GRAU_ACADEMICO]||'nao_confirmado',modality,academicLevel:levelMap[row.TP_NIVEL_ACADEMICO]||null,freeIndicator:row.IN_GRATUITO==='1'?true:row.IN_GRATUITO==='0'?false:null,censusYear}}
export function mapCourseStatistics(row){const metrics=[];const values=[];for(const [metric,value] of Object.entries(row)){if(!metric.startsWith('QT_')||nullish(value)===null)continue;const numeric=Number(value);if(!Number.isFinite(numeric))throw new Error(`Métrica ${metric} inválida: ${value}`);metrics.push(metric);values.push(numeric)}return {metrics,values}}
