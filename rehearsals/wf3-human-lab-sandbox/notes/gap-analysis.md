# WF3 Gap Analysis

## Proven Behavior

- Landing tracking payload shape is stable and documented (sandbox landing includes `eventId`, persisted UTMs/`fbclid`, `consentStatus`).
- Required event names are canonical: `page_view`, `email_captured`, `buy_now_clicked`, `mockup_interacted`.
- Sheet schema is **33 columns** (25 original + `eventId`, `receivedAt`, `fbclid`, `consentStatus`, `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement`).
- Existing Spec 1.5.0 `app.json` fields support WF3 without schema changes.
- WF3 should append runtime rows only and should not write `app.json`.
- Meta Sheet columns are reserved and remain blank until WF4.
- **Contract freeze:** WF3 event contract is frozen and ready for external implementation (`EXTERNAL-SETUP-HANDOFF.md`).

## Remaining Blockers

| Priority | Gap | Reason | Dependency | Blocks? |
|----------|-----|--------|------------|---------|
| P0 | No sandbox WF3 n8n workflow | Cannot receive webhook POSTs or append Sheets rows | n8n build via handoff | Yes |
| P0 | No sandbox Sheet ID returned | Cannot verify external append | Google Sheets setup (33 headers) | Yes |
| P0 | `tracking.webhookUrl` not embedded in sandbox landing | Browser E2E cannot reach WF3 | WF0 or approved manual sandbox URL + WF2 re-transform | Yes |
| P1 | Production `landing-template` lacks attribution/`eventId` sync | Sandbox landing updated; production deferred | Spec 1.5.0 pass | No for sandbox |
| P1 | No WF3 AI builder prompt in production `n8n-workflows/` | Slows future workflow JSON creation | Final Spec pass | No |
| P1 | No shared row mapping snippet in production docs | Risk of drift between landing payload and n8n mapping | Final Spec update | No |
| P2 | Optional auth path not tested | Default v1 has no auth secret | `WEBHOOK_AUTH_SECRET` decision | No |

## Recommendations

- Keep WF3 external proof focused on the four canonical events and the **33-column** Sheet row order.
- Do not add `tracking.lastEventAt` for v1; record it as a future improvement only.
- Prefer a shared validation/map helper for future n8n Code nodes (`receivedAt`, `eventId` fallback, consent/meta defaults).
- Do not block WF3 on WF4/Meta requirements; leave Meta columns blank.
- Sync sandbox landing attribution/`eventId` into production `landing-template` only during Spec 1.5.0.

## Cursor Tasks

- Maintain this rehearsal folder.
- Run local payload/row tests.
- Prepare direct curl payloads only after sandbox webhook is returned.
- Update this log with external evidence after user approval.

## Web AI Tasks

- Create sandbox Google Sheet and configure service account access (33 headers).
- Build WF3 n8n workflow from `EXTERNAL-SETUP-HANDOFF.md`.
- Return sandbox values to Cursor (§B).
- Verify Sheet rows after approved tests.
