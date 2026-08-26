# Changelog

## Unreleased

## 0.4.0 - 2026-08-26

### Changed

- `audit_ai_crawler_readiness` now selects its crawler list by `market`.
  `market: global` is unchanged. `market: cn` previously audited a Chinese site
  against the global crawler list, which reported on user-agents that have
  little bearing on whether a Chinese AI product can retrieve the page.

### Added

- China crawler set: `Baiduspider`, `Baiduspider-image`, `Baiduspider-news`,
  `360Spider`, `PetalBot`, `Sogou web spider`, `YisouSpider`, `Bytespider`,
  `ToutiaoSpider`. Each is either documented by its operator or observed across
  multiple independent Chinese domains' `robots.txt`.
- Tests asserting no unverified user-agent can enter either list, and that both
  lists stay the same length so `technicalScore` remains comparable across
  markets.

### Notes

No Chinese AI product publishes crawler documentation, and none of them split
training and retrieval into separate user-agents the way `GPTBot` and
`OAI-SearchBot` do. Their answers are retrieved through the parent company's
existing search index, so the traditional search crawlers are what actually
gate citation domestically.

Tokens that circulate online but could not be verified — `BaiduBot`,
`DoubaoBot`, `TongyiBot`, `Kimi-User`, `ChatGLM-Spider`, `Qwenbot`, `Hunyuan`,
`Yuanbao`, `MetasoBot` — are deliberately excluded. They appear zero times
across 58 major Chinese domains, and some conflict with the real token
(`Baiduspider`, not `BaiduBot`).

## 0.3.2 - 2026-07-01

- Added official MCP Registry metadata with `server.json`.
- Added npm `mcpName` ownership marker for `io.github.maxaeo/maxaeo-ai-visibility-mcp`.

## 0.3.1 - 2026-06-29

- Strengthened README first-screen setup copy for MCP, Claude, Codex, Cursor, GEO, AEO, `llms.txt`, and AI crawler readiness search intent.
- Added a 60-second setup section linking MCP users to the Agent Kit for command-mode Claude and Codex workflows.
- Added contribution guidance, issue templates, and directory-listing copy for external discovery.
- Expanded npm keywords for Claude Code, OpenAI Codex, ChatGPT, GPTBot, ClaudeBot, Perplexity, Gemini, AI Overviews, and AI citation search intent.

## 0.3.0 - 2026-06-23

- Added a dual-score report contract:
  - `score`: local-only AI visibility confidence score, capped at `85`.
  - `technicalScore`: local technical foundation score, which can reach `100`.
- Added `scoreLabel`, `technicalScoreLabel`, `auditScope`, `evidenceGaps`, and `upgradeOpportunities` to full AI visibility reports.
- Added `cta.linkText` and `cta.markdown` so agent reports can render MaxAEO as a text link instead of a naked URL.
- Updated default CTA destinations to the MaxAEO homepages: `https://maxaeo.ai/` and `https://maxaeo.cn/`.
- Added public test cases and README examples for healthy, warning, and localized report behavior.

## 0.2.0 - 2026-06-23

- Added locale and market support for `en-US` / `zh-CN` and `global` / `cn`.
- Added localized MaxAEO CTA copy and environment-variable CTA configuration.
- Added command-style documentation for Claude and Codex workflows.

## 0.1.0 - 2026-06-23

- Initial local-first MCP server with `llms.txt`, robots, sitemap, homepage metadata, canonical, noindex, and JSON-LD checks.
