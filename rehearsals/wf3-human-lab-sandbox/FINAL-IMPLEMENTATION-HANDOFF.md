# WF3 Final Implementation Handoff

**Status:** Frozen for external Sheet + n8n setup.  
**Canonical companion:** [`EXTERNAL-SETUP-HANDOFF.md`](./EXTERNAL-SETUP-HANDOFF.md) (node code, full payloads, web AI prompt).  
**Scope:** Sandbox only. No production Sheets, Drive, Meta, `landing-template/`, or production n8n docs.

> **WF3 is frozen and ready for external implementation.**

Nothing is missing for the next step (create sandbox Sheet + n8n workflow and return §2 values). Browser E2E (WF0 webhook embed + WF2 redeploy) is a **later** step after curl proof — not a blocker for this handoff.

---

## 1. External Resources To Create Or Configure

| Resource | Exact configuration |
|----------|---------------------|
| Google Spreadsheet | Name: `App Validation - WF3 Sandbox` |
| Sheet tab | `Sheet1` |
| Header row | Row 1, **33** columns, exact TSV below |
| Sheet sharing | `app-validation-sa@app-validation-501106.iam.gserviceaccount.com` as **Editor** |
| GCP / Sheets API | Already assumed enabled for project `app-validation-501106` |
| n8n Google credential | Type: Google Service Account. Label: `Google Service Account` (reuse if present) |
| n8n workflow | Name: `WF3 - Tracking Sandbox`. **Active: Yes** |
| Webhook | Method `POST`. Path: `app-validation/human-lab-wf1-sandbox-events`. Response mode: Using **Respond to Webhook** node |
| Auth (v1) | Config Set `webhookAuthSecret: null` (no Bearer) |
| Optional alert | Skip for first proof (`ALERT_WEBHOOK_URL: null`) |

**Exact ordered headers (paste into A1):**

```
timestamp	eventType	appId	appName	experimentId	experimentRunId	projectId	deploymentId	landingVersion	landingVariantId	mockupVersionId	campaignName	visitorId	sessionId	email	price	pageUrl	referrer	utmSource	utmMedium	utmCampaign	utmContent	utmTerm	timeOnPageSeconds	mockupInteracted	eventId	receivedAt	fbclid	consentStatus	metaCampaignId	metaAdSetId	metaAdId	placement
```

Do not rename, reorder, insert, or delete columns.

---

## 2. Values To Return To Cursor After Setup

```yaml
GOOGLE_SHEET_ID_SANDBOX: "<spreadsheet-id-from-url>"
GOOGLE_SHEET_TAB_NAME: "Sheet1"
GOOGLE_SHEET_URL: "https://docs.google.com/spreadsheets/d/<spreadsheet-id>/edit#gid=0"
GOOGLE_SHEET_COLUMN_COUNT: 33
GOOGLE_SERVICE_ACCOUNT_EMAIL: "app-validation-sa@app-validation-501106.iam.gserviceaccount.com"
N8N_CREDENTIAL_GOOGLE_SA_LABEL: "Google Service Account"
N8N_BASE_URL: "https://scooter.app.n8n.cloud"
WF3_WEBHOOK_URL_SANDBOX: "https://scooter.app.n8n.cloud/webhook/app-validation/human-lab-wf1-sandbox-events"
WF3_WEBHOOK_AUTH_SECRET: null
SANDBOX_APP_ID: "human-lab-wf1-sandbox"
SANDBOX_EXPERIMENT_RUN_ID: "run_human-lab_2026q2_001"
SANDBOX_LANDING_URL: "https://human-lab-wf2-sandbox.vercel.app"
WF3_WORKFLOW_NAME: "WF3 - Tracking Sandbox"
WF3_WORKFLOW_ACTIVE: true
ALERT_WEBHOOK_URL: null
```

**Do not return:** service account JSON, n8n API keys, Vercel tokens, Meta tokens.

---

## 3. WF3 Order Of Operations

