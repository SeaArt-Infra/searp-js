# SeaRP API reference

Synced with the SeaRP engine and project batch-import contract on 2026-10-08.
Paths below are relative to the engine `/v1` base; batch import uses `/admin/v1`.

## Routes

| Method | Path | Client method |
| --- | --- | --- |
| GET | `/health` | `engine.health` |
| GET | `/live` | `engine.live` |
| GET | `/metrics` | `engine.metrics` |
| GET | `/capabilities` | `engine.capabilities` |
| GET | `/models` | `engine.models` |
| GET | `/llm` | `engine.llmStatus` |
| POST | `/llm/check` | `engine.llmCheck` |
| GET | `/generations/models` | `engine.generationModels` |
| POST | `/generations` | `engine.createGeneration` |
| GET | `/generations/{id}` | `engine.getGeneration` |
| POST | `/assemble` | `engine.assemble` |
| POST | `/debug/chat` | `engine.debugChat / debugChatStream` |
| POST | `/sessions` | `sessions.create` |
| POST | `/experience/sessions` | `sessions.createExperience` |
| GET | `/sessions/{id}` | `sessions.get` |
| PATCH | `/sessions/{id}` | `sessions.patch` |
| GET | `/sessions/{id}/history/{index}` | `sessions.historyMessage` |
| POST | `/sessions/{id}/turns` | `sessions.turn / turnStream` |
| POST | `/sessions/{id}/rewind` | `sessions.rewind` |
| POST | `/sessions/{id}/fork` | `sessions.fork` |
| POST | `/sessions/{id}/edit` | `sessions.edit` |
| POST | `/sessions/{id}/operations` | `operations.run` |
| GET | `/operations` | `operations.list` |
| GET | `/operations/{id}` | `operations.get` |
| POST | `/operations/{id}/recover` | `operations.recover` |
| GET | `/traces` | `operations.traces` |
| POST | `/versions/{id}/preview` | `versions.preview` |
| GET | `/cards` | `cards.list` |
| POST | `/cards` | `cards.create` |
| GET | `/cards/{id}` | `cards.get` |
| PATCH | `/cards/{id}` | `cards.update` |
| DELETE | `/cards/{id}` | `cards.delete` |
| POST | `/cards/import` | `cards.importCards` |
| PATCH | `/cards/{id}/listing` | `cards.setListing` |
| GET | `/users/{user_id}/cards` | `cards.listByUser` |
| GET | `/cards/{id}/versions` | `cards.listVersions` |
| GET | `/cards/{id}/versions/{version}` | `cards.getVersion` |
| DELETE | `/cards/{id}/versions/{version}` | `cards.deleteVersion` |
| POST | `/cards/{id}/versions/{version}/restore` | `cards.restoreVersion` |
| PATCH | `/cards/{id}/versions/{version}/translations/{lang}/{field}` | `cards.updateTranslation` |
| GET | `/cards/{id}/versions/{version}/translations` | `cards.listTranslations` |
| POST | `/cards/{id}/versions/{version}/translations` | `cards.saveTranslations` |
| GET | `/sessions/{id}/cinema/rounds` | `cinema.listRounds` |
| POST | `/sessions/{id}/cinema/rounds` | `cinema.createRound / createRoundStream` |
| GET | `/sessions/{id}/cinema/rounds/{round_id}` | `cinema.getRound` |
| GET | `/sessions/{id}/cinema/image-tasks/{task_id}` | `cinema.getImageTask` |
| POST | `/cinema/image-tasks/{task_id}/generate` | `cinema.generateImageTask` |
| POST | `/cinema/image-tasks/{task_id}/result` | `cinema.saveImageResult` |

## Requests and current contract

Request bodies use the server's snake_case JSON keys and are passed through
unchanged. Authentication and request-specific headers come from the client and
request options. Keep project credentials on the caller's server.

