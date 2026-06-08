# Development Guidelines

Guidelines for developing **tmetric-mcp** — a TypeScript MCP server that wraps the TMetric REST API v3.

> For detailed code review guidelines, see [coderabbit.md](./coderabbit.md)

## Quick Reference

| Item | Convention |
|------|------------|
| Indentation | 4 spaces |
| Quotes | Single |
| Semicolons | Always |
| Package Manager | pnpm |
| Build output | `dist/` |
| Imports | `.js` extension in source (NodeNext) |

## Project Structure

```text
src/
├── index.ts          # McpServer setup, transport, SIGINT handler
├── client.ts         # tmetricRequest<T>, resolveAccountId, token guard
├── types.ts          # Shared TypeScript interfaces
└── tools/
    ├── index.ts      # Re-exports all registerXxxTools functions
    ├── accounts.ts
    ├── users.ts
    ├── timeEntries.ts
    ├── tasks.ts
    ├── projects.ts
    └── reports.ts
```

## Development Scripts

```bash
pnpm build      # Compile TypeScript to dist/
pnpm dev        # Run with tsx (no build step, requires TMETRIC_API_TOKEN)
pnpm lint       # Run ESLint
pnpm lint:fix   # ESLint with auto-fix
```

## Code Patterns

### Adding a New Tool

1. Add the handler in the relevant `src/tools/*.ts` file inside `registerXxxTools()`.
2. Export it from `src/tools/index.ts` (already done via `export *`).
3. Set annotations matching the HTTP method (see below).
4. Document it in the README tool reference table.

### Tool Annotations

```typescript
// GET endpoints
annotations: { readOnlyHint: true, idempotentHint: true }

// DELETE endpoints
annotations: { destructiveHint: true }

// POST / PUT / PATCH
annotations: { idempotentHint: false }
```

### accountId Resolution

```typescript
async ({ accountId: explicitAccountId }) => {
    const accountId = await resolveAccountId(explicitAccountId);
    // use accountId in path
}
```

### Imports

```typescript
// External
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Internal — always use .js extension
import { tmetricRequest, resolveAccountId } from '../client.js';
import type { TMetricProject } from '../types.js';
```

### Result Helper

Each tool file has a local helper (do not import from elsewhere):

```typescript
function result(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
```

### Logging

Use `process.stderr` only — `process.stdout` is reserved for the MCP stdio transport:

```typescript
process.stderr.write('some debug info\n');
```

## API Reference

### TMetric REST API v3

Base URL: `https://app.tmetric.com/api/v3`

Key endpoints:

| Tool | Method | Path |
|------|--------|------|
| `tmetric_get_accounts` | GET | `/userprofile/accounts` |
| `tmetric_get_current_user` | GET | `/user` |
| `tmetric_list_managed_teams` | GET | `/accounts/{id}/teams/managed` |
| `tmetric_list_projects` | GET | `/accounts/{id}/projects` |
| `tmetric_list_tasks` | GET | `/accounts/{id}/tasks` |
| `tmetric_get_time_entries` | GET | `/accounts/{id}/timeentries` |
| `tmetric_create_time_entry` | POST | `/accounts/{id}/timeentries` |
| `tmetric_update_time_entry` | PUT | `/accounts/{id}/timeentries/{entryId}` |
| `tmetric_delete_time_entry` | DELETE | `/accounts/{id}/timeentries/{entryId}` |
| `tmetric_get_projects_report` | GET | `/accounts/{id}/reports/projects` |

Time entry body shape: nested `project: {id}`, `task: {id}`, `tags: [{id}]`, field is `note` (not `description`).

Timestamps: `YYYY-MM-DDTHH:mm:ss` (no offset). `null` = now / still running.

## Dependencies

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` v1.x | MCP server + stdio transport |
| `zod` v3 | Input schema validation (v4 incompatible with SDK v1) |

## Troubleshooting

**Build errors**: Check that all imports use `.js` extension and tsconfig uses `NodeNext`.

**`pnpm test` missing**: There are no automated tests yet. CI runs build + lint only.

**MCP not connecting**: Ensure `TMETRIC_API_TOKEN` is set in the env block of your MCP client config and the path in `args` points to `dist/index.js` after building.
