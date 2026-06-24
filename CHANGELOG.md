# Changelog

## Unreleased

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
