import test from 'node:test';
import assert from 'node:assert/strict';
import { Client, ErrConflict, ErrNotFound, SeaRPError, withHeader, withHeaders } from '../src/index.js';
import { defaultBaseURL, sdkVersion } from '../src/client.js';

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
  assert.ok(sdkVersion);
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

  const session = await client.sessions.create({ user_id: 'u1', card_id: 'c1' });
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

test('card paging, localized versions, translations and restore preserve the contract', async () => {
  const calls = [];
  const client = testClient(async (url, init) => {
    calls.push({ url: new URL(url), init, body: init.body ? JSON.parse(init.body) : undefined });
    return new Response('{}');
  });
  const caller = withHeader('x-request-id', 'req-1');
  await client.cards.list({ limit: 20, offset: 0 });
  await client.cards.listByUser('u1', { limit: 20, offset: 0 });
  await client.cards.listVersions('c1', { limit: 20, before_version: 7 }, caller);
  await client.cards.getVersion('c1', 3, { lang: 'zh' }, caller);
  await client.cards.listVersions('c1', caller);
  await client.cards.getVersion('c1', 3, caller);
  await client.Cards.ListTranslations('c1', 3);
  const body = { user_id: 'u1', expected_latest_version: 7, lang: 'zh', translations: { name: '艾达' } };
  await client.Cards.SaveTranslations('c1', 3, body, caller);
  await client.cards.restoreVersion('c1', 3, { expected_latest_version: 7, change_note: 'restore' }, caller);
  assert.equal(calls[0].url.searchParams.get('offset'), '0');
  assert.equal(calls[1].url.searchParams.get('limit'), '20');
  assert.equal(calls[2].url.searchParams.get('before_version'), '7');
  assert.equal(calls[3].url.searchParams.get('lang'), 'zh');
  for (const index of [2, 3, 4, 5, 7, 8]) assert.equal(calls[index].init.headers.get('x-request-id'), 'req-1');
  assert.equal(calls[6].url.pathname, '/v1/cards/c1/versions/3/translations');
  assert.equal(calls[7].init.method, 'POST');
  assert.deepEqual(calls[7].body, body);
  assert.deepEqual(calls[8].body, { expected_latest_version: 7, change_note: 'restore' });
  assert.throws(() => client.cards.restoreVersion('c1', 3), /expected_latest_version/);
});

test('liveness is JSON, metrics are text, and JSON errors retain session evidence', async () => {
  const client = testClient(async (url) => {
    if (new URL(url).pathname.endsWith('/live')) return new Response('{"status":"live"}');
    if (new URL(url).pathname.endsWith('/metrics')) return new Response('searp_requests_total 1\n');
    return new Response('{"error":{"code":"invalid","message":"unknown field"},"session_id":"s1"}', { status: 422 });
  });
  assert.equal((await client.Engine.Live()).status, 'live');
  assert.equal(await client.Engine.Metrics(), 'searp_requests_total 1\n');
  await assert.rejects(() => client.engine.debugChat({}), error => {
    assert.equal(error.kind, 'invalid');
    assert.equal(error.code, 'invalid');
    assert.equal(error.message, 'unknown field');
    assert.equal(error.sessionId, 's1');
    assert.equal(error.payload.session_id, 's1');
    return true;
  });
});

test('cinema streams negotiate SSE and expose event IDs without losing spaces', async () => {
  const client = testClient(async (url, init) => {
    assert.equal(init.headers.get('accept'), 'text/event-stream');
    assert.equal(init.headers.get('last-event-id'), 'evt-1');
    assert.equal(init.headers.get('idempotency-key'), 'round-1');
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({ start(controller) {
      for (const text of ['id: evt-', '2\r\nevent: cinema\r\ndata:  leading and trailing  \r\n\r\n', 'event: done\ndata: finished']) controller.enqueue(encoder.encode(text));
      controller.close();
    }}));
  });
  const events = [];
  for await (const event of client.cinema.createRoundStream('s1', { content: 'go' }, withHeaders({ 'Last-Event-ID': 'evt-1', 'Idempotency-Key': 'round-1' }))) events.push(event);
  assert.equal(events[0].id, 'evt-2');
  assert.equal(events[0].data, ' leading and trailing  ');
  assert.equal(events[1].data, 'finished');
  assert.ok(events[1].done);
});

test('cinema round lists page arrays and retain legacy request options', async () => {
  const calls = [];
  const client = testClient(async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response('[{"round_id":"r1","cost":"0.01"}]');
  });
  const caller = withHeader('x-request-id', 'req-1');
  const rounds = await client.cinema.listRounds('s1', { limit: 20, offset: 0 }, caller);
  await client.cinema.listRounds('s1', caller);
  assert.equal(rounds[0].round_id, 'r1');
  assert.equal(calls[0].url.searchParams.get('offset'), '0');
  assert.equal(calls[0].url.searchParams.get('limit'), '20');
  assert.equal(calls[1].init.headers.get('x-request-id'), 'req-1');
});

test('batch import uses explicit Control API with the project token', async () => {
  const body = { cards: [{ name: 'Ada', introduction: 'Pilot', greeting: 'Hi', background: 'Harbor' }] };
  const client = testClient(async (url, init) => {
    assert.equal(String(url), 'https://control.example/admin/v1/cards/import/batch');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.get('authorization'), 'Bearer test-key');
    assert.equal(init.headers.get('x-request-id'), 'req-1');
    assert.deepEqual(JSON.parse(init.body), body);
    return new Response('{"items":[{"id":"c1"}]}', { status: 201 });
  }, { controlAPIBaseURL: 'https://control.example/admin/v1/' });
  assert.equal((await client.Cards.ImportBatch(body, withHeader('x-request-id', 'req-1'))).items[0].id, 'c1');
  assert.throws(() => testClient(async () => {}).cards.importBatch(body), /controlAPIBaseURL/);
});

test('chat passes multimodal and per-turn options unchanged and retains imported-history evidence', async () => {
  const message = [{ type: 'text', text: 'what?' }, { type: 'image_url', image_url: { url: 'https://cdn.example/a.png', detail: 'auto' } }];
  const body = { action: 'reply', message, lang: 'zh', lastest_system_prompt: 'brief', favorability_score: 45, user: { name: 'Visitor' }, metadata: { history: [{ role: 'user', content: 'hi' }] }, top_p: 0.9, thinking_mode: true };
  const client = testClient(async (url, init) => {
    assert.deepEqual(JSON.parse(init.body), body);
    return new Response(JSON.stringify({ history: [{ role: 'user', content: message }], history_import: { seeded: { messages: 1, dropped: 0 } }, prompt_redacted: true }));
  });
  const result = await client.sessions.turn('s1', body);
  assert.deepEqual(result.history[0].content, message);
  assert.equal(result.history_import.seeded.messages, 1);
  assert.ok(result.prompt_redacted);
});
