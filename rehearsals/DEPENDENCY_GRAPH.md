# WF1-WF4 Dependency Graph

## Workflow Graph

```mermaid
flowchart TD
  AppJson[app.json Spec 1.5.0]
  Starter[app-package-starter]
  Spec[app-validation-spec]
  LandingTemplate[landing-template]
  WF0[WF0 Provisioning]
  WF1[WF1 Mockup Deploy]
  WF2[WF2 Landing Deploy]
  WF3[WF3 Tracking]
  WFAds[WF4/WF-Ads Meta]
  WFDecision[WF-Decision]
  Sheets[Google Sheets]
  Meta[Meta Ads]
  Rehearsals[rehearsal artifacts]

  Spec --> AppJson
  Starter --> AppJson
  AppJson --> WF0
  WF0 -->|tracking.webhookUrl| AppJson
  AppJson --> WF1
  WF1 -->|deployment.mockup.*| AppJson
  AppJson --> WF2
  LandingTemplate --> WF2
  WF2 -->|deployment.landing.*| AppJson
  WF2 -->|app-config tracking block| WF3
  WF3 --> Sheets
  Sheets --> WFDecision
  AppJson --> WFAds
  WF2 --> WFAds
  WF3 --> WFAds
  WFAds --> Meta
  WFAds -->|ads.meta.* + validating| AppJson
  Meta --> WFDecision
  WFDecision -->|validation.* + terminal status| AppJson
  Rehearsals --> Spec
```

## Edge List

| From | To | Dependency |
|------|----|------------|
| `app-validation-spec` | `app.json` | Defines schema and field meanings |
| `app-package-starter` | New app packages | Provides initial `app.json` scaffold |
| WF0 | WF1/WF2/WF3 | Provisions `tracking.webhookUrl` and `status: ready` |
| WF1 | WF2 | Provides `deployment.mockup.url` / `mockup.previewUrl` |
| WF2 | WF3 | Embeds `tracking.webhookUrl` and analytics IDs in landing app-config |
| WF3 | WF-Ads | Must prove event capture before paid traffic |
| WF3 | WF-Decision | Provides conversion rows in Google Sheets |
| WF-Ads | WF-Decision | Provides spend/click metrics and `ads.meta.*` IDs |
| WF-Decision | `app.json` | Writes `validation.*` and terminal root `status` |
| `landing-template/lib/tracking.ts` | WF3 n8n mapping | Defines payload fields and Sheet row order (production sync pending Spec 1.5.0) |
| Sandbox landing attribution | WF3 Sheet rows | Persists UTMs + `fbclid`; generates `eventId` per event |
| WF3 n8n Map To Sheet Row | Google Sheets | Always sets `receivedAt`; fallback `eventId` / `consentStatus`; Meta columns blank until WF4 |
| WF4 / WF-Ads | Google Sheets Meta columns | Later populates `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement` |
| Google Sheets | WF-Decision | Raw v1 analytics store (33-column schema) |
| Rehearsal artifacts | Final Spec 1.5.0 update | Evidence for coordinated docs/schema/starter/workflow sync |

## Critical Path

```txt
WF0 webhook -> WF1 mockup URL -> WF2 landing URL + app-config -> WF3 Sheet rows (33 cols) -> WF4 dry-run V1 (proven) -> Prompt A reconciled -> Manual Meta setup -> Prompt B -> WF4 create-paused (blocked) -> WF-Decision
```

## Current Blockers

- ~~WF3 external proof~~ **Cleared** — live workflow `7G2fJmqKsr8CGVID`, curl runs passed. Canonical: `wf3-human-lab-sandbox/CANONICAL-WF3.md`.
- Browser E2E still needs WF0 `tracking.webhookUrl` + WF2 re-embed (BL-005/006).
- WF4 V1 dry-run is **proven** (local + n8n execution 35; $1/day; MAX_DAILY_BUDGET_USD=10). Prompt A **reconciled**. Create-paused blocked on Manual Meta setup + Prompt B IDs + operator approval. Spec/starter deferred.
- Production `landing-template` attribution/`eventId` sync is deferred to Spec 1.5.0 (BL-028).
- Final production update is blocked until Spec 1.5.0 coordinated pass (BL-031–BL-038) after Prompt B / create-paused design freeze.