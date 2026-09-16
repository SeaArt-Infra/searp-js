import test from 'node:test';
import assert from 'node:assert/strict';
import { AdminService } from '../src/admin.js';
import { TransportClient } from '../src/transport.js';
import { ErrNotFound, SeaRPError } from '../src/errors.js';

function adminService(handler) {
  return new AdminService(new TransportClient({
    apiKey: 'test-key',
    baseURL: 'https://admin.example.com/admin/v1',
    userAgent: 'searp-js/test',
    fetch: handler,
  }));
}

test('admin.health posts to /health with bearer token', async () => {
  let seen;
  const service = adminService(async (url, init) => {
    seen = { url: String(url), init };
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  const result = await service.health();
  assert.equal(result.ok, true);
  assert.equal(seen.url, 'https://admin.example.com/admin/v1/health');
  assert.equal(seen.init.method, 'GET');
  assert.equal(seen.init.headers.get('authorization'), 'Bearer test-key');
});

test('admin.getProject maps error envelope code and message', async () => {
  const service = adminService(async () => new Response(
    JSON.stringify({ error: { code: 'not_found', message: 'project not found' } }),
    { status: 404 },
  ));
  await assert.rejects(
    () => service.getProject('missing'),
    (error) => {
      assert.ok(error instanceof SeaRPError);
      assert.equal(error.kind, ErrNotFound);
      assert.equal(error.code, 'not_found');
      assert.equal(error.message, 'project not found');
      return true;
    },
  );
});

test('admin project and catalog paths match control-plane routes', async () => {
  const seen = [];
  const service = adminService(async (url) => {
    seen.push(String(url));
    if (String(url).endsWith('/cover')) {
      return new Response('png-bytes', { status: 200, headers: { 'content-type': 'image/png' } });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });

  await service.listProjectVersions('p1', { cursor: '2' });
  await service.diffProjectVersion('p1', 'v1', 'v0');
  const cover = await service.getCatalogCardCover('card-1');
  assert.equal(seen[0], 'https://admin.example.com/admin/v1/projects/p1/versions?cursor=2');
  assert.equal(seen[1], 'https://admin.example.com/admin/v1/projects/p1/versions/v1/diff?against=v0');
  assert.equal(seen[2], 'https://admin.example.com/admin/v1/catalog/card-1/cover');
  assert.equal(cover, 'png-bytes');
});
