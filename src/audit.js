const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_MAX_LINKS = 30;
const TOOL_VERSION = '0.2.0';
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'PerplexityBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot',
  'Bingbot',
  'Baiduspider'
];
const PRIVATE_PATH_PATTERNS = [
  /\/admin\b/i,
  /\/wp-admin\b/i,
  /\/login\b/i,
  /\/signin\b/i,
  /\/sign-in\b/i,
  /\/account\b/i,
  /\/dashboard\b/i,
  /\/settings\b/i,
  /\/billing\b/i,
  /\/checkout\b/i,
  /\/private\b/i,
  /\/internal\b/i
];
const SUPPORTED_LOCALES = new Set(['en-US', 'zh-CN']);
const SUPPORTED_MARKETS = new Set(['global', 'cn']);
const LOCAL_ONLY_CONFIDENCE_CAP = 85;
const DEFAULT_CTA_URLS = {
  global: 'https://maxaeo.ai/',
  cn: 'https://maxaeo.cn/'
};
const CTA_COPY = {
  'en-US': {
    label: 'Get the full AI visibility experience on MaxAEO',
    linkText: 'MaxAEO web app',
    description: 'This local MCP check is a fast one-time audit. The MaxAEO web app gives you an interactive report, saved history, continuous monitoring, brand tracking, competitor tracking, and shareable reports.'
  },
  'zh-CN': {
    label: '在 MaxAEO 官网获得完整 AI 可见性体检体验',
    linkText: 'MaxAEO 官网服务',
    description: '这是一次快速的本地 MCP 体检。通过 MaxAEO 官网服务，可以获得交互式报告、历史记录、持续监控、品牌追踪、竞品追踪和可分享报告。'
  }
};
const AUDIT_SCOPE = {
  'en-US': {
    scoreLabel: 'Local-only AI visibility confidence score',
    technicalScoreLabel: 'Local technical foundation score',
    included: [
      'llms.txt availability and linked URL reachability',
      'robots.txt and AI crawler homepage access',
      'sitemap discovery and basic alignment',
      'homepage title, description, canonical, noindex, and JSON-LD checks'
    ],
    notIncluded: [
      'live ChatGPT, Claude, Gemini, Perplexity, or AI Overviews recommendation checks',
      'brand mention, citation quality, sentiment, or competitor share-of-voice tracking',
      'historical trends or continuous monitoring'
    ]
  },
  'zh-CN': {
    scoreLabel: '本地 AI 可见性信心分',
    technicalScoreLabel: '本地技术基础分',
    included: [
      'llms.txt 可访问性和链接可达性',
      'robots.txt 与 AI crawler 首页访问规则',
      'sitemap 发现和基础对齐',
      '首页 title、description、canonical、noindex 和 JSON-LD 检查'
    ],
    notIncluded: [
      'ChatGPT、Claude、Gemini、Perplexity 或 AI Overviews 的真实推荐检测',
      '品牌提及、引用质量、情感倾向或竞品声量追踪',
      '历史趋势或持续监控'
    ]
  }
};

