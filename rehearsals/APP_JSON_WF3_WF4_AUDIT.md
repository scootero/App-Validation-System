# app.json WF3/WF4 Audit

**Status:** Sandbox audit artifact  
**Conclusion:** Existing Spec 1.5.0 `app.json` fields support WF3 and WF4 v1. No schema changes are required before WF3 implementation rehearsal or WF4 dry-run design.

## WF3 Support

| Requirement | Existing support | Change needed? |
|-------------|------------------|----------------|
| Unified tracking endpoint | `tracking.webhookUrl` | No |
| Legacy per-event fallback URLs | `tracking.webhooks.emailCaptured`, `tracking.webhooks.buyNowClicked` | No |
| Event metadata | `tracking.events[]` | No |
| Attribution IDs | `analytics.projectId`, `experimentId`, `experimentRunId`, `landingVariantId`, `mockupVersionId` | No |
| Campaign attribution | `ads.campaignName` | No |
| Landing deployment attribution | `deployment.landing.vercelProjectId`, `deploymentUrl`, `lastDeployedAt` | No |
| App identity | `appId`, `identity.appName` | No |
| Google Sheet target | n8n Config Set | Correctly outside `app.json` |
| Auth secret | n8n Credentials/env | Correctly outside `app.json` |
| Runtime event fields (`eventId`, `receivedAt`, `fbclid`, `consentStatus`, Meta IDs, `placement`) | Client payload + n8n Sheet mapping | **No** — Sheet/event-only, not `app.json` |

## WF3 Sheet Expansion (Not app.json)

These fields are part of the **33-column** Google Sheets event log and landing POST body. They do **not** require `app.json` schema changes:

| Field | Owner | Notes |
|-------|-------|-------|
| `eventId` | Landing (n8n fallback) | Per-event UUID |
| `receivedAt` | n8n only | Webhook receive time |
| `fbclid` | Landing (persisted) | From initial URL |
| `consentStatus` | Landing / n8n default `unknown` | No consent UI yet |
| `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement` | Blank until WF4 | Reserved Sheet columns; not author `ads.*` |

## WF4 Support

| Requirement | Existing support | Change needed? |
|-------------|------------------|----------------|
| Destination URL | `deployment.landing.url` | No |
| Campaign name/objective/platforms | `ads.campaignName`, `ads.objective`, `ads.platforms` | No |
| Copy variants | `ads.headlines`, `ads.primaryTexts`, `ads.descriptions` | No |
| CTA | `ads.callToAction` | No |
| UTM params | `ads.utmTemplate` | No |
| Broad targeting (V1) | `ads.targeting.locations`, `ageMin`, `ageMax` required; `interests` optional | No schema change; gender/placements deferred |
| Creative assets | `ads.media[]`, fallback `media.ogImage` | No |
| Asset repo resolution | `source.assetsGithubRepo`, `source.mockupGithubRepo`, branches/root | No |
| Budget | `experiment.testBudget`; daily must be ≤ n8n `MAX_DAILY_BUDGET_USD` (10) | No app.json field for cap |
| Meta write-back | `ads.meta.*` | No |
| Lifecycle promotion | root `status: validating` | No |
| Meta API token | n8n Credentials | Correctly outside `app.json` |
| Meta ad account/Page IDs | n8n Credentials/Config Set | Correctly outside `app.json` |
| Event-log Meta join keys | Sheet columns `metaCampaignId` / `metaAdSetId` / `metaAdId` / `placement` | No `app.json` change; WF4 may populate Sheet later |

## Optional Future Fields

| Priority | Field | Reason | Blocks current implementation? |
|----------|-------|--------|--------------------------------|
| P1 | `ads.specialAdCategories` | Explicitly prevent unsafe Meta defaults for regulated categories | Conditional for regulated apps only |
| P2 | `tracking.lastEventAt` | Optional WF3 health/debug write-back | No |
| P2 | `ads.placements` | More precise Meta placement control (author intent) | No — distinct from Sheet `placement` column |
| P2 | `ads.optimization` | Objective-specific billing/optimization mapping | No |
| P2 | `ads.meta.errorMessage` | Operational failure visibility | No |
| P3 | `ads.meta.requestHash` | Idempotency/audit support | No |

## Classification Of Changes

- Critical defects: none found.
- Enhancements: explicit Meta special ad category handling; shared validation and mapping helpers; production `landing-template` sync of attribution/`eventId`.
- Future improvements: richer targeting/placement schema, WF3 health write-back, Meta idempotency fields.

## Recommendation

Proceed with current `app.json` schema for WF3 and WF4 dry-run work. Treat the 33-column Sheet expansion as runtime contract only — **WF3 event contract is frozen and ready for external implementation** (`rehearsals/wf3-human-lab-sandbox/EXTERNAL-SETUP-HANDOFF.md`). Add any future `app.json` fields only during the final coordinated Spec 1.5.0 update pass after WF3 proof and Meta API verification.