1. **Visitor lands** on the landing page (with optional `utm_*` / `fbclid` in the URL).
2. **Landing captures** UTMs + `fbclid` (persist for session/visitor), generates `visitorId` / `sessionId`, and builds a tracking payload with a unique `eventId`.
3. **Event generated** — one of: `page_view`, `email_captured`, `buy_now_clicked`, `mockup_interacted`.
4. **Landing POSTs** JSON to `tracking.webhookUrl` (`Content-Type: application/json`).
5. **n8n Webhook** receives the request.
6. **Auth** — skipped when `webhookAuthSecret` is null; otherwise Bearer check (401 on fail).
7. **Validation** — required fields + allowed `eventType`; invalid → flag `_validationFailed` (still aim for HTTP 200).
8. **Normalization** — map to 33 columns; always set `receivedAt`; fallback `eventId`; default `consentStatus` → `unknown`; Meta columns blank.
9. **Route** — if `_skipAppend`, skip Sheets; else continue.
10. **Google Sheets Append** — write one row to `Sheet1` (retry 3× on failure).
11. **Response** — HTTP `200` with `{ "ok": true }` to the client.
12. **Verification** — confirm four rows (after live rehearsal) match expected fields.

```txt
Visitor lands
  → event generated (landing)
  → n8n webhook
  → auth (optional)
  → validation
  → normalization (+ receivedAt)
  → route valid / skip invalid append
  → Google Sheets append
  → HTTP 200 response
  → human/Cursor verification
```

---

## 4. Exact n8n Node Order

| # | Node | Type |
|---|------|------|
| 1 | Landing Event Webhook | Webhook POST |
| 2 | Workflow Config | Set (`googleSheetId`, `googleSheetTabName=Sheet1`, `webhookAuthSecret=null`) |
| 3 | Validate Auth | Code |
| 4 | Validate Payload | Code |
| 5 | Map To Sheet Row | Code |
| 6 | Route Valid Events | IF (`_skipAppend` → skip Append) |
| 7 | Append Row | Google Sheets Append (33 cols, retry 3×) |
| 8 | Respond 200 | Respond to Webhook `{ "ok": true }` |
| 9 | Notify Failure | HTTP Request (optional; skip for first proof) |

**Wiring:** `1 → 2 → 3 → 4 → 5 → 6`. IF true → `7 → 8`. IF false → `8`. Optional: Append error → `9 → 8`.

Reference Code nodes: see [`EXTERNAL-SETUP-HANDOFF.md`](./EXTERNAL-SETUP-HANDOFF.md) §§A4–A6.

---

## 5. Four Live Rehearsal Steps And Expected Results

Run **only after** §2 values are returned and the user explicitly approves external POSTs. One payload per request. Full JSON: `fixtures/wf3-payloads.json`.

| Step | Action | Expected HTTP | Expected Sheet row highlights |
|------|--------|---------------|-------------------------------|
| 1 | POST `page_view` | `200` `{ "ok": true }` | `eventType=page_view`, email/price empty, `timeOnPageSeconds=0`, `mockupInteracted=false`, `eventId=evt_page_view_…001` |
| 2 | POST `email_captured` | `200` `{ "ok": true }` | email=`wf3-rehearsal+email@example.com`, price empty, `timeOnPageSeconds=45`, `eventId=evt_email_captured_…002` |
| 3 | POST `buy_now_clicked` | `200` `{ "ok": true }` | email=`wf3-rehearsal+buy@example.com`, price=`$6.99`, `timeOnPageSeconds=62`, `mockupInteracted=true`, `eventId=evt_buy_now_clicked_…003` |
| 4 | POST `mockup_interacted` | `200` `{ "ok": true }` | email/price empty, `timeOnPageSeconds=18`, `mockupInteracted=true`, `eventId=evt_mockup_interacted_…004` |

**Every row must also have:**

