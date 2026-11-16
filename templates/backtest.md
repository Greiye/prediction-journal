---
id: "NNN"
type: backtest
backtest_of: ""          # id of the entry being replayed, e.g. "001" (blank if none)
title: "Backtest: {{title}}"
date_noticed: "{{date:YYYY-MM-DD}}"   # date you ran the backtest
cutoff: ""               # YYYY-MM-DD: freeze date. Use ONLY evidence dated before this.
domain:                  # tech | market | career | health | relationships | place
claim: ""                # blind prediction made as if on the cutoff date (one falsifiable sentence)
timeframe: ""            # horizon from the cutoff, e.g. "24 months"
confidence:              # 0-100, blind confidence (feeds calibration)
score: open              # hit | partial | miss, scored after unblinding
tags: [backtest]
events:                  # pre-cutoff evidence + post-cutoff outcome (site shades everything after cutoff)
  - { date: "", lane: world,  label: "" }
  - { date: "", lane: me,     label: "" }
  - { date: "", lane: circle, label: "" }
signals:                 # things visible before the cutoff; acted: did you act on it?
  - { date: "", label: "", source: "", acted: false }
rules: []                # rules extracted, e.g. ["If X happens, do Y within Z"]
---

# NNN · Backtest: {{title}}

> **Lookahead guard:** write sections 1-3 before reading section 4. Anything you know only because of what happened later goes in section 4, never in 1-3.

## 1. Setup
- **Turning point:** 
- **Cutoff date:** 
- **Question asked at cutoff:** 

## 2. Evidence available before cutoff
| Date | Source | Evidence | Personal or public |
|---|---|---|---|
| | | | |

## 3. Blind prediction
- **Prediction:** 
- **Timeframe:** 
- **Confidence:** %
- **Action it implied:** 
- **AI blind run (optional):** prompt "It is [cutoff]. You know nothing after this date. Given [evidence], what happens in [timeframe]?" Paste answer.

## 4. Unblind: what happened
- **Outcome:** 
- **Score:** 
- **What the blind prediction got wrong:** 

## 5. Signals seen but not acted on
| Signal | When | Why I didn't act |
|---|---|---|
| | | |

## 6. Rules
1. 

## 7. Bias check
- **Lookahead leaks:** anything in 1-3 that relied on hindsight?
- **Survivorship:** am I only backtesting the calls that worked?
