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
| `creativeResolved` | Generic binary coords from `resolveCreativeSource` (see below) |
| `landingUrl` / `destinationUrl` | WF2 URL + expanded `ads.utmTemplate` |
| `budget` | `experiment.testBudget` → `dailyBudgetUsd` |
| `budgetCapCheck` | vs n8n `MAX_DAILY_BUDGET_USD` (fail-closed) |
| `wf3Gate` | proven required events |
| `rootStatusPreserved` | current root `status` (not mutated by paused create) |

## Resolved creative source (generic — any app package)

Provider-neutral. Derived only from `app.json` (no hardcoded app/repo/filename):

1. Select creative: `ads.media[]` → else `media.ogImage`
2. If `githubPath`: `repo = source.assetsGithubRepo ?? source.mockupGithubRepo`, `branch = source.assetsBranch ?? source.mockupBranch ?? "main"`
3. Build `downloadUrl` (V1: public GitHub raw URL) + `filename` + image MIME allowlist
4. If `url`: HTTPS download URL directly (still binary → Meta later; not pass-through as creative image URL)

Fail closed: `CREATIVE_REPO_UNRESOLVED`, `CREATIVE_REPO_INVALID`, `CREATIVE_PATH_MISSING`, `CREATIVE_UNSUPPORTED_TYPE` (V1 images only).

## Gates (fail closed)

- HTTPS landing URL
- Broad targeting present
- FB and/or IG platforms
- Resolvable creative **including binary source coords**
- Daily budget ≤ cap
- Idempotency: refuse if any `ads.meta` ID exists

## Ownership

Ad Plan is provider-neutral. Meta enums and payloads are **not** part of the Ad Plan — see [`META-ADAPTER-CONTRACT.md`](./META-ADAPTER-CONTRACT.md).
