import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { tmetricRequest, resolveAccountId } from '../client.js';
import type { TMetricUser, TMetricTeam } from '../types.js';

function result(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export function registerUserTools(server: McpServer): void {
    server.registerTool(
        'tmetric_get_current_user',
        { title: 'Get Current User',
            description:
        'Get the authenticated user\'s profile, including account memberships and activeAccountId. ' +
        'Use this to discover your accountId.',
            inputSchema: {},
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async() => {
            const data = await tmetricRequest<TMetricUser>('GET', '/user');

            return result(data);
        }
    );

    server.registerTool(
        'tmetric_list_managed_teams',
        { title: 'List Managed Teams',
            description:
        'List teams managed by the current user in the given account. ' +
        'Use to list teams managed by the current user (members list is not available via GET).',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async({ accountId: explicitAccountId }) => {
            const accountId = await resolveAccountId(explicitAccountId);
            const data = await tmetricRequest<TMetricTeam[]>(
                'GET',
                `/accounts/${accountId}/teams/managed`
            );

            return result(data);
        }
    );
}
