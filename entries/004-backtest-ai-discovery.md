---
id: "004"
type: backtest
backtest_of: "001"
title: "Backtest: Discovering AI (ChatGPT 3.5)"
date_noticed: "2026-11-25"
cutoff: "2024-01-15"
domain: market
claim: "Over the next 24 months, NVIDIA (the AI picks-and-shovels bellwether) outperforms the S&P 500."
timeframe: "24 months"
confidence: 60
score: hit
tags: [backtest, ai]
events:
  - { date: "2022-11", lane: world,  label: "ChatGPT launches" }
  - { date: "2023-05", lane: world,  label: "NVIDIA AI guidance shock" }
  - { date: "2023-11", lane: world,  label: "100M weekly ChatGPT users" }
  - { date: "2024-01", lane: me,     label: "I start using ChatGPT", approx: true }
  - { date: "2024-02", lane: circle, label: "Tell friends: no response", approx: true }
  - { date: "2024-06", lane: world,  label: "NVIDIA briefly most valuable company", approx: true }
  - { date: "2025-07", lane: circle, label: "Brother adopts", approx: true }
signals:
  - { date: "2023-01", label: "Fastest-growing consumer app on record (~100M users in 2 months)", source: "news (UBS estimate via Reuters)", acted: false }
  - { date: "2023-01", label: "Microsoft commits billions to OpenAI: big tech buying in", source: "news", acted: false }
  - { date: "2023-05", label: "NVIDIA guides revenue far above estimates on AI demand", source: "earnings news", acted: false }
  - { date: "2023-11", label: "Microsoft 365 Copilot ships to businesses: AI goes into work tools", source: "news", acted: false }
  - { date: "2024-01", label: "I find it useful myself for real tasks", source: "personal", acted: true }
rules:
  - "If a tool I use myself is also a record-breaking consumer product, spend one hour that week listing its public suppliers (chips, cloud, power)."
  - "Silence from my circle means early, not wrong."
  - "Act small and pre-set: a fixed starter position (e.g. 1-5% of investable cash) with a review date, instead of all-or-nothing."
  - "Write the prediction and a confidence % on the day I notice, not afterwards."
---

# 004 · Backtest: Discovering AI (ChatGPT 3.5)

> **Lookahead guard:** sections 1-3 use only evidence dated before the cutoff. Anything known only from later goes in section 4.

> **Draft status (2026-11-25):** Claude filled this in with defaults while waiting on Mike's answers. Items marked **(default)** need Mike to confirm. The blind prediction was drafted by an AI that already knows the outcome, so it is **contaminated**. Mike should set his own confidence (what he would honestly have said in Jan 2024) and edit it with **Edit** on the site.

## 1. Setup
- **Turning point:** First hands-on use of ChatGPT 3.5.
- **Cutoff date:** 2024-01-15 **(default: "around Jan 2024" from #001; replace with the date of the oldest chat in ChatGPT history)**
- **Question asked at cutoff:** Is this big enough to put money or time behind, and where?

## 2. Evidence available before cutoff
| Date | Source | Evidence | Personal or public |
|---|---|---|---|
| 2022-11 | OpenAI | ChatGPT launches to the public | Public |
| 2023-01 | Microsoft | Multiyear, multibillion investment in OpenAI | Public |
| 2023-02 | Reuters (UBS est.) | ~100M monthly users in Jan 2023, fastest-growing consumer app on record | Public |
| 2023-03 | OpenAI | GPT-4 released | Public |
| 2023-05 | NVIDIA earnings | Revenue guidance far above estimates on data-center AI demand; market cap nears $1T | Public |
| 2023-11 | Microsoft | Microsoft 365 Copilot generally available to enterprises | Public |
| 2023-11 | OpenAI DevDay | 100M weekly ChatGPT users; board crisis resolved within days | Public |
| 2024-01 | Me | ChatGPT handles useful tasks on demand | Personal **(default: add what you used it for)** |
| ? | Me | What I'd seen about AI before (news, YouTube, coworkers) | Personal **(needs Mike)** |

**Resources at cutoff:** **(needs Mike: money and hours per week I could have deployed)**

## 3. Blind prediction
- **Prediction:** Over 24 months, NVIDIA beats the S&P 500. Reasoning: the product is private (OpenAI), but every chat runs on GPUs and cloud capacity. The suppliers are public, and demand was already showing up in their earnings by May 2023.
- **Timeframe:** 24 months (to Jan 2026)
- **Confidence:** 60% **(placeholder; contaminated; Mike to set)**
- **Action it implied:** A small starter position in NVDA or a semiconductor ETF, plus 1-2 hours/week building AI skills.
- **AI blind run (optional):** Not run. Any current model knows 2024-25, so a truly blind run needs a model whose training data ends before the cutoff.

## 4. Unblind: what happened
- **Outcome:** NVIDIA rose roughly 2.5-3x in 2024 versus about +23% for the S&P 500, was briefly the world's most valuable company in mid-2024, and kept rising into 2025. *(Figures approximate, from memory; verify before relying on them.)*
- **Score:** Hit.
- **Circle (after cutoff):** Friends shrugged in Feb 2024; brother adopted ~mid-2025. Read at the time as "not a big deal"; in hindsight it meant "early".
- **What the blind prediction got wrong:** It said nothing about magnitude. "Outperform" undersold a multi-x move, and a 60% confidence was probably too low given the evidence already in hand.

## 5. Signals seen but not acted on
| Signal | When | Why I didn't act |
|---|---|---|
| Record user growth | 2023-01 | Not watching tech/markets **(default)** |
| Microsoft buys in | 2023-01 | OpenAI is private; didn't think of public proxies |
| NVIDIA guidance shock | 2023-05 | Not around investor peers |
| Copilot in work tools | 2023-11 | Not tracked |

## 6. Rules
1. If a tool I use myself is also a record-breaking consumer product, spend one hour that week listing its public suppliers (chips, cloud, power).
2. Silence from my circle means early, not wrong.
3. Act small and pre-set: a fixed starter position with a review date, instead of all-or-nothing.
4. Write the prediction and a confidence % on the day I notice.

## 7. Bias check
- **Lookahead leaks:** Yes. The choice of NVIDIA as the bellwether is hindsight-informed. A cleaner test names a basket (chips + cloud) before looking. The blind prediction was written by a model that knows the outcome.
- **Survivorship:** This backtests a call that worked. Next backtest should be one that didn't (a hype that faded), to check the rules don't just say "buy every hype."
