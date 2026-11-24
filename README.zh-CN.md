# MaxAEO AI 可见度 MCP

在 AI 助手里直接向豆包、DeepSeek、Kimi、腾讯元宝、千问、ChatGPT、Gemini、Perplexity 等平台提问，拿回答原文和引用来源，看 AI 搜索有没有提到、引用你的品牌。

这是**远程（托管）MCP**，不用在本地安装或运行。

- 国内地址：`https://maxaeo.cn/geoapi/geodata/developer/mcp`；海外地址：`https://maxaeo.ai/geoapi/geodata/developer/mcp`（Streamable HTTP）
- 登录：第一次连接时用 MaxAEO 账号登录授权（OAuth），也可以在请求头带 API Key：`Authorization: Bearer <key>`
- 计费：新账号送 100 点，按成功拿到回答的次数扣点，失败不扣。[充值与价格](https://maxaeo.cn/developers/pricing)
- 文档：https://maxaeo.cn/docs/developers/mcp/

> 早期的本地包 `maxaeo-ai-visibility-mcp`（npm）已停用：它只做站点静态检查，远程版会真的去问各个 AI 平台。

## 作为插件安装（MCP + 技能）

插件把远程 MCP 和 3 个现成技能装在一起，直接问「豆包有没有推荐我的品牌」就能出报告：

| 技能 | 能做什么 |
|---|---|
| `ai-visibility` | 品牌在 AI 回答里有没有被推荐、排第几、推荐了谁、引用了哪些网站 |
| `geo-citation-check` | AI 回答你所在品类时最爱引用哪些网站，该去哪发内容 |
| `ai-share-of-voice` | 和竞品比：各被推荐几次、排第几 |

**Claude Code**

```bash
claude plugin marketplace add maxaeo/maxaeo-ai-visibility-mcp
claude plugin install maxaeo-ai-visibility@maxaeo
```

**只装技能**（支持 Agent Skills 的客户端）：`npx skills add maxaeo/maxaeo-ai-visibility-mcp`

插件默认连海外站 maxaeo.ai；国内账号把 MCP 地址换成 `https://maxaeo.cn/geoapi/geodata/developer/mcp`。第一次调用会打开浏览器登录 MaxAEO 授权，不用复制 Key，新账号送 100 点。

## 只接 MCP

**Claude Code**

```bash
claude mcp add --transport http maxaeo https://maxaeo.cn/geoapi/geodata/developer/mcp
```

然后运行 `/mcp` 登录。Cursor、VS Code、Cherry Studio 等客户端填上面的地址即可，写法见[文档](https://maxaeo.cn/docs/developers/mcp/)。

## 工具

`list_platforms`（可用平台、单价、近期成功率，免费）、`submit_task`（提问，成功才扣点）、`get_task`（取回答和引用，免费）、`list_tasks`、`cancel_task`、`retry_task`。任务是异步的，可能要几分钟。

English: [README.md](README.md)
