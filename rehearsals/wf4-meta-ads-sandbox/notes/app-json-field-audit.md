# WF4 app.json Field Audit (V1 revised)

## Verdict

No production schema changes required for WF4 V1 dry-run. Existing Spec 1.5.0 fields support broad targeting + budget + creative + `ads.meta.*` write-back.

## V1 required (existing)

| Requirement | Field |
|-------------|-------|
| Destination | `deployment.landing.url` |
| Copy / CTA / UTM | `ads.*` |
| Platforms | `ads.platforms` |
| Broad targeting | `ads.targeting.locations`, `ageMin`, `ageMax` |
| Creative | `ads.media[]` or `media.ogImage` |
| Budget | `experiment.testBudget` |
| Write-back | `ads.meta.*` |

## Optional (not required V1)

| Field | Notes |
|-------|-------|
| `ads.targeting.interests` | Extension; omit from dry-run when absent |
| Gender / placements / custom audiences | Deferred — no schema change |

## Outside app.json

| Value | Where |
|-------|-------|
| Business Portfolio / Ad Account / Page / IG | n8n Config (non-secret) |
| API version / objective / billing / optimization | n8n Config (non-secret) |
| `MAX_DAILY_BUDGET_USD` | n8n Config |
| Meta token / approval token | n8n Credentials |

## Production Drive / Spec

Do not modify production Drive or `app-validation-spec` / starter until Prompt A reviewed (Spec 1.5.0 coordinated pass).
