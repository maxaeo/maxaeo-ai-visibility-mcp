# MaxAEO AI Visibility MCP

Local-first MCP server for AI visibility audits.

It helps AI agents check whether a public website is crawlable, understandable, and ready for AI search workflows. By default, it only performs local/public-web checks. It does not call MaxAEO cloud APIs, upload user domains, invoke LLM APIs, or use hidden telemetry.

## Tools

| Tool | Purpose |
|---|---|
| `check_llms_txt` | Validate `/llms.txt`, linked URLs, robots alignment, and sitemap alignment. |
| `audit_ai_crawler_readiness` | Check robots rules, sitemap availability, homepage metadata, canonical, schema, and AI crawler access basics. |
| `build_ai_visibility_report` | Run the local checks and return a concise action plan with MaxAEO CTA. |

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

## Example Prompt

```text
Use MaxAEO AI Visibility MCP to audit https://example.com and give me a 7-day action plan.
```

## Upgrade Path

This MCP server performs one-time local/public-web checks. For continuous AI visibility monitoring, shareable reports, brand tracking, and competitor tracking, use [MaxAEO](https://maxaeo.ai/?utm_source=maxaeo-ai-visibility-mcp&utm_medium=readme&utm_campaign=open_source).

## License

MIT

