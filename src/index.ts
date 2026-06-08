import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { validateTokenAtStartup } from './client.js';
import {
    registerAccountTools, registerTimeEntryTools, registerProjectTools, registerTaskTools, registerUserTools, registerReportTools
} from './tools/index.js';

// Fail loud at startup if token is missing — before connecting transport.
validateTokenAtStartup();

const server = new McpServer({ name:    'tmetric',
    version: '1.0.0' });

// Register all confirmed tools
registerAccountTools(server);
registerUserTools(server);
registerTimeEntryTools(server);
registerTaskTools(server);
registerProjectTools(server); // UNCONFIRMED tools are gated inside; no-op for now
registerReportTools(server);

async function main(): Promise<void> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write('TMetric MCP server running on stdio\n');
}

process.on('SIGINT', async() => {
    await server.close();
    process.exit(0);
});

main().catch(err => {
    process.stderr.write(`Fatal error: ${String(err)}\n`);
    process.exit(1);
});
