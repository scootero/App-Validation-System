# WF4 V1 Field Classification

**Date:** 2026-07-15  
**Rule:** No production schema changes this pass. Extension points documented only.

---

## Bucket 1 — Reusable existing (use now)

| Field | Status |
|-------|--------|
| `ads.campaignName`, `objective`, `platforms` | Existing |
| `ads.headlines`, `primaryTexts`, `descriptions`, `callToAction` | Existing |
| `ads.utmTemplate` | Existing |
| `ads.targeting.locations`, `ageMin`, `ageMax` | Existing — **required for V1** |
| `ads.targeting.interests` | Existing — **optional**; not required for V1 |
| `ads.media[]`, `media.ogImage` | Existing |
| `experiment.testBudget` | Existing |
| `deployment.landing.url` | Existing |
| `analytics.experimentRunId` | Existing |
| `ads.meta.*` | Existing — automation write-back |

## Bucket 2 — Meta-specific (n8n Config; Prompt A reconciled)

| Field | Location / value |
|-------|------------------|
| Meta API version | n8n Config Set — `v25.0` |
| Objective API enum mapping | n8n Config Set — V1 funnel `OUTCOME_TRAFFIC` |
| billing_event | n8n Config Set — `IMPRESSIONS` |
| optimization_goal | n8n Config Set — `LANDING_PAGE_VIEWS` |
| Budget minor-unit rule | n8n Config Set — USD cents |
| Special ad categories decision | n8n Config Set — `[]` / NONE (no schema field required) |
| Business Portfolio / Ad Account / Page / IG user ID | n8n Config Set — from Prompt B |
| Page / IG payload field names | `object_story_spec.page_id`, `instagram_user_id` |

## Bucket 3 — Deferred future (no schema change now)

| Field | Reason |
|-------|--------|
| `ads.targeting.gender` | Optional extension; omit from V1 |
| `ads.placements[]` | Detailed Feed/Stories/Reels control |
| `ads.targeting.customAudiences[]` | Retargeting later |
| `ads.specialAdCategories` | Not required for V1 — use n8n Config `[]` |
| `ads.optimization` | Author-side optimization hints |
| `ads.provider` | Explicit provider enum if multi-provider |
| `ads.meta.errorMessage` | Ops visibility |
| `ads.meta.requestHash` | Extra idempotency |

---

## V1 validation gates (sandbox)

Required:

- HTTPS `deployment.landing.url`
- Complete ads copy + platforms (FB and/or IG)
- `targeting.locations`, `ageMin`, `ageMax`
- Resolvable creative
- `testBudget` with USD; daily ≤ `MAX_DAILY_BUDGET_USD`

Not required:

- Interests, gender, placements, custom audiences
