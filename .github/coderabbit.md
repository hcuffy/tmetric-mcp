# CodeRabbit Review Guidelines

Review guidelines for the **tmetric-mcp** project — a TypeScript MCP server that exposes TMetric time-tracking API endpoints as tools for LLM clients (Claude Desktop, etc.).

## Project Overview

- **Package**: `tmetric-mcp`
- **Purpose**: MCP server wrapping the TMetric REST API v3
- **Runtime**: Node.js 20+, native `fetch`, ESM (`"type": "module"`)
- **Build**: TypeScript → `dist/` via `tsc`
- **Transport**: stdio (`StdioServerTransport`)
- **Package Manager**: pnpm

## Module Architecture

```
src/
├── index.ts          # McpServer setup, transport, SIGINT handler
├── client.ts         # tmetricRequest<T>, resolveAccountId, token guard
├── types.ts          # Shared TypeScript interfaces
└── tools/
    ├── index.ts      # Re-exports all registerXxxTools functions
    ├── accounts.ts   # tmetric_get_accounts
    ├── users.ts      # tmetric_get_current_user, tmetric_list_managed_teams
    ├── timeEntries.ts # 8 entry tools + 3 timer wrappers
    ├── tasks.ts      # list/get/create/update/patch/delete
    ├── projects.ts   # tmetric_list_projects
    └── reports.ts    # projects report, profitability report
```

## Code Style Guidelines

### General Rules

- 4 spaces for indentation
- Single quotes for strings
- Always use semicolons
- Explicit return types on exported functions
- No `any` (ESLint error)

### TypeScript

- All relative imports use `.js` extension in source (NodeNext resolution)
- Interfaces live in `src/types.ts`
- Zod schemas for all MCP tool `inputSchema` (zod v3 — incompatible with v4)

### Naming Conventions

- **camelCase**: variables, functions, parameters
- **PascalCase**: interfaces, types
- **kebab-case**: file names
- Tool names: `tmetric_snake_case`

## Key Patterns

### Tool Registration

Every tool file exports a single `registerXxxTools(server: McpServer): void` function:

```typescript
export function registerFooTools(server: McpServer): void {
    server.registerTool('tmetric_foo', { ... }, async (params) => {
        const accountId = await resolveAccountId(params.accountId);
        const data = await tmetricRequest<FooType>('GET', `/accounts/${accountId}/foo`);
        return result(data);
    });
}
```

### Tool Annotations

| Method | Annotations |
|--------|-------------|
| GET | `readOnlyHint: true, idempotentHint: true` |
| DELETE | `destructiveHint: true` |
| POST/PUT/PATCH | `idempotentHint: false` |
| POST timeentries | also `destructiveHint: true` (overwrites overlapping entries) |

### Error Handling

All errors go through `tmetricRequest<T>` — it throws with method + path + status + body + actionable hint. Tool handlers should not catch and swallow errors.

### accountId Resolution

All account-scoped endpoints accept an optional `accountId` parameter. Pass it to `resolveAccountId(explicit?)` which auto-resolves from `GET /user` on first call and caches the result.

### Result Helper

Each tool file defines a local `result(data)` helper:

```typescript
function result(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
```

### Array Query Params

`userId`, `teamId`, `clientId`, `projectId` in report endpoints are `number[]` — serialized as repeated keys (`?userId=0&userId=5`), not comma-separated.

## ESLint Rules (Key)

| Rule | Setting |
|------|---------|
| Indentation | 4 spaces |
| Quotes | Single |
| Semicolons | Always |
| `@typescript-eslint/no-explicit-any` | Error |
| `@typescript-eslint/no-unused-vars` | Error |
| `key-spacing` | Error |

## Review Checklist

- [ ] TypeScript compiles without errors (`pnpm build`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] All relative imports use `.js` extension
- [ ] New tools registered in `src/index.ts`
- [ ] New tool file exported from `src/tools/index.ts`
- [ ] Tool annotations set correctly for the HTTP method
- [ ] `accountId` param passes through `resolveAccountId()`
- [ ] No `process.stdout` usage (breaks stdio MCP transport) — use `process.stderr` for logging
- [ ] No hardcoded account IDs or tokens
