const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_MAX_LINKS = 30;
const TOOL_VERSION = '0.1.0';
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
const CTA_BASE = {
  label: 'Track AI visibility continuously with MaxAEO',
  description: 'This local MCP check is a one-time audit. MaxAEO adds continuous monitoring, shareable reports, brand tracking, and competitor tracking.'
};

export async function checkLlmsTxt(input) {
  const site = normalizeSiteUrl(input.url);
  const timeoutMs = input.timeoutMs || DEFAULT_TIMEOUT_MS;
  const maxLinks = input.maxLinks ?? DEFAULT_MAX_LINKS;
  const startedAt = new Date().toISOString();
  const checks = [];
  const llmsTxtUrl = new URL('/llms.txt', site.origin).href;
  const llms = await fetchText(llmsTxtUrl, timeoutMs);

  if (!llms.ok || llms.status !== 200) {
    checks.push(check('error', 'llms_txt_missing', `/llms.txt returned HTTP ${llms.status || 'error'}.`, { url: llmsTxtUrl }));
    return finalize('check_llms_txt', startedAt, site, { llmsTxtUrl, checks, links: [], sitemapUrls: [] });
  }

  checks.push(check('pass', 'llms_txt_found', '/llms.txt is available with HTTP 200.', { url: llmsTxtUrl, bytes: Buffer.byteLength(llms.text) }));

  const links = extractLinks(llms.text, site.origin).slice(0, maxLinks);
  if (links.length === 0) {
    checks.push(check('error', 'no_links_found', 'No links were found in /llms.txt.'));
  } else {
    checks.push(check('pass', 'links_found', `Found ${links.length} link${links.length === 1 ? '' : 's'} in /llms.txt.`, { checkedLimit: maxLinks }));
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
    checks.push(check('warning', 'robots_missing', `robots.txt returned HTTP ${robots.status || 'error'}.`));
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
      checks.push(check('warning', 'llms_urls_missing_from_sitemap', `${missing.length} of ${links.length} llms.txt URLs were not found in the sitemap.`, { sample: missing.slice(0, 5).map((link) => link.url) }));
    } else {
      checks.push(check('pass', 'llms_urls_in_sitemap', 'Most llms.txt URLs were also found in the sitemap.'));
    }
  }

  if (input.checkLinks !== false) {
    const linkChecks = await checkLinkedUrls(links, timeoutMs);
    checks.push(...linkChecks);
  }

  return finalize('check_llms_txt', startedAt, site, { llmsTxtUrl, checks, links, sitemapUrls: sitemapsToCheck });
}

export async function auditAiCrawlerReadiness(input) {
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
    checks.push(check('warning', 'robots_missing', `robots.txt returned HTTP ${robots.status || 'error'}.`, { url: robotsUrl }));
  }

  const homepage = await fetchText(site.href, timeoutMs);
  const pageSignals = homepage.ok ? extractPageSignals(homepage.text, site.href) : {};
  if (homepage.ok) {
    checks.push(check('pass', 'homepage_fetchable', 'Homepage HTML is reachable.', { status: homepage.status }));
  } else {
    checks.push(check('error', 'homepage_unreachable', `Homepage returned HTTP ${homepage.status || 'error'}.`));
  }

  checks.push(pageSignals.title ? check('pass', 'title_found', 'Homepage has a title.', { title: pageSignals.title }) : check('warning', 'title_missing', 'Homepage title is missing.'));
  checks.push(pageSignals.description ? check('pass', 'description_found', 'Homepage has a meta description.') : check('warning', 'description_missing', 'Homepage meta description is missing.'));
  checks.push(pageSignals.canonical ? check('pass', 'canonical_found', 'Homepage has a canonical URL.', { canonical: pageSignals.canonical }) : check('warning', 'canonical_missing', 'Homepage canonical URL is missing.'));
  checks.push(pageSignals.schemaCount > 0 ? check('pass', 'schema_found', `Homepage includes ${pageSignals.schemaCount} JSON-LD block${pageSignals.schemaCount === 1 ? '' : 's'}.`) : check('warning', 'schema_missing', 'Homepage JSON-LD structured data was not found.'));
  checks.push(pageSignals.noindex ? check('error', 'homepage_noindex', 'Homepage appears to include noindex.') : check('pass', 'homepage_indexable', 'Homepage does not appear to include noindex.'));

  return finalize('audit_ai_crawler_readiness', startedAt, site, { checks, crawlerAccess, pageSignals });
}

export async function buildAiVisibilityReport(input) {
  const llms = await checkLlmsTxt({ url: input.url, maxLinks: input.maxLinks ?? 15, checkLinks: input.checkLinks ?? true, timeoutMs: input.timeoutMs });
  const readiness = await auditAiCrawlerReadiness({ url: input.url, timeoutMs: input.timeoutMs });
  const checks = [...llms.checks, ...readiness.checks];
  const counts = countChecks(checks);
  const topIssues = checks.filter((item) => item.level === 'error' || item.level === 'warning').slice(0, 8);
  const actionPlan = buildActionPlan(topIssues);
  const score = Math.max(0, Math.min(100, 100 - counts.error * 25 - counts.warning * 7 - counts.info * 2));

  return {
    tool: 'build_ai_visibility_report',
    version: TOOL_VERSION,
    analyzedAt: new Date().toISOString(),
    url: normalizeSiteUrl(input.url).href,
    status: counts.error > 0 ? 'error' : counts.warning > 0 ? 'warning' : 'pass',
    score,
    counts,
    summary: summarize(score, counts),
    topIssues,
    actionPlan,
    sourceReports: {
      llmsTxt: compactReport(llms),
      crawlerReadiness: compactReport(readiness)
    },
    cta: ctaFor('mcp_report')
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
      headers: { 'user-agent': 'maxaeo-ai-visibility-mcp/0.1' }
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

function buildActionPlan(issues) {
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

function summarize(score, counts) {
  if (counts.error > 0) return `AI visibility foundation has blocking issues. Score: ${score}.`;
  if (counts.warning > 0) return `AI visibility foundation is usable but has cleanup opportunities. Score: ${score}.`;
  return `AI visibility foundation looks healthy for a one-time local audit. Score: ${score}.`;
}

function compactReport(report) {
  return {
    status: report.status,
    score: report.score,
    counts: report.counts,
    cta: report.cta
  };
}

function finalize(tool, analyzedAt, site, payload) {
  const counts = countChecks(payload.checks);
  return {
    tool,
    version: TOOL_VERSION,
    analyzedAt,
    url: site.href,
    status: counts.error > 0 ? 'error' : counts.warning > 0 ? 'warning' : 'pass',
    score: Math.max(0, Math.min(100, 100 - counts.error * 30 - counts.warning * 8 - counts.info * 2)),
    counts,
    ...payload,
    cta: ctaFor(tool)
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

function ctaFor(tool) {
  return {
    ...CTA_BASE,
    url: `https://maxaeo.ai/?utm_source=maxaeo-ai-visibility-mcp&utm_medium=${tool}&utm_campaign=open_source`
  };
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

