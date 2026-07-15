# WF4 n8n Sandbox

## Live Workflow

| Field | Value |
|-------|-------|
| Name | `WF4 - Meta Ads Sandbox` |
| ID | `YIc53GBq4upelYp6` |
| URL | https://scottyo.app.n8n.cloud/workflow/YIc53GBq4upelYp6 |
| Active | **No** |
| Dry-run execution | `30` (success) |

## Files

| File | Role |
|------|------|
| `wf4-meta-ads-sandbox.workflow.ts` | SDK source |
| `WF4-meta-ads-sandbox.canonical-meta.json` | Proven IDs and execution proof |
| `../CANONICAL-WF4.md` | Single source of truth |
| `../PRODUCTION-PROMOTION-CHECKLIST.md` | Promotion rules |

## Dry-Run Test

Manual run with defaults (`mode=dry_run`, `approval=false`). Expect **Respond Dry Run** output with `metaHttpCalls: 0`, `driveWrites: 0`.

Create-paused nodes are **disabled**. Do not enable without operator approval and Meta API verification.
