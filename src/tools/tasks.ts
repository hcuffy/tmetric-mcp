import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { tmetricRequest, resolveAccountId } from '../client.js';
import type { TMetricTask } from '../types.js';
import { result, safe } from './utils.js';

export function registerTaskTools(server: McpServer): void {
    server.registerTool(
        'tmetric_list_tasks',
        { title:       'List Tasks',
            description: 'List all tasks in the account workspace.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        function({ accountId: explicitAccountId }) {
            return safe(async function() {
                const accountId = await resolveAccountId(explicitAccountId);
                const data = await tmetricRequest<TMetricTask[]>(
                    'GET',
                    `/accounts/${accountId}/tasks`
                );

                return result(data);
            });
        }
    );

    server.registerTool(
        'tmetric_get_task',
        { title:       'Get Task',
            description: 'Get a single task by ID.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID'),
                taskId:    z.number().int().describe('Task ID') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        function({ accountId: explicitAccountId, taskId }) {
            return safe(async function() {
                const accountId = await resolveAccountId(explicitAccountId);
                const data = await tmetricRequest<TMetricTask>(
                    'GET',
                    `/accounts/${accountId}/tasks/${taskId}`
                );

                return result(data);
            });
        }
    );

    server.registerTool(
        'tmetric_create_task',
        { title:       'Create Task',
            description: 'Create a new task in the account.',
            inputSchema: { accountId:   z.number().int().optional().describe('TMetric account ID'),
                name:        z.string().describe('Task name'),
                projectId:   z.number().int().optional().describe('Project ID to associate the task with'),
                description: z.string().optional().describe('Task description') },
            annotations: { idempotentHint: false } },
        function({ accountId: explicitAccountId, name, projectId, description }) {
            return safe(async function() {
                const accountId = await resolveAccountId(explicitAccountId);
                const body: Record<string, unknown> = { name };
                if (projectId !== undefined) {
                    body.projectId = projectId;
                }
                if (description !== undefined) {
                    body.description = description;
                }
                const data = await tmetricRequest<TMetricTask>(
                    'POST',
                    `/accounts/${accountId}/tasks`,
                    body
                );

                return result(data);
            });
        }
    );

    server.registerTool(
        'tmetric_update_task',
        { title:       'Update Task',
            description: 'Fully update (replace) a task by ID.',
            inputSchema: {
                accountId:   z.number().int().optional().describe('TMetric account ID'),
                taskId:      z.number().int().describe('Task ID to update'),
                name:        z.string().describe('Task name'),
                projectId:   z.number().int().optional().describe('Project ID'),
                description: z.string().optional().describe('Task description'),
                isCompleted: z.boolean().optional().describe('Mark task as completed')
            },
            annotations: { idempotentHint: false } },
        function({
            accountId: explicitAccountId, taskId, name, projectId, description, isCompleted
        }) {
            return safe(async function() {
                const accountId = await resolveAccountId(explicitAccountId);
                const body: Record<string, unknown> = { name };
                if (projectId !== undefined) {
                    body.projectId = projectId;
                }
                if (description !== undefined) {
                    body.description = description;
                }
                if (isCompleted !== undefined) {
                    body.isCompleted = isCompleted;
                }
                const data = await tmetricRequest<TMetricTask>(
                    'PUT',
                    `/accounts/${accountId}/tasks/${taskId}`,
                    body
                );

                return result(data);
            });
        }
    );

    server.registerTool(
        'tmetric_patch_task',
        { title:       'Patch Task',
            description: 'Partially update a task by ID (only provided fields are changed).',
            inputSchema: {
                accountId:   z.number().int().optional().describe('TMetric account ID'),
                taskId:      z.number().int().describe('Task ID to patch'),
                name:        z.string().optional().describe('New task name'),
                projectId:   z.number().int().optional().describe('New project ID'),
                description: z.string().optional().describe('New description'),
                isCompleted: z.boolean().optional().describe('Mark task as completed')
            },
            annotations: { idempotentHint: false } },
        function({
            accountId: explicitAccountId, taskId, name, projectId, description, isCompleted
        }) {
            return safe(async function() {
                const accountId = await resolveAccountId(explicitAccountId);
                const body: Record<string, unknown> = {};
                if (name !== undefined) {
                    body.name = name;
                }
                if (projectId !== undefined) {
                    body.projectId = projectId;
                }
                if (description !== undefined) {
                    body.description = description;
                }
                if (isCompleted !== undefined) {
                    body.isCompleted = isCompleted;
                }
                const data = await tmetricRequest<TMetricTask>(
                    'PATCH',
                    `/accounts/${accountId}/tasks/${taskId}`,
                    body
                );

                return result(data);
            });
        }
    );

    server.registerTool(
        'tmetric_delete_task',
        { title:       'Delete Task',
            description: 'Delete a task by ID.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID'),
                taskId:    z.number().int().describe('Task ID to delete') },
            annotations: { destructiveHint: true, idempotentHint: false } },
        function({ accountId: explicitAccountId, taskId }) {
            return safe(async function() {
                const accountId = await resolveAccountId(explicitAccountId);
                await tmetricRequest<void>('DELETE', `/accounts/${accountId}/tasks/${taskId}`);

                return result({ success: true, taskId });
            });
        }
    );
}
