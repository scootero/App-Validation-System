# WF3 Rehearsal — `human-lab-wf1-sandbox`

**Status:** Local contract **frozen** (33 columns). External sandbox proof pending Sheet + n8n values from web AI.  
**Freeze:** WF3 event contract is frozen and ready for external implementation.  
**Handoff:** [`FINAL-IMPLEMENTATION-HANDOFF.md`](./FINAL-IMPLEMENTATION-HANDOFF.md) · [`EXTERNAL-SETUP-HANDOFF.md`](./EXTERNAL-SETUP-HANDOFF.md)  
**Scope:** Sandbox only. Do not modify production Drive, production Google Sheets, production n8n workflows, production `landing-template`, or production app packages.

## Goal

Prove the WF3 flow:

```txt
Landing page event
-> n8n webhook
-> validation/authentication
-> normalized event (receivedAt, eventId fallback, consent/meta defaults)
-> Google Sheets row (33 columns)
```

Required events:

- `page_view`
- `email_captured`
- `buy_now_clicked`
- `mockup_interacted`

## Proven Locally

- Canonical event Sheet row has **33** fields (25 original + 8 expansion fields).
- Landing generates `eventId`, persists UTMs + `fbclid`, sends `consentStatus: unknown`.
- n8n mapping always sets `receivedAt`; falls back `eventId` / `consentStatus`; leaves Meta columns blank.
- Invalid payloads are flagged and routed around Append (still HTTP 200).
- Each required event can be represented as a normalized Sheet row.
- No new `app.json` fields are required for WF3 v1.
- `node scripts/wf3-rehearse.js` passes.

## Remaining Blockers

- Sandbox Google Sheet ID and tab must be created/returned with **33** headers.
- WF3 n8n workflow must be built/published in sandbox.
- `tracking.webhookUrl` must be provisioned by WF0 or manually stubbed in sandbox fixtures.
- WF2 sandbox landing must be re-transformed/redeployed with the sandbox webhook before browser E2E.
- Production `landing-template` sync of attribution/`eventId` is deferred to Spec 1.5.0 (sandbox landing already updated).
- No external webhook POST has been sent by Cursor in this rehearsal.

## Files

| File | Purpose |
|------|---------|
| `contract.md` | Frozen event contract, Google Sheets schema, n8n node plan |
| `FINAL-IMPLEMENTATION-HANDOFF.md` | **Final operator handoff** (resources, roles, live steps, web AI prompt) |
| `EXTERNAL-SETUP-HANDOFF.md` | Full web AI handoff (node code, payloads, verification) |
| `EXTERNAL-SETUP-PACKAGE.md` | Compact mirror; points to EXTERNAL-SETUP-HANDOFF |
| `scripts/wf3-rehearse.js` | Local validation of payload fixtures and normalized rows |
| `execution-log.md` | Local/external rehearsal checklist and evidence |
| `notes/gap-analysis.md` | Gaps, recommendations, and blockers |
| `external-setup-guide.md` | Short setup guide |
| `production-implementation-checklist.md` | Final production criteria |
| `fixtures/wf3-payloads.json` | Four canonical event payloads |
| `fixtures/expected-sheet-rows.json` | Expected normalized row arrays |

## Definition Of Done

- Local rehearsal passes.
- Sandbox external rehearsal passes.
- Inputs/outputs are documented.
- `app.json` contract is finalized.
- Required n8n nodes are identified.
- Manual setup steps are documented.
- No production assets were modified.
