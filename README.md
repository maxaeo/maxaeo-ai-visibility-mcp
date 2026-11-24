# MaxAEO AI Visibility MCP

Ask ChatGPT, Perplexity, Gemini, Claude, Copilot, Grok, Google AI Mode and Google AI Overviews any question from your AI assistant, and get the full answer with the sources it cited. Use it to check whether AI search mentions and cites your brand.

This is a **hosted MCP server**. Nothing to install or run locally.

- Server URL: `https://maxaeo.ai/geoapi/geodata/developer/mcp` (Streamable HTTP)
- Sign-in: OAuth with your MaxAEO account the first time you connect, or send an API key as `Authorization: Bearer <key>`
- Pricing: 100 free credits for new accounts, then pay per successful answer. Failed tasks are free. [Pricing](https://maxaeo.ai/developers/pricing)
- Official MCP Registry: `ai.maxaeo/ai-visibility-api`
- Docs: https://maxaeo.ai/docs/developers/mcp/

> The earlier local-only package `maxaeo-ai-visibility-mcp` (npm) is deprecated. It only ran static site checks; the hosted server queries the AI engines for real answers.

## Connect

**Claude Code**

```bash
claude mcp add --transport http maxaeo https://maxaeo.ai/geoapi/geodata/developer/mcp
```

Then run `/mcp` and sign in.

**Claude Desktop / claude.ai**: Settings → Connectors → Add custom connector → paste the server URL.

**Cursor** (`~/.cursor/mcp.json`)

```json
{ "mcpServers": { "maxaeo": { "url": "https://maxaeo.ai/geoapi/geodata/developer/mcp" } } }
```

**VS Code** (`.vscode/mcp.json`)

```json
{ "servers": { "maxaeo": { "type": "http", "url": "https://maxaeo.ai/geoapi/geodata/developer/mcp" } } }
```

## Tools

| Tool | What it does | Cost |
|---|---|---|
| `list_platforms` | Engines you can ask, credits per answer, recent success rate | Free |
| `submit_task` | Ask one engine one question | Charged only if it succeeds |
| `get_task` | Status, full answer and cited sources | Free |
| `list_tasks` | Your recent tasks | Free |
| `cancel_task` | Cancel a queued task | Free |
| `retry_task` | Retry a failed task | Charged only if it succeeds |

Tasks are asynchronous and can take a few minutes; your assistant polls `get_task` until they finish.

## Example prompts

- "Ask ChatGPT and Perplexity 'best CRM for startups' and tell me whether they mention HubSpot and which sites they cite."
- "Check how Google AI Overviews answers 'what is AEO' and list the sources."

## Links

- Website: https://maxaeo.ai/ai-visibility-api/
- REST API quickstart: https://maxaeo.ai/docs/developers/quickstart/
- Developer console: https://maxaeo.ai/developers/

`server.json` in this repo is the entry published to the official MCP Registry.
