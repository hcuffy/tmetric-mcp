import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { tmetricRequest } from '../client.js';
import type { TMetricAccount } from '../types.js';

function result(data: unknown) {
    return { content: [
        { type: 'text' as const,
            text: JSON.stringify(data) }] };
}

export function registerAccountTools(server: McpServer): void {
    server.registerTool(
        'tmetric_get_accounts',
        { title: 'Get Accounts',
            description:
        'List all TMetric workspaces (accounts) available to the current user via GET /userprofile/accounts. ' +
        'Use the returned account IDs when calling other tools that require an accountId.',
            inputSchema: {},
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async() => {
            const accounts = await tmetricRequest<TMetricAccount[]>('GET', '/userprofile/accounts');

            return result(accounts);
        }
    );
}
