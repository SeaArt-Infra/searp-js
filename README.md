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
  card_info: {
    name: 'Ada', gender: 2,
    introduction: 'Port pilot',
    greeting: 'Welcome to the fog harbor.',
    background: 'Knows the tides and shipping lanes.',
    lang: 'en',
  },
}, withHeader('x-request-id', 'request-1'));
console.log(session.id);
```

`baseURL` defaults to `http://127.0.0.1:8788`; the API base is derived as
`<baseURL>/v1` unless it already ends in `/v1`.

`sessions.create` accepts `card_id`, inline `card_info`, or `version_id`.
Use `engine.debugChat` for temporary card/sampling configurations;
`request` and sampling fields are rejected by `sessions.create`.
`sessions.createExperience` opens the currently published experience version.

See [API reference](API_REFERENCE.md) for all routes, pagination, translations,
multimodal input, per-turn parameters, and migration notes.

## Release API update

Aligned with SeaRP release API docs `af4e254` on 2026-10-23. The SDK now
covers group story cards and sessions, player inspiration suggestions, missing
translation queries, translation reuse, catalog fork and Cinema order.

```js
const suggestions = await client.sessions.inspiration(session.id, { lang: 'zh' });
console.log(suggestions.replies);

const group = await client.groupSessions.create({
  group_id: groupId, user_id: 'visitor-1', mode: 'group_chat',
});
const turn = await client.groupSessions.turn(group.id, {
  content: 'Hello everyone.', expected_revision: group.revision,
}, withHeader('Idempotency-Key', 'group-turn-001'));
console.log(turn.revision, turn.turn.segments);
```

Import `withHeader` from `searp_js` for per-request headers.

Use `client.groupSessions.turnStream` for group SSE.
Handle segment events, errors and disconnects; only done confirms completion.
Inspiration changes no history and calls the model again on each retry.

`POST /v1/cards` is deprecated and scheduled to sunset on 2027-01-01.
The role-card creation example below remains for existing integrations.
For catalog cards, configure `controlAPIBaseURL` and call
`client.cards.fork` with a project ID and `catalog_ids`; inspect
both `items` and `errors`. See [API reference](API_REFERENCE.md) for route
coverage, import-document differences, group request fields and recovery.

## Services

| Service | Purpose |
| --- | --- |
| `client.sessions` | Sessions, history, turns, rewind/fork/edit |
| `client.operations` | Idempotent paid operations, recovery, traces |
| `client.engine` | Health, models, generations, assemble, debug chat |
| `client.cards` | Role-card CRUD, versions, translations |
| `client.versions` | Version preview |
| `client.cinema` | Cinema rounds and image tasks |

## Legacy Role Card Creation

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
  card_info: {
    name: 'Ada', gender: 2,
    introduction: 'Port pilot',
    greeting: 'Welcome to the fog harbor.',
    background: 'Knows the tides and shipping lanes.',
    lang: 'en',
  },
});
```

Use `card_id`, `card_info`, or `version_id` with `sessions.create`;
use `engine.debugChat` with `card_info` for temporary sampling/configuration.
`sessions.create` rejects a nested `request`.
Use `client.sessions.createExperience` for the currently published version.

## Legacy Role Card Creation

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

## Release API additions (2026-10-23)

Use `client.groupCards` for story cards, immutable versions, members,
imports, preview and translations. Use `client.groupSessions` for creating group
sessions, generating JSON/SSE turns, querying turn records and prompts.
Member removals require a JSON body with `user_id` and
`expected_latest_version`. Group generation takes `content` and supports a
stable `Idempotency-Key` header; preserve the key and original input on retry.
JSON responses include the flattened session revision and group `turn.segments`.
The shared SSE parser also exposes `segment_*` and `parser_warning` events.
Read history through the ordinary session get method.

`client.sessions.inspiration` returns positive/neutral player reply
suggestions. It accepts an empty body or per-call language and sampling,
changes no history/revision, and has no SSE or idempotency. Every retry calls
the model again. `client.cards.untranslated` queries missing
translations; `forkTranslations` copies existing catalog translations.
Check per-item errors even when HTTP is 200.

Card creation is deprecated with sunset 2027-01-01; existing create examples
are for compatibility. Use catalog fork with `catalog_ids` and an explicit
Control API base for onboarding published cards. Legacy batch-import is kept
for older deployments. Consult API_REFERENCE.md for import payload differences
between the release documents and registered handlers.
Cinema lists support descending offset order; returned arrays remain sorted
by ascending sequence. Recover abandon always needs
`acknowledge_unknown: true`; use operation revision for recovery and session
revision for generation. Terminal operation evidence defaults to 7 hours.

## Route Reference

- `sessions.create`, `createExperience`, `get`, `historyMessage`, `turn`,
  `turnStream`, `proactive`, `proactiveStream`, `inspiration`, `patch`, `rewind`, `fork`, `edit`
- `operations.run`, `get`, `list`, `recover`, `traces`
- `engine.health`, `live`, `metrics`, `capabilities`, `models`, `llmStatus`, `llmCheck`,
  `generationModels`, `createGeneration`, `getGeneration`, `assemble`,
  `debugChat`, `debugChatStream`
- `cards.list`, `create`, `get`, `update`, `delete`, `importCards`,
  `setListing`, `listVersions`, `getVersion`, `deleteVersion`,
  `updateTranslation`, `restoreVersion`, `listTranslations`, `saveTranslations`, `importBatch`, `listByUser`
- `versions.preview`
- `cinema.listRounds`, `createRound`, `createRoundStream`, `getRound`,
  `getImageTask`, `generateImageTask`, `saveImageResult`

- `cards.untranslated`, `forkTranslations`, `fork`
- `groupCards`: CRUD, listing, versions, roster, characters, preview, import, translations
- `groupSessions`: create, turn, turn stream, get turn, prompt
</script>
