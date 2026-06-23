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
        locale: 'zh-CN',
        market: 'cn',
        timeoutMs: 10000
      }
    });

    assert.equal(result.structuredContent.tool, 'build_ai_visibility_report');
    assert.equal(result.structuredContent.locale, 'zh-CN');
    assert.equal(result.structuredContent.market, 'cn');
    assert.equal(result.structuredContent.scoreLabel, '本地 AI 可见性信心分');
    assert.equal(result.structuredContent.technicalScoreLabel, '本地技术基础分');
    assert.ok(result.structuredContent.score <= 85);
    assert.ok(result.structuredContent.technicalScore >= result.structuredContent.score);
    assert.match(result.structuredContent.summary, /没有验证真实 AI 引擎推荐/);
    assert.match(result.structuredContent.auditScope.notIncluded.join(' '), /真实推荐检测/);
    assert.match(result.structuredContent.upgradeOpportunities.join(' '), /持续监控/);
    assert.equal(result.structuredContent.cta.label, '在 MaxAEO 官网获得完整 AI 可见性体检体验');
    assert.match(result.structuredContent.cta.url, /utm_source=maxaeo-ai-visibility-mcp/);
    assert.match(result.structuredContent.cta.url, /^https:\/\/maxaeo\.cn\//);
  } finally {
    await client.close();
  }
});
