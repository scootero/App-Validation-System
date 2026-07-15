# WF3 Event Contract And Rehearsal Plan

## Canonical Flow

```txt
landing-template client event
-> POST application/json to tracking.webhookUrl
-> n8n Webhook Trigger
-> optional Bearer auth from n8n credentials/env
-> payload validation
-> row normalization (receivedAt, eventId fallback, consent/meta defaults)
-> Google Sheets append
-> HTTP 200 response
```

WF3 is runtime-only. It appends Google Sheets rows and does not routinely write `app.json`.

## Event Payload

The POST body is the event. There is no wrapper envelope.

| Field | Required | Type | Source |
|-------|----------|------|--------|
| `eventType` | Yes | string enum | Landing client |
| `appId` | Yes | string | `app.json.appId` via app-config |
| `appName` | Yes | string | `identity.appName` |
| `experimentId` | Yes | string | `analytics.experimentId` |
| `experimentRunId` | Yes | string | `analytics.experimentRunId` |
| `projectId` | No | string | `analytics.projectId` |
| `deploymentId` | No | string | `deployment.landing.vercelProjectId` or `deploymentUrl` |
| `landingVersion` | No | string | `deployment.landing.lastDeployedAt` |
| `landingVariantId` | No | string | `analytics.landingVariantId` |
| `mockupVersionId` | No | string | `analytics.mockupVersionId` |
| `campaignName` | No | string | `ads.campaignName` |
| `visitorId` | No | string | Browser `localStorage` |
| `sessionId` | No | string | Browser `sessionStorage` |
| `email` | Conditional | string | Form input |
| `price` | Conditional | string | Pricing fake-door CTA |
| `pageUrl` | No | string | `window.location.href` |
| `referrer` | No | string | `document.referrer` |
| `utmSource` | No | string | URL query, persisted for session |
| `utmMedium` | No | string | URL query, persisted for session |
| `utmCampaign` | No | string | URL query, persisted for session |
| `utmContent` | No | string | URL query, persisted for session |
| `utmTerm` | No | string | URL query, persisted for session |
| `timeOnPageSeconds` | No | number | Client timer |
| `mockupInteracted` | No | boolean | Client session flag |
| `timestamp` | Yes | ISO 8601 string | Client event time |
| `eventId` | No* | string UUID | Landing generates per event; n8n fallback if missing |
| `fbclid` | No | string | URL query on first load; persisted visitor/session |
| `consentStatus` | No | string | Landing default `unknown`; n8n default if missing |
| `metaCampaignId` | No | string | Blank until WF4 populates |
| `metaAdSetId` | No | string | Blank until WF4 populates |
| `metaAdId` | No | string | Blank until WF4 populates |
| `placement` | No | string | Blank until WF4 populates |

\* Landing should always send `eventId`. n8n generates a fallback UUID when absent.

### Server-only Sheet field

| Field | Required | Type | Source |
|-------|----------|------|--------|
| `receivedAt` | Yes (Sheet) | ISO 8601 string | Always set by n8n at webhook receive time. Not authoritative from client. |

## Field Ownership Rules

| Field | Client | n8n Map To Sheet Row |
|-------|--------|----------------------|
| `eventId` | Generate UUID per event | If missing/empty → generate fallback UUID |
| `receivedAt` | Omit (not authoritative) | Always set to webhook receive time |
| `fbclid` | Capture on first load; persist; include on every event | Pass through; default `""` |
| UTM fields | Capture on first load; persist; include on every event | Pass through; default `""` |
| `consentStatus` | Send `unknown` by default | If missing → `unknown` |
| `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement` | Send `""` | Default `""` until WF4 |

## Canonical Events

| eventType | Trigger | Event-specific fields |
|-----------|---------|-----------------------|
| `page_view` | Page load once | `email: ""`, `price: ""`, `mockupInteracted: false` initially |
| `email_captured` | Waitlist form submit | `email` populated, `price: ""` |
| `buy_now_clicked` | Pricing fake-door submit | `email` and `price` populated |
| `mockup_interacted` | First mockup expand/click | `mockupInteracted: true` |