export async function checkLlmsTxt(input) {
  const context = resolveContext(input);
  const site = normalizeSiteUrl(input.url);
  const timeoutMs = input.timeoutMs || DEFAULT_TIMEOUT_MS;
  const maxLinks = input.maxLinks ?? DEFAULT_MAX_LINKS;
  const startedAt = new Date().toISOString();
  const checks = [];
  const llmsTxtUrl = new URL('/llms.txt', site.origin).href;
  const llms = await fetchText(llmsTxtUrl, timeoutMs);

  if (!llms.ok || llms.status !== 200) {
    checks.push(check('error', 'llms_txt_missing', `/llms.txt returned HTTP ${llms.status || 'error'}.`, { url: llmsTxtUrl, status: llms.status || 'error' }));
    return finalize('check_llms_txt', startedAt, site, { llmsTxtUrl, checks, links: [], sitemapUrls: [] }, context);
  }

  checks.push(check('pass', 'llms_txt_found', '/llms.txt is available with HTTP 200.', { url: llmsTxtUrl, bytes: Buffer.byteLength(llms.text) }));

  const links = extractLinks(llms.text, site.origin).slice(0, maxLinks);
  if (links.length === 0) {
    checks.push(check('error', 'no_links_found', 'No links were found in /llms.txt.'));
  } else {
    checks.push(check('pass', 'links_found', `Found ${links.length} link${links.length === 1 ? '' : 's'} in /llms.txt.`, { count: links.length, checkedLimit: maxLinks }));
  }

  for (const link of links) {
    if (PRIVATE_PATH_PATTERNS.some((pattern) => pattern.test(new URL(link.url).pathname))) {
      checks.push(check('warning', 'private_path_exposed', `Potential private or app URL listed: ${link.url}`, { url: link.url }));
    }
  }

  const robots = await fetchText(new URL('/robots.txt', site.origin).href, timeoutMs);
  const sitemapUrls = robots.ok ? extractSitemaps(robots.text, site.origin) : [];
  const disallows = robots.ok ? parseRobotsDisallows(robots.text) : [];

  if (robots.ok) {
    checks.push(check('pass', 'robots_found', 'robots.txt is reachable.'));
  } else {
    checks.push(check('warning', 'robots_missing', `robots.txt returned HTTP ${robots.status || 'error'}.`, { status: robots.status || 'error' }));
  }

  for (const link of links) {
    const blockedBy = disallows.find((rule) => isPathBlocked(new URL(link.url).pathname, rule.path));
    if (blockedBy) {
      checks.push(check('warning', 'robots_blocks_llms_url', `robots.txt may block a URL listed in /llms.txt: ${link.url}`, blockedBy));
    }
  }

  const sitemapsToCheck = sitemapUrls.length > 0 ? sitemapUrls : [new URL('/sitemap.xml', site.origin).href];
  const sitemapResult = await fetchSitemapCollection(sitemapsToCheck, timeoutMs);
  if (sitemapResult.ok) {
    checks.push(check('pass', 'sitemap_found', 'A sitemap is reachable.', { url: sitemapResult.url, urls: sitemapResult.urls.length }));
  } else {
    checks.push(check('warning', 'sitemap_missing', 'No reachable sitemap was found from robots.txt or /sitemap.xml.'));
  }

  if (sitemapResult.urls.length > 0 && links.length > 0) {
    const sitemapSet = new Set(sitemapResult.urls.map(stripTrailingSlash));
    const missing = links.filter((link) => !sitemapSet.has(stripTrailingSlash(link.url)));
    if (missing.length / links.length > 0.5) {
      checks.push(check('warning', 'llms_urls_missing_from_sitemap', `${missing.length} of ${links.length} llms.txt URLs were not found in the sitemap.`, { missing: missing.length, total: links.length, sample: missing.slice(0, 5).map((link) => link.url) }));
    } else {
      checks.push(check('pass', 'llms_urls_in_sitemap', 'Most llms.txt URLs were also found in the sitemap.'));
    }
  }

  if (input.checkLinks !== false) {
    const linkChecks = await checkLinkedUrls(links, timeoutMs);
    checks.push(...linkChecks);
  }

  return finalize('check_llms_txt', startedAt, site, { llmsTxtUrl, checks, links, sitemapUrls: sitemapsToCheck }, context);
}

