# WF4 External Proof Status

**Last updated:** 2026-07-16  
**Phase:** Pre-create prep done (ledger table + disabled create chain + Meta cred attached); dry-run still proven; create-paused still disabled; WF4 inactive

## Returned values

```yaml
META_API_VERSION: "v25.0"
SPECIAL_AD_CATEGORIES: []
RECOMMENDED_OBJECTIVE_FOR_LANDING_FUNNEL: "OUTCOME_TRAFFIC"
BILLING_EVENT: "IMPRESSIONS"
OPTIMIZATION_GOAL: "LINK_CLICKS"
ALT_OPTIMIZATION_GOAL: "LANDING_PAGE_VIEWS"
ADS_META_STATUS_AFTER_PAUSED_CREATE: "created_paused"
ROOT_STATUS_AFTER_PAUSED_CREATE: "unchanged"
ADAPTER_SSOT: "lib/meta-adapter.js"

MAX_DAILY_BUDGET_USD: 2   # workflow safety ceiling only — not default ad budget
MIN_DAILY_BUDGET_USD: 1
FIRST_TEST_DAILY_BUDGET_USD: 1   # fixture 14/14; unchanged
AD_ACCOUNT_CURRENCY: "USD"
payment_method_present: true

META_BUSINESS_PORTFOLIO_ID: "1074341285117707"
META_AD_ACCOUNT_ID: "act_979257825150251"
META_PAGE_ID: "1237104852815793"
META_INSTAGRAM_USER_ID: "17841440875992246"
META_SYSTEM_USER_ID: "61591805738163"  # provenance only; not a Workflow Config key
META_N8N_CREDENTIAL_NAME: "Meta Marketing API - Orro"  # token stays in n8n Credentials only
META_N8N_CREDENTIAL_ID: "pphgFAkucBMaBs8A"
META_N8N_CREDENTIAL_TYPE: "facebookGraphApi"

OPERATION_LEDGER_DATA_TABLE_ID: "Yys4vVmQGk8fTxag"
OPERATION_LEDGER_DATA_TABLE_NAME: "WF4 Operation Ledger"

N8N_BASE_URL: "https://scottyo.app.n8n.cloud"
WF4_WORKFLOW_ID: "YIc53GBq4upelYp6"
WF4_WORKFLOW_NAME: "WF4 - Meta Ads Sandbox"
WF4_WORKFLOW_ACTIVE: false
WF4_LIVE_VERSION_ID: "ce6f88da-2f05-4711-b7d6-a7bc405f8f39"
SANDBOX_APP_ID: "human-lab-wf1-sandbox"
WF3_GATE_STATUS: proven
WF4_POST_SYNC_DRY_RUN_EXECUTION_ID: "38"
WF4_PRECREATE_DRY_RUN_EXECUTION_ID: "39"
_createPausedAllowed: false
```

## Done

| Item | Status |
|------|--------|
| Prompt A reconciliation | Done |
| Architecture + adapter SSOT | Done |
| Manual Meta account setup | Done (IDs above) |
| Live Workflow Config (clean, no duplicates) | Done |
| Live Process node = adapter SSOT | Done |
| Operation ledger Data Table | Done (`Yys4vVmQGk8fTxag`) |
| Disabled create chain + ledger nodes | Done (wired, disabled) |
| Meta credential on create HTTP nodes | Done (`Meta Marketing API - Orro`) |
| Local dry-run via adapter | PASS (`wf4-rehearse.js`) |
| Prior n8n dry-run | execution `35` |
| Post-sync n8n dry-run (IDs + adapter) | execution `38` success |
| Meta token in repo | Never (credential only) |

## Blocking (create-paused)

| Item | Owner |
|------|-------|
| Create approval-token Credential vault | Operator — **manual now** (see CONFIG-DRIVEN doc) |
| Paste token into Config + run `approvalToken` | Operator — **only at create enablement** |
| Resolve creative binary for image upload | Operator/next Agent — before create |
| Flip `_createPausedAllowed` + enable create nodes | Explicit operator approval — **not yet** |
| Explicit create-paused approval | Operator — **not yet** |
| Spec 1.5.0 root-status ownership note | Spec pass |
| Human Lab Drive `500/14` vs `$2` cap | Do not use that package for create-paused without budget change |

## Approval-token vault (operator)

1. n8n → Credentials → Add → **Header Auth**
2. Name: `WF4 Create-Paused Approval Token`
3. Header: `X-WF4-Approval-Token`
4. Value: long random secret
5. Keep Workflow Config `wf4CreatePausedApprovalToken` **empty** until create-paused is approved
