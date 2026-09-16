import { requestJSON } from './service.js';

export class VersionsService {
  constructor(client) {
    this.client = client;
  }

  preview(id, body, ...options) {
    return requestJSON(this.client, 'POST', `/versions/${encodeURIComponent(id)}/preview`, body, options);
  }
}
