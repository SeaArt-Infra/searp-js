import { requestJSON, streamSSE } from './service.js';

export class GroupSessionsService {
  constructor(client) { this.client = client; }

  create(body, ...options) {
    return requestJSON(this.client, 'POST', '/group-sessions', body, options);
  }

  turn(id, body, ...options) {
    return requestJSON(this.client, 'POST', `${path(id)}/turns`, body, options);
  }

  turnStream(id, body, ...options) {
    return streamSSE(this.client, 'POST', `${path(id)}/turns`, body, options);
  }

  getTurn(id, turnID, ...options) {
    return requestJSON(this.client, 'GET', `${path(id)}/turns/${encodeURIComponent(turnID)}`, undefined, options);
  }

  prompt(id, query = {}, ...options) {
    if (query?.headers || query?.signal) { options.unshift(query); query = {}; }
    const values = new URLSearchParams();
    if (query.turn_id !== undefined && query.turn_id !== null) values.set('turn_id', query.turn_id);
    const encoded = values.toString();
    return requestJSON(this.client, 'GET', `${path(id)}/prompt${encoded ? `?${encoded}` : ''}`, undefined, options);
  }
}

function path(id) { return `/sessions/${encodeURIComponent(id)}/group`; }
