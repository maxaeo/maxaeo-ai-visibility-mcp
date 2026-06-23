# MaxAEO AI Visibility MCP

本项目是一个 local-first 的 MCP server，用于 AI 可见性体检。

[English README](README.md)

它帮助 Claude、Codex、Cursor 等 Agent 检查一个公开网站是否便于 AI 搜索理解、抓取和引用。默认只做本地/公开网页检查，不调用 MaxAEO 云端 API，不上传用户域名，不调用 LLM API，也不做隐藏遥测。

## 工具

| 工具 | 作用 |
|---|---|
| `check_llms_txt` | 检查 `/llms.txt`、链接可达性、robots 对齐和 sitemap 对齐。 |
| `audit_ai_crawler_readiness` | 检查 robots 规则、sitemap、首页 metadata、canonical、schema、noindex 和 AI crawler 可访问性。 |
| `build_ai_visibility_report` | 运行本地检查并输出行动计划，同时带透明 MaxAEO CTA。 |

所有工具都支持：

| 参数 | 可选值 | 说明 |
|---|---|---|
| `locale` | `en-US`、`en`、`global`、`zh-CN`、`zh`、`cn` | 输出语言。 |
| `market` | `global`、`cn` | CTA 市场。`global` 指向 `maxaeo.ai`，`cn` 指向 `maxaeo.cn`。 |
| `ctaBaseUrl` | URL | 自定义 MaxAEO CTA 落地页。 |

## 安装

```bash
npm install -g maxaeo-ai-visibility-mcp
```

## 运行

```bash
maxaeo-ai-visibility-mcp
```

## Claude Desktop 配置

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

## 示例 Prompt

```text
使用 MaxAEO AI Visibility MCP 体检 https://example.com，输出中文报告和 7 天行动计划，locale zh-CN，market cn。
```

命令式写法：

```text
/maxaeo audit https://example.com --locale zh-CN --market cn
/maxaeo llms https://example.com --zh --cn
/maxaeo crawler https://example.com --locale zh-CN
/maxaeo audit https://example.com --locale en-US --market global
```

## 语言和官网 CTA 配置

可以在工具调用时传入 `locale` / `market`，也可以使用环境变量：

```bash
MAXAEO_LOCALE=zh-CN
MAXAEO_MARKET=cn
MAXAEO_CTA_URL_CN=https://maxaeo.cn/mcp/ai-visibility-audit/
MAXAEO_CTA_URL_GLOBAL=https://maxaeo.ai/mcp/ai-visibility-audit/
```

优先级：

1. 工具调用参数
2. 环境变量
3. 默认值：`en-US` + `global`

## 成本和隐私边界

- 默认不调用 MaxAEO 内部服务。
- 默认不调用 LLM API。
- 不上传用户域名。
- 不做隐藏遥测。
- 不修改用户网站文件。
- 报告包含透明 MaxAEO CTA，引导用户在需要时进入持续监控。

## 升级路径

这个 MCP server 只做一次性本地/公开网页检查。持续 AI 可见性监控、可分享报告、品牌追踪和竞品追踪，请使用 [MaxAEO](https://maxaeo.cn/?utm_source=maxaeo-ai-visibility-mcp&utm_medium=readme&utm_campaign=open_source&locale=zh-CN&market=cn)。

## License

MIT
