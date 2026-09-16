import { ErrGeneral, SeaRPError } from './errors.js';
import { TransportClient } from './transport.js';
import { SessionsService } from './sessions.js';
import { OperationsService } from './operations.js';
import { EngineService } from './engine.js';
import { CardsService } from './cards.js';
import { VersionsService } from './versions.js';
import { CinemaService } from './cinema.js';
import { AdminService } from './admin.js';

export const defaultBaseURL = 'http://127.0.0.1:8788';
export const defaultAdminBaseURL = 'http://127.0.0.1:8790/admin/v1';
export const defaultTimeout = 5 * 60 * 1000;
export const sdkVersion = '0.1.0';

export class Client {
  constructor(config = {}) {
    const endpoints = resolveEndpoints(config);
    const timeout = config.timeout ?? config.Timeout ?? defaultTimeout;
    this.apiKey = config.apiKey ?? config.APIKey ?? '';
    this.baseURL = endpoints.root;
    this.apiBaseURL = endpoints.api;
    this.adminBaseURL = endpoints.admin;
    this.headers = config.headers ?? config.Headers ?? {};

    const shared = {
      apiKey: this.apiKey,
      headers: this.headers,
      timeout,
      fetch: config.fetch,
    };

    this.sessions = new SessionsService(new TransportClient({
      ...shared,
      baseURL: this.apiBaseURL,
      userAgent: `searp-js/${sdkVersion}`,
    }));
    this.operations = new OperationsService(new TransportClient({
      ...shared,
      baseURL: this.apiBaseURL,
      userAgent: `searp-js/${sdkVersion}`,
    }));
    this.engine = new EngineService(new TransportClient({
      ...shared,
      baseURL: this.apiBaseURL,
      userAgent: `searp-js/${sdkVersion}`,
    }));
    this.cards = new CardsService(new TransportClient({
      ...shared,
      baseURL: this.apiBaseURL,
      userAgent: `searp-js/${sdkVersion}`,
    }));
    this.versions = new VersionsService(new TransportClient({
      ...shared,
      baseURL: this.apiBaseURL,
      userAgent: `searp-js/${sdkVersion}`,
    }));
    this.cinema = new CinemaService(new TransportClient({
      ...shared,
      baseURL: this.apiBaseURL,
      userAgent: `searp-js/${sdkVersion}`,
    }));
    this.admin = new AdminService(new TransportClient({
      ...shared,
      baseURL: this.adminBaseURL,
      userAgent: `searp-js/${sdkVersion}`,
    }));

    this.Sessions = goStyleService(this.sessions, {
      create: 'Create', createExperience: 'CreateExperience', get: 'Get',
      historyMessage: 'HistoryMessage', turn: 'Turn', turnStream: 'TurnStream',
      patch: 'Patch', rewind: 'Rewind', fork: 'Fork', edit: 'Edit',
    });
    this.Operations = goStyleService(this.operations, {
      run: 'Run', get: 'Get', list: 'List', recover: 'Recover', traces: 'Traces',
    });
    this.Engine = goStyleService(this.engine, {
      health: 'Health', capabilities: 'Capabilities', models: 'Models',
      llmStatus: 'LLMStatus', llmCheck: 'LLMCheck',
      generationModels: 'GenerationModels', createGeneration: 'CreateGeneration',
      getGeneration: 'GetGeneration', assemble: 'Assemble',
      debugChat: 'DebugChat', debugChatStream: 'DebugChatStream',
    });
    this.Cards = goStyleService(this.cards, {
      list: 'List', create: 'Create', get: 'Get', update: 'Update',
      delete: 'Delete', importCards: 'Import', setListing: 'SetListing',
      listVersions: 'ListVersions', getVersion: 'GetVersion',
      deleteVersion: 'DeleteVersion', updateTranslation: 'UpdateTranslation',
      restoreVersion: 'RestoreVersion', listByUser: 'ListByUser',
    });
    this.Versions = goStyleService(this.versions, { preview: 'Preview' });
    this.Cinema = goStyleService(this.cinema, {
      listRounds: 'ListRounds', createRound: 'CreateRound',
      createRoundStream: 'CreateRoundStream', getRound: 'GetRound',
      getImageTask: 'GetImageTask', generateImageTask: 'GenerateImageTask',
      saveImageResult: 'SaveImageResult',
    });
    this.Admin = goStyleService(this.admin, {
      request: 'Request', health: 'Health', whoami: 'Whoami',
      agentContract: 'AgentContract', listProjects: 'ListProjects',
      createProject: 'CreateProject', getProject: 'GetProject',
      deleteProject: 'DeleteProject', rotateProjectToken: 'RotateProjectToken',
      getProjectLive: 'GetProjectLive', updateProjectLive: 'UpdateProjectLive',
      raw: 'Raw', projectRequest: 'ProjectRequest',
      getGlobalPack: 'GetGlobalPack', updateGlobalPack: 'UpdateGlobalPack',
      getProjectPack: 'GetProjectPack', patchProjectPack: 'PatchProjectPack',
      deleteProjectPack: 'DeleteProjectPack', forkProjectPack: 'ForkProjectPack',
      listCatalog: 'ListCatalog', importCatalog: 'ImportCatalog',
      getCatalogCard: 'GetCatalogCard', updateCatalogCard: 'UpdateCatalogCard',
      deleteCatalogCard: 'DeleteCatalogCard', getCatalogCardCover: 'GetCatalogCardCover',
      listProjectCards: 'ListProjectCards', getProjectCard: 'GetProjectCard',
      updateProjectCard: 'UpdateProjectCard', deleteProjectCard: 'DeleteProjectCard',
      setProjectCardListing: 'SetProjectCardListing', importProjectCard: 'ImportProjectCard',
      importProjectCardsBatch: 'ImportProjectCardsBatch', forkProjectCard: 'ForkProjectCard',
      listProjectCardVersions: 'ListProjectCardVersions', getProjectCardVersion: 'GetProjectCardVersion',
      deleteProjectCardVersion: 'DeleteProjectCardVersion', restoreProjectCardVersion: 'RestoreProjectCardVersion',
      listProjectExperiments: 'ListProjectExperiments', createProjectExperiment: 'CreateProjectExperiment',
      getProjectExperiment: 'GetProjectExperiment', updateProjectExperiment: 'UpdateProjectExperiment',
      startProjectExperiment: 'StartProjectExperiment', pauseProjectExperiment: 'PauseProjectExperiment',
      stopProjectExperiment: 'StopProjectExperiment',
      getProjectLLM: 'GetProjectLLM', updateProjectLLM: 'UpdateProjectLLM', deleteProjectLLM: 'DeleteProjectLLM',
      listProjectVersions: 'ListProjectVersions', createProjectVersion: 'CreateProjectVersion',
      getProjectVersion: 'GetProjectVersion', diffProjectVersion: 'DiffProjectVersion',
      publishProjectVersion: 'PublishProjectVersion', getProjectRelease: 'GetProjectRelease',
      listProjectReleases: 'ListProjectReleases', rollbackProjectRelease: 'RollbackProjectRelease',
      listProjectSystemPrompts: 'ListProjectSystemPrompts', createProjectSystemPrompt: 'CreateProjectSystemPrompt',
      setProjectSystemPromptDefault: 'SetProjectSystemPromptDefault', getProjectSystemPrompt: 'GetProjectSystemPrompt',
      updateProjectSystemPrompt: 'UpdateProjectSystemPrompt',
      listGlobalSystemPrompts: 'ListGlobalSystemPrompts', createGlobalSystemPrompt: 'CreateGlobalSystemPrompt',
      setGlobalSystemPromptDefault: 'SetGlobalSystemPromptDefault', getGlobalSystemPrompt: 'GetGlobalSystemPrompt',
      listProjectUserSessions: 'ListProjectUserSessions', getProjectUserSession: 'GetProjectUserSession',
      getProjectIdentityMigration: 'GetProjectIdentityMigration', startProjectIdentityMigration: 'StartProjectIdentityMigration',
      prepareProjectIdentityMigration: 'PrepareProjectIdentityMigration', purgeProjectIdentityMigration: 'PurgeProjectIdentityMigration',
      adoptProjectIdentityMigration: 'AdoptProjectIdentityMigration', revertProjectIdentityMigration: 'RevertProjectIdentityMigration',
      previewProjectIdentityMigration: 'PreviewProjectIdentityMigration',
      listProjectRollouts: 'ListProjectRollouts', createProjectRollout: 'CreateProjectRollout',
      getCurrentProjectRollouts: 'GetCurrentProjectRollouts', getProjectRollout: 'GetProjectRollout',
      updateProjectRollout: 'UpdateProjectRollout', deleteProjectRollout: 'DeleteProjectRollout',
      stopProjectRollout: 'StopProjectRollout', listProjectRolloutAudits: 'ListProjectRolloutAudits',
      listProjectPresets: 'ListProjectPresets', createProjectPreset: 'CreateProjectPreset',
      updateProjectPreset: 'UpdateProjectPreset', publishProjectPreset: 'PublishProjectPreset',
      listProjectSessions: 'ListProjectSessions', updateProjectSession: 'UpdateProjectSession',
      listProjectSuites: 'ListProjectSuites', createProjectSuite: 'CreateProjectSuite',
      getProjectSuite: 'GetProjectSuite', listProjectEvaluations: 'ListProjectEvaluations',
      getProjectEvaluation: 'GetProjectEvaluation', compareProjectEvaluation: 'CompareProjectEvaluation',
      cancelProjectEvaluation: 'CancelProjectEvaluation', resumeProjectEvaluation: 'ResumeProjectEvaluation',
      listProjectFeedback: 'ListProjectFeedback', createProjectFeedback: 'CreateProjectFeedback',
    });
  }
}