- Session creation requires `user_id` and `card_id`, inline `card_info`, or
  `version_id`. Inline cards require nonempty `name`, `introduction`,
  `greeting`, and `background`; `gender` accepts 0/1/2 or the documented
  male/female/other aliases. A nested `request` and sampling fields are rejected.
  Optional `card_version` pins a stored card version. Optional
  `system_template_id` selects a template ID; `user` is the player persona.
- Experience creation accepts `user_id`, optional `user` and
  `system_template_id`, and uses the currently published version.
- Debug chat takes inline `card_info` plus `text` or `message` on the first
  call. It defaults to `persist: true`; continue with the returned
  `session_id` and `expected_revision`. Use `persist: false` with
  `card_info` and `history` for a stateless call. Debug chat accepts sampling,
  memory and per-call prompt parameters; it does not accept a nested `request`.
- Turns take `action` (reply/additional/regenerate), `text` or `message`,
  optional `expected_revision`, sampling, memory, `user`, `lang`,
  `system_prompt_override`, `lastest_system_prompt` (keep this spelling),
  `favorability_score` (-1..100), and `metadata.history`.
- Operations take `idempotency_key`, `action`, `text` or `message`,
  `expected_revision` and `metadata` at the top level. Put model,
  temperature, max_tokens, user and request overrides under `live`; put
  max_context and pinned_memory under `memory`. Sampling options
  `top_p`, `thinking_mode`, `thinking_budget_tokens` and prompt parameters
  `lastest_system_prompt`, `favorability_score`, `lang` can also be top-level.
  `system_prompt_override` belongs under `live`. Top-level non-null values
  override matching live values. Operations always return JSON.
- `metadata.history` only seeds an empty session. The response's
  `history_import` records seeded/skipped status; leading assistant messages
  are dropped. On operations this transcript participates in the input digest:
  keep it unchanged when retrying the same key.
- Sampling fields are `model`, `temperature` (0..2), `max_tokens`
  (1..1000000), `top_p` (0 < p <= 1), `thinking_mode` and
  `thinking_budget_tokens`. Thinking support depends on the selected model;
  Claude budgets require enabled thinking and 1024 <= budget < max_tokens.
  Gemini 3 does not accept thinking_mode=false.
- `lang`, per-turn `user` and prompt instructions apply to that call only.
  Sampling and memory updates on non-version sessions are saved on success.
  Version sessions reject fixed configuration overrides; card sessions reject
  replacing their `request`. PATCH accepts `request` only for debug sessions.
- Assemble requires `request`; optional `history`, `user_message`,
  `max_context`, `pinned_memory`, `cinema` and prompt parameters are passed
  through. Version preview requires `text` and optional prompt parameters.
- Rewind/edit/fork accept `expected_revision`. Rewind and edit require
  an absolute history `index`; fork can omit it to copy all retained history.
  Edit takes text `content` and preserves attached images.
- Recover requires the **operation** `expected_revision` and `action`
  (commit/abandon); unknown-result abandonment also requires
  `acknowledge_unknown: true`. Inspect operation status before recovery.

## Pagination and translations

| Resource | Query | Response / continuation |
| --- | --- | --- |
| Session history | limit, offset | Latest page by default, limit default/max 10; continue with history_offset + history.length, checking revision across pages |
| Project/user cards | lang, limit, offset; project list also ids/card_ids | Array; limit default 50, max 200; explicit offset=0 is preserved |
| Card versions | limit, before_version | {items, next_before_version}; limit default 20, max 100 |
| Card version detail | lang | Localized snapshot inside version metadata |
| Cinema rounds | limit, offset | Array; limit default 10, max 100 |
| Operations | session_id, version_id, status, limit, offset | {items, next_offset}; continue even if filtering leaves an empty page, until next_offset is null |

Retained session history can start after index 0. A cold-history handoff can
return 409; retry the read rather than combining mismatched revisions.

Translation GET returns `{language_code: {field: text}}`. Translation POST
saves owner-provided fields with
`{user_id, expected_latest_version, lang, translations: {name: "...", ...}}`;
it does not run a translation model. The single-field PATCH requires
`{value, expected_latest_version}`. Supported fields are name, background,
dialog_style, reply_settings, introduction, greeting and scenario.

