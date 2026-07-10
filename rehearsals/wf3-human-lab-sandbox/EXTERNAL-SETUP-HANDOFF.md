# WF3 External Setup Handoff Package

**Audience:** Web AI agent (or human operator) creating the sandbox Google Sheet and n8n WF3 workflow.  
**Scope:** Sandbox only. Do not touch production Sheets, Drive, Meta, `landing-template/`, or production n8n docs.  
**Canonical for external setup:** This file. `EXTERNAL-SETUP-PACKAGE.md` mirrors it and points here.  
**Operator summary:** [`FINAL-IMPLEMENTATION-HANDOFF.md`](./FINAL-IMPLEMENTATION-HANDOFF.md) (order of ops, roles, live rehearsal steps).

> **WF3 event contract is frozen and ready for external implementation.**

Do not create the Sheet or n8n workflow from any older 25-column package.

---

## A. Everything To Create / Configure

### A1. Google Spreadsheet

| Item | Exact value |
|------|-------------|
| Spreadsheet name | `App Validation - WF3 Sandbox` |
| Tab name | `Sheet1` |
| Header row | Row 1, columns A–AG, **33** headers, exact names and order below |
| Share with | `app-validation-sa@app-validation-501106.iam.gserviceaccount.com` |
| Share role | **Editor** |

**Exact ordered headers (TSV — paste into A1):**

```
timestamp	eventType	appId	appName	experimentId	experimentRunId	projectId	deploymentId	landingVersion	landingVariantId	mockupVersionId	campaignName	visitorId	sessionId	email	price	pageUrl	referrer	utmSource	utmMedium	utmCampaign	utmContent	utmTerm	timeOnPageSeconds	mockupInteracted	eventId	receivedAt	fbclid	consentStatus	metaCampaignId	metaAdSetId	metaAdId	placement
```

Do not rename, reorder, insert, or delete columns. Total: **33**.

### A2. n8n Workflow

| Item | Exact value |
|------|-------------|
| Workflow name | `WF3 - Tracking Sandbox` |
| Active | **Yes** (production webhook URL required) |
| Google credential type | Google Service Account |
| Google credential label | `Google Service Account` (reuse existing if present) |
| Webhook method | `POST` |
| Webhook path | `app-validation/human-lab-wf1-sandbox-events` |
| Webhook response mode | Using **Respond to Webhook** node |
| Auth (v1 sandbox) | `webhookAuthSecret: null` — no Bearer required |

### A3. Exact Node Sequence And Settings

| # | Node name | Type | Settings |
|---|-----------|------|----------|
| 1 | Landing Event Webhook | Webhook | Method `POST`. Path `app-validation/human-lab-wf1-sandbox-events`. Response mode: Using 'Respond to Webhook' node. JSON body. |
| 2 | Workflow Config | Set | `googleSheetId` = sandbox spreadsheet ID; `googleSheetTabName` = `Sheet1`; `webhookAuthSecret` = `null`. |
| 3 | Validate Auth | Code | If secret null/empty → pass. Else require `Authorization: Bearer <secret>`; on fail → Respond 401 and stop. |
| 4 | Validate Payload | Code | Require `eventType`, `appId`, `appName`, `experimentId`, `experimentRunId`, `timestamp`. Allow only `page_view`, `email_captured`, `buy_now_clicked`, `mockup_interacted`. On fail: set `_validationFailed: true` (do **not** HTTP 400). |
| 5 | Map To Sheet Row | Code | Map to 33 columns. Always set `receivedAt` = now ISO (ignore client). If `eventId` missing/empty → UUID. If `consentStatus` missing/empty → `unknown`. Meta fields default `""`. Optional strings → `""`; `timeOnPageSeconds` → `0`; `mockupInteracted` → `false`. If `_validationFailed` → set `_skipAppend: true`. |
| 6 | Route Valid Events | IF | True when `_skipAppend` is not true → Append Row. False → Respond 200 (skip Sheets). |
| 7 | Append Row | Google Sheets | Credential: `Google Service Account`. Operation: Append. Document by ID from Config. Sheet: `Sheet1`. Map all **33** columns. Retry on fail: **3×**. |
| 8 | Respond 200 | Respond to Webhook | Status `200`. Body `{ "ok": true }`. |
| 9 | Notify Failure | HTTP Request (optional) | Only if Append fails after retries. Skip for first sandbox proof. |

**Wiring:** `1 → 2 → 3 → 4 → 5 → 6`. IF true → `7 → 8`. IF false → `8`. Optional: Append error → `9 → 8`.

