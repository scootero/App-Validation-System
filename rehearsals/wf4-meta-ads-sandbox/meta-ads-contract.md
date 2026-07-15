# WF4 Meta Ads Contract

**Status:** Frozen for sandbox dry-run (2026-07-15). Create-paused path wired but disabled until explicit approval.

WF4 maps to platform **WF-Ads**. Provider-neutral author contract lives at `ads.*`; Meta automation writes only `ads.meta.*`.

## Current Scope

- Dry-run bundle preparation and local/n8n proof.
- Create-paused Meta HTTP nodes exist in workflow graph but are **disabled and unreachable** in this pass.
- No Meta mutations, no Drive write-back, no spend.

## Required Upstream Proof

| Dependency | Requirement | Sandbox status |
|------------|-------------|----------------|
| WF2 | `deployment.landing.url` is non-null HTTPS | Fixture uses `human-lab-wf2-sandbox.vercel.app` |
| WF3 | One Sheet row per required event (33-column schema) | **Proven** |
| Google Sheets | WF-Decision can filter by `appId`, `experimentRunId`, `eventType` | Proven via WF3 |
| WF3 Sheet Meta columns | `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement` blank until WF4 create-paused | Blank |
| `app.json` | `ads`, `experiment`, `media`, `source`, `deployment.landing` complete | Fixture complete |

## Provider Model

| Layer | Owner | Notes |
|-------|-------|-------|
| `ads.*` (copy, targeting, media, utm) | Human author | Never overwritten by WF4 |
| `ads.meta.*` | WF-Ads automation | Written only after full paused create + verify |
| Future `ads.google.*`, `ads.tiktok.*` | Future adapters | Document only; not built in v1 |

Run identity key: `appId` + `analytics.experimentRunId` + `provider` (`meta`).

## Idempotency (mandatory before create-paused)

Before any Meta HTTP call:

1. Read `ads.meta.campaignId`, `adSetId`, `creativeId`, `adId`.
2. If **any** is non-null → refuse with clear error; no Meta calls.
3. Log run key: `{ appId, experimentRunId, provider: "meta" }`.

Partial orphans from a failed prior run require manual Meta cleanup before retry.

## Triple Approval Gate (create-paused only)

All three required before Meta HTTP:

1. `mode === "create_paused"`
2. `approval === true`
3. `approvalToken` input matches n8n Config Set / credential `WF4_CREATE_PAUSED_APPROVAL_TOKEN`

**Never** store approval token in `app.json` or repo files.

## Meta Credentials And Ownership

Store in n8n Credentials or Config Set only:

- Meta API access token (`ads_management` + `ads_read`)
- Meta ad account ID
- Meta Page ID
- Instagram actor ID (if Instagram placements)
- Meta API version (`VERIFY_*` until confirmed)
- Default daily budget cap
- `WF4_CREATE_PAUSED_APPROVAL_TOKEN`

External prerequisites (read-only verify):

- Business Manager access to ad account
- Page as ad actor; IG connected if needed
- Billing configured (campaign remains PAUSED)
- Special ad category decision documented

## Meta-Dependent Values (VERIFY until confirmed)

Do not hardcode live values until Web AI / operator confirms:

- `objective` mapping (`ads.objective` → Marketing API)
- `optimizationGoal`
- `billingEvent`
- `specialAdCategories`
- Budget minor units (`daily_budget`)
- Page / Instagram actor fields
- Interest IDs (`ads.targeting.interests[]` → Meta interest IDs)

## Existing `app.json` Inputs

| Field | WF4 use |
|-------|---------|
| `deployment.landing.url` | Destination URL base |
| `ads.campaignName` | Campaign/ad naming |
| `ads.objective` | Objective mapping input |
| `ads.platforms` | Publisher platform hints |
| `ads.headlines[]`, `primaryTexts[]`, `descriptions[]` | Creative copy |
| `ads.callToAction` | CTA type |
| `ads.utmTemplate` | Destination attribution |
| `ads.targeting` | Location, age, interest hints |
| `ads.media[]` | Preferred creative assets |
| `media.ogImage` | Creative fallback |
| `source.*` | Resolve `githubPath` assets |
| `experiment.testBudget` | Total budget and duration |
| `analytics.experimentRunId` | Idempotency run key |

## Creative Selection

1. First usable `ads.media[]` (`url` or `githubPath`).
2. Else `media.ogImage`.
3. Else fail. No silent text-only ads.

## Budget Rule

```txt
dailyBudget = experiment.testBudget.amount / experiment.testBudget.durationDays
```

Apply Config Set `DEFAULT_DAILY_BUDGET_CAP` before create-paused.

## Required n8n Node List

| # | Node | Type | Purpose |
|---|------|------|---------|
| 1 | Manual Run | Manual Trigger | `appId`, `mode`, `approval`, `approvalToken`, optional `appJson` |
| 2 | Workflow Config | Set | VERIFY placeholders, budget cap, provider, approval token ref |
| 3 | Load App Json | Code | Fixture or trigger `appJson`; no Drive write |
| 4 | Idempotency Check | Code | Refuse if any `ads.meta.*` ID exists |
| 5 | Validate Ads | Code | Landing, copy, budget, creative gates |
| 6 | Build Dry Run Bundle | Code | Campaign → ad set → creative → ad request bundle |
| 7 | Triple Approval Gate | IF | `create_paused` + approval + token match |
| 8 | Respond Dry Run | Code | Output bundle; **no external writes** |
| 9 | Create Paused Blocked | Code | Fail closed if gate ever passes without credentials |
| 10–14 | Meta HTTP nodes | HTTP Request | **Disabled** in this pass |
| 15 | Verify All Four IDs | Code | Create-paused only |
| 16–17 | Re-read + merge-write | Drive | Create-paused only; not executed |
| 18 | Notify Failure | HTTP optional | Partial create / write-back fail |

## Write-Back Contract

Only after campaign + ad set + creative + ad all created, IDs verified, and `app.json` re-read:

```json
{
  "ads": {
    "meta": {
      "status": "created_paused",
      "campaignId": "<campaign-id>",
      "adSetId": "<ad-set-id>",
      "creativeId": "<creative-id>",
      "adId": "<ad-id>",
      "landingUrl": "<landing-url-with-utm>",
      "dailyBudget": 35.71,
      "createdAt": "<iso8601>",
      "lastSyncedAt": null
    }
  },
  "status": "validating"
}
```

Never modify: author `ads.*` copy/targeting/media, `experiment`, `deployment`, `validation`.

## Error Handling

| Error | Action |
|-------|--------|
| Existing `ads.meta.*` ID | Refuse; no Meta calls |
| Missing landing URL | Fail — run WF2 first |
| Incomplete `ads` | Fail; no Meta calls |
| No creative | Fail with clear error |
| Meta API error | Retry 3× backoff; do not change `status` |
| Partial Meta create | Log IDs; alert; no `validating` write-back |
| Drive write-back fail | Critical alert |

No automated Meta rollback.

## Freeze

> WF4 dry-run contract is frozen. Create-paused remains disabled until Meta API values are verified, credentials attached, triple approval satisfied, and operator explicitly approves testing.