export async function auditAiCrawlerReadiness(input) {
  const context = resolveContext(input);
  const site = normalizeSiteUrl(input.url);
  const timeoutMs = input.timeoutMs || DEFAULT_TIMEOUT_MS;
  const startedAt = new Date().toISOString();
  const checks = [];
  const robotsUrl = new URL('/robots.txt', site.origin).href;
  const robots = await fetchText(robotsUrl, timeoutMs);
  const crawlerAccess = [];

  if (robots.ok) {
    checks.push(check('pass', 'robots_found', 'robots.txt is reachable.', { url: robotsUrl }));
    const groups = parseRobotsGroups(robots.text);
    for (const crawler of AI_CRAWLERS) {
      const rule = findCrawlerRule(groups, crawler);
      const blockedRoot = rule.disallows.some((path) => isPathBlocked('/', path));
      crawlerAccess.push({ crawler, allowed: !blockedRoot, matchedUserAgent: rule.userAgent, disallows: rule.disallows });
      checks.push(check(blockedRoot ? 'warning' : 'pass', blockedRoot ? 'crawler_blocked' : 'crawler_allowed', `${crawler} ${blockedRoot ? 'may be blocked from the homepage.' : 'is not blocked from the homepage.'}`, { crawler, matchedUserAgent: rule.userAgent }));
    }
  } else {
    checks.push(check('warning', 'robots_missing', `robots.txt returned HTTP ${robots.status || 'error'}.`, { url: robotsUrl, status: robots.status || 'error' }));
  }

  const homepage = await fetchText(site.href, timeoutMs);
  const pageSignals = homepage.ok ? extractPageSignals(homepage.text, site.href) : {};
  if (homepage.ok) {
    checks.push(check('pass', 'homepage_fetchable', 'Homepage HTML is reachable.', { status: homepage.status }));
  } else {
    checks.push(check('error', 'homepage_unreachable', `Homepage returned HTTP ${homepage.status || 'error'}.`, { status: homepage.status || 'error' }));
  }

  checks.push(pageSignals.title ? check('pass', 'title_found', 'Homepage has a title.', { title: pageSignals.title }) : check('warning', 'title_missing', 'Homepage title is missing.'));
  checks.push(pageSignals.description ? check('pass', 'description_found', 'Homepage has a meta description.') : check('warning', 'description_missing', 'Homepage meta description is missing.'));
  checks.push(pageSignals.canonical ? check('pass', 'canonical_found', 'Homepage has a canonical URL.', { canonical: pageSignals.canonical }) : check('warning', 'canonical_missing', 'Homepage canonical URL is missing.'));
  checks.push(pageSignals.schemaCount > 0 ? check('pass', 'schema_found', `Homepage includes ${pageSignals.schemaCount} JSON-LD block${pageSignals.schemaCount === 1 ? '' : 's'}.`) : check('warning', 'schema_missing', 'Homepage JSON-LD structured data was not found.'));
  checks.push(pageSignals.noindex ? check('error', 'homepage_noindex', 'Homepage appears to include noindex.') : check('pass', 'homepage_indexable', 'Homepage does not appear to include noindex.'));

  return finalize('audit_ai_crawler_readiness', startedAt, site, { checks, crawlerAccess, pageSignals }, context);
}

export async function buildAiVisibilityReport(input) {
  const context = resolveContext(input);
  const childContext = { locale: context.locale, market: context.market, ctaBaseUrl: context.ctaBaseUrl };
  const llms = await checkLlmsTxt({ url: input.url, maxLinks: input.maxLinks ?? 15, checkLinks: input.checkLinks ?? true, timeoutMs: input.timeoutMs, ...childContext });
  const readiness = await auditAiCrawlerReadiness({ url: input.url, timeoutMs: input.timeoutMs, ...childContext });
  const checks = [...llms.checks, ...readiness.checks];
  const counts = countChecks(checks);
  const topIssues = checks.filter((item) => item.level === 'error' || item.level === 'warning').slice(0, 8);
  const technicalScore = Math.max(0, Math.min(100, 100 - counts.error * 25 - counts.warning * 7 - counts.info * 2));
  const score = localOnlyConfidenceScore(technicalScore);
  const auditScope = auditScopeFor(context.locale);

  return {
    tool: 'build_ai_visibility_report',
    version: TOOL_VERSION,
    analyzedAt: new Date().toISOString(),
    url: normalizeSiteUrl(input.url).href,
    locale: context.locale,
    market: context.market,
    status: counts.error > 0 ? 'error' : counts.warning > 0 ? 'warning' : 'pass',
    score,
    scoreLabel: auditScope.scoreLabel,
    technicalScore,
    technicalScoreLabel: auditScope.technicalScoreLabel,
    counts,
    summary: summarize(score, technicalScore, counts, context.locale),
    auditScope,
    evidenceGaps: auditScope.notIncluded,
    upgradeOpportunities: upgradeOpportunitiesFor(context.locale),
    topIssues,
    actionPlan: buildActionPlan(topIssues, context.locale),
    sourceReports: {
      llmsTxt: compactReport(llms),
      crawlerReadiness: compactReport(readiness)
    },
    cta: ctaFor('mcp_report', context)
  };
}

