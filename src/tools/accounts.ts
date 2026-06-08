import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { tmetricRequest } from '../client.js';

function result(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export function registerAccountTools(server: McpServer): void {
    // TODO: endpoint unconfirmed — see Step 0 of the build plan.
    // GET /accounts was NOT confirmed in the Swagger UI screenshots.
    // Fallback: use tmetric_get_current_user (GET /user) to obtain accountId from the response.
    // Implement this tool only after confirming the endpoint exists at GET /accounts.
    //
    // server.registerTool("tmetric_get_accounts", ...) — BLOCKED

    // In the meantime, expose a utility tool that resolves accountId via GET /user.
    server.registerTool(
        'tmetric_get_account_id',
        { title: 'Get Account ID',
            description:
        'Resolve the current user\'s active account ID by calling GET /user. ' +
        'Use this to discover your accountId before calling other tools. ' +
        'Note: GET /accounts is unconfirmed; this is the recommended approach.',
            inputSchema: {},
            annotations: { readOnlyHint: true, idempotentHint: true } },
        async() => {
            const user = await tmetricRequest<{
        id?: number;
        name?: string;
        activeAccountId?: number;
        accounts?: Array<{ id: number; name: string }>;
      }>('GET', '/user');

            return result({ activeAccountId: user.activeAccountId,
                accounts:        user.accounts ?? [],
                note:            'Use activeAccountId or pick from accounts[] to identify your accountId.' });
        }
    );
}
