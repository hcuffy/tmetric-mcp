import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { tmetricRequest, resolveAccountId } from '../client.js';
import type { TMetricProject } from '../types.js';

function result(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export function registerProjectTools(server: McpServer): void {
    server.registerTool(
        'tmetric_list_projects',
        { title:       'List Projects',
            description: 'List all projects visible to the current user in the workspace.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async({ accountId: explicitAccountId }) => {
            const accountId = await resolveAccountId(explicitAccountId);
            const data = await tmetricRequest<TMetricProject[]>(
                'GET',
                `/accounts/${accountId}/projects`
            );

            return result(data);
        }
    );
}
