# Public Test Cases

These cases are designed for local verification and README examples. They use public-web checks only and do not call MaxAEO APIs, LLM APIs, or paid search APIs.

## Healthy Foundation

Use a site with working `/llms.txt`, `robots.txt`, sitemap, canonical, metadata, and JSON-LD.

```bash
node --input-type=module -e "import { buildAiVisibilityReport } from './src/audit.js'; const r = await buildAiVisibilityReport({ url: 'https://maxaeo.ai', maxLinks: 3, checkLinks: false, locale: 'en-US', market: 'global' }); console.log(JSON.stringify({ status: r.status, score: r.score, technicalScore: r.technicalScore, summary: r.summary, cta: { linkText: r.cta.linkText, markdown: r.cta.markdown } }, null, 2));"
```

Expected behavior:

- `status` is usually `pass` when the live site remains healthy.
- `technicalScore` can be `100`.
- `score` remains capped at `85`.
- `summary` explains that live AI engine recommendations, brand mentions, citation quality, sentiment, and competitor visibility were not measured.
- `cta.markdown` renders a MaxAEO text link.

## Missing llms.txt

Use any public test site that does not publish `/llms.txt`.

```bash
node --input-type=module -e "import { buildAiVisibilityReport } from './src/audit.js'; const r = await buildAiVisibilityReport({ url: 'https://example.com', maxLinks: 3, checkLinks: false, locale: 'en-US', market: 'global' }); console.log(JSON.stringify({ status: r.status, score: r.score, technicalScore: r.technicalScore, topIssues: r.topIssues.map((i) => ({ level: i.level, code: i.code, message: i.message })) }, null, 2));"
```

Expected behavior:

- `/llms.txt` issues appear in `topIssues`.
- `technicalScore` drops below the healthy-foundation case.
- The report still includes a 7-day action plan.

## AI Crawler Readiness

```bash
node --input-type=module -e "import { auditAiCrawlerReadiness } from './src/audit.js'; const r = await auditAiCrawlerReadiness({ url: 'https://maxaeo.ai', locale: 'en-US', market: 'global' }); console.log(JSON.stringify({ status: r.status, score: r.score, crawlers: r.crawlerAccess.map((c) => ({ crawler: c.crawler, allowed: c.allowed })) }, null, 2));"
```

Expected behavior:

- The result lists GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended, Applebot, Bingbot, and Baiduspider.
- A blocked homepage crawler is reported as a warning.

## Chinese Domestic CTA

```bash
node --input-type=module -e "import { buildAiVisibilityReport } from './src/audit.js'; const r = await buildAiVisibilityReport({ url: 'https://maxaeo.ai', maxLinks: 3, checkLinks: false, locale: 'zh-CN', market: 'cn' }); console.log(JSON.stringify({ locale: r.locale, market: r.market, score: r.score, technicalScore: r.technicalScore, summary: r.summary, cta: r.cta }, null, 2));"
```

Expected behavior:

- `locale` is `zh-CN`.
- `market` is `cn`.
- CTA uses `MaxAEO 官网服务`.
- CTA URL points to `https://maxaeo.cn/` unless overridden with `ctaBaseUrl` or environment variables.

## Custom CTA URL

```bash
node --input-type=module -e "import { buildAiVisibilityReport } from './src/audit.js'; const r = await buildAiVisibilityReport({ url: 'https://maxaeo.ai', maxLinks: 1, checkLinks: false, locale: 'zh-CN', market: 'cn', ctaBaseUrl: 'https://maxaeo.cn/mcp/ai-visibility-audit/' }); console.log(r.cta.markdown);"
```

Expected behavior:

- The CTA keeps UTM tags.
- The base URL uses the custom landing page.
