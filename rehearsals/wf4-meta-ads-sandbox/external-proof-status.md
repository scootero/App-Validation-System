# WF4 External Proof Status

**Last updated:** 2026-07-30  
**Phase:** Prompt 3 Track A **A7 PASS** — video create-paused complete; create path disabled; Track C still PASS

## Continuity / left off

| Item | Value |
|------|-------|
| Asset repo | `scootero/Human-Lab-WF1-Sandbox` @ `main` |
| Image V1 Meta IDs | campaign `120250607331460199` / adset `120250622864980199` / creative `1007406578799368` / ad `120250622866330199` / hash `3dd4a70bea3678c35714a2d06d718c3c` |
| Video V1 Meta IDs | campaign `120250720019360199` / adset `120250720020290199` / creative `935428952921305` / ad `120250720289310199` / videoId `1340974838103452` / thumb hash `345dec661253cd35c1e8bb414e90433a` |
| Orphans (leave PAUSED) | `120250622864710199`; `120250720277100199`; `120250720277300199` |
| Ledger video | `operationKey=…\|video-feed-v1`, `phase=writeback_done`, exec **105** |
| Drive write-back | exec **105** → `1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn` — `variants.image-v1` + `variants.video-feed-v1` |
| Create-paused | **Disabled**; Config `dry_run` / `approval=false`; create nodes off |
| Track C | **PASS** — see `wf4-final-prompts/TRACK-C-PROOF.md` |
| Next phase | A8 Feed previews for video-feed-v1 |

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
WF4_LIVE_VERSION_ID: "3fb014d8-cf97-4177-9c2e-281765519d4b"
SANDBOX_APP_ID: "human-lab-wf1-sandbox"
WF3_GATE_STATUS: proven
WF4_POST_SYNC_DRY_RUN_EXECUTION_ID: "38"
WF4_PRECREATE_DRY_RUN_EXECUTION_ID: "39"
WF4_PROMPT1_DRY_RUN_EXECUTION_ID: "48"
WF4_PROMPT1_DRY_RUN_STATUS: "success"
WF4_PROMPT1_DRY_RUN_AT: "2026-07-19T03:44:47.931Z"
WF4_IMAGE_V1_VERDICT: "PASS"
WF4_IMAGE_V1_CREATE_EXECUTION_ID: "74"
WF4_IMAGE_V1_WRITEBACK_EXECUTION_ID: "94"
WF4_IMAGE_V1_IDEMPOTENCY_EXECUTION_ID: "95"
WF4_IMAGE_V1_META_VERIFY_EXECUTION_ID: "96"
WF4_IMAGE_V1_CAMPAIGN_ID: "120250607331460199"
WF4_IMAGE_V1_ADSET_ID: "120250622864980199"
WF4_IMAGE_V1_CREATIVE_ID: "1007406578799368"
WF4_IMAGE_V1_AD_ID: "120250622866330199"
WF4_IMAGE_V1_IMAGE_HASH: "3dd4a70bea3678c35714a2d06d718c3c"
WF4_CREATIVE_BINARY_LOCAL_PROOF: "2026-07-18 PASS (wf4-resolve-creative.js; metaHttpCalls=0; byteSize=2077914; 1734x907)"
WF4_CREATIVE_BINARY_N8N_DRY_RUN: "2026-07-18 PASS execution 48 (planning only; create/download/upload nodes remain disabled)"
_createPausedAllowed: false
```

## Creative binary resolution

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
| Local file | 1734 × 907, `image/png`, 2,077,914 bytes (tracked on nested `main`, up to date with origin) |
| Downloaded proof | `content-type: image/png`, `byteSize: 2077914` |

**Local proofs (2026-07-18 re-verified):**

| Test | Result | Meta writes |
|------|--------|-------------|
| `node scripts/wf4-rehearse.js` | PASS | 0 |
| `node scripts/wf4-resolve-creative.js` | PASS | 0 |

**Live n8n dry-run (Prompt 1 — execution `48`):**

| Field | Value |
|-------|-------|
| Status | `success` |
| `ok` | `true` |
| `mode` | `dry_run` |
| `approval` | `false` |
| `_createPausedAllowed` | `false` |
| `metaHttpCalls` | `0` |
| `driveWrites` | `0` |
| `externalWritePerformed` | `false` |
| Selected creative | `media/og-image.png` |
| Source repo / branch | `scootero/Human-Lab-WF1-Sandbox` @ `main` |
| Budget | `$1/day` (14/14); max `$2/day` |
| Last node | **Respond Dry Run** |
| Create / download / upload / ledger nodes | Remained **disabled**; not executed |
| Workflow active after run | `false` |
| Token gates | **Removed 2026-07-21** — no `approvalToken` / Header Auth runtime compare |
| Post-token-removal dry_run | **PASS** execution `53` (`failures`: mode / approval / hard-gate only) |

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
| Generic creative binary resolution (adapter + disabled nodes) | Done (repo + live) |
| Local dry-run via adapter | PASS (`wf4-rehearse.js`) |
| Local creative download proof (no Meta) | PASS (`wf4-resolve-creative.js`) |
| Prior n8n dry-run | execution `35` / `38` / `39` |
| Prompt 1 live dry_run (creative SDK synced) | **PASS** execution `48` |
| Live == import-ready structural match | Verified (23 nodes; no `...1` duplicates; Process/Respond hashes match) |
| Meta token in repo | Never (credential only) |
| Image V1 PAUSED create (exec 74) | **PASS** — campaign/adset/creative/ad PAUSED |
| Drive ads.meta write-back (exec 94) | **PASS** |
| Feed previews (exec 93/96) | **PASS** — FB desktop/mobile + IG Feed |
| Idempotency already_complete (exec 95) | **PASS** — zero Meta POSTs; ledger writeback_done |
| Image V1 verdict | **PASS** |

## Blocking (post–Image V1 / post–Track C) — ops

| Item | Owner |
|------|-------|
| Meta Standard Access + business verify | Scott (Meta UI) — blocks public delivery |
| Already Complete IF before next create enablement | Agent — Create Campaign still POSTs on resume |
| Track A video `/advideos` | Prompt 3 — wait for Scott to approve Track A; A1 research first |
| Human activation | Manual only — no WF4 auto-activate |
| Spec 1.5.0 root-status ownership note | Spec pass |
| Human Lab Drive `500/14` vs `$2` cap | Do not use that package for create-paused without budget change |
| Sheet Meta ID columns population | Design done (TRACK-C-PROOF); implement via URL dynamic params / Decision |

## Approval gates (updated 2026-07-21)

Header Auth vault + Config dual-token compare **removed**. Create-paused requires:

1. Exact phrase
2. `mode=create_paused` + `approval=true`
3. `_createPausedAllowed=true` + create path enabled for one run
4. Budget / Meta IDs / creative / ledger gates
5. **Already Complete IF** must exist before re-enablement (see CREATE-PAUSED-V1-CONTRACT A9)