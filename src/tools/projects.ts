import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerProjectTools(_server: McpServer): void {
    // TODO: endpoint unconfirmed — see Step 0 of the build plan.
    // GET /accounts/{accountId}/projects (list) was NOT confirmed in Swagger screenshots.
    // GET /accounts/{accountId}/projects/{projectId} (single) was NOT confirmed.
    //
    // Use tmetric_get_trackable_projects instead (GET /accounts/{accountId}/timeentries/projects)
    // which IS confirmed and returns projects available for time tracking.
    //
    // Implement these tools only after confirming the endpoints exist:
    //   - tmetric_list_projects  → GET /accounts/{accountId}/projects
    //   - tmetric_get_project    → GET /accounts/{accountId}/projects/{projectId}
}
