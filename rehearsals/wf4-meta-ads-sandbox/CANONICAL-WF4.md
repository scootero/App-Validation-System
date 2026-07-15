# CANONICAL WF4 — Meta Ads Sandbox

**Status:** Dry-run proven (2026-07-15). Create-paused disabled.

## Proven Platform Values

| Key | Value |
|-----|-------|
| N8N_BASE_URL | `https://scottyo.app.n8n.cloud` |
| WF4_WORKFLOW_ID | `YIc53GBq4upelYp6` |
| WF4_WORKFLOW_NAME | `WF4 - Meta Ads Sandbox` |
| WF4_WORKFLOW_URL | `https://scottyo.app.n8n.cloud/workflow/YIc53GBq4upelYp6` |
| WF4_ACTIVE | `false` |
| SANDBOX_APP_ID | `human-lab-wf1-sandbox` |
| SANDBOX_EXPERIMENT_RUN_ID | `run_human-lab_2026q2_001` |
| PROVIDER | `meta` |
| DEFAULT_MODE | `dry_run` |
| WF3_GATE_STATUS | `proven` |
| WF3_SHEET_ID | `1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0` |
| DRY_RUN_EXECUTION_ID | `30` |

## Canonical Node Flow (dry-run proven)

```
Manual Run → Workflow Config → Process WF4 Dry Run → Triple Approval Gate → Respond Dry Run
```

Create-paused branch (disabled): `Create Paused Blocked → Create Campaign PAUSED`

## Field Ownership

| Field | Owner |
|-------|-------|
| `ads.*` (copy, targeting, media, utm) | Human author — never overwrite |
| `ads.meta.*` | WF-Ads — write only after full paused create + verify |
| `status` | WF-Ads sets `validating` only after four IDs verified |
| Sheet Meta columns | WF4 create-paused follow-up |

## Safety Gates

1. **Idempotency:** refuse if any `ads.meta.{campaignId,adSetId,creativeId,adId}` exists
2. **Triple approval:** `mode=create_paused` + `approval=true` + matching `WF4_CREATE_PAUSED_APPROVAL_TOKEN`
3. **`_createPausedAllowed`:** hardcoded `false` in this pass
4. **Disabled nodes:** Create Paused Blocked, Create Campaign PAUSED

## VERIFY_* Fields (awaiting Meta API confirmation)

- `metaApiVersion`
- `objective` → `VERIFY_META_OBJECTIVE_MAPPING`
- `billing_event`, `optimization_goal` → `VERIFY_FOR_OBJECTIVE`
- `special_ad_categories` → `VERIFY_BEFORE_LIVE_USE`
- `daily_budget` → `VERIFY_MINOR_UNITS_BEFORE_LIVE_USE`
- `page_id` → `CONFIG_META_PAGE_ID`
- `image_hash` → `VERIFY_AFTER_IMAGE_UPLOAD`
- `interests[]` → `VERIFY_INTEREST_ID`

## Artifact Index

| File | Role |
|------|------|
| `meta-ads-contract.md` | Frozen contract |
| `dry-run-payloads/human-lab-wf4-dry-run.json` | Canonical bundle shape |
| `scripts/wf4-rehearse.js` | Local proof |
| `EXTERNAL-SETUP-HANDOFF.md` | External setup A–E |
| `n8n/wf4-meta-ads-sandbox.workflow.ts` | SDK source |
| `n8n/WF4-meta-ads-sandbox.canonical-meta.json` | Live IDs |
| `notes/live-rehearsal-report.md` | Dry-run execution proof |

## Provider Model

- Author contract: `ads.*` (provider-neutral)
- Meta automation: `ads.meta.*`
- Future: `ads.google.*`, `ads.tiktok.*` (document only)
