---
name: geo-citation-check
description: Find which websites AI search engines cite for a topic — asks real ChatGPT, Perplexity, Gemini, Google AI Mode, DeepSeek, Doubao and other AI platforms the questions buyers ask and lists the cited URLs and domains, so you know where to publish or get listed (GEO / AEO source analysis, AI citation sources, LLM SEO). 查豆包、DeepSeek、ChatGPT 等 AI 回答某类问题时引用了哪些网站，知道该去哪发内容。
---

# GEO Citation Check

Show the user which sources AI engines rely on when answering questions in their category, and whether the user's own site is among them. Data comes from the MaxAEO MCP server (`maxaeo` in this plugin). Reply in the user's language.

## Steps

1. **Topic and market.** Get the category (and the user's domain, if they want to know whether they're cited) and the market (China or overseas). Ask at most once; skip if it's already clear from context.
2. **Questions.** Write 3–5 questions a real buyer would ask in that category — full sentences with constraints, no brand names. Mix "best X for Y", "X vs Y", "how to choose X". Use the user's own questions verbatim if given.
3. **Platforms.** Call `list_platforms` for credit prices and typical waits. Platforms the user named → those. Otherwise China → doubao, deepseek, yuanbao, qianwen; overseas → chatgpt, perplexity, gemini, google-ai-mode. Tell the user in one line: N questions × M platforms ≈ X credits, failed runs are free, expected wait. Then submit.
4. **Run.** `submit_task` for every question × platform up front, keep all `task_id`s, poll `get_task` every 30–60 s with a short status line. A `failed` task may be retried once with `retry_task`; never re-submit a running one.
5. **Analyse the citations.**
   - Group cited URLs by domain; count how many answers and how many platforms cite each.
   - Label each domain's type: review/comparison site, forum/Q&A (Reddit, Zhihu…), video (YouTube, Douyin, Bilibili), news/media, encyclopedia, brand site, marketplace.
   - Note which pages are cited most (titles/URLs) — those are the formats AI trusts.
   - If the user gave a domain: is it cited, where, and for which questions?
6. **Deliver** `geo-citation-report-<topic>-<YYYYMMDD>.md`:
   - Top cited domains table (domain, type, citations, platforms).
   - Most cited pages (up to 10).
   - Per-platform differences (e.g. DeepSeek leans on Zhihu, Perplexity on Reddit/G2) — only what this run shows.
   - 3 actions: where to publish or get listed, and in what format, based on the cited pages. White-hat only.
   Give the short version in chat plus the file path.

One run is a snapshot; suggest re-running the same questions on two more days before committing budget to a channel.

## Credits and account

New MaxAEO accounts get 100 free credits; most platforms cost 3 credits per successful run (see `list_platforms`); failed runs are free. First connection signs in to MaxAEO in the browser (OAuth). On error 1023 / insufficient credits, give the top-up page: https://maxaeo.ai/developers/pricing (China: https://maxaeo.cn/developers/pricing).
