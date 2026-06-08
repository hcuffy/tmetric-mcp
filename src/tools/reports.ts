import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { tmetricRequest, resolveAccountId } from '../client.js';
import type { TMetricProjectsReport, TMetricProfitabilityReport } from '../types.js';

function result(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

/** Serialize an array param as repeated keys: ?userId=0&userId=5 */
function appendArrayParam(
    params: URLSearchParams,
    key: string,
    values: number[] | undefined
): void {
    if (!values || values.length === 0) {
        return;
    }
    for (const value of values) {
        params.append(key, String(value));
    }
}

export function registerReportTools(server: McpServer): void {
    server.registerTool(
        'tmetric_get_projects_report',
        { title: 'Get Projects Report',
            description:
        'Get a projects summary report. ' +
        'If no dates are given, returns whole-lifetime data. ' +
        'Financial info included only if caller has rights to it. ' +
        'Array params (userId, teamId, etc.) are serialized as repeated query keys.',
            inputSchema: {
                accountId: z.number().int().optional().describe('TMetric account ID'),
                userId:    z
                    .array(z.number().int())
                    .optional()
                    .describe('Filter by user IDs (0 = current user)'),
                teamId: z
                    .array(z.number().int())
                    .optional()
                    .describe('Filter by team IDs'),
                clientId: z
                    .array(z.number().int())
                    .optional()
                    .describe('Filter by client IDs'),
                projectId: z
                    .array(z.number().int())
                    .optional()
                    .describe('Filter by project IDs'),
                includeDone: z
                    .boolean()
                    .optional()
                    .describe('Include completed projects'),
                startDate: z
                    .string()
                    .optional()
                    .describe('Start date YYYY-MM-DD (inclusive)'),
                endDate: z
                    .string()
                    .optional()
                    .describe('End date YYYY-MM-DD (inclusive)')
            },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async({
            accountId: explicitAccountId, userId, teamId, clientId, projectId, includeDone, startDate, endDate
        }) => {
            const accountId = await resolveAccountId(explicitAccountId);
            const params = new URLSearchParams();
            appendArrayParam(params, 'userId', userId);
            appendArrayParam(params, 'teamId', teamId);
            appendArrayParam(params, 'clientId', clientId);
            appendArrayParam(params, 'projectId', projectId);
            if (includeDone !== undefined) {
                params.set('includeDone', String(includeDone));
            }
            if (startDate) {
                params.set('startDate', startDate);
            }
            if (endDate) {
                params.set('endDate', endDate);
            }
            const queryString = params.toString() ? `?${params}` : '';
            const data = await tmetricRequest<TMetricProjectsReport[]>(
                'GET',
                `/accounts/${accountId}/reports/projects${queryString}`
            );

            return result(data);
        }
    );

    server.registerTool(
        'tmetric_get_profitability_report',
        { title: 'Get Profitability Report',
            description:
        'Get the profitability report for the account. ' +
        'Note: exact query parameters for this endpoint are unverified — ' +
        'pass startDate and endDate as a best guess. Expand in Swagger to confirm.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID'),
                startDate: z
                    .string()
                    .optional()
                    .describe('Start date YYYY-MM-DD (inclusive)'),
                endDate: z
                    .string()
                    .optional()
                    .describe('End date YYYY-MM-DD (inclusive)') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async({ accountId: explicitAccountId, startDate, endDate }) => {
            const accountId = await resolveAccountId(explicitAccountId);
            const params = new URLSearchParams();
            if (startDate) {
                params.set('startDate', startDate);
            }
            if (endDate) {
                params.set('endDate', endDate);
            }
            const queryString = params.toString() ? `?${params}` : '';
            const data = await tmetricRequest<TMetricProfitabilityReport>(
                'GET',
                `/accounts/${accountId}/reports/profitability${queryString}`
            );

            return result(data);
        }
    );
}