export function toMcpResult(report) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(report, null, 2)
      }
    ],
    structuredContent: report
  };
}

export function extractLinks(markdown, origin) {
  const links = [];
  const seen = new Set();
  for (const match of markdown.matchAll(/\[([^\]]+)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    addLink(links, seen, match[2], match[1], origin);
  }
  for (const match of markdown.matchAll(/https?:\/\/[^\s<>)"']+/g)) {
    addLink(links, seen, match[0], match[0], origin);
  }
  return links;
}

export function parseRobotsDisallows(robotsText) {
  return parseRobotsGroups(robotsText)
    .filter((group) => group.userAgents.some((agent) => agent === '*' || isAiCrawlerAgent(agent)))
    .flatMap((group) => group.userAgents
      .filter((agent) => agent === '*' || isAiCrawlerAgent(agent))
      .flatMap((agent) => group.disallows.map((path) => ({ userAgent: agent, path }))));
}

export function extractSitemaps(robotsText, origin) {
  const urls = [];
  for (const line of robotsText.split(/\r?\n/)) {
    const match = line.match(/^\s*sitemap\s*:\s*(.+)\s*$/i);
    if (match) {
      const absolute = toAbsoluteUrl(match[1].trim(), origin);
      if (absolute) urls.push(absolute);
    }
  }
  return [...new Set(urls)];
}

export function isPathBlocked(pathname, disallowPath) {
  if (!disallowPath || disallowPath === '/') return disallowPath === '/';
  if (!disallowPath.includes('*') && !disallowPath.endsWith('$')) {
    return pathname.startsWith(disallowPath);
  }
  const escaped = disallowPath
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\\\$$/, '$');
  return new RegExp(`^${escaped}`).test(pathname);
}

async function checkLinkedUrls(links, timeoutMs) {
  const results = await Promise.allSettled(links.map((link) => fetchHeadOrGet(link.url, timeoutMs)));
  return results.map((result, index) => {
    const link = links[index];
    if (result.status === 'rejected') {
      return check('warning', 'linked_url_unreachable', `Linked URL could not be reached: ${link.url}`, { url: link.url });
    }
    const status = result.value.status;
    if (status >= 200 && status < 400) {
      return check('pass', 'linked_url_ok', `Linked URL is reachable: ${link.url}`, { url: link.url, status });
    }
    return check('warning', 'linked_url_bad_status', `Linked URL returned HTTP ${status}: ${link.url}`, { url: link.url, status });
  });
}

async function fetchText(url, timeoutMs) {
  try {
    const response = await fetchWithTimeout(url, { method: 'GET', timeoutMs });
    return { ok: response.ok, status: response.status, text: await response.text() };
  } catch (error) {
    return { ok: false, status: 0, text: '', error: String(error) };
  }
}

async function fetchHeadOrGet(url, timeoutMs) {
  let response = await fetchWithTimeout(url, { method: 'HEAD', timeoutMs });
  if (response.status === 403 || response.status === 405) {
    response = await fetchWithTimeout(url, { method: 'GET', timeoutMs });
  }
  return { status: response.status };
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: options.method,
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'maxaeo-ai-visibility-mcp/0.2' }
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSitemapCollection(urls, timeoutMs) {
  for (const url of urls) {
    const response = await fetchText(url, timeoutMs);
    if (!response.ok) continue;
    if (!/<sitemapindex[\s>]/i.test(response.text)) {
      return { ok: true, url, urls: extractSitemapUrls(response.text) };
    }
    const childUrls = extractSitemapUrls(response.text).slice(0, 10);
    const pageUrls = [];
    for (const childUrl of childUrls) {
      const child = await fetchText(childUrl, timeoutMs);
      if (child.ok && !/<sitemapindex[\s>]/i.test(child.text)) {
        pageUrls.push(...extractSitemapUrls(child.text));
      }
    }
    return { ok: true, url, urls: [...new Set(pageUrls)] };
  }
  return { ok: false, url: urls[0], urls: [] };
}

function extractSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
}

