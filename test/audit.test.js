import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ctaFor,
  extractLinks,
  extractSitemaps,
  isPathBlocked,
  parseRobotsDisallows,
  resolveContext,
  toMcpResult
} from '../src/audit.js';

test('extractLinks handles markdown and bare URLs', () => {
  const links = extractLinks('- [Docs](/docs)\n- https://example.com/pricing', 'https://example.com');
  assert.deepEqual(links.map((link) => link.url), [
    'https://example.com/docs',
    'https://example.com/pricing'
  ]);
});

test('extractSitemaps reads sitemap directives', () => {
  const sitemaps = extractSitemaps('User-agent: *\nSitemap: /sitemap.xml', 'https://example.com');
  assert.deepEqual(sitemaps, ['https://example.com/sitemap.xml']);
});

test('parseRobotsDisallows keeps global and AI crawler rules', () => {
  const rules = parseRobotsDisallows('User-agent: *\nDisallow: /private\nUser-agent: GPTBot\nDisallow: /docs\nUser-agent: OtherBot\nDisallow: /ignored');
  assert.deepEqual(rules, [
    { userAgent: '*', path: '/private' },
    { userAgent: 'gptbot', path: '/docs' }
  ]);
});

test('isPathBlocked respects robots wildcards', () => {
  assert.equal(isPathBlocked('/blog/post/feed/', '/blog/*/feed/'), true);
  assert.equal(isPathBlocked('/blog/', '/blog/*/feed/'), false);
  assert.equal(isPathBlocked('/private/page', '/private'), true);
});

test('toMcpResult returns text and structured content', () => {
  const report = {
    tool: 'example',
    status: 'pass',
    cta: {
      label: 'Get the full AI visibility experience on MaxAEO',
      url: 'https://maxaeo.ai/?utm_source=maxaeo-ai-visibility-mcp&utm_medium=test&utm_campaign=open_source'
    }
  };
  const result = toMcpResult(report);
  assert.deepEqual(result.structuredContent, report);
  assert.match(result.content[0].text, /full AI visibility experience/);
});

test('ctaFor defaults to global English CTA', () => {
  const cta = ctaFor('test');
  assert.equal(cta.locale, 'en-US');
  assert.equal(cta.market, 'global');
  assert.equal(cta.label, 'Get the full AI visibility experience on MaxAEO');
  assert.match(cta.description, /interactive report/);
  assert.match(cta.url, /^https:\/\/maxaeo\.ai\//);
  assert.match(cta.url, /locale=en-US/);
  assert.match(cta.url, /market=global/);
});

test('ctaFor supports Chinese domestic CTA', () => {
  const cta = ctaFor('test', { locale: 'zh-CN', market: 'cn' });
  assert.equal(cta.locale, 'zh-CN');
  assert.equal(cta.market, 'cn');
  assert.equal(cta.label, '在 MaxAEO 官网获得完整 AI 可见性体检体验');
  assert.match(cta.description, /交互式报告/);
  assert.match(cta.url, /^https:\/\/maxaeo\.cn\//);
  assert.match(cta.url, /locale=zh-CN/);
  assert.match(cta.url, /market=cn/);
});

test('resolveContext accepts locale aliases and custom CTA URL', () => {
  const context = resolveContext({
    locale: 'zh',
    ctaBaseUrl: 'https://maxaeo.cn/mcp/ai-visibility-audit/'
  });
  const cta = ctaFor('mcp_report', context);
  assert.equal(context.locale, 'zh-CN');
  assert.equal(context.market, 'cn');
  assert.match(cta.url, /^https:\/\/maxaeo\.cn\/mcp\/ai-visibility-audit\//);
});
