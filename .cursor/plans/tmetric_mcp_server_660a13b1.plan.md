---
name: TMetric MCP Server
overview: Build a TypeScript MCP server for TMetric using stdio transport, `@modelcontextprotocol/sdk` v1.x, `zod@^3`, and native fetch on Node 20+. The plan faithfully follows the verified v2 build doc.
todos:
  - id: init-project
    content: Replace stale pnpm-workspace.yaml; scaffold package.json, tsconfig.json with correct ESM/NodeNext config
    status: completed
  - id: client
    content: "Implement src/client.ts: token guard, tmetricRequest<T>, resolveAccountId with GET /user fallback, 204 handling"
    status: completed
  - id: types
    content: Define shared TypeScript interfaces in src/types.ts (TimeEntry, Task, Project, Account shapes)
    status: completed
  - id: tools-time-entries
    content: "Implement src/tools/timeEntries.ts: 8 direct tools + 3 timer wrappers, full TimeEntryBody Zod schema"
    status: completed
  - id: tools-tasks
    content: "Implement src/tools/tasks.ts: list, get, create, update, patch, delete"
    status: completed
  - id: tools-users
    content: "Implement src/tools/users.ts: get_current_user (confirmed), list_managed_teams (fallback for unconfirmed members)"
    status: completed
  - id: tools-accounts
    content: "Implement src/tools/accounts.ts: get_accounts gated with TODO, note fallback to GET /user"
    status: completed
  - id: tools-projects
    content: "Implement src/tools/projects.ts: list_projects + get_project gated with TODO; no other project tools"
    status: completed
  - id: tools-reports
    content: "Implement src/tools/reports.ts: projects report (array params) + profitability report"
    status: completed
  - id: index
    content: "Implement src/index.ts: McpServer setup, register all confirmed tools, StdioServerTransport, SIGINT handler"
    status: completed
  - id: readme
    content: "Write README.md: setup, token instructions, Claude Desktop config block, full tool list with descriptions"
    status: completed
isProject: false
---

# TMetric MCP Server Build Plan

## Repo state
`/Users/henrycuffy-work/Private/tmetric-mcp` is almost empty (stale `pnpm-workspace.yaml` referencing fleetster modules — replace it or remove it).

## Tech stack
- Runtime: **Node 20+**, native `fetch`
- Language: **TypeScript**, ESM (`"type": "module"`)
- MCP: **`@modelcontextprotocol/sdk` v1.x** (NOT v2 `@modelcontextprotocol/server` — v2 is pre-alpha)
- Validation: **`zod@^3`** (v1 SDK incompatible with zod v4)
- Dev: **`tsx`** (not ts-node), build with `tsc`
- `tsconfig`: target ES2022, module NodeNext, moduleResolution NodeNext

## File structure
```
tmetric-mcp/
├── src/
│   ├── index.ts
│   ├── client.ts
│   ├── types.ts
│   └── tools/
│       ├── accounts.ts
│       ├── timeEntries.ts   # includes timer wrappers
│       ├── projects.ts      # UNCONFIRMED tools gated with TODO
│       ├── tasks.ts
│       ├── users.ts
│       └── reports.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Key implementation decisions

### client.ts
- Read `TMETRIC_API_TOKEN` from env at startup — throw before transport connects if missing
- Central `tmetricRequest<T>(method, path, body?)` — handles 204 No Content (no `.json()`)
- `resolveAccountId(explicit?)` — uses `GET /user` fallback if `GET /accounts` unconfirmed
- Errors: method + path + status + body + actionable hint

### Step 0 — 3 unconfirmed endpoints (gate as TODO, do not implement until confirmed)
- `GET /accounts` → fallback: resolve accountId from `GET /user`
- `GET /accounts/{id}/projects` → fallback: `GET .../timeentries/projects`
- `GET /accounts/{id}/members` → fallback: `GET .../teams/managed`

### Tool annotations
- GET → `readOnlyHint: true`
- DELETE → `destructiveHint: true`
- POST/PUT/PATCH → `idempotentHint: false`
- `POST /timeentries` gets `destructiveHint: true` (overwrites overlapping entries)

### Timer tools — wrappers over time entries (no `/timer` endpoint)
- `tmetric_get_active_timer` → `GET .../timeentries/latest` (null `endTime` = running)
- `tmetric_start_timer` → `POST .../timeentries` (`startTime: null, endTime: null`)
- `tmetric_stop_timer` → `PUT .../timeentries/{id}` (set `endTime`), id resolved from latest

### TimeEntry body shape (verified against Swagger)
- Nested: `task: { id }`, `project: { id }`, `tags: [{ id }]`
- Field is `note` (NOT `description`)
- `userId` is a query param (0 = current user), NOT in the body
- Timestamps: `YYYY-MM-DDTHH:mm:ss`, nullable (`null` = now/running)

### Reports — array query params
`userId`, `teamId`, `clientId`, `projectId` are `number[]` — serialized as repeated keys (`?userId=0&userId=5`)

### ESM import style
All relative imports use `.js` extension in source:
```typescript
import { tmetricRequest } from "./client.js";
```

## Tools summary (24 confirmed + 5 gated)

**accounts.ts** (1 gated)
- `tmetric_get_accounts` — TODO (unconfirmed `GET /accounts`)

**users.ts** (1 confirmed + 1 gated)
- `tmetric_get_current_user` — `GET /user`
- `tmetric_list_members` — TODO (unconfirmed `GET .../members`); implement `tmetric_list_managed_teams` instead

**timeEntries.ts** (11 confirmed tools including 3 timer wrappers)
- get/create/update/delete entries, latest, recent, projects, tags, break
- get_active_timer, start_timer, stop_timer

**projects.ts** (2 gated)
- `tmetric_list_projects`, `tmetric_get_project` — TODO (unconfirmed)

**tasks.ts** (6 confirmed)
- list, get, create, update, patch, delete

**reports.ts** (2 confirmed)
- `tmetric_get_projects_report`, `tmetric_get_profitability_report`
