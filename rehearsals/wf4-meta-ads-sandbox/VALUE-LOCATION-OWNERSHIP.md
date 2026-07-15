# WF4 Value Location Ownership

**Status:** Architecture revision 2026-07-15  
**Rule:** Secrets never in `app.json` or git. Meta account IDs are non-secret config. Objective/billing/optimization live in the **Meta adapter SSOT**, not editable operator Config.

---

## Master table

| Value | Location | Owner | Notes |
|-------|----------|-------|-------|
| Ad copy, platforms, targeting, creative, UTM | `app.json` → `ads.*` | Author | Never overwritten by WF4 |
| Author objective hint | `app.json` → `ads.objective` | Author | Sandbox V1: **`traffic`** |
| Experiment budget | `app.json` → `experiment.testBudget` | Author | |
| Calculated daily budget | Ad Plan / adapter | — | amount ÷ durationDays |
| Meta IDs / `created_paused` / landingUrl / dailyBudget | `app.json` → `ads.meta.*` | WF4 | After verified paused create; **no root status change** |
| Landing URL | `deployment.landing.url` | WF2 | HTTPS |
| Experiment run ID | `analytics.experimentRunId` | Author | Ledger + idempotency key |
| Objective → Meta enum, billing, optimization, payloads | [`lib/meta-adapter.js`](./lib/meta-adapter.js) | Code SSOT | V1: `OUTCOME_TRAFFIC` / `LINK_CLICKS` / `IMPRESSIONS` |
| Meta Business Portfolio ID | n8n Config | Operator | |
| Ad Account ID | n8n Config | Operator | `act_…` |
| Facebook Page ID | n8n Config | Operator | → `object_story_spec.page_id` |
| Instagram user ID | n8n Config | Operator | `instagram_user_id` |
| Meta API version | n8n Config | Operator | Default `v25.0` |
| `MAX_DAILY_BUDGET_USD` | n8n Config | Operator | Default **10** |
| Meta access token | n8n Credentials | Operator | System user preferred |
| `WF4_CREATE_PAUSED_APPROVAL_TOKEN` | n8n Credentials | Operator | |
| Operation ledger row | n8n Data Table | WF4 | Key: appId + experimentRunId + provider |

---

## Budget ownership

| Item | Where | Example |
|------|-------|---------|
| Per-app total + duration | `experiment.testBudget` | 14 / 14 = **$1/day** |
| Global safety cap | n8n `MAX_DAILY_BUDGET_USD` | **10** |
| Cap exceeded | Validation error | 500/14 → fail |

Never auto-clamp. Never store cap in app.json.

## Human Lab Drive note

Production Drive may still have `500/14`. Do not modify Drive in this pass.