- `appId` = `human-lab-wf1-sandbox`
- `experimentRunId` = `run_human-lab_2026q2_001`
- `utmSource` / `utmMedium` / `utmCampaign` = `rehearsal` / `sandbox` / `wf3-test`
- `fbclid` = `IwAR0_rehearsal_fbclid_001`
- `consentStatus` = `unknown`
- non-empty `receivedAt` (n8n-generated ISO)
- Meta columns (`metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement`) blank
- **33** columns total

---

## 6. What Cursor Will Verify After Setup

After §2 values are returned (and only after approved POSTs):

1. Returned webhook URL matches expected path pattern.
2. Workflow reported `WF3_WORKFLOW_ACTIVE: true`.
3. Sheet ID/URL/tab and column count `33` are present.
4. Each of the four POSTs returns HTTP 200 within ~2s.
5. Sheet has exactly four new rows for the four event types.
6. Shared identity/attribution fields match fixtures (`appId`, `experimentRunId`, UTMs, `fbclid`, `consentStatus`).
7. Each row has non-empty `eventId` and `receivedAt`.
8. Meta columns remain blank.
9. No Drive `app.json` write from WF3.
10. No production Sheet / Drive / Meta / landing-template changes.
11. Update `external-proof-status.md` / `execution-log.md` with pass/fail evidence.

Cursor will **not** POST until you approve. Cursor will **not** create the Sheet or n8n workflow in this phase (web AI / manual does that).

---

## 7. Responsibility Separation

| Who | Does what **today** |
|-----|---------------------|
| **Manual (you)** | Approve external setup; approve live POSTs; confirm Sheet rows visually if desired; decide when to proceed to WF0/WF2 browser E2E |
| **Web AI agent** | Create sandbox Spreadsheet + 33 headers; share with SA; build/activate n8n WF3 workflow; wire nodes/code; return §2 YAML |
| **Cursor** | Owns frozen contract + fixtures + local rehearsal; prepares curl payloads after §2; runs approved POSTs; verifies responses/rows; updates sandbox proof logs; does **not** modify production |
| **Final n8n workflow (automated)** | Receive webhook → auth → validate → normalize (`receivedAt` / `eventId` / consent / Meta defaults) → route → Sheets append (retry) → HTTP 200; optional failure alert |

**Later (not this handoff):**

| Who | Later step |
|-----|------------|
| Web AI / WF0 | Provision `tracking.webhookUrl` into sandbox `app.json` |
| Cursor / WF2 | Re-transform/redeploy sandbox landing with webhook for browser E2E |
| Spec 1.5.0 | Sync production `landing-template` attribution/`eventId` behavior |

**WF3 vs WF4:** WF3 owns event capture → Sheet rows. WF4 (dry-run) later may populate Meta Sheet columns and `ads.meta.*` in `app.json`. WF3 never writes `app.json` or creates Meta ads.

---

## 8. Copy-Paste Prompt For Web AI Agent

