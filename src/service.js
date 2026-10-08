import { ErrGeneral, SeaRPError, decodeJSON, newHTTPError } from './errors.js';
import { buildRequestOptions } from './options.js';

export async function requestJSON(client, method, path, body, options = []) {
  return decodeJSON(await requestText(client, method, path, body, options));
}

export async function requestText(client, method, path, body, options = []) {
  const { headers, signal } = buildRequestOptions(options);
  const response = await client.request(method, path, body, headers, { signal });
  if (response.status >= 400) {
    throw newHTTPError(response.status, response.body || 'SeaRP request failed');
  }
  return response.body;
}

export async function* streamSSE(client, method, path, body, options = []) {
  const { headers, signal } = buildRequestOptions(options);
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === 'accept') delete headers[key];
  }
  headers.Accept = 'text/event-stream';
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
  let eventID = '';
  let dataLines = [];

  const emit = () => {
    if (dataLines.length === 0 && eventName === '') return null;
    const event = {
      id: eventID,
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
          eventName = line.slice(6).replace(/^ /, '');
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).replace(/^ /, ''));
        } else if (line.startsWith('id:') && !line.includes('\0')) {
          eventID = line.slice(3).replace(/^ /, '');
        }
      }
      if (done) {
        buffer = buffer.replace(/\r$/, '');
        if (buffer !== '') {
          let line = buffer;
          if (line.startsWith('event:')) eventName = line.slice(6).replace(/^ /, '');
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
          else if (line.startsWith('id:') && !line.includes('\0')) eventID = line.slice(3).replace(/^ /, '');
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
