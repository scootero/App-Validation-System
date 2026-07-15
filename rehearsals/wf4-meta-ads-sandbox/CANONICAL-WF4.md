# CANONICAL WF4 — Meta Ads Sandbox

**Status:** Architecture revision design pass 2026-07-15. Create-paused disabled.

## Proven Platform Values

| Key | Value |
|-----|-------|
| N8N_BASE_URL | `https://scottyo.app.n8n.cloud` |
| WF4_WORKFLOW_ID | `YIc53GBq4upelYp6` |
| WF4_WORKFLOW_NAME | `WF4 - Meta Ads Sandbox` |
| WF4_ACTIVE | `false` |
| SANDBOX_APP_ID | `human-lab-wf1-sandbox` |
| FIRST_TEST_BUDGET | `14 USD / 14 days = $1.00/day` |
| MAX_DAILY_BUDGET_USD | `10` |
| PROVIDER | `meta` |
| DEFAULT_MODE | `dry_run` |
| WF3_GATE_STATUS | `proven` |
| META_API_VERSION | `v25.0` (configurable) |
| Adapter SSOT | `lib/meta-adapter.js` |

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
| `notes/meta-research-prompt-a-results.md` | Prompt A reconciliation |
| `meta-ads-contract.md` | V1 contract |
| `scripts/wf4-rehearse.js` | Local proof (consumes adapter) |
| `scripts/sync-wf4-adapter-into-workflow.js` | Sync SSOT into workflow |
| `n8n/` | SDK + canonical meta |