```text
You are setting up the App Validation System WF3 sandbox (tracking webhook → Google Sheets). Sandbox only — do NOT touch production Sheets, Drive, Meta, landing-template, or production n8n docs.

FROZEN: WF3 is frozen and ready for external implementation. Use the 33-column schema only (not any older 25-column package).

CREATE / CONFIGURE:

1) Google Spreadsheet
- Name: App Validation - WF3 Sandbox
- Tab: Sheet1
- Paste this exact header row into A1 (33 columns, TSV):

timestamp	eventType	appId	appName	experimentId	experimentRunId	projectId	deploymentId	landingVersion	landingVariantId	mockupVersionId	campaignName	visitorId	sessionId	email	price	pageUrl	referrer	utmSource	utmMedium	utmCampaign	utmContent	utmTerm	timeOnPageSeconds	mockupInteracted	eventId	receivedAt	fbclid	consentStatus	metaCampaignId	metaAdSetId	metaAdId	placement

- Share as Editor with: app-validation-sa@app-validation-501106.iam.gserviceaccount.com

2) n8n workflow
- Name: WF3 - Tracking Sandbox
- Activate: Yes
- Google credential label: Google Service Account (reuse if exists)
- Webhook: POST path app-validation/human-lab-wf1-sandbox-events
- Response mode: Using Respond to Webhook node
- Auth: webhookAuthSecret = null (no Bearer required for v1 sandbox)

Node sequence (exact):
1. Landing Event Webhook (Webhook POST)
2. Workflow Config (Set: googleSheetId, googleSheetTabName=Sheet1, webhookAuthSecret=null)
3. Validate Auth (Code: skip if secret null; else Bearer check → 401)
4. Validate Payload (Code: require eventType, appId, appName, experimentId, experimentRunId, timestamp; allow only page_view, email_captured, buy_now_clicked, mockup_interacted; on fail set _validationFailed, still aim for HTTP 200)
5. Map To Sheet Row (Code: 33 columns; always set receivedAt=now ISO; eventId fallback UUID; consentStatus default unknown; meta*+placement default ""; if _validationFailed set _skipAppend)
6. Route Valid Events (IF: not _skipAppend → Append; else → Respond 200)
7. Append Row (Google Sheets Append, all 33 columns, retry 3×)
8. Respond 200 ({ "ok": true })
9. Notify Failure (optional; skip for first proof)

Field ownership:
- eventId: landing generates; n8n fallback if missing
- receivedAt: always n8n
- fbclid + UTMs: landing persists; include every event
- consentStatus: default unknown
- meta* + placement: blank until WF4
- WF3 does NOT write app.json

RETURN this YAML (no secrets):

GOOGLE_SHEET_ID_SANDBOX: "<id>"
GOOGLE_SHEET_TAB_NAME: "Sheet1"
GOOGLE_SHEET_URL: "https://docs.google.com/spreadsheets/d/<id>/edit#gid=0"
GOOGLE_SHEET_COLUMN_COUNT: 33
GOOGLE_SERVICE_ACCOUNT_EMAIL: "app-validation-sa@app-validation-501106.iam.gserviceaccount.com"
N8N_CREDENTIAL_GOOGLE_SA_LABEL: "Google Service Account"
N8N_BASE_URL: "https://scooter.app.n8n.cloud"
WF3_WEBHOOK_URL_SANDBOX: "https://scooter.app.n8n.cloud/webhook/app-validation/human-lab-wf1-sandbox-events"
WF3_WEBHOOK_AUTH_SECRET: null
SANDBOX_APP_ID: "human-lab-wf1-sandbox"
SANDBOX_EXPERIMENT_RUN_ID: "run_human-lab_2026q2_001"
SANDBOX_LANDING_URL: "https://human-lab-wf2-sandbox.vercel.app"
WF3_WORKFLOW_NAME: "WF3 - Tracking Sandbox"
WF3_WORKFLOW_ACTIVE: true
ALERT_WEBHOOK_URL: null

Do NOT return service account JSON, n8n API keys, Vercel tokens, or Meta tokens.
Do NOT send test POSTs unless I explicitly ask; Cursor will run approved curls after your return values.
After setup, confirm header count is 33 and the workflow is Active.
```

---

## Missing Before External Implementation?

**None for Sheet + n8n setup.**

Deferred (after curl proof, not blockers for this handoff):

- WF0 provision of sandbox `tracking.webhookUrl`
- WF2 re-transform/redeploy for browser E2E
- Production `landing-template` sync (Spec 1.5.0)
- WF4 Meta population of Sheet Meta columns (dry-run until WF3 proven)

---

## Related Files

| File | Role |
|------|------|
| [`EXTERNAL-SETUP-HANDOFF.md`](./EXTERNAL-SETUP-HANDOFF.md) | Full node code + payloads + verification |
| [`contract.md`](./contract.md) | Frozen event contract |
| [`fixtures/wf3-payloads.json`](./fixtures/wf3-payloads.json) | Four test payloads |
| [`fixtures/expected-sheet-rows.json`](./fixtures/expected-sheet-rows.json) | Expected 33-col rows |
| [`scripts/wf3-rehearse.js`](./scripts/wf3-rehearse.js) | Local verifier (passed) |