export function createClient(config = {}) {
  return new Client(config);
}

export const New = createClient;

export function resolveEndpoints(config = {}) {
  const baseURL = config.baseURL ?? config.BaseURL ?? '';
  const root = resolveRootURL(baseURL);
  const api = resolveAPIBaseURL(root, config.apiBaseURL ?? config.APIBaseURL ?? '');
  const admin = resolveAdminBaseURL(root, config.adminBaseURL ?? config.AdminBaseURL ?? '', baseURL);
  return { root, api, admin };
}

function resolveRootURL(raw) {
  return normalizeURL(raw || defaultBaseURL);
}

function resolveAPIBaseURL(root, raw) {
  if (raw) return normalizeURL(raw);
  const parsed = new URL(root);
  if (parsed.pathname.endsWith('/v1')) return root;
  return joinURL(root, 'v1');
}

function resolveAdminBaseURL(root, raw, configuredBaseURL) {
  if (raw) return normalizeURL(raw);
  if (!configuredBaseURL) return normalizeURL(defaultAdminBaseURL);
  return joinURL(root, 'admin/v1');
}

export function normalizeURL(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch (error) {
    throw new SeaRPError({ kind: ErrGeneral, message: `invalid URL: ${error.message}` });
  }
  if (!parsed.protocol || !parsed.host) {
    throw new SeaRPError({ kind: ErrGeneral, message: 'invalid URL: missing scheme or host' });
  }
  parsed.pathname = cleanURLPath(parsed.pathname);
  if (parsed.pathname === '/') parsed.pathname = '';
  return parsed.toString().replace(/\/$/, '');
}

function joinURL(baseURL, suffix) {
  const parsed = new URL(baseURL);
  parsed.pathname = cleanURLPath(`${parsed.pathname}/${suffix}`);
  return normalizeURL(parsed.toString());
}

function cleanURLPath(pathname) {
  const stack = [];
  for (const part of pathname.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return `/${stack.join('/')}`;
}

function goStyleService(service, names) {
  for (const [jsName, goName] of Object.entries(names)) {
    service[goName] = service[jsName].bind(service);
  }
  return service;
}
