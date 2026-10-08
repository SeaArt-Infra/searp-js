export const ErrAuth = 'auth';
export const ErrInvalid = 'invalid';
export const ErrNotFound = 'not_found';
export const ErrConflict = 'conflict';
export const ErrQuota = 'quota';
export const ErrTimeout = 'timeout';
export const ErrNetwork = 'network';
export const ErrGeneral = 'general';

export class SeaRPError extends Error {
  constructor({ kind = ErrGeneral, code = '', message = 'SeaRP SDK error', status = 0 } = {}) {
    super(message);
    this.name = 'SeaRPError';
    this.kind = kind;
    this.code = code;
    this.status = status;
    this.Kind = kind;
    this.Code = code;
    this.Status = status;
  }
}

export function newHTTPError(status, message, code = '') {
  let payload;
  try {
    payload = JSON.parse(message);
    if (payload?.error?.message) message = payload.error.message;
    if (payload?.error?.code) code = payload.error.code;
  } catch { /* Plain-text errors remain supported. */ }
  let kind = ErrGeneral;
  if (status === 400 || status === 422) kind = ErrInvalid;
  else if (status === 401 || status === 403) kind = ErrAuth;
  else if (status === 404) kind = ErrNotFound;
  else if (status === 409) kind = ErrConflict;
  else if (status === 429) kind = ErrQuota;
  else if (status === 408 || status === 504) kind = ErrTimeout;
  const error = new SeaRPError({ kind, code, status, message });
  error.payload = payload;
  error.sessionId = payload?.session_id ?? '';
  return error;
}

export function decodeJSON(payload) {
  if (!payload) return {};
  try {
    return JSON.parse(payload);
  } catch (error) {
    throw new SeaRPError({ kind: ErrGeneral, message: `failed to decode response: ${error.message}` });
  }
}
