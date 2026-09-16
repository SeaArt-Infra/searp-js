import { decodeJSON, newHTTPError } from './errors.js';
import { buildRequestOptions } from './options.js';

export class AdminService {
  constructor(client) {
    this.client = client;
  }

  request(method, path, body, ...options) {
    return adminRequestJSON(this.client, method, path, body, options);
  }

  health(...options) {
    return adminRequestJSON(this.client, 'GET', '/health', undefined, options);
  }

  whoami(...options) {
    return adminRequestJSON(this.client, 'GET', '/whoami', undefined, options);
  }

  agentContract(...options) {
    return adminRequestJSON(this.client, 'GET', '/agent/contract', undefined, options);
  }

  listProjects(...options) {
    return adminRequestJSON(this.client, 'GET', '/projects', undefined, options);
  }

  createProject(body, ...options) {
    return adminRequestJSON(this.client, 'POST', '/projects', body, options);
  }

  getProject(id, ...options) {
    return adminRequestJSON(this.client, 'GET', `/projects/${encodeURIComponent(id)}`, undefined, options);
  }

  deleteProject(id, ...options) {
    return adminRequestJSON(this.client, 'DELETE', `/projects/${encodeURIComponent(id)}`, undefined, options);
  }

  rotateProjectToken(id, ...options) {
    return adminRequestJSON(this.client, 'POST', `/projects/${encodeURIComponent(id)}/token`, undefined, options);
  }

  getProjectLive(id, ...options) {
    return adminRequestJSON(this.client, 'GET', `/projects/${encodeURIComponent(id)}/live`, undefined, options);
  }

  updateProjectLive(id, body, ...options) {
    return adminRequestJSON(this.client, 'PUT', `/projects/${encodeURIComponent(id)}/live`, body, options);
  }
}

export async function adminRequestJSON(client, method, path, body, options = []) {
  const { headers, signal } = buildRequestOptions(options);
  const response = await client.request(method, path, body, headers, { signal });
  if (response.status >= 400) {
    throw parseAdminError(response.status, response.body);
  }
  return decodeJSON(response.body);
}

export function parseAdminError(status, payload) {
  let envelope = {};
  try {
    envelope = JSON.parse(payload || '{}');
  } catch {
    return newHTTPError(status, payload || `HTTP ${status}`);
  }
  const error = envelope.error ?? {};
  if (error.code || error.message) {
    return newHTTPError(status, error.message || `HTTP ${status}`, error.code || '');
  }
  return newHTTPError(status, payload || `HTTP ${status}`);
}
