import { ErrGeneral, SeaRPError } from './errors.js';
import { TransportClient } from './transport.js';
import { SessionsService } from './sessions.js';
import { OperationsService } from './operations.js';
import { EngineService } from './engine.js';
import { CardsService } from './cards.js';
import { VersionsService } from './versions.js';
import { CinemaService } from './cinema.js';

export const defaultBaseURL = 'http://127.0.0.1:8788';
export const defaultTimeout = 5 * 60 * 1000;
export const sdkVersion = '0.1.0';

export class Client {
  constructor(config = {}) {
    const endpoints = resolveEndpoints(config);
    const timeout = config.timeout ?? config.Timeout ?? defaultTimeout;
    this.apiKey = config.apiKey ?? config.APIKey ?? '';
    this.baseURL = endpoints.root;
    this.apiBaseURL = endpoints.api;
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
    const controlBase = config.controlAPIBaseURL ?? config.ControlAPIBaseURL ?? '';
    const controlClient = controlBase ? new TransportClient({
      ...shared,
      baseURL: normalizeURL(controlBase),
      userAgent: `searp-js/${sdkVersion}`,
    }) : undefined;
    this.cards = new CardsService(new TransportClient({
      ...shared,
      baseURL: this.apiBaseURL,
      userAgent: `searp-js/${sdkVersion}`,
    }), controlClient);
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

    this.Sessions = goStyleService(this.sessions, {
      create: 'Create', createExperience: 'CreateExperience', get: 'Get',
      historyMessage: 'HistoryMessage', turn: 'Turn', turnStream: 'TurnStream',
      patch: 'Patch', rewind: 'Rewind', fork: 'Fork', edit: 'Edit',
    });
    this.Operations = goStyleService(this.operations, {
      run: 'Run', get: 'Get', list: 'List', recover: 'Recover', traces: 'Traces',
    });
    this.Engine = goStyleService(this.engine, {
      health: 'Health', live: 'Live', metrics: 'Metrics', capabilities: 'Capabilities', models: 'Models',
      llmStatus: 'LLMStatus', llmCheck: 'LLMCheck',
      generationModels: 'GenerationModels', createGeneration: 'CreateGeneration',
      getGeneration: 'GetGeneration', assemble: 'Assemble',
      debugChat: 'DebugChat', debugChatStream: 'DebugChatStream',
    });
    this.Cards = goStyleService(this.cards, {
      list: 'List', create: 'Create', get: 'Get', update: 'Update',
      delete: 'Delete', importCards: 'Import', importBatch: 'ImportBatch', setListing: 'SetListing',
      listVersions: 'ListVersions', getVersion: 'GetVersion',
      deleteVersion: 'DeleteVersion', updateTranslation: 'UpdateTranslation',
      restoreVersion: 'RestoreVersion', listByUser: 'ListByUser',
      listTranslations: 'ListTranslations', saveTranslations: 'SaveTranslations',
    });
    this.Versions = goStyleService(this.versions, { preview: 'Preview' });
    this.Cinema = goStyleService(this.cinema, {
      listRounds: 'ListRounds', createRound: 'CreateRound',
      createRoundStream: 'CreateRoundStream', getRound: 'GetRound',
      getImageTask: 'GetImageTask', generateImageTask: 'GenerateImageTask',
      saveImageResult: 'SaveImageResult',
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
  return { root, api };
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
