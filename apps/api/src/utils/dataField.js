import { DATA_STATUSES } from '../models/DataStatus.js';

export function dataField({ value = null, status = 'nao_confirmado', source = null, sourceUrl = null, updatedAt = null, reason = null }) {
  if (!DATA_STATUSES.has(status)) throw new Error(`Status de dado inválido: ${status}`);
  if ((status === 'confirmado' || status === 'importado') && (!source || !updatedAt)) {
    throw new Error('Dado confirmado/importado exige fonte e data.');
  }
  if (status === 'nao_confirmado' && !reason) throw new Error('Dado não confirmado exige motivo.');
  return { value, status, source, sourceUrl, updatedAt, ...(reason ? { reason } : {}) };
}

export function importedField(value, snapshot) {
  if (value === null || value === undefined || value === '') {
    return dataField({ status: 'nao_confirmado', reason: 'A fonte consultada não informou este campo.' });
  }
  return dataField({ value, status: 'importado', source: snapshot.sourceName, sourceUrl: snapshot.sourceUrl, updatedAt: snapshot.importedAt });
}

export function unconfirmedField(reason) {
  return dataField({ status: 'nao_confirmado', reason });
}
