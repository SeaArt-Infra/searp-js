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

  async raw(method, path, body, ...options) {
    const { headers, signal } = buildRequestOptions(options);
    const response = await this.client.request(method, path, body, headers, { signal });
    if (response.status >= 400) throw parseAdminError(response.status, response.body);
    return response.body;
  }

  projectRequest(projectId, method, subpath, body, ...options) {
    return adminRequestJSON(this.client, method, projectPath(projectId, subpath), body, options);
  }

  getGlobalPack(...options) {
    return adminRequestJSON(this.client, 'GET', '/pack', undefined, options);
  }

  updateGlobalPack(body, ...options) {
    return adminRequestJSON(this.client, 'PUT', '/pack', body, options);
  }

  getProjectPack(projectId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, 'pack'), undefined, options);
  }

  patchProjectPack(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'PATCH', projectPath(projectId, 'pack'), body, options);
  }

  deleteProjectPack(projectId, ...options) {
    return adminRequestJSON(this.client, 'DELETE', projectPath(projectId, 'pack'), undefined, options);
  }

  forkProjectPack(projectId, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, 'pack/fork'), undefined, options);
  }

  listCatalog(query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `/catalog${queryString(query)}`, undefined, options);
  }

  importCatalog(body, ...options) {
    return adminRequestJSON(this.client, 'POST', '/catalog/import', body, options);
  }

  getCatalogCard(cardId, ...options) {
    return adminRequestJSON(this.client, 'GET', `/catalog/${encodeURIComponent(cardId)}`, undefined, options);
  }

  updateCatalogCard(cardId, body, ...options) {
    return adminRequestJSON(this.client, 'PATCH', `/catalog/${encodeURIComponent(cardId)}`, body, options);
  }

  deleteCatalogCard(cardId, ...options) {
    return adminRequestJSON(this.client, 'DELETE', `/catalog/${encodeURIComponent(cardId)}`, undefined, options);
  }

  async getCatalogCardCover(cardId, ...options) {
    return this.raw('GET', `/catalog/${encodeURIComponent(cardId)}/cover`, undefined, ...options);
  }

  listProjectCards(projectId, query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectPath(projectId, 'cards')}${queryString(query)}`, undefined, options);
  }

  getProjectCard(projectId, cardId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectCardPath(projectId, cardId), undefined, options);
  }

  updateProjectCard(projectId, cardId, body, ...options) {
    return adminRequestJSON(this.client, 'PATCH', projectCardPath(projectId, cardId), body, options);
  }

  deleteProjectCard(projectId, cardId, ...options) {
    return adminRequestJSON(this.client, 'DELETE', projectCardPath(projectId, cardId), undefined, options);
  }

  setProjectCardListing(projectId, cardId, body, ...options) {
    return adminRequestJSON(this.client, 'PATCH', `${projectCardPath(projectId, cardId)}/listing`, body, options);
  }

  importProjectCard(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, 'cards/import'), body, options);
  }

  importProjectCardsBatch(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, 'cards/import/batch'), body, options);
  }

  forkProjectCard(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, 'cards/fork'), body, options);
  }

  listProjectCardVersions(projectId, cardId, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectCardPath(projectId, cardId)}/versions`, undefined, options);
  }

  getProjectCardVersion(projectId, cardId, version, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectCardPath(projectId, cardId)}/versions/${version}`, undefined, options);
  }

  deleteProjectCardVersion(projectId, cardId, version, ...options) {
    return adminRequestJSON(this.client, 'DELETE', `${projectCardPath(projectId, cardId)}/versions/${version}`, undefined, options);
  }

  restoreProjectCardVersion(projectId, cardId, version, ...options) {
    return adminRequestJSON(this.client, 'POST', `${projectCardPath(projectId, cardId)}/versions/${version}/restore`, undefined, options);
  }

  listProjectExperiments(projectId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, 'experiments'), undefined, options);
  }

  createProjectExperiment(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, 'experiments'), body, options);
  }

  getProjectExperiment(projectId, experimentId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, `experiments/${encodeURIComponent(experimentId)}`), undefined, options);
  }

  updateProjectExperiment(projectId, experimentId, body, ...options) {
    return adminRequestJSON(this.client, 'PATCH', projectPath(projectId, `experiments/${encodeURIComponent(experimentId)}`), body, options);
  }

  startProjectExperiment(projectId, experimentId, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, `experiments/${encodeURIComponent(experimentId)}/start`), undefined, options);
  }

  pauseProjectExperiment(projectId, experimentId, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, `experiments/${encodeURIComponent(experimentId)}/pause`), undefined, options);
  }

  stopProjectExperiment(projectId, experimentId, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, `experiments/${encodeURIComponent(experimentId)}/stop`), undefined, options);
  }

  getProjectLLM(projectId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, 'llm'), undefined, options);
  }

  updateProjectLLM(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'PUT', projectPath(projectId, 'llm'), body, options);
  }

  deleteProjectLLM(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'DELETE', projectPath(projectId, 'llm'), body, options);
  }

  listProjectVersions(projectId, query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectPath(projectId, 'versions')}${queryString(query)}`, undefined, options);
  }

  createProjectVersion(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, 'versions'), body, options);
  }

  getProjectVersion(projectId, versionId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, `versions/${encodeURIComponent(versionId)}`), undefined, options);
  }

  diffProjectVersion(projectId, versionId, against, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectPath(projectId, `versions/${encodeURIComponent(versionId)}/diff`)}?${new URLSearchParams({ against }).toString()}`, undefined, options);
  }

  publishProjectVersion(projectId, versionId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, `versions/${encodeURIComponent(versionId)}/publish`), body, options);
  }

  getProjectRelease(projectId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, 'release'), undefined, options);
  }

  listProjectReleases(projectId, query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectPath(projectId, 'releases')}${queryString(query)}`, undefined, options);
  }

  rollbackProjectRelease(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, 'release/rollback'), body, options);
  }

  listProjectSystemPrompts(projectId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, 'system-prompts'), undefined, options);
  }

  createProjectSystemPrompt(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, 'system-prompts'), body, options);
  }

  setProjectSystemPromptDefault(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'PUT', projectPath(projectId, 'system-prompts'), body, options);
  }

  getProjectSystemPrompt(projectId, promptId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, `system-prompts/${encodeURIComponent(promptId)}`), undefined, options);
  }

  updateProjectSystemPrompt(projectId, promptId, body, ...options) {
    return adminRequestJSON(this.client, 'PUT', projectPath(projectId, `system-prompts/${encodeURIComponent(promptId)}`), body, options);
  }

  listGlobalSystemPrompts(...options) {
    return adminRequestJSON(this.client, 'GET', '/global-system-prompts', undefined, options);
  }

  createGlobalSystemPrompt(body, ...options) {
    return adminRequestJSON(this.client, 'POST', '/global-system-prompts', body, options);
  }

  setGlobalSystemPromptDefault(body, ...options) {
    return adminRequestJSON(this.client, 'PUT', '/global-system-prompts', body, options);
  }

  getGlobalSystemPrompt(promptId, ...options) {
    return adminRequestJSON(this.client, 'GET', `/global-system-prompts/${encodeURIComponent(promptId)}`, undefined, options);
  }

  listProjectUserSessions(projectId, query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectPath(projectId, 'user-sessions')}${queryString(query)}`, undefined, options);
  }

  getProjectUserSession(projectId, sessionId, query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectPath(projectId, `user-sessions/${encodeURIComponent(sessionId)}`)}${queryString(query)}`, undefined, options);
  }

  getProjectIdentityMigration(...options) {
    return adminRequestJSON(this.client, 'GET', '/project-identity-migration', undefined, options);
  }

  startProjectIdentityMigration(body, ...options) {
    return adminRequestJSON(this.client, 'POST', '/project-identity-migration', body, options);
  }

  prepareProjectIdentityMigration(...options) {
    return adminRequestJSON(this.client, 'POST', '/project-identity-migration/prepare', undefined, options);
  }

  purgeProjectIdentityMigration(body, ...options) {
    return adminRequestJSON(this.client, 'POST', '/project-identity-migration/purge', body, options);
  }

  adoptProjectIdentityMigration(body, ...options) {
    return adminRequestJSON(this.client, 'POST', '/project-identity-migration/adopt', body, options);
  }

  revertProjectIdentityMigration(body, ...options) {
    return adminRequestJSON(this.client, 'POST', '/project-identity-migration/revert', body, options);
  }

  previewProjectIdentityMigration(...options) {
    return adminRequestJSON(this.client, 'GET', '/project-identity-migration/preview', undefined, options);
  }

  projectEngine(projectId, method, enginePath, body, ...options) {
    return adminRequestJSON(this.client, method, projectPath(projectId, `engine/${enginePath}`), body, options);
  }

  listAdminCards(query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `/cards${queryString(query)}`, undefined, options);
  }

  translationsQueue(query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `/translations/queue${queryString(query)}`, undefined, options);
  }

  translationsCallback(body, ...options) {
    return adminRequestJSON(this.client, 'POST', '/translations/callback', body, options);
  }

  listProjectRollouts(projectId, query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectPath(projectId, 'rollouts')}${queryString(query)}`, undefined, options);
  }

  createProjectRollout(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, 'rollouts'), body, options);
  }

  getCurrentProjectRollouts(projectId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, 'rollouts/current'), undefined, options);
  }

  getProjectRollout(projectId, rolloutId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, `rollouts/${encodeURIComponent(rolloutId)}`), undefined, options);
  }

  updateProjectRollout(projectId, rolloutId, body, ...options) {
    return adminRequestJSON(this.client, 'PATCH', projectPath(projectId, `rollouts/${encodeURIComponent(rolloutId)}`), body, options);
  }

  deleteProjectRollout(projectId, rolloutId, ...options) {
    return adminRequestJSON(this.client, 'DELETE', projectPath(projectId, `rollouts/${encodeURIComponent(rolloutId)}`), undefined, options);
  }

  stopProjectRollout(projectId, rolloutId, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, `rollouts/${encodeURIComponent(rolloutId)}/stop`), undefined, options);
  }

  listProjectRolloutAudits(projectId, rolloutId, query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectPath(projectId, `rollouts/${encodeURIComponent(rolloutId)}/audit`)}${queryString(query)}`, undefined, options);
  }

  listProjectPresets(projectId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, 'presets'), undefined, options);
  }

  createProjectPreset(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, 'presets'), body, options);
  }

  updateProjectPreset(projectId, presetId, body, ...options) {
    return adminRequestJSON(this.client, 'PUT', projectPath(projectId, `presets/${encodeURIComponent(presetId)}`), body, options);
  }

  publishProjectPreset(projectId, presetId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, `presets/${encodeURIComponent(presetId)}/publish`), body, options);
  }

  listProjectSessions(projectId, query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectPath(projectId, 'sessions')}${queryString(query)}`, undefined, options);
  }

  updateProjectSession(projectId, sessionId, body, ...options) {
    return adminRequestJSON(this.client, 'PATCH', projectPath(projectId, `sessions/${encodeURIComponent(sessionId)}`), body, options);
  }

  listProjectSuites(projectId, query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectPath(projectId, 'suites')}${queryString(query)}`, undefined, options);
  }

  createProjectSuite(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, 'suites'), body, options);
  }

  getProjectSuite(projectId, suiteId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, `suites/${encodeURIComponent(suiteId)}`), undefined, options);
  }

  listProjectEvaluations(projectId, query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectPath(projectId, 'evaluations')}${queryString(query)}`, undefined, options);
  }

  getProjectEvaluation(projectId, evaluationId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, `evaluations/${encodeURIComponent(evaluationId)}`), undefined, options);
  }

  compareProjectEvaluation(projectId, evaluationId, ...options) {
    return adminRequestJSON(this.client, 'GET', projectPath(projectId, `evaluations/${encodeURIComponent(evaluationId)}/compare`), undefined, options);
  }

  cancelProjectEvaluation(projectId, evaluationId, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, `evaluations/${encodeURIComponent(evaluationId)}/cancel`), undefined, options);
  }

  resumeProjectEvaluation(projectId, evaluationId, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, `evaluations/${encodeURIComponent(evaluationId)}/resume`), undefined, options);
  }

  listProjectFeedback(projectId, query = {}, ...options) {
    return adminRequestJSON(this.client, 'GET', `${projectPath(projectId, 'feedback')}${queryString(query)}`, undefined, options);
  }

  createProjectFeedback(projectId, body, ...options) {
    return adminRequestJSON(this.client, 'POST', projectPath(projectId, 'feedback'), body, options);
  }

}


function projectPath(projectId, subpath = '') {
  const base = `/projects/${encodeURIComponent(projectId)}`;
  return subpath ? `${base}/${subpath}` : base;
}

function projectCardPath(projectId, cardId) {
  return projectPath(projectId, `cards/${encodeURIComponent(cardId)}`);
}

function queryString(query = {}) {
  const values = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') values.set(key, String(value));
  }
  const suffix = values.toString();
  return suffix ? `?${suffix}` : '';
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
