# WF4 Meta Ads Contract

**Status:** V1 architecture revision 2026-07-15. Dry-run design pass; create-paused disabled.

WF4 maps to platform **WF-Ads**. Provider-neutral author contract lives at `ads.*`; Meta automation writes only `ads.meta.*`.

Canonical Meta research: [`notes/meta-research-prompt-a-results.md`](./notes/meta-research-prompt-a-results.md)  
Architecture: [`architecture/AD-PLAN-CONTRACT.md`](./architecture/AD-PLAN-CONTRACT.md) → [`architecture/META-ADAPTER-CONTRACT.md`](./architecture/META-ADAPTER-CONTRACT.md) → [`architecture/OPERATION-LEDGER.md`](./architecture/OPERATION-LEDGER.md)  
**Adapter SSOT:** [`lib/meta-adapter.js`](./lib/meta-adapter.js) (consumers must not duplicate mappings).

## Pipeline

```txt
app.json → Ad Plan → Meta adapter → operation ledger → paused create (later) → read-back → ads.meta.* write-back
```

Root status is **not** set to `validating` on paused create. Activation is a separate human-approved step.

## Current Scope

- Dry-run Ad Plan + adapter bundle + ledger plan snapshot.
- Create-paused Meta HTTP nodes exist but are **disabled**.
- No Meta mutations, no Drive write-back, no spend.

## V1 Meta pairing (adapter-owned)

| Field | Value |
|-------|-------|
| Objective | `OUTCOME_TRAFFIC` (author `ads.objective: traffic`) |
| `optimization_goal` | **`LINK_CLICKS`** |
| `billing_event` | **`IMPRESSIONS`** |

`LANDING_PAGE_VIEWS` is an alternative pending account validation — not locked for V1.

## Status model

| After verified paused create | Value |
|------------------------------|-------|
| `ads.meta.status` | **`created_paused`** (existing schema enum) |
| Root `status` | **Unchanged** (preserve e.g. `ready`) |
| Root `validating` | Only after later human-approved activation |

## Create sequence

```
Campaign (PAUSED) → Ad Set (PAUSED) → Image upload (asset) → Ad Creative (asset) → Ad (PAUSED)
```

Never send `ACTIVE`.

## Budget

```
dailyBudgetUsd = amount / durationDays
daily_budget (Meta) = dailyBudgetUsd × 100  # USD cents
```

Fail if daily > `MAX_DAILY_BUDGET_USD` (10). Never clamp. `$1/day` conditional on account `min_daily_budget`.

## Idempotency + ledger

- Refuse if any `ads.meta` campaign/adSet/creative/ad ID exists.
- Operation ledger (n8n Data Table) keyed by `appId|experimentRunId|provider`; persist each ID immediately after create (when create-paused enabled).
- V1 reconcile: resume if safe, else `manual_review_required`; no auto-delete.

## Triple Approval (create-paused)

`mode=create_paused` + `approval=true` + `WF4_CREATE_PAUSED_APPROVAL_TOKEN`.

## Ownership

| Layer | Location |
|-------|----------|
| Author ads / budget / targeting | `app.json` |
| Meta IDs / `created_paused` | `ads.meta.*` |
| Objective/billing/optimization/payloads | **Meta adapter SSOT** |
| API version, account/Page/IG IDs, budget cap | n8n Config |
| Tokens | n8n secrets |

## Freeze

> Design pass: Ad Plan + adapter SSOT + ledger design + `created_paused` without root validating. Create-paused disabled until Manual setup, Prompt B, and explicit approval.
