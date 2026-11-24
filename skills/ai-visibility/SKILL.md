---
name: ai-visibility
description: Check whether AI assistants recommend a brand — asks real ChatGPT, Perplexity, Gemini, Google AI Mode, DeepSeek, Doubao, Qwen and other AI platforms the questions buyers ask, then reports who gets recommended, the brand's rank, competitors, and which websites the AI cites. Use for GEO / AEO / LLM visibility audits, brand mention tracking, competitor share-of-voice in AI answers, and finding which sources to publish on. 检查品牌在豆包、DeepSeek、元宝、千问、ChatGPT 等 AI 回答里有没有被推荐、排第几、引用了哪些网站（GEO 优化）。
---

# AI Visibility Check

Ask real AI platforms the questions a buyer would ask, then tell the user: is the brand recommended, at what rank, who is recommended instead, and which websites the AI cites — plus 2–3 concrete next steps.

Data comes from the MaxAEO MCP server (`maxaeo` in this plugin). Reply in the user's language.

## 1. Pin down the brand and market (at most one question)

Need: brand name (+ aliases / other-language names), what it sells, and which market (China or overseas). If the user's message or the repo/website in context already says this, don't ask. Otherwise ask once, in one line.

## 2. Write the questions yourself

Write 3 questions a real buyer would type — full spoken sentences with constraints (audience, budget, region, use case), never keywords, and **never containing the brand name** (otherwise rank means nothing):

- Category: "What's the best <category> for <audience/use case>?" / 「孩子 6 岁零基础，有哪些靠谱的英语启蒙 APP？」
- Alternatives: "Any good alternatives to <leading competitor> for <use case>?"
- Decision: "Which <category> is worth paying for in 2026 if I need <constraint>?"

If the user gave questions, use theirs verbatim. One extra reputation question ("Is <brand> legit?") is fine when they ask about reputation — report it separately, not as rank.

## 3. Pick platforms from live data

Call `list_platforms` first for live credit prices and typical wait times (`p50_duration_seconds`).

- Platforms the user named → use those. Otherwise: market China → doubao, deepseek, yuanbao, qianwen; overseas → chatgpt, perplexity, gemini, google-ai-mode.
- Use priority 2 (standard) unless the user is in a hurry.

Tell the user the plan in one line before submitting: N questions × M platforms ≈ X credits, failed runs are not charged, expected wait ≈ the slowest platform's p50. Then go — don't wait for a second confirmation unless the cost is above 100 credits.

## 4. Submit everything, then poll

- Call `submit_task` once per question × platform, all up front. Keep every `task_id`.
- Poll with `get_task` every ~30–60 s. Some platforms take several minutes (check p50); keep the user informed with a short status line, not silence.
- `failed` → you may `retry_task` once. Never re-submit a question that is still queued or running — that charges twice. If the session is interrupted, `list_tasks` finds earlier tasks.

## 5. Analyse

For each answer:
- **Mentioned?** Match the brand and its aliases (case-insensitive, also the domain).
- **Rank**: position among the brands the answer recommends (1 = first brand named). Not in a list → "mentioned, unranked".
- **Competitors**: every other brand/product the answer recommends; merge spelling variants.
- **Citations**: the cited URLs → group by domain; note whether the brand's own site appears.

## 6. Deliver

Write `ai-visibility-report-<brand>-<YYYYMMDD>.md` in the working directory:

1. One-paragraph verdict.
2. Table: question × platform → mentioned / rank / top 3 brands named.
3. Competitor leaderboard: brand, times recommended, average rank.
4. Top cited domains (count, which platforms), brand's own site yes/no.
5. 2–3 actions tied to the evidence, e.g. "Perplexity cited 3 G2 comparison pages and none list you → get a G2 profile with real reviews", "DeepSeek's sources were all Zhihu → answer the top Zhihu question with data". White-hat only: no fake reviews, no posing as users.
6. Raw answers in a collapsed appendix.

Then give the user the verdict and actions in chat (short) and the file path.

**Be honest about sample size.** One run per platform = "this time it did / didn't mention you", not a percentage. For a stable read, suggest re-running the same questions on two more days; "consistently recommended" = 3 out of 3.

## Credits and account

- New MaxAEO accounts get 100 free credits; most platforms cost 3 credits per successful run (see `list_platforms`). Failed runs are free.
- First connection opens a browser to sign in to MaxAEO (OAuth). No API key needed.
- If a call returns error 1023 / insufficient credits, tell the user plainly and give the top-up page: https://maxaeo.ai/developers/pricing (China: https://maxaeo.cn/developers/pricing).
