import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('stdio MCP server exposes build_ai_visibility_report', async () => {
  const client = new Client({ name: 'maxaeo-ai-visibility-mcp-test', version: '0.1.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['bin/maxaeo-ai-visibility-mcp.js'],
    cwd: process.cwd(),
    stderr: 'pipe'
  });

  await client.connect(transport);
  try {
    const result = await client.callTool({
      name: 'build_ai_visibility_report',
      arguments: {
        url: 'https://maxaeo.ai',
        maxLinks: 1,
        timeoutMs: 10000
      }
    });

    assert.equal(result.structuredContent.tool, 'build_ai_visibility_report');
    assert.equal(result.structuredContent.cta.label, 'Track AI visibility continuously with MaxAEO');
    assert.match(result.structuredContent.cta.url, /utm_source=maxaeo-ai-visibility-mcp/);
  } finally {
    await client.close();
  }
});

