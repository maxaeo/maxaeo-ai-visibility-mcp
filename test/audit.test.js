import assert from 'node:assert/strict';
import test from 'node:test';
import {
  crawlersForMarket,
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
  assert.equal(cta.linkText, 'MaxAEO web app');
  assert.match(cta.description, /interactive report/);
  assert.match(cta.markdown, /^Continue in MaxAEO: \[MaxAEO web app\]\(https:\/\/maxaeo\.ai\//);
  assert.match(cta.url, /^https:\/\/maxaeo\.ai\//);
  assert.match(cta.url, /locale=en-US/);
  assert.match(cta.url, /market=global/);
});

test('ctaFor supports Chinese domestic CTA', () => {
  const cta = ctaFor('test', { locale: 'zh-CN', market: 'cn' });
  assert.equal(cta.locale, 'zh-CN');
  assert.equal(cta.market, 'cn');
  assert.equal(cta.label, '在 MaxAEO 官网获得完整 AI 可见性体检体验');
  assert.equal(cta.linkText, 'MaxAEO 官网服务');
  assert.match(cta.description, /交互式报告/);
  assert.match(cta.markdown, /^继续完整体检可用：\[MaxAEO 官网服务\]\(https:\/\/maxaeo\.cn\//);
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

test('crawlersForMarket returns the global set by default', () => {
  const global = crawlersForMarket('global');
  assert.ok(global.includes('GPTBot'));
  assert.ok(global.includes('OAI-SearchBot'));
  assert.deepEqual(crawlersForMarket(undefined), global);
});

test('crawlersForMarket returns China-specific crawlers for the cn market', () => {
  const cn = crawlersForMarket('cn');
  assert.ok(cn.includes('Baiduspider'));
  assert.ok(cn.includes('PetalBot'));
  assert.ok(cn.includes('Sogou web spider'));
  assert.ok(cn.includes('Bytespider'));
});

test('crawler lists contain no unverified user-agents', () => {
  // These tokens circulate in blog posts and community lists but appear zero
  // times across 58 major Chinese domains' robots.txt, and some conflict with
  // the real token (Baiduspider, not BaiduBot). Auditing against a user-agent
  // that does not exist produces a finding nobody can act on.
  const unverified = [
    'BaiduBot', 'BaiduSpider-AI', 'DoubaoBot', 'Doubao', 'AlibabaBot',
    'Alibaba-Crawler-AI', 'TongyiBot', 'YiyanBot', 'Kimi-User', 'Kimi',
    'ChatGLM', 'ChatGLM-Spider', 'Qwenbot', 'Hunyuan', 'Yuanbao',
    'PanguBot', 'MetasoBot', 'DeepSeekBot'
  ];
  for (const market of ['global', 'cn']) {
    const list = crawlersForMarket(market).map((item) => item.toLowerCase());
    for (const token of unverified) {
      assert.ok(
        !list.includes(token.toLowerCase()),
        `${token} is not a verifiable crawler and must not be audited (${market})`
      );
    }
  }
});

test('each market audits the same number of crawlers so scores stay comparable', () => {
  // technicalScore subtracts a fixed amount per blocked crawler, so changing
  // the list length between markets would silently change the score scale.
  assert.equal(crawlersForMarket('cn').length, crawlersForMarket('global').length);
});