Restore requires `{expected_latest_version, change_note?}`. It copies the
selected snapshot into a new latest version; it does not reset the version
counter. Card updates/restores can use an `Idempotency-Key` request header.
Translation writes do not create content versions.

## Images, streaming and Cinema

For image chat, replace `text` with `message`:
`[{type: "text", text: "What is this?"}, {type: "image_url", image_url: {url: "https://cdn.example/a.png", detail: "auto"}}]`.
Do not send both nonempty text and message. Additional/regenerate omit both.
The server accepts up to 8 images, 1 MiB per inline image URL and 2 MiB inline
total. History `content` is a string or a content-part array, including in the
single-history-message response.

Streaming methods set `Accept: text/event-stream` automatically. Preserve
token whitespace and handle SSE error events and disconnects; receiving HTTP
200 alone is not generation success. Sessions/turns done data is plain text
(session ID followed by reply); debug-chat done data is JSON.

Cinema requires a stable `Idempotency-Key` header. Round bodies take content,
option_index (0 is valid), custom_input and expected_revision, plus optional
model, temperature, max_tokens, top_p, max_context, pinned_memory,
conversation_style, user, lang and image_model. Those overrides apply to the
round. Cinema's outer SSE event name is `cinema`; parse data JSON and inspect
its inner `event` (including message_end and error), rather than waiting for a
chat-style done event. Event IDs are exposed by the SDK. Events are live
transport only; recover final state using operation, Round and image-task
queries after disconnect. A Last-Event-ID header must refer to an existing
operation for the same round; it does not guarantee historical event replay.

Image generate/result bodies require `session_id`. Generate accepts optional
model and only claims pending tasks. Result accepts status, image_url,
watermark_url, material_id and error; status defaults to ready, which requires
image_url. Costs are provider-reported strings or null. The SDK preserves
these values and does not invent cost estimates.

## Project batch import and visibility

Project batch import uses `POST /admin/v1/cards/import/batch` at an explicitly
configured Control API base. It accepts `{cards: [...]}` (or rows), 1..100
cards, using the same project bearer token. IDs are server-issued. The response
is `{items: [...]}`. Earlier successes remain if a later card fails.
Administrator tokens must include project_id in the body.

The legacy engine import/listing routes require a console delegation token;
normal project tokens use the Control API. Engine import accepts one
`{card, overwrite?}`, not a batch. Internal administrative routes are outside
the public SDK service surface.

Plain-text and JSON HTTP errors are supported, with 400/422 mapped to invalid.
JSON error code/message and the complete response payload are retained; a
debug-chat error can include session_id to query before retrying.
Ordinary project responses may set `prompt_redacted: true`; do not interpret
empty prompt/messages as missing generation. Traces require prompt-inspection
delegation and return 404 for an ordinary project token.

## JavaScript usage and migration

```js
await client.cards.list({ lang: 'zh', limit: 20, offset: 0 });
await client.cards.listVersions(cardId, { limit: 20, before_version: 7 });
await client.cards.getVersion(cardId, 3, { lang: 'zh' });
await client.cards.listTranslations(cardId, 3);
await client.cards.saveTranslations(cardId, 3, {
  user_id: userId, expected_latest_version: 7, lang: 'zh',
  translations: { name: '艾达' },
});
await client.cards.restoreVersion(cardId, 3, { expected_latest_version: 7 });
await client.cinema.listRounds(sessionId, { limit: 20, offset: 0 });
```

Version/round methods also keep the old option-only call form
(e.g. listVersions(id, withHeader(...))). Restore now needs an explicit body.
Configure `controlAPIBaseURL: 'https://rp.example.com/admin/v1'` on Client,
then call `client.cards.importBatch({cards: [draft]})`.
Go-style service aliases include the added methods.
SSE events expose `id`; HTTP errors expose `payload` and `sessionId`.

