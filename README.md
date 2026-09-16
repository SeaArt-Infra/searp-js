# SeaRP JavaScript SDK

Node.js ESM client for the SeaRP engine HTTP API.

## Install

```bash
npm install https://github.com/SeaArt-Infra/searp-js.git
```

Requirements:

- Node.js 18+
- ESM project

## Quick Start

```js
import { Client, withHeader } from 'searp_js';

const client = new Client({
  apiKey: 'rp-your-project-token',
  baseURL: 'https://rp.example.com',
});

const session = await client.sessions.createExperience({
  user_id: 'visitor-1',
}, withHeader('x-request-id', 'request-1'));
console.log(session.id);
```

`baseURL` defaults to `http://127.0.0.1:8788`; the API base is derived as
`<baseURL>/v1` unless it already ends in `/v1`.

The control-plane client is configured separately. With a custom engine
`baseURL`, `adminBaseURL` defaults to `<baseURL>/admin/v1`; with the default
engine URL it defaults to `http://127.0.0.1:8790/admin/v1`.

## Services

| Service | Purpose |
| --- | --- |
| `client.sessions` | Sessions, history, turns, rewind/fork/edit |
| `client.operations` | Idempotent paid operations, recovery, traces |
| `client.engine` | Health, models, generations, assemble, debug chat |
| `client.cards` | Role-card CRUD, versions, translations |
| `client.versions` | Version preview |
| `client.cinema` | Cinema rounds and image tasks |
| `client.admin` | Gateway health, identity, projects, and project live settings |

## Chat Turn

```js
const turn = await client.sessions.turn(session.id, {
  action: 'reply',
  text: 'Hello.',
  expected_revision: session.revision,
}, withHeaders({
  'x-infra-project-id': projectId,
  'x-infra-user-id': userId,
  'x-request-id': requestId,
}));
```

For SSE streaming:

```js
for await (const event of client.sessions.turnStream(session.id, {
  action: 'reply',
  text: 'Hello.',
  stream: true,
})) {
  if (event.done) break;
  if (event.event === 'token') process.stdout.write(event.data);
}
```

## Control Plane

```js
const health = await client.admin.health();
const whoami = await client.admin.whoami();
const projects = await client.admin.listProjects();
const project = await client.admin.getProject('project-id');
const live = await client.admin.updateProjectLive('project-id', {
  model: 'your-model',
  expected_revision: 3,
});
```

`client.admin.request(method, path, body, ...options)` exposes the full
`/admin/v1` surface for endpoints without a typed method. Admin error
responses follow `{"error":{"code":"...","message":"..."}}`; the SDK exposes
the envelope code as `error.code`.

## Errors

Inspect `error.kind` and `error.status`:

```js
import { SeaRPError } from 'searp_js';

try {
  await client.sessions.get('missing');
} catch (error) {
  if (error instanceof SeaRPError) {
    console.log(error.kind, error.code, error.status);
  }
}
```

## Development

```bash
npm test
```
