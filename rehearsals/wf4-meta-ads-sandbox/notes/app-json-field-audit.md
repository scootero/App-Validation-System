# WF4 app.json Field Audit

## Verdict

No new `app.json` fields are required for WF4 dry-run research or the first paused-campaign contract.

## Existing Support

| Requirement | Existing field |
|-------------|----------------|
| Landing destination | `deployment.landing.url` |
| Campaign name | `ads.campaignName` |
| Objective hint | `ads.objective` |
| Platforms | `ads.platforms` |
| Headlines | `ads.headlines[]` |
| Primary text | `ads.primaryTexts[]` |
| Description | `ads.descriptions[]` |
| CTA | `ads.callToAction` |
| UTM attribution | `ads.utmTemplate` |
| Targeting hints | `ads.targeting` |
| Preferred creatives | `ads.media[]` |
| Creative fallback | `media.ogImage` |
| Asset resolution | `source.assetsGithubRepo`, `source.mockupGithubRepo`, branches/root |
| Budget | `experiment.testBudget` |
| Write-back IDs | `ads.meta.*` |
| Lifecycle promotion | root `status: validating` |

## Correctly Outside app.json

| Value | Storage |
|-------|---------|
| Meta API access token | n8n Credentials |
| Meta ad account ID | n8n Credentials / Config Set |
| Meta Page ID | n8n Config Set |
| Instagram actor ID | n8n Config Set |
| Meta API version | n8n Config Set |
| Platform daily budget cap | n8n Config Set |
| Event-log Meta join keys (`metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement`) | WF3 Google Sheet columns (blank until WF4) |

## Optional Future Improvements

| Priority | Field | Reason | Blocks v1? |
|----------|-------|--------|------------|
| P1 | `ads.specialAdCategories` | Avoid unsafe assumptions for regulated categories | Conditional |
| P2 | `ads.placements` | More precise Feed/Stories/Reels control | No |
| P2 | `ads.optimization` | Objective-specific billing/optimization mapping | No |
| P2 | `ads.targeting.geo` | Structured geo beyond free-text locations | No |
| P2 | `ads.meta.errorMessage` | Store last failure summary | No |
| P3 | `ads.meta.requestHash` | Idempotency/audit support | No |

## Recommendation

Proceed with dry-run WF4 design using current fields. Add optional schema fields only after current Meta API verification and WF3 proof.
