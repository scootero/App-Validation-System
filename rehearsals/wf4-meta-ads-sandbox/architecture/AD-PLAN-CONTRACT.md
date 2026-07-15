# WF4 Ad Plan Contract

**Status:** Design pass 2026-07-15  
**Role:** Provider-neutral normalized plan derived from `app.json` before any Meta adapter mapping.

## Pipeline

```txt
app.json → Ad Plan → Meta adapter → operation ledger → (later) paused create → read-back → ads.meta.* write-back
```

## Required Ad Plan fields

| Field | Source |
|-------|--------|
| `appId` | `app.json` |
| `experimentRunId` | `analytics.experimentRunId` |
| `provider` | runtime (`meta`) |
| `authorObjective` | `ads.objective` (sandbox V1: `traffic`) |
| `campaignName`, copy, CTA, platforms | `ads.*` |
| `targeting` | locations, ageMin/ageMax; interests optional |
| `creative` | first usable `ads.media[]` else `media.ogImage` |
| `landingUrl` / `destinationUrl` | WF2 URL + expanded `ads.utmTemplate` |
| `budget` | `experiment.testBudget` → `dailyBudgetUsd` |
| `budgetCapCheck` | vs n8n `MAX_DAILY_BUDGET_USD` (fail-closed) |
| `wf3Gate` | proven required events |
| `rootStatusPreserved` | current root `status` (not mutated by paused create) |

## Gates (fail closed)

- HTTPS landing URL
- Broad targeting present
- FB and/or IG platforms
- Resolvable creative
- Daily budget ≤ cap
- Idempotency: refuse if any `ads.meta` ID exists

## Ownership

Ad Plan is provider-neutral. Meta enums and payloads are **not** part of the Ad Plan — see [`META-ADAPTER-CONTRACT.md`](./META-ADAPTER-CONTRACT.md).
