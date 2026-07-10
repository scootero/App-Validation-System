# WF4 Meta Ads Contract

## Current Scope

WF4 is research/design and dry-run payload preparation only until WF3 is proven.

WF4 may prepare request bundles for review. It must not create or activate live Meta resources without explicit future approval.

## Required Upstream Proof

| Dependency | Requirement |
|------------|-------------|
| WF2 | `deployment.landing.url` is non-null HTTPS |
| WF3 | At least one sandbox Sheet row exists for each required event (**33-column** schema) |
| Google Sheets | WF-Decision can read signup rows by `appId`, `experimentRunId`, and `eventType`; join via `eventId` / Meta ID columns when populated |
| WF3 Sheet Meta columns | `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement` remain blank until WF4 populates them |
| `app.json` | `ads`, `experiment`, `media`, `source`, and `deployment.landing` are complete |

## Meta Credentials And Ownership

Store these in n8n Credentials or Config Set nodes, not `app.json`:

- Meta API access token.
- Meta ad account ID.
- Meta Page ID.
- Instagram actor ID, if Instagram placements are used.
- Meta API version.
- Default budget cap.

Ownership/prerequisites to verify externally:

- Business Manager has access to the ad account.
- Token has `ads_management` for creation and `ads_read` for monitoring.
- Page can be used as ad actor.
- Instagram account is connected if Instagram placements are requested.
- Billing is configured, but campaign remains paused.
- Special ad category requirements are known before payload creation.

## Existing `app.json` Inputs

| Field | WF4 use |
|-------|---------|
| `deployment.landing.url` | Destination URL base |
| `ads.campaignName` | Campaign/ad naming |
| `ads.objective` | Objective mapping input |
| `ads.platforms` | Publisher platform hints |
| `ads.headlines[]` | Creative headline variants |
| `ads.primaryTexts[]` | Creative body variants |
| `ads.descriptions[]` | Creative description variants |
| `ads.callToAction` | CTA type |
| `ads.utmTemplate` | Destination attribution |
| `ads.targeting` | Location, age, interest hints |
| `ads.media[]` | Preferred creative assets |
| `media.ogImage` | Creative fallback |
| `source.*` | Resolve `githubPath` assets |
| `experiment.testBudget` | Total budget and duration |
| `analytics.*` | Naming/attribution context |

## Creative Selection

1. Use first usable `ads.media[]`.
2. Else use `media.ogImage`.
3. Else fail. Do not silently create text-only ads.

## Budget Rule

```txt
dailyBudget = experiment.testBudget.amount / experiment.testBudget.durationDays
```

Then apply an n8n Config Set cap before any live create-paused mode.

Meta budget units must be verified against the current API before live use.

## Required n8n Node List

| # | Node | Type | Purpose |
|---|------|------|---------|
| 1 | Manual Run | Manual Trigger | Input `appId`, `mode`, approval flag |
| 2 | Workflow Config | Set | Meta API version, budget cap, dry-run default |
| 3 | Read app.json | Google Drive | Read sandbox/Drive manifest |
| 4 | Gate WF2/WF3 readiness | Code + IF | Require landing URL and WF3 proof |
| 5 | Validate ads/experiment | Code + IF | Check copy, targeting, budget, creative |
| 6 | Resolve creative asset | Code + HTTP Request | Resolve `url` or `githubPath` |
| 7 | Build dry-run bundle | Code | Build campaign/ad set/creative/ad request |
| 8 | Dry-run output | Code/Respond | Stop with no external writes by default |
| 9 | Human approval gate | Manual/IF | Required before Meta writes |
| 10 | Upload image | HTTP Request | Meta image upload, create-paused only |
| 11 | Create Campaign | HTTP Request | `status: PAUSED` |
| 12 | Create Ad Set | HTTP Request | `status: PAUSED` |
| 13 | Create Creative | HTTP Request | Link ad creative |
| 14 | Create Ad | HTTP Request | `status: PAUSED` |
| 15 | Re-read app.json | Google Drive | Preserve author content |
| 16 | Merge-write app.json | Code + Drive Upload | Write `ads.meta.*`, `status: validating` only |
| 17 | Notify Failure | HTTP Request, optional | Partial-create or API failures |

## Write-Back Contract

Only after successful create-paused mode:

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

Never modify:

- `ads.headlines`
- `ads.primaryTexts`
- `ads.descriptions`
- `ads.targeting`
- `experiment`
- `deployment`
- `landingPage`

## Cursor Tasks

- Maintain dry-run payloads and contract docs.
- Validate schema support.
- Record API verification requirements.
- Do not call Meta APIs.

## Web AI Tasks

- Inspect Meta Business settings read-only.
- Report available ad accounts, Pages, Instagram actors, and permissions.
- Verify current API objective names, placement requirements, budget minimums, and special ad category rules.
- Do not create or activate campaigns.
