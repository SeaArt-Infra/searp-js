---
name: searp-js
description: Build and troubleshoot SeaRP engine and control-plane integrations with the searp_js client. Use when creating role-play sessions, running chat turns or streaming replies, using idempotent operations, importing cards, previewing versions, assembling prompts, generating images, debugging chats, or managing projects through the /admin/v1 gateway from Node.js.
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
   and the remaining services for cards, versions, and cinema. Use
   `client.admin` for the `/admin/v1` control plane.
3. Prefer the operations API with a stable idempotency key for paid chat.
4. HTTP 200 does not guarantee a generated reply; inspect operation `status`.
5. Pass request-specific SeaInfra attribution headers with `withHeaders`.

## Control Plane

```js
const health = await client.admin.health();
const whoami = await client.admin.whoami();
const projects = await client.admin.listProjects();
const project = await client.admin.createProject({
  id: 'project-id',
  token: 'project-token-with-at-least-16-characters',
});
```

For control-plane routes without a typed method, use
`client.admin.request(method, path, body, ...options)`. Admin errors carry
their envelope `code` on `error.code`.

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
const session = await client.sessions.createExperience({ user_id: 'user-123' });
```

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
- `admin.request`, `health`, `whoami`, `agentContract`, `listProjects`,
  `createProject`, `getProject`, `deleteProject`, `rotateProjectToken`,
  `getProjectLive`, `updateProjectLive`
- `admin.raw`, `projectRequest`, `getGlobalPack`, `updateGlobalPack`,
  `getProjectPack`, `patchProjectPack`, `deleteProjectPack`, `forkProjectPack`
- `admin.listCatalog`, `importCatalog`, `getCatalogCard`, `updateCatalogCard`,
  `deleteCatalogCard`, `getCatalogCardCover`
- `admin.listProjectCards`, `getProjectCard`, `updateProjectCard`,
  `deleteProjectCard`, `setProjectCardListing`, `importProjectCard`,
  `importProjectCardsBatch`, `forkProjectCard`, `listProjectCardVersions`,
  `getProjectCardVersion`, `deleteProjectCardVersion`,
  `restoreProjectCardVersion`
- `admin.listProjectExperiments`, `createProjectExperiment`,
  `getProjectExperiment`, `updateProjectExperiment`, `startProjectExperiment`,
  `pauseProjectExperiment`, `stopProjectExperiment`
- `admin.getProjectLLM`, `updateProjectLLM`, `deleteProjectLLM`
- `admin.listProjectVersions`, `createProjectVersion`, `getProjectVersion`,
  `diffProjectVersion`, `publishProjectVersion`, `getProjectRelease`,
  `listProjectReleases`, `rollbackProjectRelease`
- `admin.listProjectSystemPrompts`, `createProjectSystemPrompt`,
  `setProjectSystemPromptDefault`, `getProjectSystemPrompt`,
  `updateProjectSystemPrompt`, `listGlobalSystemPrompts`,
  `createGlobalSystemPrompt`, `setGlobalSystemPromptDefault`,
  `getGlobalSystemPrompt`
- `admin.listProjectUserSessions`, `getProjectUserSession`,
  `getProjectIdentityMigration`, `startProjectIdentityMigration`,
  `prepareProjectIdentityMigration`, `purgeProjectIdentityMigration`,
  `adoptProjectIdentityMigration`, `revertProjectIdentityMigration`,
  `previewProjectIdentityMigration`
- `admin.listProjectRollouts`, `createProjectRollout`,
  `getCurrentProjectRollouts`, `getProjectRollout`, `updateProjectRollout`,
  `deleteProjectRollout`, `stopProjectRollout`, `listProjectRolloutAudits`
- `admin.listProjectPresets`, `createProjectPreset`, `updateProjectPreset`,
  `publishProjectPreset`, `listProjectSessions`, `updateProjectSession`
- `admin.listProjectSuites`, `createProjectSuite`, `getProjectSuite`,
  `listProjectEvaluations`, `getProjectEvaluation`,
  `compareProjectEvaluation`, `cancelProjectEvaluation`,
  `resumeProjectEvaluation`, `listProjectFeedback`, `createProjectFeedback`
