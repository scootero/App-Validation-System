# WF4 External Proof Status

**Last updated:** 2026-07-15  
**Phase:** Dry-run sandbox (zero Meta / Drive mutations)

## Returned values (operator / Web AI — fill in)

```yaml
META_BUSINESS_MANAGER_ID: null
META_AD_ACCOUNT_ID: null
META_PAGE_ID: null
META_INSTAGRAM_ACTOR_ID: null
META_API_VERSION: null
DEFAULT_DAILY_BUDGET_CAP: null
SPECIAL_AD_CATEGORY_DECISION: null
OBJECTIVE_MAPPING: null
BILLING_EVENT_FOR_CONVERSIONS: null
OPTIMIZATION_GOAL_FOR_CONVERSIONS: null
BUDGET_MINOR_UNIT_RULE: null
MIN_DAILY_BUDGET_USD: null
INTEREST_ID_MAPPING: null
TOKEN_SCOPES_CONFIRMED: null

N8N_BASE_URL: "https://scottyo.app.n8n.cloud"
WF4_WORKFLOW_ID: "YIc53GBq4upelYp6"
WF4_WORKFLOW_ACTIVE: false
WF4_WORKFLOW_NAME: "WF4 - Meta Ads Sandbox"
WF4_WORKFLOW_URL: "https://scottyo.app.n8n.cloud/workflow/YIc53GBq4upelYp6"
SANDBOX_APP_ID: "human-lab-wf1-sandbox"
SANDBOX_EXPERIMENT_RUN_ID: "run_human-lab_2026q2_001"
SANDBOX_LANDING_URL: "https://human-lab-wf2-sandbox.vercel.app"
WF3_SHEET_ID: "1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0"
WF3_GATE_STATUS: proven
```

## Done

| Item | Status | Evidence |
|------|--------|----------|
| Local dry-run proof | PASS | `scripts/wf4-rehearse.js` |
| Dry-run payload contract | Frozen | `dry-run-payloads/human-lab-wf4-dry-run.json` |
| Contract frozen | Done | `meta-ads-contract.md` |
| External setup package | Done | `EXTERNAL-SETUP-HANDOFF.md` |
| n8n dry-run workflow | Done | `YIc53GBq4upelYp6` (inactive) |
| n8n dry-run execution | PASS | execution `30` |
| WF3 upstream gate | Proven | WF3 live Sheet + n8n |

## Blocking (before create-paused)

| Item | Owner |
|------|-------|
| Meta API verification (VERIFY_* → live values) | Web AI / operator |
| Meta credential attach | Operator |
| Approval token in n8n | Operator |
| Explicit create-paused approval | Operator |
| Final payload review | Operator |

## n8n dry-run execution

```yaml
WF4_DRY_RUN_EXECUTION_ID: "30"
WF4_DRY_RUN_EXECUTION_STATUS: success
META_HTTP_CALLS_OBSERVED: 0
DRIVE_WRITES_OBSERVED: 0
```

## Next step

Web AI read-only Meta inspection → return Section B YAML → operator reviews dry-run bundle → approve create-paused testing separately.
