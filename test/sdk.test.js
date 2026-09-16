import test from 'node:test';
import assert from 'node:assert/strict';
import { Client, ErrConflict, ErrNotFound, SeaRPError, withHeader, withHeaders } from '../src/index.js';
import { defaultBaseURL, defaultAdminBaseURL, sdkVersion } from '../src/client.js';

function testClient(handler, config = {}) {
  return new Client({
    apiKey: 'test-key',
    apiBaseURL: 'https://example.com/v1',
    fetch: handler,
    ...config,
  });
}

test('exports default base URL and version', () => {
  assert.equal(defaultBaseURL, 'http://127.0.0.1:8788');
  assert.equal(defaultAdminBaseURL, 'http://127.0.0.1:8790/admin/v1');
  assert.ok(sdkVersion);
});

test('admin.health posts to /health with bearer token', async () => {
  let seen;
  const client = new Client({
    apiKey: 'test-key',
    adminBaseURL: 'https://admin.example.com/admin/v1',
    fetch: async (url, init) => {
      seen = { url: String(url), init };
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const result = await client.admin.health();
  assert.equal(result.ok, true);
  assert.equal(seen.url, 'https://admin.example.com/admin/v1/health');
  assert.equal(seen.init.method, 'GET');
  assert.equal(seen.init.headers.get('authorization'), 'Bearer test-key');
});

test('admin.getProject maps error envelope code and message', async () => {
  const client = new Client({
    apiKey: 'test-key',
    adminBaseURL: 'https://admin.example.com/admin/v1',
    fetch: async () => new Response(JSON.stringify({ error: { code: 'not_found', message: 'project not found' } }), { status: 404 }),
  });
  await assert.rejects(
    () => client.admin.getProject('missing'),
    (error) => {
      assert.ok(error instanceof SeaRPError);
      assert.equal(error.kind, ErrNotFound);
      assert.equal(error.code, 'not_found');
      assert.equal(error.message, 'project not found');
      return true;
    },
  );
});

test('sessions.create posts to /sessions with bearer token', async () => {
  let seen;
  const client = testClient(async (url, init) => {
    seen = { url: String(url), init };
    return new Response(JSON.stringify({ id: 'session-1', revision: 1 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  const session = await client.sessions.create({ user_id: 'u1', request: {} });
  assert.equal(session.id, 'session-1');
  assert.equal(seen.url, 'https://example.com/v1/sessions');
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.headers.get('authorization'), 'Bearer test-key');
});

test('sessions.get maps 404 body to SeaRPError', async () => {
  const client = testClient(async () => new Response('session not found', { status: 404 }));
  await assert.rejects(
    () => client.sessions.get('missing'),
    (error) => {
      assert.ok(error instanceof SeaRPError);
      assert.equal(error.kind, ErrNotFound);
      assert.equal(error.status, 404);
      return true;
    },
  );
});

test('operations.run maps 409 body to conflict error', async () => {
  const client = testClient(async () => new Response('stale revision', { status: 409 }));
  await assert.rejects(
    () => client.operations.run('s1', { idempotency_key: 'k' }),
    (error) => {
      assert.equal(error.kind, ErrConflict);
      return true;
    },
  );
});

test('request options add caller headers', async () => {
  let headers;
  const client = testClient(async (url, init) => {
    headers = init.headers;
    return new Response('{}', { status: 200 });
  });
  await client.sessions.get('s1', {}, withHeader('x-request-id', 'req-1'), withHeaders({ 'x-infra-user-id': 'user-1' }));
  assert.equal(headers.get('x-request-id'), 'req-1');
  assert.equal(headers.get('x-infra-user-id'), 'user-1');
});

test('operations.list encodes query parameters', async () => {
  let url;
  const client = testClient(async (requestURL) => {
    url = String(requestURL);
    return new Response(JSON.stringify({ items: [] }), { status: 200 });
  });
  await client.operations.list({ session_id: 's1', status: 'completed', limit: 20 });
  assert.match(url, /\/operations\?/);
  assert.match(url, /session_id=s1/);
  assert.match(url, /status=completed/);
  assert.match(url, /limit=20/);
});

test('session stream yields token and done events', async () => {
  const client = testClient(async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: token\ndata: Hel\n\nevent: token\ndata: lo\n\nevent: done\ndata: s1\n\n'));
        controller.close();
      },
    });
    return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  });

  const events = client.sessions.turnStream('s1', { action: 'reply', text: 'hello', stream: true });
  const seen = [];
  for await (const event of events) {
    seen.push(event);
  }
  assert.deepEqual(seen.map((event) => event.event), ['token', 'token', 'done']);
  assert.equal(seen.filter((event) => event.event === 'token').map((event) => event.data).join(''), 'Hel' + 'lo');
  assert.equal(seen[2].done, true);
});
