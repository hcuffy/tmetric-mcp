# TMetric MCP Server

An [MCP](https://modelcontextprotocol.io/) server for the [TMetric](https://tmetric.com/) time-tracking API. Lets Claude Desktop (or any MCP client) read and manage your TMetric time entries, tasks, projects, and reports via natural language.

## Requirements

- Node.js 20 or later
- A TMetric account with an API token

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Build
pnpm build
```

## API Token

1. Log in to [app.tmetric.com](https://app.tmetric.com)
2. Click your name (bottom-left) → **My Profile** → **General Settings** → **Get new API token**
3. Copy the token — you will set it as `TMETRIC_API_TOKEN`

## Claude Desktop configuration

Add this block to your `claude_desktop_config.json` (usually at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "tmetric": {
      "command": "node",
      "args": ["/absolute/path/to/tmetric-mcp/dist/index.js"],
      "env": {
        "TMETRIC_API_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Replace `/absolute/path/to/tmetric-mcp` with the actual path to this repo.

## Development

```bash
# Run without building (uses tsx)
TMETRIC_API_TOKEN=your_token pnpm dev
```

## Tool reference

> Timer tools are wrappers over time-entry endpoints — TMetric has no dedicated `/timer` endpoint.
> A running timer is a time entry whose `endTime` is `null`.

### Accounts (`accounts.ts`)

| Tool | Description |
|------|-------------|
| `tmetric_get_accounts` | List all TMetric workspaces available to the current user. Returns account IDs needed for other tools. |

### Users (`users.ts`)

| Tool | Description |
|------|-------------|
| `tmetric_get_current_user` | Get authenticated user's profile including account memberships and `activeAccountId`. |
| `tmetric_list_managed_teams` | List teams managed by the current user in the given workspace. |

### Time Entries (`timeEntries.ts`)

| Tool | Description |
|------|-------------|
| `tmetric_get_time_entries` | Get time entries for a date range (`YYYY-MM-DD`). `userId=0` = current user. |
| `tmetric_create_time_entry` | Create a new time entry. **Destructive** — overlapping entries are overwritten. Body uses nested objects: `project:{id}`, `task:{id}`, `tags:[{id}]`, field is `note`. |
| `tmetric_update_time_entry` | Fully update a time entry by ID. Set `endTime` to stop a running timer. |
| `tmetric_delete_time_entry` | Delete a time entry by ID. |
| `tmetric_get_latest_time_entry` | Get the most recent time entry. `endTime=null` means a timer is running. |
| `tmetric_get_recent_time_entries` | Get a list of recent time entries. |
| `tmetric_get_trackable_projects` | Get projects available for time tracking (confirmed alternative for project list). |
| `tmetric_get_time_entry_tags` | Get all tags available for time entries. |
| `tmetric_add_break` | Add a break to the timeline. `endTime=null` also stops a running timer. |

#### Timer wrappers

| Tool | Description |
|------|-------------|
| `tmetric_get_active_timer` | Get the currently running timer (`endTime=null`). Returns `{running: false}` if no timer is active. |
| `tmetric_start_timer` | Start a new timer now (`startTime=null, endTime=null`). Optionally attach project, task, note, tags. **Destructive** — overwrites overlapping entries. |
| `tmetric_stop_timer` | Stop the running timer by setting `endTime`. Resolves the entry ID from `latest` if not provided. |

### Tasks (`tasks.ts`)

| Tool | Description |
|------|-------------|
| `tmetric_list_tasks` | List all tasks in the account workspace. |
| `tmetric_get_task` | Get a single task by ID. |
| `tmetric_create_task` | Create a new task (name, optional projectId, description). |
| `tmetric_update_task` | Fully replace a task by ID. |
| `tmetric_patch_task` | Partially update a task (only provided fields are changed). |
| `tmetric_delete_task` | Delete a task by ID. |

### Projects (`projects.ts`)

| Tool | Description |
|------|-------------|
| `tmetric_list_projects` | List all projects visible to the current user in the workspace. |

### Reports (`reports.ts`)

| Tool | Description |
|------|-------------|
| `tmetric_get_projects_report` | Projects summary report. Filters: `userId[]`, `teamId[]`, `clientId[]`, `projectId[]`, `includeDone`, `startDate`, `endDate`. Arrays serialized as repeated query params. |
| `tmetric_get_profitability_report` | Profitability report. Filters: `userId[]`, `teamId[]`, `clientId[]`, `projectId[]`, `startDate`, `endDate`. |

## Notes

- All `accountId` params are optional — the server resolves it automatically from `GET /user` on first call and caches it. Pass `accountId` explicitly if you have multiple accounts.
- Timestamps in request bodies use `YYYY-MM-DDTHH:mm:ss` (no timezone offset). `null` means "now" for `startTime` or "still running" for `endTime`.
- Date query params use `YYYY-MM-DD`.
- Error messages include the HTTP method, path, status code, response body, and an actionable hint.
