export function preserveCompetitionModalities(rows){return rows.map((row)=>({...row,score:Number(row.score)}))}