## Google Sheets Schema

Use one unified sandbox spreadsheet with tab `Sheet1`. Header row must be exactly **33 columns**:

```txt
timestamp | eventType | appId | appName | experimentId | experimentRunId | projectId | deploymentId | landingVersion | landingVariantId | mockupVersionId | campaignName | visitorId | sessionId | email | price | pageUrl | referrer | utmSource | utmMedium | utmCampaign | utmContent | utmTerm | timeOnPageSeconds | mockupInteracted | eventId | receivedAt | fbclid | consentStatus | metaCampaignId | metaAdSetId | metaAdId | placement
```

## Contract Freeze

**WF3 event contract is frozen and ready for external implementation.**

Canonical external handoff: `EXTERNAL-SETUP-HANDOFF.md`.

## Required n8n Node List

| # | Node | Type | Purpose |
|---|------|------|---------|
| 1 | Landing Event Webhook | Webhook | Accept POST JSON from deployed landing |
| 2 | Workflow Config | Set | `googleSheetId`, `googleSheetTabName`, `webhookAuthSecret` |
| 3 | Validate Auth | Code | Skip when secret is null; otherwise validate Bearer header |
| 4 | Validate Payload | Code | Check event type and minimum required fields; flag `_validationFailed` (still HTTP 200) |
| 5 | Map To Sheet Row | Code | Build object/array in canonical Sheet order; set `receivedAt`; fallback `eventId`; default consent/meta; `_skipAppend` when invalid; preserve `_validationErrors` on skip |
| 6 | Route Valid Events | IF | Skip Append when `_skipAppend`; else Append |
| 7 | Append Row | Google Sheets | Append normalized row with **explicit/`defineBelow`** 1:1 mapping for all 33 columns |
| 8 | Respond 200 | Respond to Webhook | HTTP 200 always for payload outcomes. Valid: `{ "ok": true }`. Invalid/skipped: `{ "ok": false, "skipped": true, "errors": [...] }` |
| 9 | Notify Failure | HTTP Request, optional | Alert if Sheets append fails after retries |

## Cursor Tasks

- Maintain sandbox-only rehearsal files.
- Generate sample payloads and expected Sheet rows.
- Run local contract tests.
- Document blockers and production checklist.
- Do not POST to external webhook without explicit approval and returned sandbox values.

## Web AI Tasks

- Create sandbox Google Sheet with the canonical 33-column header row.
- Share the Sheet with the Google service account as Editor.
- Build/publish the WF3 n8n workflow from the node list.
- Return webhook URL, Sheet ID, tab name, and workflow name to Cursor.
- Verify rows in Google Sheets after approved test payloads.

## External Setup Instructions

1. Create a sandbox Google Sheet named `App Validation - WF3 Sandbox`.
2. Keep or rename the first tab to `Sheet1`.
3. Paste the 33 canonical headers in row 1 (see `EXTERNAL-SETUP-HANDOFF.md`).
4. Share with `app-validation-sa@app-validation-501106.iam.gserviceaccount.com` as Editor.
5. Build the WF3 n8n workflow using the node list above.
6. Use `webhookAuthSecret: null` for v1 sandbox unless explicitly testing auth.
7. Return the values listed in `EXTERNAL-SETUP-HANDOFF.md` §B.

## Production Implementation Checklist

- [ ] Shared validation and row mapping are extracted or duplicated with tests.
- [ ] Google Sheets append retries are configured.
- [ ] Alert path is configured or explicitly deferred.
- [ ] All malformed payloads return HTTP 200 with `{ "ok": false, "skipped": true, "errors": [...] }` except invalid auth.
- [ ] Auth secret, if enabled, lives only in n8n Credentials/env.
- [ ] WF3 does not write `app.json`.
- [ ] WF3 does not change author `ads` fields.
- [ ] Landing generates `eventId` and persists UTMs + `fbclid`.
- [ ] n8n always sets `receivedAt` and falls back `eventId` / `consentStatus`.
- [ ] Meta Sheet columns remain blank until WF4 populates them.
- [ ] WF-Decision can filter rows by `appId`, `experimentRunId`, and `eventType`.
