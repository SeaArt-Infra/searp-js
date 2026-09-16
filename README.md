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

const session = await client.sessions.create({
  user_id: 'visitor-1',
  request: {
    character: { name: 'Ada', gender: 2 },
    style: 1,
    lang: 'en',
  },
}, withHeader('x-request-id', 'request-1'));
console.log(session.id);
```

`baseURL` defaults to `http://127.0.0.1:8788`; the API base is derived as
`<baseURL>/v1` unless it already ends in `/v1`.

`sessions.create` is the general session entry point. Use
`sessions.createExperience` only when the project has already published an
experience version.

## Services

| Service | Purpose |
| --- | --- |
| `client.sessions` | Sessions, history, turns, rewind/fork/edit |
| `client.operations` | Idempotent paid operations, recovery, traces |
| `client.engine` | Health, models, generations, assemble, debug chat |
| `client.cards` | Role-card CRUD, versions, translations |
| `client.versions` | Version preview |
| `client.cinema` | Cinema rounds and image tasks |

## Role Card Session

Create a role card with `client.cards.create`, then open a session from that
card:

```js
const card = await client.cards.create({
  user_id: 'visitor-1',
  name: 'Ada',
  gender: 2,
  introduction: 'Port pilot',
  greeting: 'Welcome to the fog harbor.',
  background: 'Knows the tides and shipping lanes.',
  lang: 'en',
});

const session = await client.sessions.create({
  user_id: 'visitor-1',
  card_id: card.id,
});
console.log(session.id);
```

`card_version` is optional; omit it to pin the latest card version. Use
`client.cards.list`, `client.cards.get`, `client.cards.update`, and
`client.cards.delete` to maintain cards.

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
