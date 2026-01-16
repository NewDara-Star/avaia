/**
 * Avaia MCP Server Entry Point
 * Cognitive AI Teacher with pedagogical tools
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { getDatabase, runMigrations, closeDatabase } from './db/index.js';

// Import tool modules
import { registerSrsTools } from './tools/srs.js';
import { registerSandboxTools } from './tools/sandbox.js';
import { registerVerifyTools } from './tools/verify.js';
import { registerContentTools } from './tools/content.js';
import { registerSessionTools } from './tools/session.js';
import { registerProjectTools } from './tools/project.js';

// =============================================================================
// Server Setup
// =============================================================================

const server = new McpServer({
    name: 'avaia',
    version: '1.0.0',
});

// =============================================================================
// Tool Registration
// =============================================================================

function registerAllTools(): void {
    registerSrsTools(server);
    registerSandboxTools(server);
    registerVerifyTools(server);
    registerContentTools(server);
    registerSessionTools(server);
    registerProjectTools(server);
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main(): Promise<void> {
    // Initialize database
    try {
        getDatabase();
        runMigrations();
        console.error('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }

    // Register all tools
    registerAllTools();
    console.error('All tools registered');

    // Start server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Avaia MCP Server running on stdio');

    // Cleanup on exit
    process.on('SIGINT', () => {
        closeDatabase();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        closeDatabase();
        process.exit(0);
    });
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
