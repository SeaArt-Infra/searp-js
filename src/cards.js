import { requestJSON } from './service.js';
import { ErrInvalid, SeaRPError } from './errors.js';

export class CardsService {
  constructor(client, controlClient) {
    this.client = client;
    this.controlClient = controlClient;
  }

  importBatch(body, ...options) {
    if (!this.controlClient) throw new SeaRPError({ kind: ErrInvalid, message: 'cards.importBatch requires controlAPIBaseURL (full /admin/v1 base)' });
    return requestJSON(this.controlClient, 'POST', '/cards/import/batch', body, options);
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

  listVersions(id, query = {}, ...options) {
    if (query?.headers || query?.signal) { options.unshift(query); query = {}; }
    return requestJSON(this.client, 'GET', `/cards/${encodeURIComponent(id)}/versions${versionQueryString(query)}`, undefined, options);
  }

  getVersion(id, version, query = {}, ...options) {
    if (query?.headers || query?.signal) { options.unshift(query); query = {}; }
    return requestJSON(this.client, 'GET', `/cards/${encodeURIComponent(id)}/versions/${version}${cardQueryString(query)}`, undefined, options);
  }

  deleteVersion(id, version, ...options) {
    return requestJSON(this.client, 'DELETE', `/cards/${encodeURIComponent(id)}/versions/${version}`, undefined, options);
  }

  updateTranslation(id, version, lang, field, body, ...options) {
    return requestJSON(this.client, 'PATCH', `/cards/${encodeURIComponent(id)}/versions/${version}/translations/${encodeURIComponent(lang)}/${encodeURIComponent(field)}`, body, options);
  }

  restoreVersion(id, version, body, ...options) {
    if (!body || typeof body !== 'object' || body.expected_latest_version === undefined) {
      throw new SeaRPError({ kind: ErrInvalid, message: 'restore requires a body with expected_latest_version' });
    }
    return requestJSON(this.client, 'POST', `/cards/${encodeURIComponent(id)}/versions/${version}/restore`, body, options);
  }

  listTranslations(id, version, ...options) {
    return requestJSON(this.client, 'GET', `/cards/${encodeURIComponent(id)}/versions/${version}/translations`, undefined, options);
  }

  saveTranslations(id, version, body, ...options) {
    return requestJSON(this.client, 'POST', `/cards/${encodeURIComponent(id)}/versions/${version}/translations`, body, options);
  }

  listByUser(userID, query = {}, ...options) {
    return requestJSON(this.client, 'GET', `/users/${encodeURIComponent(userID)}/cards${cardQueryString(query)}`, undefined, options);
  }
}

function cardQueryString(query = {}) {
  const values = new URLSearchParams();
  for (const key of ['limit', 'offset']) {
    if (query[key] !== undefined && query[key] !== null) values.set(key, String(query[key]));
  }
  if (query.lang) values.set('lang', String(query.lang));
  if (Array.isArray(query.ids) && query.ids.length) values.set('ids', query.ids.join(','));
  if (Array.isArray(query.cardIds) && query.cardIds.length) values.set('card_ids', query.cardIds.join(','));
  if (Array.isArray(query.card_ids) && query.card_ids.length) values.set('card_ids', query.card_ids.join(','));
  const suffix = values.toString();
  return suffix ? `?${suffix}` : '';
}

function versionQueryString(query = {}) {
  const values = new URLSearchParams();
  for (const key of ['limit', 'before_version']) {
    if (query[key] !== undefined && query[key] !== null) values.set(key, String(query[key]));
  }
  const suffix = values.toString();
  return suffix ? `?${suffix}` : '';
}
