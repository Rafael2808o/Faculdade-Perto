import { getToken } from '../lib/auth.js';

export class ApiError extends Error {
  constructor(payload, status) {
    super(payload?.error?.message || 'Não foi possível carregar os dados.');
    this.payload = payload;
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({
    error: { message: 'A resposta do servidor não pôde ser lida.', hint: 'Tente novamente.' }
  }));
  if (!response.ok) throw new ApiError(payload, response.status);
  return payload;
}

export function queryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) search.set(key, value);
  });
  return search.toString();
}
