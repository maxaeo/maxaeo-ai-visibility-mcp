# MaxAEO AI Visibility MCP Server：GEO / AEO / AI SEO 体检

本项目是一个 local-first 的 Model Context Protocol (MCP) server，用于 AI 可见性体检、GEO、AEO、AI SEO、`llms.txt` 和 AI crawler readiness 检查。

[English README](README.md)

它帮助 Claude、Codex、Cursor 等 Agent 检查一个公开网站是否便于 AI 搜索理解、抓取和引用。默认只做本地/公开网页检查，不调用 MaxAEO 云端 API，不上传用户域名，不调用 LLM API，也不做隐藏遥测。

## 使用场景

- 从 MCP client 或 coding agent 中运行 AI 可见性体检。
- 检查网站的 GEO / generative engine optimization 基础。
- 检查网站的 AEO / answer engine optimization 基础。
- 校验 `llms.txt`、robots.txt、sitemap、canonical、noindex、metadata 和 JSON-LD。
- 在不调用付费 LLM/Search API 的前提下生成 7 天行动计划。

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

命令式写法。

Claude：

```text
/maxaeo audit https://example.com --locale zh-CN --market cn
/maxaeo llms https://example.com --zh --cn
/maxaeo crawler https://example.com --locale zh-CN
/maxaeo audit https://example.com --locale en-US --market global
```

Codex：

```text
$maxaeo-ai-visibility audit https://example.com --locale zh-CN --market cn
$maxaeo-ai-visibility llms https://example.com --zh --cn
$maxaeo-ai-visibility crawler https://example.com --locale zh-CN
$maxaeo-ai-visibility audit https://example.com --locale en-US --market global
```

## 语言和官网 CTA 配置

可以在工具调用时传入 `locale` / `market`，也可以使用环境变量：

```bash
MAXAEO_LOCALE=zh-CN
MAXAEO_MARKET=cn
MAXAEO_CTA_URL_CN=https://maxaeo.cn/
MAXAEO_CTA_URL_GLOBAL=https://maxaeo.ai/
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

## 分数含义

`100/100` 表示这次本地技术基础体检没有发现阻塞问题，覆盖抓取、`llms.txt`、sitemap、robots、schema、indexability 和首页可理解性等基础信号。它不代表真实 AI 引擎推荐、品牌提及、引用质量、情感倾向或竞品可见性已经满分。

## 升级路径

这个 MCP server 适合在 Agent 里快速做一次性检查。要获得更好的产品体验，可以使用 [MaxAEO 官网服务](https://maxaeo.cn/?utm_source=maxaeo-ai-visibility-mcp&utm_medium=readme&utm_campaign=open_source&locale=zh-CN&market=cn)：交互式报告、历史记录、持续监控、品牌追踪、竞品追踪和可分享报告。

## License

MIT