### A4. Reference Code (Validate Auth)

```javascript
const secret = $json.webhookAuthSecret;
const headers = $node["Landing Event Webhook"].json.headers || {};
const auth = headers.authorization || headers.Authorization || "";

if (!secret) {
  return [{ json: $json }];
}

if (auth !== `Bearer ${secret}`) {
  throw new Error("UNAUTHORIZED");
}

return [{ json: $json }];
```

Prefer a dedicated Respond-to-Webhook **401** branch when auth is later enabled; for v1 sandbox secret is null.

### A5. Reference Code (Validate Payload)

```javascript
const body = $json.body || $json;
const allowed = new Set([
  "page_view",
  "email_captured",
  "buy_now_clicked",
  "mockup_interacted",
]);
const required = [
  "eventType",
  "appId",
  "appName",
  "experimentId",
  "experimentRunId",
  "timestamp",
];

const missing = required.filter((k) => body[k] === undefined || body[k] === null || body[k] === "");
const invalidType = !allowed.has(body.eventType);

return [{
  json: {
    ...body,
    _validationFailed: Boolean(missing.length || invalidType),
    _validationErrors: [
      ...(missing.length ? [`missing: ${missing.join(",")}`] : []),
      ...(invalidType ? [`invalid eventType: ${body.eventType}`] : []),
    ],
  },
}];
```

### A6. Reference Code (Map To Sheet Row)

```javascript
const p = $json;
const columns = [
  "timestamp","eventType","appId","appName","experimentId","experimentRunId",
  "projectId","deploymentId","landingVersion","landingVariantId","mockupVersionId",
  "campaignName","visitorId","sessionId","email","price","pageUrl","referrer",
  "utmSource","utmMedium","utmCampaign","utmContent","utmTerm",
  "timeOnPageSeconds","mockupInteracted",
  "eventId","receivedAt","fbclid","consentStatus",
  "metaCampaignId","metaAdSetId","metaAdId","placement",
];

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const receivedAt = new Date().toISOString();
const row = {};

for (const c of columns) {
  if (c === "receivedAt") {
    row[c] = receivedAt;
    continue;
  }
  if (c === "eventId") {
    row[c] = p.eventId ? p.eventId : uuid();
    continue;
  }
  if (c === "consentStatus") {
    row[c] = p.consentStatus ? p.consentStatus : "unknown";
    continue;
  }
  if (["metaCampaignId","metaAdSetId","metaAdId","placement"].includes(c)) {
    row[c] = p[c] == null ? "" : p[c];
    continue;
  }
  if (p[c] === undefined || p[c] === null) {
    row[c] = c === "timeOnPageSeconds" ? 0 : c === "mockupInteracted" ? false : "";
  } else {
    row[c] = p[c];
  }
}

if (p._validationFailed) {
  return [{ json: { ...row, _skipAppend: true } }];
}

return [{ json: row }];
```

### A7. Field Ownership (Do Not Change)

| Field | Owner |
|-------|--------|
| `eventId` | Landing generates; n8n fallback if missing |
| `receivedAt` | Always n8n at webhook receive |
| `fbclid` + UTMs | Landing captures first load, persists, includes every event |
| `consentStatus` | Default `unknown` |
| `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement` | Blank until WF4 |
| `app.json` | WF3 does **not** write `app.json` |

---

## B. Every Value To Return

Fill and send back this block (no secrets):

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

## C. Exact Test Payloads And Expected Sheet Rows

Use **one event body per request**. Do not POST until Cursor has §B values and the user explicitly approves external POSTs.

Shared on every event:

- `fbclid`: `IwAR0_rehearsal_fbclid_001`
- `consentStatus`: `unknown`
- Meta fields: `""`
- Client omits `receivedAt` (n8n sets it)

### C1. `page_view`

