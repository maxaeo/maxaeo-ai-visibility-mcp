---
name: ai-share-of-voice
description: Compare a brand against competitors in AI answers — asks real ChatGPT, Perplexity, Gemini, Google AI Mode, DeepSeek, Doubao, Qwen and other AI platforms buyer questions and ranks which brands get recommended most, at what position, and why (AI share of voice, competitor benchmarking for GEO / AEO, LLM brand ranking). 对比品牌和竞品在豆包、DeepSeek、ChatGPT 等 AI 回答里被推荐的次数和排名。
---

# AI Share of Voice

Benchmark the user's brand against competitors across AI engines: who gets recommended, how often, at what rank, and what the AI says about each. Data comes from the MaxAEO MCP server (`maxaeo` in this plugin). Reply in the user's language.

## Steps

1. **Brand, competitors, market.** Brand + aliases, the competitors the user cares about (if none given, discover them from the answers), market (China / overseas). Ask at most once.
2. **Questions.** Write 4–6 buyer questions without any brand names: category picks ("best X for Y"), use-case variants (budget, audience, region), and one "how to choose X" question. These decide share of voice, so keep them realistic.
3. **Platforms.** `list_platforms` for prices and waits. Named platforms → those; else China → doubao, deepseek, yuanbao, qianwen; overseas → chatgpt, perplexity, gemini, google-ai-mode. One-line plan with credit estimate (failed runs free), then submit.
4. **Run.** Submit all question × platform tasks up front, poll `get_task` every 30–60 s, retry a `failed` one once with `retry_task`, never re-submit a running task.
5. **Score each answer.** For every brand named: mentioned (yes/no), position (1 = first recommended), and the reason the AI gives (price, features, reputation…). Merge aliases.
6. **Deliver** `ai-share-of-voice-<brand>-<YYYYMMDD>.md`:
   - Leaderboard: brand, answers mentioning it / total answers, average position, platforms where it is #1.
   - Per-platform table: question × platform → top 3 brands; mark the user's brand.
   - Why competitors win: the attributes AI repeats for the top brands, and the sources it cites for them.
   - 3 actions to close the gap, tied to the evidence (e.g. missing from the comparison pages AI cites). White-hat only.
   Short version in chat plus the file path.

Counts from a single run are directional. Say "mentioned in 7 of 16 answers this run", not a precise rate; recommend repeating on two more days for a stable benchmark.

## Credits and account

New MaxAEO accounts get 100 free credits; most platforms cost 3 credits per successful run (see `list_platforms`); failed runs are free. First connection signs in to MaxAEO in the browser (OAuth). On error 1023 / insufficient credits, give the top-up page: https://maxaeo.ai/developers/pricing (China: https://maxaeo.cn/developers/pricing).
