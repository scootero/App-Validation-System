# WF4 External Proof Status

**Last updated:** 2026-07-17  
**Phase:** Creative binary-resolution path implemented in repo + local proofs PASS; create-paused still disabled; WF4 inactive; live n8n import of updated SDK pending operator

## Continuity / left off

| Item | Value |
|------|-------|
| V1 creative (sandbox fixture) | `media/og-image.png` |
| Asset repo (fixture only) | `scootero/Human-Lab-WF1-Sandbox` @ `main` |
| Local file | `rehearsals/github/Human-Lab-WF1-Sandbox/media/og-image.png` (~2,077,914 bytes, PNG) |
| Resolution | Generic: `ads.media[].githubPath` → `source.assetsGithubRepo ?? source.mockupGithubRepo` → raw download → (later) Meta `adimages` → `image_hash` |
| Template hardcodes | None in adapter / download nodes (fixture holds Human Lab values) |
| Create-paused | **Disabled**; `_createPausedAllowed: false` |
| Next operator action | Import/sync updated `n8n/wf4-meta-ads-sandbox.workflow.ts` into live WF4 → Manual dry_run → confirm `metaHttpCalls: 0` → then await explicit approval before create-paused |

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
WF4_CREATIVE_BINARY_LOCAL_PROOF: "2026-07-17 PASS (wf4-resolve-creative.js; metaHttpCalls=0)"
WF4_CREATIVE_BINARY_N8N_DRY_RUN: "pending operator sync/import of updated workflow SDK"
_createPausedAllowed: false
```

## Creative binary resolution (2026-07-17)

**Generic template behavior** (any future app package):

1. Adapter `resolveCreativeSource` reads selected creative + `source.*`
2. Dry-run bundle exposes `source.creative.downloadUrl` / `filename` / `repo` / `branch`
3. Disabled create-chain nodes: **Resolve Creative Download Plan** → **Download Creative Binary** → **Validate Creative Binary** → **Upload Ad Image** (multipart binary) → **Merge Image Hash** (fails without `image_hash`)

**Sandbox proof data (fixture only, not template hardcode):**

| Field | Value |
|-------|-------|
| `ads.media[0].githubPath` | `media/og-image.png` |
| `source.mockupGithubRepo` | `scootero/Human-Lab-WF1-Sandbox` |
| `source.mockupBranch` | `main` |
| Resolved `downloadUrl` | `https://raw.githubusercontent.com/scootero/Human-Lab-WF1-Sandbox/main/media/og-image.png` |
| Downloaded proof | `content-type: image/png`, `byteSize: 2077914` |

**Local proofs:**

| Test | Result | Meta writes |
|------|--------|-------------|
| `node scripts/wf4-rehearse.js` | PASS | 0 |
| `node scripts/wf4-resolve-creative.js` | PASS | 0 |

**Live n8n dry-run (operator):**

1. Keep workflow **inactive**; keep `mode=dry_run`; do **not** enable create-paused nodes
2. Sync/import updated Process Code + new disabled creative nodes from `n8n/wf4-meta-ads-sandbox.workflow.ts`
3. Manual Run → expect **Respond Dry Run** with `metaHttpCalls: 0`, `driveWrites: 0`
4. Confirm create-path nodes remain disabled (including Download/Upload image)

## Done

| Item | Status |
|------|--------|
| Prompt A reconciliation | Done |
| Architecture + adapter SSOT | Done |
| Manual Meta account setup | Done (IDs above) |
| Live Workflow Config (clean, no duplicates) | Done |
| Operation ledger Data Table | Done (`Yys4vVmQGk8fTxag`) |
| Disabled create chain + ledger nodes | Done (wired, disabled) |
| Meta credential on create HTTP nodes | Done (`Meta Marketing API - Orro`) |
| Generic creative binary resolution (adapter + disabled nodes) | Done (repo) |
| Local dry-run via adapter | PASS (`wf4-rehearse.js`) |
| Local creative download proof (no Meta) | PASS (`wf4-resolve-creative.js`) |
| Prior n8n dry-run | execution `35` / `38` / `39` |
| Live n8n sync of creative-binary SDK | **Pending operator** (no n8n API from this agent session) |
| Meta token in repo | Never (credential only) |

## Blocking (create-paused)

| Item | Owner |
|------|-------|
| Sync/import updated WF4 workflow SDK into live n8n + dry_run confirm | Operator |
| Create approval-token Credential vault | Operator — **manual now** (see CONFIG-DRIVEN doc) |
| Paste token into Config + run `approvalToken` | Operator — **only at create enablement** |
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
