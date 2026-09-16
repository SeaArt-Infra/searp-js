import { requestJSON, streamSSE } from './service.js';

export class SessionsService {
  constructor(client) {
    this.client = client;
  }

  create(body, ...options) {
    return requestJSON(this.client, 'POST', '/sessions', body, options);
  }

  createExperience(body, ...options) {
    return requestJSON(this.client, 'POST', '/experience/sessions', body, options);
  }

  get(id, query = {}, ...options) {
    return requestJSON(this.client, 'GET', `/sessions/${encodeURIComponent(id)}${queryString(query)}`, undefined, options);
  }

  historyMessage(id, index, ...options) {
    return requestJSON(this.client, 'GET', `/sessions/${encodeURIComponent(id)}/history/${index}`, undefined, options);
  }

  turn(id, body, ...options) {
    return requestJSON(this.client, 'POST', `/sessions/${encodeURIComponent(id)}/turns`, body, options);
  }

  turnStream(id, body, ...options) {
    return streamSSE(this.client, 'POST', `/sessions/${encodeURIComponent(id)}/turns`, body, options);
  }

  patch(id, body, ...options) {
    return requestJSON(this.client, 'PATCH', `/sessions/${encodeURIComponent(id)}`, body, options);
  }

  rewind(id, body, ...options) {
    return requestJSON(this.client, 'POST', `/sessions/${encodeURIComponent(id)}/rewind`, body, options);
  }

  fork(id, body, ...options) {
    return requestJSON(this.client, 'POST', `/sessions/${encodeURIComponent(id)}/fork`, body, options);
  }

  edit(id, body, ...options) {
    return requestJSON(this.client, 'POST', `/sessions/${encodeURIComponent(id)}/edit`, body, options);
  }
}

function queryString(query = {}) {
  const values = new URLSearchParams();
  if (query.limit !== undefined && query.limit !== null) values.set('limit', String(query.limit));
  if (query.offset !== undefined && query.offset !== null) values.set('offset', String(query.offset));
  const suffix = values.toString();
  return suffix ? `?${suffix}` : '';
}
