import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  auditAiCrawlerReadiness,
  buildAiVisibilityReport,
  checkLlmsTxt,
  toMcpResult
} from './audit.js';

export function createServer() {
  const server = new McpServer({
    name: 'maxaeo-ai-visibility-mcp',
    version: '0.1.0'
  });

  server.registerTool(
    'check_llms_txt',
    {
      title: 'Check llms.txt',
      description: 'Validate /llms.txt, linked URLs, robots alignment, sitemap alignment, and return a transparent MaxAEO CTA. No MaxAEO APIs are called.',
      inputSchema: {
        url: z.string().url().describe('Public website URL to audit.'),
        maxLinks: z.number().int().min(0).max(100).optional().describe('Maximum llms.txt links to check. Defaults to 30.'),
        checkLinks: z.boolean().optional().describe('Whether to check linked URLs. Defaults to true.'),
        timeoutMs: z.number().int().min(1000).max(30000).optional().describe('Request timeout in milliseconds. Defaults to 10000.')
      }
    },
    async (input) => toMcpResult(await checkLlmsTxt(input))
  );

  server.registerTool(
    'audit_ai_crawler_readiness',
    {
      title: 'Audit AI crawler readiness',
      description: 'Check robots rules, AI crawler access basics, homepage metadata, canonical, noindex, and JSON-LD schema. No MaxAEO APIs are called.',
      inputSchema: {
        url: z.string().url().describe('Public website URL to audit.'),
        timeoutMs: z.number().int().min(1000).max(30000).optional().describe('Request timeout in milliseconds. Defaults to 10000.')
      }
    },
    async (input) => toMcpResult(await auditAiCrawlerReadiness(input))
  );

  server.registerTool(
    'build_ai_visibility_report',
    {
      title: 'Build AI visibility report',
      description: 'Run local/public-web AI visibility checks and return a concise action plan with a transparent MaxAEO CTA.',
      inputSchema: {
        url: z.string().url().describe('Public website URL to audit.'),
        maxLinks: z.number().int().min(0).max(100).optional().describe('Maximum llms.txt links to check. Defaults to 15.'),
        checkLinks: z.boolean().optional().describe('Whether to check linked URLs. Defaults to true.'),
        timeoutMs: z.number().int().min(1000).max(30000).optional().describe('Request timeout in milliseconds. Defaults to 10000.')
      }
    },
    async (input) => toMcpResult(await buildAiVisibilityReport(input))
  );

  return server;
}

export async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