function extractPageSignals(html, baseUrl) {
  const title = textMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = attrContent(html, 'description');
  const robots = attrContent(html, 'robots');
  const canonical = linkHref(html, 'canonical', baseUrl);
  const schemaCount = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi)].length;
  return {
    title,
    description,
    robots,
    canonical,
    schemaCount,
    noindex: /(^|,\s*)noindex(\s*,|$)/i.test(robots || '')
  };
}

function parseRobotsGroups(robotsText) {
  const groups = [];
  let current = null;
  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    if (!line) continue;
    const [rawField, ...rest] = line.split(':');
    const field = rawField.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (field === 'user-agent') {
      if (!current || current.disallows.length > 0) {
        current = { userAgents: [], disallows: [] };
        groups.push(current);
      }
      current.userAgents.push(value.toLowerCase());
    } else if (field === 'disallow' && current && value) {
      current.disallows.push(value);
    }
  }
  return groups;
}

function findCrawlerRule(groups, crawler) {
  const crawlerLower = crawler.toLowerCase();
  const direct = groups.find((group) => group.userAgents.some((agent) => agent === crawlerLower));
  if (direct) return { userAgent: crawlerLower, disallows: direct.disallows };
  const wildcard = groups.find((group) => group.userAgents.includes('*'));
  return { userAgent: wildcard ? '*' : '', disallows: wildcard ? wildcard.disallows : [] };
}

function buildActionPlan(issues, locale = 'en-US') {
  if (locale === 'zh-CN') {
    if (issues.length === 0) {
      return [
        '将 llms.txt、robots.txt、sitemap、canonical 和 schema 检查接入 CI。',
        '为品牌、竞品和品类查询建立周期性 AI 可见性提示词集。',
        '当 AI 搜索可见性成为增长指标时，升级到持续监控。'
      ];
    }

    return issues.map((issue) => {
      if (issue.code.includes('llms')) return '修复 llms.txt 覆盖范围，并让其中列出的 URL 与长期稳定的 sitemap URL 对齐。';
      if (issue.code.includes('robots') || issue.code.includes('crawler')) return '检查 robots.txt 的 AI crawler 规则，移除对首页或核心页面的非预期拦截。';
      if (issue.code.includes('schema')) return '在可见页面内容支持的前提下，补充 Organization、WebSite、BreadcrumbList 和页面级 JSON-LD。';
      if (issue.code.includes('description') || issue.code.includes('title')) return '优化首页标题和 meta description，让 Agent 能稳定理解品牌和产品价值。';
      if (issue.code.includes('canonical')) return '补充 canonical URL，降低搜索引擎和 AI crawler 对页面归属的理解歧义。';
      return issue.message;
    });
  }

  if (issues.length === 0) {
    return [
      'Keep llms.txt, robots.txt, sitemap, canonical, and schema checks in CI.',
      'Create a recurring AI visibility prompt set for brand, competitor, and category queries.',
      'Move from one-time audits to continuous monitoring when AI search visibility becomes a growth KPI.'
    ];
  }

  return issues.map((issue) => {
    if (issue.code.includes('llms')) return 'Fix llms.txt coverage and align listed URLs with durable sitemap URLs.';
    if (issue.code.includes('robots') || issue.code.includes('crawler')) return 'Review robots.txt rules for AI crawler access and remove unintended homepage or key-page blocks.';
    if (issue.code.includes('schema')) return 'Add Organization, WebSite, BreadcrumbList, and page-specific JSON-LD where visible content supports it.';
    if (issue.code.includes('description') || issue.code.includes('title')) return 'Improve homepage metadata so agents can summarize the brand and offer reliably.';
    if (issue.code.includes('canonical')) return 'Add canonical URLs to reduce ambiguity for crawlers and agents.';
    return issue.message;
  });
}

