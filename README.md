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

<script
  type="text/plain"
  data-doc-skill
  data-doc-skill-id="searp-js"
  data-doc-skill-label="SeaRP JavaScript SDK"
  data-doc-skill-filename="searp-js-SKILL.md"
  data-doc-skill-version="1"
>
---
name: searp-js
description: Build and troubleshoot SeaRP engine integrations with the searp_js client. Use when creating role-play sessions, running chat turns or streaming replies, using idempotent operations, importing cards, previewing versions, assembling prompts, generating images, or debugging chats from Node.js.
---

# SeaRP JavaScript SDK

Use `searp_js` to call the SeaRP engine `/v1` API from an ESM Node.js 18+
project.

## Install

```bash
npm install https://github.com/SeaArt-Infra/searp-js.git
```

## Workflow

1. Create one `Client` with the project bearer token and reuse it.
2. Use `client.sessions` for sessions/turns, `client.operations` for idempotent
   paid generation, `client.engine` for models/generations/assemble/debug chat,
   and the remaining services for cards, versions, and cinema.
3. Prefer the operations API with a stable idempotency key for paid chat.
4. HTTP 200 does not guarantee a generated reply; inspect operation `status`.
5. Pass request-specific SeaInfra attribution headers with `withHeaders`.

## Initialize Client

```js
import { Client } from 'searp_js';

const client = new Client({
  apiKey: 'rp-your-project-token',
  baseURL: 'https://rp.example.com',
});
```

## Create A Session

```js
const session = await client.sessions.create({
  user_id: 'user-123',
  request: {
    character: { name: 'Ada', gender: 2 },
    style: 1,
    lang: 'en',
  },
});
```

Use `client.sessions.createExperience` only when the project has already
published an experience version.

## Create A Role Card Session

```js
const card = await client.cards.create({
  user_id: 'user-123',
  name: 'Ada',
  gender: 2,
  introduction: 'Port pilot',
  greeting: 'Welcome to the fog harbor.',
  background: 'Knows the tides and shipping lanes.',
  lang: 'en',
});

const session = await client.sessions.create({
  user_id: 'user-123',
  card_id: card.id,
});
```

Omit `card_version` to pin the latest card version. Use `client.cards.list`,
`client.cards.get`, `client.cards.update`, and `client.cards.delete` to
maintain cards.

## Run A Reply

```js
const op = await client.operations.run(session.id, {
  idempotency_key: 'reply-001',
  action: 'reply',
  text: 'Hello.',
  expected_revision: session.revision,
});
```

For streaming, use `client.sessions.turnStream` and stop on `done`.

## Errors

Catch `SeaRPError` and branch on `error.kind`. `ErrConflict` usually means a
stale `expected_revision` or an idempotency key reused with different input.

## Route Reference

- `sessions.create`, `createExperience`, `get`, `historyMessage`, `turn`,
  `turnStream`, `patch`, `rewind`, `fork`, `edit`
- `operations.run`, `get`, `list`, `recover`, `traces`
- `engine.health`, `capabilities`, `models`, `llmStatus`, `llmCheck`,
  `generationModels`, `createGeneration`, `getGeneration`, `assemble`,
  `debugChat`, `debugChatStream`
- `cards.list`, `create`, `get`, `update`, `delete`, `importCards`,
  `setListing`, `listVersions`, `getVersion`, `deleteVersion`,
  `updateTranslation`, `restoreVersion`, `listByUser`
- `versions.preview`
- `cinema.listRounds`, `createRound`, `createRoundStream`, `getRound`,
  `getImageTask`, `generateImageTask`, `saveImageResult`
</script>
