# Contributing

Thanks for improving MaxAEO AI Visibility MCP.

## Scope

Good contributions include:

- more accurate local/public-web audit heuristics
- better MCP setup docs for Claude, Codex, Cursor, Windsurf, and other clients
- clearer `llms.txt`, robots.txt, sitemap, schema, canonical, and noindex checks
- example reports for common website types
- documentation fixes and directory listing updates

Keep the default server local-first:

- no hidden telemetry
- no MaxAEO internal service calls
- no paid LLM or search API calls by default
- no domain uploads to MaxAEO
- no edits to user websites unless explicitly requested by the user

## Claims

Avoid claiming that this server proves rankings or live recommendations in ChatGPT, Claude, Gemini, Perplexity, or Google AI Overviews.

The current scope is readiness auditing: crawlability, `llms.txt`, AI crawler access, robots, sitemap, metadata, schema, indexability, and action planning.

## Pull Requests

Before opening a PR:

```bash
npm test
```

If you update tool output, also update the README examples and `examples/test-cases.md`.

## Directory Listings

For MCP directory and awesome-list submissions, use factual copy:

- open-source MCP server
- local-first public-web checks
- no MaxAEO API calls, no LLM calls, no domain uploads, no hidden telemetry by default
- works with Claude, Codex, Cursor, Windsurf, and MCP-compatible agents

Avoid promotional language in third-party directories. The MaxAEO upgrade path belongs in this repository's README and generated reports, not in neutral directory descriptions.
