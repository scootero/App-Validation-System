# WF4 Live Dry-Run Rehearsal Report

**Date:** 2026-07-15  
**Workflow:** WF4 - Meta Ads Sandbox (`YIc53GBq4upelYp6`)  
**Execution ID:** 30  
**Status:** success

## Summary

Dry-run execution completed on inactive n8n workflow. Bundle built from fixture `app.json`. Triple approval gate routed to dry-run response. **Zero Meta HTTP calls. Zero Drive writes.**

## Nodes Executed

1. Manual Run
2. Workflow Config
3. Process WF4 Dry Run
4. Triple Approval Gate (false branch → dry-run)
5. Respond Dry Run

## Nodes Not Executed

- Create Paused Blocked (disabled)
- Create Campaign PAUSED (disabled)

## Verification

| Check | Result |
|-------|--------|
| `metaHttpCalls` | 0 |
| `driveWrites` | 0 |
| `externalWritePerformed` | false |
| `tripleApproved` | false |
| `_createPausedAllowed` | false |
| All entity statuses | PAUSED |
| VERIFY_* placeholders | present |

## Run Key

```json
{
  "appId": "human-lab-wf1-sandbox",
  "experimentRunId": "run_human-lab_2026q2_001",
  "provider": "meta"
}
```

## Output Highlights

- Destination URL: `https://human-lab-wf2-sandbox.vercel.app?utm_source=facebook&utm_medium=paid_social&utm_campaign=human-lab-validation`
- Daily budget: 35.71 USD
- Creative: `ads.media` → `media/og-image.png`

## Stop Line

No create-paused testing performed. Awaiting Meta API verification and operator approval.