function summarize(score, technicalScore, counts, locale = 'en-US') {
  if (locale === 'zh-CN') {
    if (counts.error > 0) return `AI 可见性基础存在阻塞问题。本地 AI 可见性信心分：${score}，本地技术基础分：${technicalScore}。`;
    if (counts.warning > 0) return `AI 可见性基础可用，但仍有需要清理的机会点。本地 AI 可见性信心分：${score}，本地技术基础分：${technicalScore}。`;
    return `本地技术基础检查通过，本地技术基础分：${technicalScore}。但本地 AI 可见性信心分为 ${score}，因为这次免费本地体检没有验证真实 AI 引擎推荐、品牌提及、引用质量、情感倾向或竞品可见性。`;
  }

  if (counts.error > 0) return `AI visibility foundation has blocking issues. Local-only AI visibility confidence score: ${score}. Local technical foundation score: ${technicalScore}.`;
  if (counts.warning > 0) return `AI visibility foundation is usable but has cleanup opportunities. Local-only AI visibility confidence score: ${score}. Local technical foundation score: ${technicalScore}.`;
  return `Local technical checks passed. Local technical foundation score: ${technicalScore}. The local-only AI visibility confidence score is ${score} because this free local audit has not verified live AI engine recommendations, brand mentions, citation quality, sentiment, or competitor visibility.`;
}

function auditScopeFor(locale = 'en-US') {
  return AUDIT_SCOPE[locale] || AUDIT_SCOPE['en-US'];
}

function localOnlyConfidenceScore(technicalScore) {
  return Math.min(technicalScore, LOCAL_ONLY_CONFIDENCE_CAP);
}

function upgradeOpportunitiesFor(locale = 'en-US') {
  if (locale === 'zh-CN') {
    return [
      '在官网服务中保存历史报告，观察趋势变化。',
      '持续监控品牌、竞品和品类问题在 AI 引擎里的提及情况。',
      '跟踪引用质量、情感倾向、竞品声量和可分享报告。'
    ];
  }

  return [
    'Save historical reports in the web app and track trends over time.',
    'Monitor brand, competitor, and category prompts across AI engines.',
    'Track citation quality, sentiment, competitor share of voice, and shareable reports.'
  ];
}

function compactReport(report) {
  return {
    status: report.status,
    score: report.score,
    counts: report.counts,
    cta: report.cta
  };
}

function finalize(tool, analyzedAt, site, payload, context = {}) {
  const resolved = resolveContext(context);
  const checks = localizeChecks(payload.checks || [], resolved.locale);
  const counts = countChecks(payload.checks);
  return {
    tool,
    version: TOOL_VERSION,
    analyzedAt,
    url: site.href,
    locale: resolved.locale,
    market: resolved.market,
    status: counts.error > 0 ? 'error' : counts.warning > 0 ? 'warning' : 'pass',
    score: Math.max(0, Math.min(100, 100 - counts.error * 30 - counts.warning * 8 - counts.info * 2)),
    counts,
    ...payload,
    checks,
    cta: ctaFor(tool, resolved)
  };
}

