import { AppError } from '../errors/AppError.js';

export function calculateEnemScore({ scores, weights, trainee = false }) {
  const entries = Object.entries(scores);
  const hasWeights = weights && Object.keys(weights).length > 0;
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [area, score] of entries) {
    const weight = hasWeights ? weights[area] : 1;
    if (weight === undefined) throw new AppError('PESO_AUSENTE',`Falta o peso de ${area}.`,{hint:'Informe um peso positivo para cada área ou remova todos os pesos.'});
    totalWeight += weight;
    weightedSum += score * weight;
  }
  const value = Number((weightedSum / totalWeight).toFixed(2));
  return {
    score: value,
    method: hasWeights ? 'ponderada' : 'simples',
    disclaimer: 'Este cálculo é apenas informativo e não garante aprovação. Pesos e regras variam por processo seletivo.',
    ...(trainee ? { traineeWarning: 'Como treineiro, sua nota não pode ser usada para ingresso regular nesta edição. Consulte as regras do processo seletivo.' } : {})
  };
}
