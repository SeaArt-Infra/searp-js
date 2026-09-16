import { ErrGeneral, SeaRPError, decodeJSON, newHTTPError } from './errors.js';
import { buildRequestOptions } from './options.js';

export async function requestJSON(client, method, path, body, options = []) {
  const { headers, signal } = buildRequestOptions(options);
  const response = await client.request(method, path, body, headers, { signal });
  if (response.status >= 400) {
    throw newHTTPError(response.status, response.body || 'SeaRP request failed');
  }
  return decodeJSON(response.body);
}

export async function* streamSSE(client, method, path, body, options = []) {
  const { headers, signal } = buildRequestOptions(options);
  const response = await client.requestStream(method, path, body, headers, { signal });
  if (response.status >= 400) {
    const text = await response.text();
    throw newHTTPError(response.status, text || 'SeaRP request failed');
  }
  if (!response.body) {
    throw new SeaRPError({ kind: ErrGeneral, message: 'stream response body is unavailable' });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let eventName = '';
  let dataLines = [];

  const emit = () => {
    if (dataLines.length === 0 && eventName === '') return null;
    const event = {
      event: eventName,
      data: dataLines.join('\n'),
      done: eventName === 'done',
      error: null,
    };
    eventName = '';
    dataLines = [];
    return event;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        let line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);
        if (line === '') {
          const event = emit();
          if (event) yield event;
          continue;
        }
        if (line.startsWith(':')) continue;
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
      if (done) {
        buffer = buffer.replace(/\r$/, '');
        if (buffer !== '') {
          let line = buffer;
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
        }
        const event = emit();
        if (event) yield event;
        return;
      }
    }
  } catch (error) {
    if (error instanceof SeaRPError) throw error;
    throw new SeaRPError({ kind: ErrGeneral, message: `stream read failed: ${error?.message ?? String(error)}` });
  } finally {
    reader.releaseLock();
  }
}
