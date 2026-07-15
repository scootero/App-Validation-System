# WF4 Config-Driven vs Hardcoded

## Config-Driven (promote per app / environment)

| Value | Source |
|-------|--------|
| `appId` | Manual trigger / Drive `app.json` |
| `mode`, `approval`, `approvalToken` | Manual trigger |
| `provider` | Config Set (`meta` for v1) |
| `metaApiVersion` | Config Set (VERIFY until confirmed) |
| `defaultDailyBudgetCap` | Config Set |
| `wf4CreatePausedApprovalToken` | n8n credential / Config Set (secret) |
| `wf3GateStatus` | Config Set |
| `useFixtureAppJson` | Config Set (sandbox only) |
| Meta ad account, Page, IG actor | n8n credentials / Config Set |

## Shared Logic (promote as reusable components)

- Idempotency check (`appId` + `experimentRunId` + `provider`)
- Triple approval gate
- Creative selection priority (`ads.media[]` → `media.ogImage`)
- UTM expansion (manual query builder — no URLSearchParams in n8n Code)
- Dry-run bundle shape (campaign → ad set → creative → ad)
- PAUSED-by-default entity status
- VERIFY_* placeholder enforcement until API confirmed

## Sandbox Hardcodes (do not promote blindly)

| Value | Sandbox value |
|-------|---------------|
| `fixtureAppJson` | Embedded human-lab fixture |
| `useFixtureAppJson` | `true` |
| `_createPausedAllowed` | `false` |
| WF4 workflow ID | `YIc53GBq4upelYp6` |
| WF3 Sheet ID | `1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0` |

## Reuse Model

Future apps: parameterize `appId`, Drive file ID, Meta account/Page IDs via Config Set. Keep node sequence and safety gates identical.