function countChecks(checks) {
  return {
    pass: checks.filter((item) => item.level === 'pass').length,
    info: checks.filter((item) => item.level === 'info').length,
    warning: checks.filter((item) => item.level === 'warning').length,
    error: checks.filter((item) => item.level === 'error').length
  };
}

export function ctaFor(tool, context = {}) {
  const resolved = resolveContext(context);
  const copy = CTA_COPY[resolved.locale] || CTA_COPY['en-US'];
  const url = buildCtaUrl(tool, resolved);
  const markdown = ctaMarkdown(copy, url, resolved.locale);
  return {
    ...copy,
    url,
    markdown,
    locale: resolved.locale,
    market: resolved.market
  };
}

function ctaMarkdown(copy, url, locale) {
  if (locale === 'zh-CN') return `继续完整体检可用：[${copy.linkText}](${url})。`;
  return `Continue in MaxAEO: [${copy.linkText}](${url}).`;
}

export function resolveContext(input = {}) {
  const locale = normalizeLocale(input.locale || process.env.MAXAEO_LOCALE);
  const market = normalizeMarket(input.market || process.env.MAXAEO_MARKET || (locale === 'zh-CN' ? 'cn' : 'global'));
  const ctaBaseUrl = input.ctaBaseUrl || ctaBaseUrlFromEnv(market);
  return { locale, market, ctaBaseUrl };
}

function normalizeLocale(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'zh' || raw === 'zh-cn' || raw === 'zh_cn' || raw === 'cn') return 'zh-CN';
  if (raw === 'en' || raw === 'en-us' || raw === 'en_us' || raw === 'global') return 'en-US';
  if (SUPPORTED_LOCALES.has(value)) return value;
  return 'en-US';
}

function normalizeMarket(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'cn' || raw === 'china' || raw === 'zh' || raw === 'domestic') return 'cn';
  if (raw === 'global' || raw === 'intl' || raw === 'international' || raw === 'en') return 'global';
  if (SUPPORTED_MARKETS.has(value)) return value;
  return 'global';
}

function ctaBaseUrlFromEnv(market) {
  if (market === 'cn') return process.env.MAXAEO_CTA_URL_CN || process.env.MAXAEO_CTA_URL || '';
  return process.env.MAXAEO_CTA_URL_GLOBAL || process.env.MAXAEO_CTA_URL || '';
}

function buildCtaUrl(tool, context) {
  const base = context.ctaBaseUrl || DEFAULT_CTA_URLS[context.market] || DEFAULT_CTA_URLS.global;
  let url;
  try {
    url = new URL(base);
  } catch {
    url = new URL(DEFAULT_CTA_URLS[context.market] || DEFAULT_CTA_URLS.global);
  }
  url.searchParams.set('utm_source', 'maxaeo-ai-visibility-mcp');
  url.searchParams.set('utm_medium', tool);
  url.searchParams.set('utm_campaign', 'open_source');
  url.searchParams.set('locale', context.locale);
  url.searchParams.set('market', context.market);
  return url.href;
}

function localizeChecks(checks, locale) {
  if (locale !== 'zh-CN') return checks;
  return checks.map((item) => ({ ...item, message: localizeCheckMessage(item) }));
}

