import { requestJSON } from './service.js';

export class OperationsService {
  constructor(client) {
    this.client = client;
  }

  run(sessionID, body, ...options) {
    return requestJSON(this.client, 'POST', `/sessions/${encodeURIComponent(sessionID)}/operations`, body, options);
  }

  get(id, ...options) {
    return requestJSON(this.client, 'GET', `/operations/${encodeURIComponent(id)}`, undefined, options);
  }

  list(query = {}, ...options) {
    return requestJSON(this.client, 'GET', `/operations${operationQueryString(query)}`, undefined, options);
  }

  recover(id, body, ...options) {
    return requestJSON(this.client, 'POST', `/operations/${encodeURIComponent(id)}/recover`, body, options);
  }

  traces(query = {}, ...options) {
    return requestJSON(this.client, 'GET', `/traces${operationQueryString(query)}`, undefined, options);
  }
}

function operationQueryString(query = {}) {
  const values = new URLSearchParams();
  for (const key of ['session_id', 'version_id', 'status']) {
    if (query[key]) values.set(key, String(query[key]));
  }
  for (const key of ['offset', 'limit']) {
    if (query[key] !== undefined && query[key] !== null && query[key] !== '') values.set(key, String(query[key]));
  }
  const suffix = values.toString();
  return suffix ? `?${suffix}` : '';
}
