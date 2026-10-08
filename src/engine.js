import { requestJSON, requestText, streamSSE } from './service.js';

export class EngineService {
  constructor(client) {
    this.client = client;
  }

  health(...options) {
    return requestJSON(this.client, 'GET', '/health', undefined, options);
  }

  live(...options) {
    return requestJSON(this.client, 'GET', '/live', undefined, options);
  }

  metrics(...options) {
    return requestText(this.client, 'GET', '/metrics', undefined, options);
  }

  capabilities(...options) {
    return requestJSON(this.client, 'GET', '/capabilities', undefined, options);
  }

  models(...options) {
    return requestJSON(this.client, 'GET', '/models', undefined, options);
  }

  llmStatus(...options) {
    return requestJSON(this.client, 'GET', '/llm', undefined, options);
  }

  llmCheck(body = {}, ...options) {
    return requestJSON(this.client, 'POST', '/llm/check', body, options);
  }

  generationModels(...options) {
    return requestJSON(this.client, 'GET', '/generations/models', undefined, options);
  }

  createGeneration(body, ...options) {
    return requestJSON(this.client, 'POST', '/generations', body, options);
  }

  getGeneration(id, ...options) {
    return requestJSON(this.client, 'GET', `/generations/${encodeURIComponent(id)}`, undefined, options);
  }

  assemble(body, ...options) {
    return requestJSON(this.client, 'POST', '/assemble', body, options);
  }

  debugChat(body, ...options) {
    return requestJSON(this.client, 'POST', '/debug/chat', body, options);
  }

  debugChatStream(body, ...options) {
    return streamSSE(this.client, 'POST', '/debug/chat', body, options);
  }
}
