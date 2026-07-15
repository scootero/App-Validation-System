# WF4 External Proof Status

**Last updated:** 2026-07-15  
**Phase:** Prompt A reconciled; architecture revision design pass complete (adapter SSOT); awaiting Manual setup + Prompt B

## Returned values

```yaml
META_API_VERSION: "v25.0"
RECOMMENDED_OBJECTIVE_FOR_LANDING_FUNNEL: "OUTCOME_TRAFFIC"
BILLING_EVENT: "IMPRESSIONS"
OPTIMIZATION_GOAL: "LINK_CLICKS"
ALT_OPTIMIZATION_GOAL: "LANDING_PAGE_VIEWS"
ADS_META_STATUS_AFTER_PAUSED_CREATE: "created_paused"
ROOT_STATUS_AFTER_PAUSED_CREATE: "unchanged"
ADAPTER_SSOT: "lib/meta-adapter.js"
MAX_DAILY_BUDGET_USD: 10
MIN_DAILY_BUDGET_USD: null
META_BUSINESS_PORTFOLIO_ID: null
META_AD_ACCOUNT_ID: null
META_PAGE_ID: null
META_INSTAGRAM_USER_ID: null
WF4_WORKFLOW_ID: "YIc53GBq4upelYp6"
WF4_WORKFLOW_ACTIVE: false
FIRST_TEST_DAILY_BUDGET_USD: 1
WF3_GATE_STATUS: proven
```

## Done

| Item | Status |
|------|--------|
| Prompt A reconciliation | Done |
| Architecture contracts + adapter SSOT | Done |
| Fixtures objective `traffic` | Done |
| Local dry-run via adapter | PASS (`wf4-rehearse.js`) |
| Prior n8n dry-run | execution `35` |

## Blocking (create-paused)

| Item | Owner |
|------|-------|
| Manual Meta setup | Operator |
| Prompt B | Operator |
| Config + credentials | Operator |
| Explicit create-paused approval | Operator |
| Live n8n Data Table for ledger | Later (design only now) |
| Spec 1.5.0: document root status preserved until activation | Spec pass |
