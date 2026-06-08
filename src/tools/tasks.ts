import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { tmetricRequest, resolveAccountId } from '../client.js';
import type { TMetricTask } from '../types.js';

function result(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export function registerTaskTools(server: McpServer): void {
    // GET list tasks
    server.registerTool(
        'tmetric_list_tasks',
        { title:       'List Tasks',
            description: 'List all tasks in the account workspace.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async({ accountId }) => {
            const aid = await resolveAccountId(accountId);
            const data = await tmetricRequest<TMetricTask[]>(
                'GET',
                `/accounts/${aid}/tasks`
            );

            return result(data);
        }
    );

    // GET single task
    server.registerTool(
        'tmetric_get_task',
        { title:       'Get Task',
            description: 'Get a single task by ID.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID'),
                taskId:    z.number().int().describe('Task ID') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async({ accountId, taskId }) => {
            const aid = await resolveAccountId(accountId);
            const data = await tmetricRequest<TMetricTask>(
                'GET',
                `/accounts/${aid}/tasks/${taskId}`
            );

            return result(data);
        }
    );

    // POST create task
    server.registerTool(
        'tmetric_create_task',
        { title:       'Create Task',
            description: 'Create a new task in the account.',
            inputSchema: { accountId:   z.number().int().optional().describe('TMetric account ID'),
                name:        z.string().describe('Task name'),
                projectId:   z.number().int().optional().describe('Project ID to associate the task with'),
                description: z.string().optional().describe('Task description') },
            annotations: { idempotentHint: false } },
        async({ accountId, name, projectId, description }) => {
            const aid = await resolveAccountId(accountId);
            const body: Record<string, unknown> = { name };
            if (projectId !== undefined) {
                body.projectId = projectId;
            }
            if (description !== undefined) {
                body.description = description;
            }
            const data = await tmetricRequest<TMetricTask>(
                'POST',
                `/accounts/${aid}/tasks`,
                body
            );

            return result(data);
        }
    );

    // PUT update task (full replace)
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
        async({
            accountId, taskId, name, projectId, description, isCompleted
        }) => {
            const aid = await resolveAccountId(accountId);
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
                `/accounts/${aid}/tasks/${taskId}`,
                body
            );

            return result(data);
        }
    );

    // PATCH partial update task
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
        async({
            accountId, taskId, name, projectId, description, isCompleted
        }) => {
            const aid = await resolveAccountId(accountId);
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
                `/accounts/${aid}/tasks/${taskId}`,
                body
            );

            return result(data);
        }
    );

    // DELETE task
    server.registerTool(
        'tmetric_delete_task',
        { title:       'Delete Task',
            description: 'Delete a task by ID.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID'),
                taskId:    z.number().int().describe('Task ID to delete') },
            annotations: { destructiveHint: true, idempotentHint: false } },
        async({ accountId, taskId }) => {
            const aid = await resolveAccountId(accountId);
            await tmetricRequest<void>('DELETE', `/accounts/${aid}/tasks/${taskId}`);

            return result({ success: true, taskId });
        }
    );
}
