import { requestJSON } from './service.js';

export class WorldBooksService {
  constructor(client) { this.client = client; }

  list(query = {}, ...options) { return requestJSON(this.client, 'GET', `/world-books${queryString(query)}`, undefined, options); }
  get(id, ...options) { return requestJSON(this.client, 'GET', `/world-books/${encodeURIComponent(id)}`, undefined, options); }
  create(body, ...options) { return requestJSON(this.client, 'POST', '/world-books', body, options); }
  delete(id, ...options) { return requestJSON(this.client, 'DELETE', `/world-books/${encodeURIComponent(id)}`, undefined, options); }
  catalogList(query = {}, ...options) { return requestJSON(this.client, 'GET', `/catalog/world-books${queryString(query)}`, undefined, options); }
  catalogGet(id, ...options) { return requestJSON(this.client, 'GET', `/catalog/world-books/${encodeURIComponent(id)}`, undefined, options); }
}

export const WorldBookService = WorldBooksService;

function queryString(query = {}) {
  const values = new URLSearchParams();
  for (const key of ['limit', 'cursor']) {
    if (query[key] !== undefined && query[key] !== null) values.set(key, String(query[key]));
  }
  const suffix = values.toString();
  return suffix ? `?${suffix}` : '';
}
