import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { tmetricRequest, resolveAccountId } from '../client.js';
import type { TMetricTimeEntry } from '../types.js';

const TimeEntryBodySchema = z.object({
    id:         z.number().int().optional(),
    /** YYYY-MM-DDTHH:mm:ss — null means "now" */
    startTime:  z.string().nullable().optional(),
    /** YYYY-MM-DDTHH:mm:ss — null means running timer */
    endTime:    z.string().nullable().optional(),
    task:       z.object({ id: z.number().int() }).optional(),
    project:    z.object({ id: z.number().int() }).optional(),
    note:       z.string().optional(),
    tags:       z.array(z.object({ id: z.number().int() })).optional(),
    isBillable: z.boolean().optional(),
    isInvoiced: z.boolean().optional()
});

function result(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export function registerTimeEntryTools(server: McpServer): void {
    // GET time entries for a date range
    server.registerTool(
        'tmetric_get_time_entries',
        { title: 'Get Time Entries',
            description:
        'Get time entries for a date range. userId 0 = current user. Dates: YYYY-MM-DD.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID (resolved automatically if omitted)'),
                userId:    z.number().int().optional().describe('User ID (0 = current user)'),
                startDate: z.string().optional().describe('Start date YYYY-MM-DD (inclusive)'),
                endDate:   z.string().optional().describe('End date YYYY-MM-DD (inclusive)') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async({ accountId, userId, startDate, endDate }) => {
            const aid = await resolveAccountId(accountId);
            const params = new URLSearchParams();
            if (userId !== undefined) {
                params.set('userId', String(userId));
            }
            if (startDate) {
                params.set('startDate', startDate);
            }
            if (endDate) {
                params.set('endDate', endDate);
            }
            const qs = params.toString() ? `?${params}` : '';
            const data = await tmetricRequest<TMetricTimeEntry[]>(
                'GET',
                `/accounts/${aid}/timeentries${qs}`
            );

            return result(data);
        }
    );

    // POST create time entry
    server.registerTool(
        'tmetric_create_time_entry',
        { title: 'Create Time Entry',
            description:
        'Create a new time entry. WARNING: overlapping entries are overwritten (destructive). ' +
        'Body uses nested objects: project:{id}, task:{id}, tags:[{id}]. Field is \'note\' not \'description\'. ' +
        'Timestamps: YYYY-MM-DDTHH:mm:ss or null (null = now).',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID'),
                userId:    z.number().int().optional().describe('User ID (0 = current user)'),
                entry:     TimeEntryBodySchema.describe('Time entry data') },
            annotations: { destructiveHint: true, idempotentHint: false } },
        async({ accountId, userId, entry }) => {
            const aid = await resolveAccountId(accountId);
            const params = new URLSearchParams();
            if (userId !== undefined) {
                params.set('userId', String(userId));
            }
            const qs = params.toString() ? `?${params}` : '';
            const data = await tmetricRequest<TMetricTimeEntry>(
                'POST',
                `/accounts/${aid}/timeentries${qs}`,
                entry
            );

            return result(data);
        }
    );

    // PUT update time entry
    server.registerTool(
        'tmetric_update_time_entry',
        { title: 'Update Time Entry',
            description:
        'Update an existing time entry by ID. Also the canonical way to stop a running timer: set endTime to the stop time.',
            inputSchema: { accountId:   z.number().int().optional().describe('TMetric account ID'),
                timeEntryId: z.number().int().describe('ID of the time entry to update'),
                entry:       TimeEntryBodySchema.describe('Updated time entry data') },
            annotations: { idempotentHint: false } },
        async({ accountId, timeEntryId, entry }) => {
            const aid = await resolveAccountId(accountId);
            const data = await tmetricRequest<TMetricTimeEntry>(
                'PUT',
                `/accounts/${aid}/timeentries/${timeEntryId}`,
                entry
            );

            return result(data);
        }
    );

    // DELETE time entry
    server.registerTool(
        'tmetric_delete_time_entry',
        { title:       'Delete Time Entry',
            description: 'Delete a time entry by ID.',
            inputSchema: { accountId:   z.number().int().optional().describe('TMetric account ID'),
                timeEntryId: z.number().int().describe('ID of the time entry to delete') },
            annotations: { destructiveHint: true, idempotentHint: false } },
        async({ accountId, timeEntryId }) => {
            const aid = await resolveAccountId(accountId);
            await tmetricRequest<void>(
                'DELETE',
                `/accounts/${aid}/timeentries/${timeEntryId}`
            );

            return result({ success: true, timeEntryId });
        }
    );

    // GET latest time entry
    server.registerTool(
        'tmetric_get_latest_time_entry',
        { title: 'Get Latest Time Entry',
            description:
        'Get the most recent time entry. An entry with endTime=null is the currently running timer.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async({ accountId }) => {
            const aid = await resolveAccountId(accountId);
            const data = await tmetricRequest<TMetricTimeEntry>(
                'GET',
                `/accounts/${aid}/timeentries/latest`
            );

            return result(data);
        }
    );

    // GET recent time entries
    server.registerTool(
        'tmetric_get_recent_time_entries',
        { title:       'Get Recent Time Entries',
            description: 'Get a list of recent time entries.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async({ accountId }) => {
            const aid = await resolveAccountId(accountId);
            const data = await tmetricRequest<TMetricTimeEntry[]>(
                'GET',
                `/accounts/${aid}/timeentries/recent`
            );

            return result(data);
        }
    );

    // GET trackable projects (confirmed alternative for project list)
    server.registerTool(
        'tmetric_get_trackable_projects',
        { title: 'Get Trackable Projects',
            description:
        'Get projects available for time tracking in this account. ' +
        'Use this to discover project IDs when creating time entries.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async({ accountId }) => {
            const aid = await resolveAccountId(accountId);
            const data = await tmetricRequest<unknown[]>(
                'GET',
                `/accounts/${aid}/timeentries/projects`
            );

            return result(data);
        }
    );

    // GET time entry tags
    server.registerTool(
        'tmetric_get_time_entry_tags',
        { title:       'Get Time Entry Tags',
            description: 'Get all tags available for time entries in this account.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async({ accountId }) => {
            const aid = await resolveAccountId(accountId);
            const data = await tmetricRequest<unknown[]>(
                'GET',
                `/accounts/${aid}/timeentries/tags`
            );

            return result(data);
        }
    );

    // POST add break
    server.registerTool(
        'tmetric_add_break',
        { title: 'Add Break',
            description:
        'Add a break to the current timeline. Sending endTime=null is also a way to stop a running timer.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID'),
                endTime:   z
                    .string()
                    .nullable()
                    .optional()
                    .describe('End time of break YYYY-MM-DDTHH:mm:ss, or null to stop timer') },
            annotations: { idempotentHint: false } },
        async({ accountId, endTime }) => {
            const aid = await resolveAccountId(accountId);
            const body = endTime !== undefined ? { endTime } : undefined;
            const data = await tmetricRequest<unknown>(
                'POST',
                `/accounts/${aid}/timeentries/break`,
                body
            );

            return result(data ?? { success: true });
        }
    );

    // --- Timer wrappers ---

    // GET active timer (wrapper over latest)
    server.registerTool(
        'tmetric_get_active_timer',
        { title: 'Get Active Timer',
            description:
        'Get the currently running timer. Returns the latest time entry; ' +
        'if its endTime is null, the timer is running. Returns null if no timer is active.',
            inputSchema: { accountId: z.number().int().optional().describe('TMetric account ID') },
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async({ accountId }) => {
            const aid = await resolveAccountId(accountId);
            const entry = await tmetricRequest<TMetricTimeEntry | null>(
                'GET',
                `/accounts/${aid}/timeentries/latest`
            );
            if (!entry || entry.endTime !== null) {
                return result({ running: false, timer: null });
            }

            return result({ running: true, timer: entry });
        }
    );

    // POST start timer (wrapper over create with null times)
    server.registerTool(
        'tmetric_start_timer',
        { title: 'Start Timer',
            description:
        'Start a new timer (running time entry). Uses startTime=null to start now with endTime=null (open). ' +
        'Optionally attach a project, task, note, or tags. WARNING: overwrites overlapping entries.',
            inputSchema: {
                accountId: z.number().int().optional().describe('TMetric account ID'),
                projectId: z.number().int().optional().describe('Project ID to attach'),
                taskId:    z.number().int().optional().describe('Task ID to attach'),
                note:      z.string().optional().describe('Note/description for the timer'),
                tags:      z
                    .array(z.number().int())
                    .optional()
                    .describe('Tag IDs to attach'),
                isBillable: z.boolean().optional().describe('Mark as billable'),
                startTime:  z
                    .string()
                    .optional()
                    .describe(
                        'Optional custom start time YYYY-MM-DDTHH:mm:ss. Omit to start now.'
                    )
            },
            annotations: { destructiveHint: true, idempotentHint: false } },
        async({
            accountId, projectId, taskId, note, tags, isBillable, startTime
        }) => {
            const aid = await resolveAccountId(accountId);
            const body: Record<string, unknown> = { startTime: startTime ?? null,
                endTime:   null };
            if (projectId !== undefined) {
                body.project = { id: projectId };
            }
            if (taskId !== undefined) {
                body.task = { id: taskId };
            }
            if (note !== undefined) {
                body.note = note;
            }
            if (tags !== undefined) {
                body.tags = tags.map(id => ({ id }));
            }
            if (isBillable !== undefined) {
                body.isBillable = isBillable;
            }
            const data = await tmetricRequest<TMetricTimeEntry>(
                'POST',
                `/accounts/${aid}/timeentries`,
                body
            );

            return result(data);
        }
    );

    // PUT stop timer (wrapper over update, sets endTime)
    server.registerTool(
        'tmetric_stop_timer',
        { title: 'Stop Timer',
            description:
        'Stop the currently running timer by setting its endTime. ' +
        'Resolves the running entry from tmetric_get_latest_time_entry if no timeEntryId is given.',
            inputSchema: { accountId:   z.number().int().optional().describe('TMetric account ID'),
                timeEntryId: z
                    .number()
                    .int()
                    .optional()
                    .describe(
                        'ID of the running time entry to stop. Resolved automatically from latest if omitted.'
                    ),
                endTime: z
                    .string()
                    .optional()
                    .describe(
                        'Stop time YYYY-MM-DDTHH:mm:ss. Defaults to current time if omitted.'
                    ) },
            annotations: { idempotentHint: false } },
        async({ accountId, timeEntryId, endTime }) => {
            const aid = await resolveAccountId(accountId);
            let entryId = timeEntryId;

            if (entryId === undefined) {
                const latest = await tmetricRequest<TMetricTimeEntry | null>(
                    'GET',
                    `/accounts/${aid}/timeentries/latest`
                );
                if (!latest || latest.endTime !== null) {
                    return result({ success: false, message: 'No running timer found.' });
                }
                entryId = latest.id;
            }

            const stopTime =
        endTime ?? new Date().toISOString().slice(0, 19).replace('T', 'T');

            const data = await tmetricRequest<TMetricTimeEntry>(
                'PUT',
                `/accounts/${aid}/timeentries/${entryId}`,
                { endTime: stopTime }
            );

            return result(data);
        }
    );
}
