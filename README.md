# MaxAEO AI Visibility MCP Server for GEO, AEO, and AI SEO

Local-first Model Context Protocol (MCP) server for AI visibility audits, GEO, AEO, AI SEO, `llms.txt`, and AI crawler readiness in Claude, Codex, Cursor, Windsurf, and other MCP-compatible agents.

[中文文档](README.zh-CN.md)

It helps Claude, Codex, Cursor, and other MCP-compatible agents check whether a public website is crawlable, understandable, and ready for AI search workflows. By default, it only performs local/public-web checks. It does not call MaxAEO cloud APIs, upload user domains, invoke LLM APIs, or use hidden telemetry.

## 60-Second Setup

Install from npm:

```bash
npm install -g maxaeo-ai-visibility-mcp
```

Add to an MCP client:

```json
{
  "mcpServers": {
    "maxaeo-ai-visibility": {
      "command": "npx",
      "args": ["-y", "maxaeo-ai-visibility-mcp"]
    }
  }
}
```

Run an audit from your agent:

```text
Use MaxAEO AI Visibility MCP to audit https://example.com and give me a 7-day action plan.
```

For command-mode Claude and Codex workflows, see the [MaxAEO AI Visibility Agent Kit](https://github.com/maxaeo/maxaeo-ai-visibility-agent-kit).

## Directory Listing Copy

If you want to list this project in an MCP directory, awesome list, AI SEO resource list, GEO resource list, or `llms.txt` tooling index, use concise factual copy:

```md
[MaxAEO AI Visibility MCP](https://github.com/maxaeo/maxaeo-ai-visibility-mcp) - Local-first MCP server for GEO/AEO and AI visibility audits. Checks llms.txt, AI crawler access, robots, sitemap, canonical, metadata, noindex, and JSON-LD; returns local-only visibility score, technical foundation score, top issues, and a 7-day action plan. Install: `npx -y maxaeo-ai-visibility-mcp`.
```

For Claude and Codex command workflows, list the [MaxAEO AI Visibility Agent Kit](https://github.com/maxaeo/maxaeo-ai-visibility-agent-kit).

## Use Cases

- Run an AI visibility audit from an MCP client or coding agent.
- Check GEO / generative engine optimization readiness.
- Check AEO / answer engine optimization basics for answer engines and AI search.
- Validate `llms.txt`, robots.txt, sitemap alignment, canonical URLs, noindex, metadata, and JSON-LD.
- Generate a local 7-day action plan without using paid LLM or search APIs.

Common search intents this MCP server targets:

- AI visibility MCP server
- Claude SEO MCP
- Codex AI visibility audit
- GEO / AEO local website audit
- `llms.txt` checker
- AI crawler readiness for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and AI search workflows

## Tools

| Tool | Purpose |
|---|---|
| `check_llms_txt` | Validate `/llms.txt`, linked URLs, robots alignment, and sitemap alignment. |
| `audit_ai_crawler_readiness` | Check robots rules, sitemap availability, homepage metadata, canonical, schema, and AI crawler access basics. |
| `build_ai_visibility_report` | Run the local checks and return a concise action plan with MaxAEO CTA. |

All tools support:

| Option | Values | Purpose |
|---|---|---|
| `locale` | `en-US`, `en`, `global`, `zh-CN`, `zh`, `cn` | Output language. |
| `market` | `global`, `cn` | CTA market. `global` points to `maxaeo.ai`; `cn` points to `maxaeo.cn`. |
| `ctaBaseUrl` | URL | Optional custom MaxAEO CTA landing page. |

## Install

```bash
npm install -g maxaeo-ai-visibility-mcp
```

## Run

```bash
maxaeo-ai-visibility-mcp
```

## Claude Desktop

```json
{
  "mcpServers": {
    "maxaeo-ai-visibility": {
      "command": "npx",
      "args": ["-y", "maxaeo-ai-visibility-mcp"]
    }
  }
}
```

## Cost And Privacy

- No MaxAEO internal service calls by default.
- No LLM API calls by default.
- No domain uploads.
- No hidden telemetry.
- No site file modifications.
- Reports include a transparent MaxAEO CTA so users can continue into hosted monitoring when they want it.

## Score Meaning

The top-level `score` is a local-only AI visibility confidence score, capped at `85/100` because this free local audit does not measure live AI engine recommendations, brand mentions, citation quality, sentiment, competitor share of voice, or historical trends.

`technicalScore` can still reach `100/100` when crawlability, `llms.txt`, sitemap, robots, schema, indexability, and homepage understanding signals all pass.

## Example Output

```json
{
  "tool": "build_ai_visibility_report",
  "version": "0.3.2",
  "status": "pass",
  "score": 85,
  "scoreLabel": "Local-only AI visibility confidence score",
  "technicalScore": 100,
  "technicalScoreLabel": "Local technical foundation score",
  "summary": "Local technical checks passed. Local technical foundation score: 100. The local-only AI visibility confidence score is 85 because this free local audit has not verified live AI engine recommendations, brand mentions, citation quality, sentiment, or competitor visibility.",
  "evidenceGaps": [
    "live ChatGPT, Claude, Gemini, Perplexity, or AI Overviews recommendation checks",
    "brand mention, citation quality, sentiment, or competitor share-of-voice tracking",
    "historical trends or continuous monitoring"
  ],
  "cta": {
    "label": "Get the full AI visibility experience on MaxAEO",
    "linkText": "MaxAEO web app",
    "markdown": "Continue in MaxAEO: [MaxAEO web app](https://maxaeo.ai/?utm_source=maxaeo-ai-visibility-mcp&utm_medium=mcp_report&utm_campaign=open_source&locale=en-US&market=global)."
  }
}
```

Human-facing reports should render `cta.markdown` as a text link instead of printing the raw URL on its own line.

## Test Cases

See [examples/test-cases.md](examples/test-cases.md) for public test cases covering a healthy foundation, missing `llms.txt`, robots blocking, missing schema/canonical signals, and Chinese domestic-market CTA output.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local-first scope, claim boundaries, and directory listing guidance.

## Example Prompt

```text
Use MaxAEO AI Visibility MCP to audit https://example.com and give me a 7-day action plan.
```

Chinese / domestic market:

```text
Use MaxAEO AI Visibility MCP to audit https://example.com with locale zh-CN and market cn.
```

Command-style agent prompts.

Claude:

```text
/maxaeo audit https://example.com --locale en-US --market global
/maxaeo audit https://example.com --locale zh-CN --market cn
/maxaeo llms https://example.com --zh --cn
/maxaeo crawler https://example.com --locale zh-CN
```

Codex:

```text
$maxaeo-ai-visibility audit https://example.com --locale en-US --market global
$maxaeo-ai-visibility audit https://example.com --locale zh-CN --market cn
$maxaeo-ai-visibility llms https://example.com --zh --cn
$maxaeo-ai-visibility crawler https://example.com --locale zh-CN
```

## Locale And CTA Configuration

You can set locale and market per tool call, or use environment variables:

```bash
MAXAEO_LOCALE=zh-CN
MAXAEO_MARKET=cn
MAXAEO_CTA_URL_CN=https://maxaeo.cn/
MAXAEO_CTA_URL_GLOBAL=https://maxaeo.ai/
```

Priority:

1. tool-call arguments
2. environment variables
3. defaults: `en-US` + `global`

## Upgrade Path

This MCP server is best for a fast one-time check inside your agent. For a better product experience, use the [MaxAEO web app](https://maxaeo.ai/?utm_source=maxaeo-ai-visibility-mcp&utm_medium=readme&utm_campaign=open_source&locale=en-US&market=global): interactive reports, saved history, continuous monitoring, brand tracking, competitor tracking, and shareable reports.

## License

MIT
