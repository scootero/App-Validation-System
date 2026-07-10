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
| Sandbox Google Sheet created | Blocked | Needs `GOOGLE_SHEET_ID_SANDBOX` |
| Google SA has Sheet Editor access | Blocked | Needs user/web AI setup |
| WF3 n8n workflow built | Blocked | Needs n8n setup |
| Sandbox webhook URL returned | Blocked | Needs WF3/WF0 setup |
| Direct `page_view` POST appends row | Blocked | Needs webhook + Sheet |
| Direct `email_captured` POST appends row | Blocked | Needs webhook + Sheet |
| Direct `buy_now_clicked` POST appends row | Blocked | Needs webhook + Sheet |
| Direct `mockup_interacted` POST appends row | Blocked | Needs webhook + Sheet |
| Browser E2E from sandbox landing | Blocked | Needs webhook embedded by WF2 re-transform/redeploy |

## Approval Status

- No production assets modified.
- No external webhook POST sent.
- No production Sheet touched.
- No n8n workflow modified by Cursor.
- WF4 remains dry-run only.

## Exact n8n Node List

1. Landing Event Webhook — Webhook POST.
2. Workflow Config — Set.
3. Validate Auth — Code.
4. Validate Payload — Code.
5. Map To Sheet Row — Code (`receivedAt`, `eventId` fallback, consent/meta defaults).
6. Route Valid Events — IF (`_skipAppend` → skip Append).
7. Append Row — Google Sheets (33 columns).
8. Respond 200 — Respond to Webhook.
9. Notify Failure — optional HTTP Request.
