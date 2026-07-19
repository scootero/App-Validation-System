# CANONICAL WF4 — Meta Ads Sandbox

**Status:** Meta account IDs confirmed 2026-07-16. Create-paused disabled. WF4 inactive.

## Proven Platform Values

| Key | Value |
|-----|-------|
| N8N_BASE_URL | `https://scottyo.app.n8n.cloud` |
| WF4_WORKFLOW_ID | `YIc53GBq4upelYp6` |
| WF4_WORKFLOW_NAME | `WF4 - Meta Ads Sandbox` |
| WF4_ACTIVE | `false` |
| SANDBOX_APP_ID | `human-lab-wf1-sandbox` |
| FIRST_TEST_BUDGET | `14 USD / 14 days = $1.00/day` (fixture; not the ceiling) |
| MAX_DAILY_BUDGET_USD | `2` (workflow safety ceiling only) |
| MIN_DAILY_BUDGET_USD | `1` (account) |
| AD_ACCOUNT_CURRENCY | `USD` |
| PROVIDER | `meta` |
| DEFAULT_MODE | `dry_run` |
| WF3_GATE_STATUS | `proven` |
| META_API_VERSION | `v25.0` |
| Adapter SSOT | `lib/meta-adapter.js` |

## Confirmed Meta account (non-secret)

| Key | Value |
|-----|-------|
| META_BUSINESS_PORTFOLIO_ID | `1074341285117707` |
| META_AD_ACCOUNT_ID | `act_979257825150251` |
| META_PAGE_ID | `1237104852815793` |
| META_INSTAGRAM_USER_ID | `17841440875992246` |
| META_SYSTEM_USER_ID | `61591805738163` (docs only) |
| META_N8N_CREDENTIAL_NAME | `Meta Marketing API - Orro` (token in n8n only) |

## V1 Meta pairing (adapter)

`OUTCOME_TRAFFIC` + `LINK_CLICKS` + `IMPRESSIONS`  
(`LANDING_PAGE_VIEWS` = alternative, not locked)

## Status after paused create (when enabled later)

- `ads.meta.status` = **`created_paused`**
- Root status = **preserved** (not `validating` until human activation)

## Pipeline

```txt
app.json → Ad Plan → Meta adapter → ledger → paused create → read-back → ads.meta.*
```

## Node Flow (dry-run)

```
Manual Run → Workflow Config → Process WF4 Dry Run → Triple Approval Gate → Respond Dry Run
```

Create-paused nodes disabled.

## Artifact Index

| File | Role |
|------|------|
| `lib/meta-adapter.js` | Adapter SSOT |
| `architecture/*.md` | Ad Plan / adapter / ledger contracts |
| `external-proof-status.md` | Confirmed Meta IDs |
| `meta-ads-contract.md` | V1 contract |
| `scripts/wf4-rehearse.js` | Local dry-run proof |
| `scripts/wf4-resolve-creative.js` | Local creative binary download proof (no Meta) |
| `scripts/sync-wf4-adapter-into-workflow.js` | Sync SSOT into workflow |
| `n8n/` | SDK + canonical meta |
| `external-proof-status.md` | Continuity / left-off / creative proof |