```json
{
  "eventType": "page_view",
  "appId": "human-lab-wf1-sandbox",
  "appName": "Human Lab",
  "experimentId": "exp_human-lab_2026q2_001",
  "experimentRunId": "run_human-lab_2026q2_001",
  "projectId": "proj_human-lab",
  "deploymentId": "prj_9gbSkYZTlRMF3iLVxOIM40OswVMU",
  "landingVersion": "2026-07-10T07:53:46Z",
  "landingVariantId": "v1",
  "mockupVersionId": "v1",
  "campaignName": "human-lab-validation",
  "visitorId": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "email": "",
  "price": "",
  "pageUrl": "https://human-lab-wf2-sandbox.vercel.app/?utm_source=rehearsal&utm_medium=sandbox&utm_campaign=wf3-test&fbclid=IwAR0_rehearsal_fbclid_001",
  "referrer": "https://facebook.com/",
  "utmSource": "rehearsal",
  "utmMedium": "sandbox",
  "utmCampaign": "wf3-test",
  "utmContent": "",
  "utmTerm": "",
  "timeOnPageSeconds": 0,
  "mockupInteracted": false,
  "timestamp": "2026-07-10T12:00:00.000Z",
  "eventId": "evt_page_view_550e8400-e29b-41d4-a716-446655440001",
  "fbclid": "IwAR0_rehearsal_fbclid_001",
  "consentStatus": "unknown",
  "metaCampaignId": "",
  "metaAdSetId": "",
  "metaAdId": "",
  "placement": ""
}
```

### C2. Event-specific deltas

| eventType | email | price | timeOnPageSeconds | mockupInteracted | timestamp | eventId |
|-----------|-------|-------|-------------------|------------------|-----------|---------|
| `email_captured` | `wf3-rehearsal+email@example.com` | `""` | `45` | `false` | `2026-07-10T12:00:45.000Z` | `evt_email_captured_550e8400-e29b-41d4-a716-446655440002` |
| `buy_now_clicked` | `wf3-rehearsal+buy@example.com` | `$6.99` | `62` | `true` | `2026-07-10T12:01:02.000Z` | `evt_buy_now_clicked_550e8400-e29b-41d4-a716-446655440003` |
| `mockup_interacted` | `""` | `""` | `18` | `true` | `2026-07-10T12:00:18.000Z` | `evt_mockup_interacted_550e8400-e29b-41d4-a716-446655440004` |

Full fixtures: `fixtures/wf3-payloads.json`. Full expected row arrays: `fixtures/expected-sheet-rows.json`.

### C3. Expected Sheet row checks (every row)

- `appId` = `human-lab-wf1-sandbox`
- `appName` = `Human Lab`
- `experimentId` = `exp_human-lab_2026q2_001`
- `experimentRunId` = `run_human-lab_2026q2_001`
- `utmSource` / `utmMedium` / `utmCampaign` = `rehearsal` / `sandbox` / `wf3-test`
- `fbclid` = `IwAR0_rehearsal_fbclid_001`
- `consentStatus` = `unknown`
- `eventId` = fixture value above (non-empty)
- `receivedAt` = ISO set by n8n (not necessarily equal to client `timestamp`)
- Meta columns empty
- Column count = 33

### C4. Example curl (only after approval)

```bash
curl -X POST "https://scooter.app.n8n.cloud/webhook/app-validation/human-lab-wf1-sandbox-events" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"page_view", ... }'
```

---

## D. Exact Verification Steps

1. Confirm Sheet header row matches the **33** columns in §A1 exactly.
2. Confirm workflow **Active** and webhook URL matches §B.
3. POST `page_view` → HTTP `200` and `{ "ok": true }`.
4. POST `email_captured` → same.
5. POST `buy_now_clicked` → same.
6. POST `mockup_interacted` → same.
7. Open `Sheet1` → **4 new rows** (one per event).
8. Confirm `experimentRunId` = `run_human-lab_2026q2_001` on each row.
9. Confirm `appId` = `human-lab-wf1-sandbox` on each row.
10. Confirm non-empty `eventId` and non-empty `receivedAt` on each row.
11. Confirm `fbclid` and `consentStatus` as in §C3.
12. Confirm Meta columns blank.
13. Confirm production Sheet / Drive / Meta were not touched.
14. Confirm WF3 did not write `app.json`.

**Pass criteria:** Four HTTP 200s within ~2s; four correct Sheet rows; 33 columns; Meta blank; no production edits; WF4 not activated.

---

## E. Copy-Paste Prompt For Web AI Agent

```text
You are setting up the App Validation System WF3 sandbox (tracking webhook → Google Sheets). Sandbox only — do NOT touch production Sheets, Drive, Meta, landing-template, or production n8n docs.

FROZEN CONTRACT: WF3 event contract is frozen and ready for external implementation. Use the 33-column schema only (not any older 25-column package).

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

## Related Sandbox Artifacts

| File | Role |
|------|------|
| `contract.md` | Frozen event contract |
| `EXTERNAL-SETUP-PACKAGE.md` | Mirror / pointer to this handoff |
| `fixtures/wf3-payloads.json` | Full test payloads |
| `fixtures/expected-sheet-rows.json` | Expected normalized rows |
| `scripts/wf3-rehearse.js` | Local contract verifier (passed) |
