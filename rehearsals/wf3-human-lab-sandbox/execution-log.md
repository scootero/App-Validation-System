# WF3 Execution Log

## Contract Freeze

| Item | Detail |
|------|--------|
| Status | **Frozen** — ready for external implementation |
| Schema | **33 columns** (order locked) |
| Local verify | `node scripts/wf3-rehearse.js` → passed |
| Handoff | `EXTERNAL-SETUP-HANDOFF.md` |
| Freeze sentence | WF3 event contract is frozen and ready for external implementation. |

## Schema Bump

| Change | Detail |
|--------|--------|
| Prior schema | 25 columns |
| Current schema | **33 columns** |
| Added columns | `eventId`, `receivedAt`, `fbclid`, `consentStatus`, `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement` |
| Local re-proof | Passed after schema bump |
| External proof | Still blocked; no POSTs sent |

## Local Rehearsal

| Check | Status | Evidence |
|-------|--------|----------|
| Rehearsal folder exists | Passed | `rehearsals/wf3-human-lab-sandbox/` |
| Four payload fixtures exist | Passed | `fixtures/wf3-payloads.json` |
| Expected Sheet rows exist | Passed | `fixtures/expected-sheet-rows.json` |
| Local validator script exists | Passed | `scripts/wf3-rehearse.js` |
| Payloads include client fields (omit `receivedAt`) | Passed | `node scripts/wf3-rehearse.js` |
| Rows match canonical 33-column order | Passed | `node scripts/wf3-rehearse.js` |
| Sandbox landing attribution/`eventId` updated | Passed | `rehearsals/wf2-human-lab-sandbox/landing-project/lib/` |
| External handoff A–E complete | Passed | `EXTERNAL-SETUP-HANDOFF.md` |

Local re-proof output (33-column schema):

```json
{
  "status": "passed",
  "results": [
    { "eventType": "page_view", "columns": 33, "consentStatus": "unknown", "fbclid": "IwAR0_rehearsal_fbclid_001" },
    { "eventType": "email_captured", "columns": 33, "consentStatus": "unknown", "fbclid": "IwAR0_rehearsal_fbclid_001" },
    { "eventType": "buy_now_clicked", "columns": 33, "consentStatus": "unknown", "fbclid": "IwAR0_rehearsal_fbclid_001" },
    { "eventType": "mockup_interacted", "columns": 33, "consentStatus": "unknown", "fbclid": "IwAR0_rehearsal_fbclid_001" }
  ]
}
```

## External Sandbox Rehearsal

| Check | Status | Evidence |
|-------|--------|----------|
| Sandbox Google Sheet created | Passed | `1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0` |
| Google SA has Sheet Editor access | Passed | Shared with `app-validation-sa@...` |
| WF3 n8n workflow built | Passed | ID `7G2fJmqKsr8CGVID`, name `WF3 - Tracking Sandbox` |
| Sandbox webhook URL returned | Passed | `https://scottyo.app.n8n.cloud/webhook/app-validation/human-lab-wf1-sandbox-events` |
| Workflow active/published | Passed | `active=true` |
| Direct `page_view` POST appends row | **Passed** | HTTP 200; n8n exec 2 Append success |
| Direct `email_captured` POST appends row | **Passed** | HTTP 200; n8n exec 3 Append success |
| Direct `buy_now_clicked` POST appends row | **Passed** | HTTP 200; n8n exec 4 Append success |
| Direct `mockup_interacted` POST appends row | **Passed** | HTTP 200; n8n exec 5 Append success |
| Browser E2E from sandbox landing | Blocked | Needs webhook embedded by WF2 re-transform/redeploy |

Live report: `notes/live-rehearsal-report.md`

## Approval Status

- No production assets modified (sandbox Sheet + sandbox n8n workflow only).
- Four approved sandbox webhook POSTs sent and verified.
- No production Sheet touched.
- Sandbox n8n workflow created and published by Cursor via MCP.
- WF4 remains dry-run only.
- Host note: live n8n base is `scottyo.app.n8n.cloud` (not `scooter`).

## Exact n8n Node List

1. Landing Event Webhook — Webhook POST.
2. Workflow Config — Set.
3. Validate Auth — Code.
4. Validate Payload — Code.
5. Map To Sheet Row — Code (`receivedAt`, `eventId` fallback, consent/meta defaults).
6. Route Valid Events — IF (`_skipAppend` → skip Append).
7. Append Row — Google Sheets (33 columns, retry 3×).
8. Respond 200 — Respond to Webhook.
9. Notify Failure — omitted for first sandbox proof.

SDK source: `n8n/wf3-tracking-sandbox.workflow.ts`
