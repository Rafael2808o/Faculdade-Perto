const ACCENTED = 'áàãâäéèêëíìîïóòõôöúùûüçñ';
const FOLDED =   'aaaaaeeeeiiiiooooouuuucn';

export function foldText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function foldedSql(expression) {
  return `translate(lower(${expression}), '${ACCENTED}', '${FOLDED}')`;
}

export function slugSql(expression) {
  return `trim(both '-' from regexp_replace(${foldedSql(expression)}, '[^a-z0-9]+', '-', 'g'))`;
}

export function catalogNaturalKey(values) {
  return values.map((value) => value === null || value === undefined ? '\u2205' : String(value)).join('|');
}