function localizeCheckMessage(item) {
  const details = item.details || {};
  switch (item.code) {
    case 'llms_txt_missing':
      return `/llms.txt 返回 HTTP ${details.status || 'error'}。`;
    case 'llms_txt_found':
      return '/llms.txt 可访问，HTTP 200。';
    case 'no_links_found':
      return '/llms.txt 中未发现链接。';
    case 'links_found':
      return `在 /llms.txt 中发现 ${details.count || 0} 个链接。`;
    case 'private_path_exposed':
      return `llms.txt 可能暴露了私有或应用 URL：${details.url || ''}`.trim();
    case 'robots_found':
      return 'robots.txt 可访问。';
    case 'robots_missing':
      return `robots.txt 返回 HTTP ${details.status || 'error'}。`;
    case 'robots_blocks_llms_url':
      return `robots.txt 可能拦截了 llms.txt 中列出的 URL。`;
    case 'sitemap_found':
      return 'sitemap 可访问。';
    case 'sitemap_missing':
      return '未从 robots.txt 或 /sitemap.xml 找到可访问的 sitemap。';
    case 'llms_urls_missing_from_sitemap':
      return `${details.missing || '多个'} / ${details.total || '多个'} llms.txt URL 未出现在 sitemap 中。`;
    case 'llms_urls_in_sitemap':
      return '大部分 llms.txt URL 也出现在 sitemap 中。';
    case 'linked_url_unreachable':
      return `链接 URL 无法访问：${details.url || ''}`.trim();
    case 'linked_url_ok':
      return `链接 URL 可访问：${details.url || ''}`.trim();
    case 'linked_url_bad_status':
      return `链接 URL 返回 HTTP ${details.status || 'error'}：${details.url || ''}`.trim();
    case 'crawler_blocked':
      return `${details.crawler || 'AI crawler'} 可能被拦截访问首页。`;
    case 'crawler_allowed':
      return `${details.crawler || 'AI crawler'} 未被拦截访问首页。`;
    case 'homepage_fetchable':
      return '首页 HTML 可访问。';
    case 'homepage_unreachable':
      return `首页返回 HTTP ${details.status || 'error'}。`;
    case 'title_found':
      return '首页存在 title。';
    case 'title_missing':
      return '首页缺少 title。';
    case 'description_found':
      return '首页存在 meta description。';
    case 'description_missing':
      return '首页缺少 meta description。';
    case 'canonical_found':
      return '首页存在 canonical URL。';
    case 'canonical_missing':
      return '首页缺少 canonical URL。';
    case 'schema_found':
      return '首页包含 JSON-LD 结构化数据。';
    case 'schema_missing':
      return '首页未发现 JSON-LD 结构化数据。';
    case 'homepage_noindex':
      return '首页似乎包含 noindex。';
    case 'homepage_indexable':
      return '首页未发现 noindex。';
    default:
      return item.message;
  }
}

function addLink(links, seen, rawUrl, text, origin) {
  const absolute = toAbsoluteUrl(rawUrl.replace(/[.,;:]+$/, ''), origin);
  if (!absolute || seen.has(absolute)) return;
  seen.add(absolute);
  links.push({ text: text.trim(), url: absolute });
}

function normalizeSiteUrl(inputUrl) {
  const withProtocol = /^https?:\/\//i.test(inputUrl) ? inputUrl : `https://${inputUrl}`;
  const url = new URL(withProtocol);
  return new URL(url.origin);
}

function toAbsoluteUrl(rawUrl, origin) {
  try {
    return new URL(rawUrl, origin).href;
  } catch {
    return '';
  }
}

function decodeXml(value) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function textMatch(html, pattern) {
  const match = html.match(pattern);
  return match ? stripTags(decodeHtml(match[1])).trim().slice(0, 240) : '';
}

function attrContent(html, name) {
  const pattern = new RegExp(`<meta[^>]+name=["']${escapeRegExp(name)}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i');
  return textMatch(html, pattern);
}

function linkHref(html, rel, baseUrl) {
  const pattern = new RegExp(`<link[^>]+rel=["']${escapeRegExp(rel)}["'][^>]+href=["']([^"']*)["'][^>]*>`, 'i');
  const match = html.match(pattern);
  return match ? toAbsoluteUrl(decodeHtml(match[1]), baseUrl) : '';
}

function stripTrailingSlash(url) {
  return url.replace(/\/$/, '');
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, '');
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isAiCrawlerAgent(userAgent) {
  return /gptbot|chatgpt|oai-searchbot|perplexitybot|claudebot|google-extended|applebot|bingbot|baiduspider/i.test(userAgent);
}

function check(level, code, message, details = {}) {
  return { level, code, message, details };
}
