import { requestJSON } from './service.js';

export class GroupCardsService {
  constructor(client) { this.client = client; }

  list(query = {}, ...options) {
    if (query?.headers || query?.signal) { options.unshift(query); query = {}; }
    return requestJSON(this.client, 'GET', `/group-cards${queryString(query, ['q', 'listed', 'include_deleted', 'limit', 'offset'])}`, undefined, options);
  }

  create(body, ...options) {
    return requestJSON(this.client, 'POST', '/group-cards', body, options);
  }

  get(id, query = {}, ...options) {
    if (query?.headers || query?.signal) { options.unshift(query); query = {}; }
    return requestJSON(this.client, 'GET', `${path(id)}${queryString(query, ['lang'])}`, undefined, options);
  }

  update(id, body, ...options) {
    return requestJSON(this.client, 'PATCH', path(id), body, options);
  }

  delete(id, ...options) {
    return requestJSON(this.client, 'DELETE', path(id), undefined, options);
  }

  setListing(id, body, ...options) {
    return requestJSON(this.client, 'PATCH', `${path(id)}/listing`, body, options);
  }

  listVersions(id, ...options) {
    return requestJSON(this.client, 'GET', `${path(id)}/versions`, undefined, options);
  }

  getVersion(id, version, query = {}, ...options) {
    if (query?.headers || query?.signal) { options.unshift(query); query = {}; }
    return requestJSON(this.client, 'GET', `${path(id)}/versions/${version}${queryString(query, ['lang'])}`, undefined, options);
  }

  listMembers(id, ...options) {
    return requestJSON(this.client, 'GET', `${path(id)}/members`, undefined, options);
  }

  addMember(id, body, ...options) {
    return requestJSON(this.client, 'POST', `${path(id)}/members`, body, options);
  }

  updateMember(id, participantID, body, ...options) {
    return requestJSON(this.client, 'PATCH', `${path(id)}/members/${encodeURIComponent(participantID)}`, body, options);
  }

  removeMember(id, participantID, body, ...options) {
    return requestJSON(this.client, 'DELETE', `${path(id)}/members/${encodeURIComponent(participantID)}`, body, options);
  }

  extractCharacters(id, body, ...options) {
    return requestJSON(this.client, 'POST', `${path(id)}/characters`, body, options);
  }

  preview(id, body, ...options) {
    return requestJSON(this.client, 'POST', `${path(id)}/preview`, body, options);
  }

  importCards(body, ...options) {
    return requestJSON(this.client, 'POST', '/group-cards/import', body, options);
  }

  listTranslations(id, version, ...options) {
    return requestJSON(this.client, 'GET', `${path(id)}/versions/${version}/translations`, undefined, options);
  }

  saveTranslations(id, version, body, ...options) {
    return requestJSON(this.client, 'POST', `${path(id)}/versions/${version}/translations`, body, options);
  }

}

function path(id) { return `/group-cards/${encodeURIComponent(id)}`; }

function queryString(query, keys) {
  const values = new URLSearchParams();
  for (const key of keys) {
    if (query[key] !== undefined && query[key] !== null) values.set(key, String(query[key]));
  }
  const encoded = values.toString();
  return encoded ? `?${encoded}` : '';
}
