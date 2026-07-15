# WF3 Live Curl Rehearsal — Run 2 (confirmed)

**Posted at:** 2026-07-10T21:47:31Z  
**Run tag:** `mrfgv3h5`  
**Webhook:** `https://scottyo.app.n8n.cloud/webhook/app-validation/human-lab-wf1-sandbox-events`  
**Workflow ID:** `7G2fJmqKsr8CGVID`  
**Verdict:** **PASS** — WF3 sandbox path proven

## Checks

| Check | Result |
|-------|--------|
| HTTP 200 + `{ "ok": true }` × 4 | Pass |
| Exactly 4 rows appended this run | Pass (n8n exec 13–16 Append success) |
| 33 columns mapped | Pass |
| `eventId` + `receivedAt` populated | Pass |
| Meta fields blank | Pass |
| No Drive `app.json` / production changes | Pass |

## This-run eventIds

- `evt_page_view_live2_mrfgv3h5`
- `evt_email_captured_live2_mrfgv3h5`
- `evt_buy_now_clicked_live2_mrfgv3h5`
- `evt_mockup_interacted_live2_mrfgv3h5`

## n8n executions

| Exec | eventType | Append | receivedAt |
|------|-----------|--------|------------|
| 13 | page_view | success | 2026-07-10T21:47:32.665Z |
| 14 | email_captured | success | 2026-07-10T21:47:35.986Z |
| 15 | buy_now_clicked | success | 2026-07-10T21:47:39.004Z |
| 16 | mockup_interacted | success | 2026-07-10T21:47:41.812Z |

No workflow fixes required; no rerun needed.
