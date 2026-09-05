import { foldText } from '../../database/sqlText.js';

const normalized = value => foldText(value).replace(/^abi\s*-\s*/, '').replace(/\s+/g, ' ').trim();
const reportAliases = new Map([
  ['eng. metalurgica e eng. de materiais','engenharia metalurgica e engenharia de materiais']
]);

export function matchUFMGTerm(row, terms) {
  let name = normalized(row.name);
  let degree = null;
  const qualification = name.match(/\s*\((bacharelado|licenciatura)\)$/);
  if (qualification) { degree = qualification[1]; name = name.replace(qualification[0], ''); }
  const montesClaros = name.includes('(montes claros)');
  name = name.replace(/\s*\(montes claros\)/, '');
  name = reportAliases.get(name) || name;
  const sameShift = term => term.shift === row.shift || (row.shift === 'integral' && term.shift.startsWith('integral'));
  let matches = terms.filter(term => normalized(term.name) === name && sameShift(term)
    && (!degree || normalized(term.degree) === degree)
    && (!montesClaros || term.city === 'Montes Claros'));
  if (!montesClaros && matches.length > 1) matches = matches.filter(term => term.city === 'Belo Horizonte');
  return matches.length === 1 ? matches[0] : null;
}

export function normalizeUFMGReport(report, term) {
  if (report.year !== term.year) throw Error('O termo de pesos precisa pertencer à mesma edição do histórico.');
  const records = [], rejected = [];
  const seen = new Set();
  for (const row of report.rows) {
    const matching = matchUFMGTerm(row, term.rows);
    if (!matching) { rejected.push({ ...row, reason: 'Curso/turno sem correspondência única no termo oficial da edição.' }); continue; }
    if (!Number.isFinite(row.minimum) || row.minimum <= 0 || row.minimum > row.maximum || row.maximum > 1000) throw Error('Faixa de notas inválida.');
    const weights = matching.weights;
    if (['languages','humanities','naturalSciences','mathematics','essay'].some(key => !Number.isFinite(weights[key]) || weights[key] < 0)
      || Object.values(weights).reduce((a,b)=>a+b,0) <= 0) throw Error('Pesos oficiais incompletos.');
    const naturalKey = ['575',report.year,matching.code,matching.shift,row.competition,report.round].join(':');
    if (seen.has(naturalKey)) throw Error('Cenário duplicado no mesmo relatório.');
    seen.add(naturalKey);
    records.push({ ...row, ...matching, name: row.name, naturalKey, round: report.round,
      roundKind: report.round === 'Chamada regular' ? 'regular' : 'waiting_snapshot',
      reportPage: row.page, weightsPage: matching.page, weightsSourceUrl: term.url });
  }
  return { records, rejected };
}
