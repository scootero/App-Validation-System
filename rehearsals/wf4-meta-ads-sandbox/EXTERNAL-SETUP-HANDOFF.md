# WF4 External Setup Handoff Package

**Audience:** Web AI agent (or human operator) for read-only Meta inspection and n8n credential configuration.  
**Scope:** Sandbox only. Do not create campaigns, ad sets, creatives, or ads. Do not activate spend.  
**Canonical for external setup:** This file. `EXTERNAL-SETUP-PACKAGE.md` mirrors it.

> **WF4 dry-run contract is frozen.** This pass requires zero Meta mutations and zero Drive write-back.

---

## A. Everything To Create / Configure

### A1. Meta Business (read-only inspection)

| Item | Action |
|------|--------|
| Business Manager | Confirm access to target ad account |
| Ad account | List ID (`act_…`); confirm billing method exists |
| Facebook Page | Confirm Page ID usable as ad actor |
| Instagram | If `ads.platforms` includes `instagram`, confirm connected IG actor ID |
| Token scopes | Confirm `ads_management` (create) and `ads_read` (monitor) — report scopes only, not token |
| Special ad categories | Document whether `NONE` or specific categories apply |

**Do not:** create campaigns, upload creatives, or spend.

### A2. n8n Credentials (sandbox)

| Item | Value |
|------|-------|
| Workflow name | `WF4 - Meta Ads Sandbox` |
| Active | **No** — keep inactive until create-paused explicitly approved |
| Meta API token | Store in n8n Credentials only when create-paused approved; **not required for dry-run** |
| Google Service Account | Reuse `Google Service Account` for future Drive read/write (dry-run uses fixture, no Drive calls) |
| Approval token | `WF4_CREATE_PAUSED_APPROVAL_TOKEN` in n8n Config Set or credential — secret; never in repo or `app.json` |

### A3. n8n Workflow Config (non-secret Set node values)

| Key | Dry-run value | Live value |
|-----|---------------|------------|
| `provider` | `meta` | `meta` |
| `mode` default | `dry_run` | `dry_run` until approved |
| `metaApiVersion` | `VERIFY_CURRENT_VERSION_BEFORE_LIVE_USE` | confirmed version |
| `defaultDailyBudgetCap` | `50` (sandbox cap) | operator value |
| `wf3GateStatus` | `proven` | `proven` |
| `useFixtureAppJson` | `true` (sandbox dry-run) | `false` when Drive read enabled |
| `wf4CreatePausedApprovalToken` | (secret ref) | must match manual trigger input |

### A4. Exact Node Sequence

| # | Node | Dry-run behavior |
|---|------|------------------|
| 1 | Manual Run | `mode=dry_run`, `approval=false` |
| 2 | Workflow Config | VERIFY placeholders |
| 3 | Load App Json | Fixture JSON; no Drive |
| 4 | Idempotency Check | Refuse if any `ads.meta.*` ID |
| 5 | Validate Ads | Gates |
| 6 | Build Dry Run Bundle | Full request bundle |
| 7 | Triple Approval Gate | Always false in dry-run |
| 8 | Respond Dry Run | Return bundle JSON |
| 9 | Create Paused Blocked | Unreachable in dry-run |
| 10–18 | Meta / Drive nodes | **Disabled** |

---

## B. Every Value To Return

Fill and send back (no secrets, no tokens):

