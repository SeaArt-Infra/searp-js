import { requestJSON, streamSSE } from './service.js';

export class CinemaService {
  constructor(client) {
    this.client = client;
  }

  listRounds(sessionID, query = {}, ...options) {
    if (query?.headers || query?.signal) { options.unshift(query); query = {}; }
    const values = new URLSearchParams();
    for (const key of ['limit', 'offset']) {
      if (query[key] !== undefined && query[key] !== null) values.set(key, String(query[key]));
    }
    const encoded = values.toString();
    const suffix = encoded ? `?${encoded}` : '';
    return requestJSON(this.client, 'GET', `${path(sessionID)}/rounds${suffix}`, undefined, options);
  }

  createRound(sessionID, body, ...options) {
    return requestJSON(this.client, 'POST', `${path(sessionID)}/rounds`, body, options);
  }

  createRoundStream(sessionID, body, ...options) {
    return streamSSE(this.client, 'POST', `${path(sessionID)}/rounds`, body, options);
  }

  getRound(sessionID, roundID, ...options) {
    return requestJSON(this.client, 'GET', `${path(sessionID)}/rounds/${encodeURIComponent(roundID)}`, undefined, options);
  }

  getImageTask(sessionID, taskID, ...options) {
    return requestJSON(this.client, 'GET', `${path(sessionID)}/image-tasks/${encodeURIComponent(taskID)}`, undefined, options);
  }

  generateImageTask(taskID, body, ...options) {
    return requestJSON(this.client, 'POST', `/cinema/image-tasks/${encodeURIComponent(taskID)}/generate`, body, options);
  }

  saveImageResult(taskID, body, ...options) {
    return requestJSON(this.client, 'POST', `/cinema/image-tasks/${encodeURIComponent(taskID)}/result`, body, options);
  }
}

function path(sessionID) {
  return `/sessions/${encodeURIComponent(sessionID)}/cinema`;
}
