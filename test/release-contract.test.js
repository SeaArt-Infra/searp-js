import test from 'node:test';
import assert from 'node:assert/strict';
import { Client, GroupCardsService, GroupSessionsService, withHeader } from '../src/index.js';

test('group cards preserve filters, localization, member CAS bodies and aliases', async () => {
  const calls = [];
  const client = new Client({ apiKey: 'test', fetch: async (url, init) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body && JSON.parse(init.body), headers: init.headers });
    return new Response('{}');
  } });
  assert.ok(client.groupCards instanceof GroupCardsService);
  assert.ok(client.groupSessions instanceof GroupSessionsService);
  const g = client.GroupCards;
  const caller = withHeader('x-request-id', 'req1');
  await g.List({ q: 'harbor & stars', listed: false, include_deleted: false, offset: 0 }, caller);
  await g.Create({ user_id: 'owner', title: 'Story', members: [{ card_id: 'a' }, { card_id: 'b' }] });
  await g.Get('g/1', { lang: 'zh' }, caller);
  await g.Update('g/1', { expected_latest_version: 3, title: 'Story 2' });
  await g.SetListing('g/1', { listed: false });
  await g.ListVersions('g/1');
  await g.GetVersion('g/1', 3, { lang: 'ja' });
  await g.ListMembers('g/1');
  await g.AddMember('g/1', { user_id: 'owner', card_id: 'c' });
  const cas = { user_id: 'owner', expected_latest_version: 3, status: 'removed' };
  await g.UpdateMember('g/1', 'tipsy:a/b', cas);
  await g.RemoveMember('g/1', 'tipsy:a/b', cas);
  await g.ExtractCharacters('g/1', {});
  await g.Preview('g/1', {});
  await g.Import({ user_id: 'owner', source: {}, dry_run: true });
  await g.ListTranslations('g/1', 3);
  await g.SaveTranslations('g/1', 3, { lang: 'zh', translations: { title: '故事' } });
  await g.Delete('g/1');
  assert.equal(calls[0].url.searchParams.get('listed'), 'false');
  assert.equal(calls[0].url.searchParams.get('include_deleted'), 'false');
  assert.equal(calls[0].url.searchParams.get('offset'), '0');
  assert.equal(calls[0].url.searchParams.get('q'), 'harbor & stars');
  assert.equal(calls[2].url.pathname, '/v1/group-cards/g%2F1');
  assert.equal(calls[2].url.searchParams.get('lang'), 'zh');
  assert.equal(calls[6].url.searchParams.get('lang'), 'ja');
  assert.equal(calls[10].method, 'DELETE');
  assert.equal(calls[10].url.pathname, '/v1/group-cards/g%2F1/members/tipsy%3Aa%2Fb');
  assert.deepEqual(calls[10].body, cas);
  assert.equal(calls[0].headers.get('x-request-id'), 'req1');
  assert.equal(calls[2].headers.get('x-request-id'), 'req1');
});

test('group turn keeps flattened snapshot, segments and nullable evidence', async () => {
  const client = new Client({ fetch: async (url, init) => {
    assert.equal(new URL(url).pathname, '/v1/sessions/s1/group/turns');
    assert.equal(init.headers.get('idempotency-key'), 'turn1');
    assert.deepEqual(JSON.parse(init.body), { content: 'Hi', expected_revision: 3 });
    return new Response('{"id":"s1","revision":4,"execution":{},"usage":null,"operation":{"id":"turn1"},"turn":{"segments":[{"speaker_valid":true}],"parser_warnings":[]}}');
  } });
  const out = await client.GroupSessions.Turn('s1', { content: 'Hi', expected_revision: 3 }, withHeader('Idempotency-Key', 'turn1'));
  assert.equal(out.revision, 4);
  assert.equal(out.usage, null);
  assert.equal(out.turn.segments[0].speaker_valid, true);
});

test('group SSE preserves all event types, event IDs, multiline done and errors', async () => {
  const names = ['operation', 'segment_start', 'token', 'segment_delta', 'segment_end', 'parser_warning', 'usage', 'done', 'error'];
  const client = new Client({ fetch: async (url, init) => {
    assert.equal(new URL(url).pathname, '/v1/sessions/s1/group/turns');
    assert.equal(init.headers.get('accept'), 'text/event-stream');
    assert.equal(init.headers.get('last-event-id'), 'evt-1');
    const data = names.map(name => `id: evt-2\nevent: ${name}\ndata: ${name === 'done' ? 's1\ndata:  Hi ' : '{}'}\n\n`).join('');
    return new Response(data, { headers: { 'content-type': 'text/event-stream' } });
  } });
  const events = [];
  for await (const event of client.GroupSessions.TurnStream('s1', { content: 'Hi' }, withHeader('Last-Event-ID', 'evt-1'))) events.push(event);
  assert.deepEqual(events.map(e => e.event), names);
  assert.equal(events[7].data, 's1\n Hi ');
  assert.ok(events[7].done);
  assert.equal(events[8].id, 'evt-2');
});

test('release JSON helpers preserve empty inspiration, partial translation failures and descending rounds', async () => {
  const calls = [];
  const client = new Client({ controlAPIBaseURL: 'https://control.example/admin/v1', fetch: async (url, init) => {
    calls.push({ url: new URL(url), body: init.body && JSON.parse(init.body) });
    if (new URL(url).pathname.endsWith('/inspiration')) return new Response('{"replies":[{"style":"positive","text":"Yes"},{"style":"neutral","text":"Maybe"}],"usage":null}');
    return new Response('{"items":[],"errors":[{"code":"missing_source"}]}');
  } });
  assert.equal((await client.Sessions.Inspiration('s1')).usage, null);
  await client.Cards.Untranslated({ locale: 'zh-CN', include_partial: false, offset: 0 });
  assert.equal((await client.Cards.ForkTranslations({ items: [] })).errors[0].code, 'missing_source');
  await client.Cinema.ListRounds('s1', { order: 'desc', limit: 1, offset: 0 });
  await client.Cards.Fork('p/1', { catalog_ids: ['c1'] });
  await client.GroupSessions.Prompt('s1', { turn_id: 'a/b&c' });
  await client.GroupSessions.GetTurn('s1', 'a/b');
  await client.GroupSessions.Create({ group_id: 'g1', user_id: 'u1' });
  assert.deepEqual(calls[0].body, {});
  assert.equal(calls[1].url.searchParams.get('include_partial'), 'false');
  assert.equal(calls[1].url.searchParams.get('offset'), '0');
  assert.equal(calls[3].url.searchParams.get('order'), 'desc');
  assert.equal(calls[4].url.href, 'https://control.example/admin/v1/projects/p%2F1/cards/fork');
  assert.equal(calls[5].url.searchParams.get('turn_id'), 'a/b&c');
  assert.equal(calls[6].url.pathname, '/v1/sessions/s1/group/turns/a%2Fb');
  assert.equal(calls[7].url.pathname, '/v1/group-sessions');
});