```yaml
META_BUSINESS_MANAGER_ID: "<bm-id>"
META_AD_ACCOUNT_ID: "act_<id>"
META_PAGE_ID: "<page-id>"
META_INSTAGRAM_ACTOR_ID: "<ig-actor-id-or-N/A>"
META_API_VERSION: "<verified-version-e.g-v21.0>"
DEFAULT_DAILY_BUDGET_CAP: "<number-usd>"
SPECIAL_AD_CATEGORY_DECISION: "NONE | <categories>"

# Verified API mappings (from current Meta Marketing API docs)
OBJECTIVE_MAPPING:
  conversions: "<meta-api-objective>"
  traffic: "<meta-api-objective>"
  awareness: "<meta-api-objective>"
  leads: "<meta-api-objective>"
  app-installs: "<meta-api-objective>"
BILLING_EVENT_FOR_CONVERSIONS: "<value>"
OPTIMIZATION_GOAL_FOR_CONVERSIONS: "<value>"
BUDGET_MINOR_UNIT_RULE: "cents | verify"
MIN_DAILY_BUDGET_USD: "<minimum>"
INTEREST_ID_MAPPING:
  fitness: "<meta-interest-id-or-skip>"
  productivity: "<meta-interest-id-or-skip>"
  self-improvement: "<meta-interest-id-or-skip>"

TOKEN_SCOPES_CONFIRMED:
  ads_management: true|false
  ads_read: true|false

N8N_BASE_URL: "https://scottyo.app.n8n.cloud"
WF4_WORKFLOW_ID: "<after-cursor-creates>"
WF4_WORKFLOW_ACTIVE: false
SANDBOX_APP_ID: "human-lab-wf1-sandbox"
SANDBOX_EXPERIMENT_RUN_ID: "run_human-lab_2026q2_001"
SANDBOX_LANDING_URL: "https://human-lab-wf2-sandbox.vercel.app"
WF3_SHEET_ID: "1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0"
WF3_GATE_STATUS: proven
```

---

## C. Dry-Run Payload Assertions

After local `node scripts/wf4-rehearse.js` or n8n dry-run execution, confirm:

- `mode` is `dry_run`
- `wf3Gate.status` is `proven`
- `computed.statusForAllCreatedEntities` is `PAUSED`
- All campaign/adSet/ad `status` fields are `PAUSED`
- `safety.externalWritePerformed` is `false`
- `safety.liveAdsCreated` is `false`
- `safety.spendPossible` is `false`
- Objective, billing, optimization, special ad categories, budget units, Page ID, interest IDs use `VERIFY_*` placeholders
- `runKey` = `{ appId, experimentRunId, provider: meta }`
- No `ads.meta.*` IDs written to Drive

Canonical reference: [`dry-run-payloads/human-lab-wf4-dry-run.json`](./dry-run-payloads/human-lab-wf4-dry-run.json)

---

## D. Verification Steps

### D1. Local proof (Cursor)

```bash
node rehearsals/wf4-meta-ads-sandbox/scripts/wf4-rehearse.js
```

Expected: `WF4 local dry-run proof: PASS`

### D2. n8n dry-run (inactive workflow, manual execution)

1. Open `WF4 - Meta Ads Sandbox` in n8n (inactive).
2. Manual run with: `mode=dry_run`, `approval=false`.
3. Confirm execution succeeds on **Respond Dry Run** node.
4. Confirm **no** HTTP Request nodes to `graph.facebook.com` executed.
5. Confirm **no** Google Drive upload/update nodes executed.
6. Save execution ID in `external-proof-status.md`.

### D3. Before create-paused approval (operator)

- [ ] All VERIFY_* fields replaced with confirmed values from Section B
- [ ] Meta token attached to n8n
- [ ] Approval token configured in n8n only
- [ ] Triple approval tested in staging with `mode=create_paused`, `approval=true`, matching token
- [ ] Idempotency refusal tested (fixture with existing `ads.meta.campaignId`)

---

## E. Copy-Paste Web AI Prompt

```
You are configuring read-only Meta context for App Validation System WF4 (Meta Ads sandbox).

RULES:
- Read-only inspection of Meta Business Manager, ad accounts, Pages, Instagram connections.
- Do NOT create campaigns, ad sets, creatives, or ads.
- Do NOT activate anything or spend money.
- Do NOT paste API tokens into chat, files, or git.

TASKS:
1. Confirm Business Manager ID and ad account ID (act_…) with billing configured.
2. Confirm Facebook Page ID usable as ad actor.
3. If Instagram placements are needed, confirm Instagram actor ID.
4. Verify current Marketing API version and document objective mapping for: conversions, traffic, awareness, leads, app-installs.
5. For conversions objective, document billing_event and optimization_goal.
6. Document special_ad_categories decision (NONE or specific).
7. Document daily budget minor units and minimum daily budget in USD.
8. Map interest strings to Meta interest IDs: fitness, productivity, self-improvement (or note if broad targeting required).
9. Confirm token would need ads_management + ads_read scopes (report only, do not generate token).

Return the YAML block from EXTERNAL-SETUP-HANDOFF.md Section B filled in (no secrets).
```
