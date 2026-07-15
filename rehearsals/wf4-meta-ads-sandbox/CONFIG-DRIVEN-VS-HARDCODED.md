# WF4 Config-Driven vs Hardcoded

## n8n non-secret Config

| Key | Notes |
|-----|-------|
| `MAX_DAILY_BUDGET_USD` | Global cap; default **10** |
| `META_BUSINESS_PORTFOLIO_ID` | From Prompt B |
| `META_AD_ACCOUNT_ID` | From Prompt B |
| `META_PAGE_ID` | → `object_story_spec.page_id` |
| `META_INSTAGRAM_USER_ID` | `instagram_user_id` or N/A |
| `META_API_VERSION` | Default **`v25.0`** (configurable) |
| `provider` | `meta` |
| `mode` default | `dry_run` |
| `useFixtureAppJson` | `true` for sandbox dry-run |

**Not in Config:** objective mapping, billing_event, optimization_goal, payload builders — those live in [`lib/meta-adapter.js`](./lib/meta-adapter.js).

## Secrets

| Key |
|-----|
| Meta access token (system user preferred) |
| `WF4_CREATE_PAUSED_APPROVAL_TOKEN` |

## Adapter SSOT (version-controlled)

V1 pairing:

- `OUTCOME_TRAFFIC`
- `optimization_goal: LINK_CLICKS`
- `billing_event: IMPRESSIONS`

Alternative (not V1 default): `LANDING_PAGE_VIEWS` — account-validate first.

Sync into n8n workflow via `scripts/sync-wf4-adapter-into-workflow.js`. Do not hand-edit Process Code mappings.

## Shared logic

- Ad Plan normalization
- Ledger key + phases
- Triple approval gate
- Fail-closed budget cap
- PAUSED Campaign/AdSet/Ad only; never ACTIVE
- Write-back: `ads.meta.status = created_paused`; root status preserved

## Sandbox hardcodes (do not promote blindly)

| Value | Sandbox |
|-------|---------|
| Fixture budget | 14/14 = $1/day → `daily_budget: 100` |
| Fixture objective | `traffic` |
| `_createPausedAllowed` | `false` |
| Workflow ID | `YIc53GBq4upelYp6` |
