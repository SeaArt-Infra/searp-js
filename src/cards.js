import { requestJSON } from './service.js';

export class CardsService {
  constructor(client) {
    this.client = client;
  }

  list(query = {}, ...options) {
    return requestJSON(this.client, 'GET', `/cards${cardQueryString(query)}`, undefined, options);
  }

  create(body, ...options) {
    return requestJSON(this.client, 'POST', '/cards', body, options);
  }

  get(id, query = {}, ...options) {
    return requestJSON(this.client, 'GET', `/cards/${encodeURIComponent(id)}${cardQueryString(query)}`, undefined, options);
  }

  update(id, body, ...options) {
    return requestJSON(this.client, 'PATCH', `/cards/${encodeURIComponent(id)}`, body, options);
  }

  delete(id, ...options) {
    return requestJSON(this.client, 'DELETE', `/cards/${encodeURIComponent(id)}`, undefined, options);
  }

  importCards(body, ...options) {
    return requestJSON(this.client, 'POST', '/cards/import', body, options);
  }

  setListing(id, body, ...options) {
    return requestJSON(this.client, 'PATCH', `/cards/${encodeURIComponent(id)}/listing`, body, options);
  }

  listVersions(id, ...options) {
    return requestJSON(this.client, 'GET', `/cards/${encodeURIComponent(id)}/versions`, undefined, options);
  }

  getVersion(id, version, ...options) {
    return requestJSON(this.client, 'GET', `/cards/${encodeURIComponent(id)}/versions/${version}`, undefined, options);
  }

  deleteVersion(id, version, ...options) {
    return requestJSON(this.client, 'DELETE', `/cards/${encodeURIComponent(id)}/versions/${version}`, undefined, options);
  }

  updateTranslation(id, version, lang, field, body, ...options) {
    return requestJSON(this.client, 'PATCH', `/cards/${encodeURIComponent(id)}/versions/${version}/translations/${encodeURIComponent(lang)}/${encodeURIComponent(field)}`, body, options);
  }

  restoreVersion(id, version, ...options) {
    return requestJSON(this.client, 'POST', `/cards/${encodeURIComponent(id)}/versions/${version}/restore`, undefined, options);
  }

  listByUser(userID, query = {}, ...options) {
    return requestJSON(this.client, 'GET', `/users/${encodeURIComponent(userID)}/cards${cardQueryString(query)}`, undefined, options);
  }
}

function cardQueryString(query = {}) {
  const values = new URLSearchParams();
  if (query.lang) values.set('lang', String(query.lang));
  if (Array.isArray(query.ids) && query.ids.length) values.set('ids', query.ids.join(','));
  if (Array.isArray(query.cardIds) && query.cardIds.length) values.set('card_ids', query.cardIds.join(','));
  if (Array.isArray(query.card_ids) && query.card_ids.length) values.set('card_ids', query.card_ids.join(','));
  const suffix = values.toString();
  return suffix ? `?${suffix}` : '';
}
