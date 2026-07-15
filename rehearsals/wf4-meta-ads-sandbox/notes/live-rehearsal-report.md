# WF4 Live Dry-Run Rehearsal Report (V1 revised)

**Date:** 2026-07-15  
**Workflow:** WF4 - Meta Ads Sandbox (`YIc53GBq4upelYp6`) — **inactive**  
**Execution ID:** 35  
**Status:** success

## Summary

V1 revised dry-run: $1/day fixture (14/14), `MAX_DAILY_BUDGET_USD=10`, broad targeting without interests. Zero Meta HTTP. Zero Drive writes. Create-paused nodes disabled.

## Verification

| Check | Result |
|-------|--------|
| dailyBudget | 1 |
| totalBudget | 14 |
| budgetCapCheck.passed | true |
| interests in targeting | absent |
| metaHttpCalls | 0 |
| driveWrites | 0 |
| workflow active | false |

## Cap exceed (local only)

`fixtures/app-json-budget-cap-exceeded.json` (500/14) fails in `wf4-rehearse.js` as expected.
