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

## Release API additions (2026-11-17)

Use `client.groupCards` for story cards, immutable versions, members,
imports, preview and translations. Use `client.groupSessions` for creating group
sessions, generating JSON/SSE turns, querying turn records and prompts.
Member removals require a JSON body with `user_id` and
`expected_latest_version`. Group generation accepts either plain-text
`content` or OpenAI `message` content parts, plus per-call
`style_prompt_override`, and supports a
stable `Idempotency-Key` header; preserve the key and original input on retry.
JSON responses include the flattened session revision and group `turn.segments`.
The shared SSE parser also exposes `segment_*` and `parser_warning` events.
Read history through the ordinary session get method.

Turns and Cinema rounds also accept `style_prompt_override` for a one-call
style replacement. Debug chat accepts top-level `lang` to override the card
language for that call. JSON generation retries transient 408/429/5xx failures
once on the same model; SSE does not retry, and cross-model fallback is removed.

`client.sessions.inspiration` returns positive/neutral player reply
suggestions. It accepts an empty body or per-call language and sampling,
changes no history/revision, and has no SSE or idempotency. Every retry calls
the model again. `client.cards.untranslated` queries missing
translations; `forkTranslations` copies existing catalog translations.
Use `client.sessions.customTask` for read-only caller-supplied PE work,
`client.cards.translate` for model-backed card translation, and
`client.worldBooks` for project/catalog world books.
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
