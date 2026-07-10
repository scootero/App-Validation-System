# WF3 External Setup Package (33-Column Schema)

> **WF3 event contract is frozen and ready for external implementation.**

**Canonical handoff for web AI agents:** [`EXTERNAL-SETUP-HANDOFF.md`](./EXTERNAL-SETUP-HANDOFF.md) (sections A–E, including copy-paste prompt).  
This file remains a compact mirror of the same frozen 33-column contract.

**Audience:** Web AI agent / human operator configuring sandbox Google Sheets + n8n.  
**Scope:** Sandbox only. Do not touch production Sheets, Drive, or Meta.  
**WF4:** Remains dry-run only. Meta Sheet columns stay blank.  
**Cursor:** Will not send live webhook POSTs until §7 values are returned and external POSTs are explicitly approved.

Do not create the Sheet or n8n workflow from an older 25-column package.

---

## 1. Exact Google Sheet Tab Name And 33 Column Headers

**Spreadsheet name:** `App Validation - WF3 Sandbox`  
**Tab name:** `Sheet1`  
**Header row (row 1), left to right, exact names (TSV):**

```
timestamp	eventType	appId	appName	experimentId	experimentRunId	projectId	deploymentId	landingVersion	landingVariantId	mockupVersionId	campaignName	visitorId	sessionId	email	price	pageUrl	referrer	utmSource	utmMedium	utmCampaign	utmContent	utmTerm	timeOnPageSeconds	mockupInteracted	eventId	receivedAt	fbclid	consentStatus	metaCampaignId	metaAdSetId	metaAdId	placement
```

Copy-paste into A1:AG1. Do not rename, reorder, or insert columns. Total: **33** columns.

---

## 2. Exact n8n Node Sequence And Settings

**Workflow name:** `WF3 - Tracking Sandbox`  
**Active:** Yes (production webhook URL)

| # | Node name | Type | Settings |
|---|-----------|------|----------|
| 1 | Landing Event Webhook | Webhook | Method: `POST`. Path: `app-validation/human-lab-wf1-sandbox-events`. Response mode: **Using 'Respond to Webhook' node**. Content type: JSON. |
| 2 | Workflow Config | Set | Assign: `googleSheetId` = sandbox spreadsheet ID; `googleSheetTabName` = `Sheet1`; `webhookAuthSecret` = `null`. |
| 3 | Validate Auth | Code | If `webhookAuthSecret` is null/empty → pass through. Else require `Authorization: Bearer <secret>`; on fail respond 401 and stop. |
| 4 | Validate Payload | Code | Require `eventType`, `appId`, `appName`, `experimentId`, `experimentRunId`, `timestamp`. Allow only `page_view`, `email_captured`, `buy_now_clicked`, `mockup_interacted`. On fail: set `_validationFailed: true` (do not 400). |
| 5 | Map To Sheet Row | Code | Map to 33 columns. Always set `receivedAt` = now ISO. If `eventId` missing → generate UUID. If `consentStatus` missing → `unknown`. Meta fields default `""`. Missing optional strings → `""`; missing `timeOnPageSeconds` → `0`; missing `mockupInteracted` → `false`. If `_validationFailed` → `_skipAppend: true`. |
| 6 | Route Valid Events | IF | True when `_skipAppend` is not true → Append Row. False → Respond 200 (skip Sheets). |
| 7 | Append Row | Google Sheets | Credential: Google Service Account. Operation: Append. Document: by ID from Config. Sheet: `Sheet1`. Map all **33** columns explicitly. Retry on fail: 3×. |
| 8 | Respond 200 | Respond to Webhook | Status: `200`. Body: `{ "ok": true }`. |
| 9 | Notify Failure | HTTP Request (optional) | Only if Sheets append fails after retries. Skip for first sandbox proof. |

**Wiring:** `1 → 2 → 3 → 4 → 5 → 6`. IF true → `7 → 8`. IF false → `8`. Optional Append error → `9 → 8`.

### Validate Auth Code (reference)

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

### Validate Payload Code (reference)

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

### Map To Sheet Row Code (reference)

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

If `_skipAppend` is true, Route Valid Events (IF) skips Append Row and goes to Respond 200.

---

## 3. Exact Webhook Path / Method

| Setting | Value |
|---------|-------|
| Method | `POST` |
| Content-Type | `application/json` |
| Path | `app-validation/human-lab-wf1-sandbox-events` |
| Expected production URL | `https://scooter.app.n8n.cloud/webhook/app-validation/human-lab-wf1-sandbox-events` |
| Body | Flat JSON event object (no wrapper) |

---

## 4. Exact Auth / Validation Approach

**Auth (v1 sandbox):**

- `webhookAuthSecret: null`
- No `Authorization` header required
- Do **not** store any auth secret in Drive `app.json`

**Payload validation:**

- Required: `eventType`, `appId`, `appName`, `experimentId`, `experimentRunId`, `timestamp`
- Allowed `eventType`: `page_view`, `email_captured`, `buy_now_clicked`, `mockup_interacted`
- `eventId` recommended from client; n8n generates fallback if missing
- `receivedAt` always set by n8n (ignore any client value)
- `consentStatus` defaults to `unknown` if missing
- Meta columns default to blank until WF4
- Malformed / unknown type: log, **still HTTP 200**
- Invalid Bearer (only if secret later enabled): **HTTP 401**
- Sheets append failure: retry 3×, alert if configured, still HTTP 200 to client

---

## 5. Exact Google Sheets Credential / Setup Requirements

| Item | Value |
|------|-------|
| Spreadsheet | New sandbox sheet only — not production event log |
| Tab | `Sheet1` |
| Headers | **33** columns from §1 |
| Service account email | `app-validation-sa@app-validation-501106.iam.gserviceaccount.com` |
| Share permission | **Editor** |
| n8n credential type | Google Service Account |
| n8n credential label | `Google Service Account` (reuse existing if already configured) |
| Sheets API | Enabled in GCP project `app-validation-501106` |
| Config Set | `googleSheetId` = sandbox ID; `googleSheetTabName` = `Sheet1` |

Do not put the service account JSON in chat or repo files.

---

## 6. Exact Test Payloads (All Four Events)

Use one event body per request. Do not POST until Cursor has §7 values and you approve external POSTs.

Shared attribution on every event:

- `fbclid`: `IwAR0_rehearsal_fbclid_001`
- `consentStatus`: `unknown`
- `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement`: `""`
- Client payloads omit `receivedAt` (n8n sets it)

### `page_view`

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

### `email_captured`

Same shared fields, with:

- `eventType`: `"email_captured"`
- `email`: `"wf3-rehearsal+email@example.com"`
- `price`: `""`
- `timeOnPageSeconds`: `45`
- `mockupInteracted`: `false`
- `timestamp`: `"2026-07-10T12:00:45.000Z"`
- `eventId`: `"evt_email_captured_550e8400-e29b-41d4-a716-446655440002"`

### `buy_now_clicked`

- `eventType`: `"buy_now_clicked"`
- `email`: `"wf3-rehearsal+buy@example.com"`
- `price`: `"$6.99"`
- `timeOnPageSeconds`: `62`
- `mockupInteracted`: `true`
- `timestamp`: `"2026-07-10T12:01:02.000Z"`
- `eventId`: `"evt_buy_now_clicked_550e8400-e29b-41d4-a716-446655440003"`

### `mockup_interacted`

- `eventType`: `"mockup_interacted"`
- `email`: `""`
- `price`: `""`
- `timeOnPageSeconds`: `18`
- `mockupInteracted`: `true`
- `timestamp`: `"2026-07-10T12:00:18.000Z"`
- `eventId`: `"evt_mockup_interacted_550e8400-e29b-41d4-a716-446655440004"`

Full fixtures: `fixtures/wf3-payloads.json`.

**Example curl (after URL is returned and approved):**

```bash
curl -X POST "https://scooter.app.n8n.cloud/webhook/app-validation/human-lab-wf1-sandbox-events" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"page_view", ... }'
```

Prefer one event object per request (not the whole multi-key fixture file).

---

## 7. Exact Values To Return After Setup

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
ALERT_WEBHOOK_URL: null
WF3_WORKFLOW_ACTIVE: true
```

Do **not** return: service account JSON, n8n API keys, Vercel tokens, Meta tokens.

---

## 8. Exact Verification Steps And Expected Rows

### Steps

1. Confirm Sheet header row matches the **33** columns exactly.
2. Confirm workflow is **Active** and webhook URL matches §3.
3. POST `page_view` → expect HTTP `200` and `{ "ok": true }`.
4. POST `email_captured` → same.
5. POST `buy_now_clicked` → same.
6. POST `mockup_interacted` → same.
7. Open `Sheet1` and confirm **4 new rows** (one per event).
8. Confirm each row’s `experimentRunId` is `run_human-lab_2026q2_001`.
9. Confirm `appId` is `human-lab-wf1-sandbox`.
10. Confirm each row has non-empty `eventId` and non-empty `receivedAt` (n8n-generated time).
11. Confirm `fbclid` is `IwAR0_rehearsal_fbclid_001` and `consentStatus` is `unknown`.
12. Confirm Meta columns are blank.
13. Confirm production Sheet / production Drive / production Meta were not touched.

### Expected event-specific values

| eventType | email | price | timeOnPageSeconds | mockupInteracted | eventId (fixture) |
|-----------|-------|-------|-------------------|------------------|-------------------|
| `page_view` | *(empty)* | *(empty)* | `0` | `FALSE` | `evt_page_view_550e8400-e29b-41d4-a716-446655440001` |
| `email_captured` | `wf3-rehearsal+email@example.com` | *(empty)* | `45` | `FALSE` | `evt_email_captured_550e8400-e29b-41d4-a716-446655440002` |
| `buy_now_clicked` | `wf3-rehearsal+buy@example.com` | `$6.99` | `62` | `TRUE` | `evt_buy_now_clicked_550e8400-e29b-41d4-a716-446655440003` |
| `mockup_interacted` | *(empty)* | *(empty)* | `18` | `TRUE` | `evt_mockup_interacted_550e8400-e29b-41d4-a716-446655440004` |

Shared expected values on every row:

- `appId` = `human-lab-wf1-sandbox`
- `appName` = `Human Lab`
- `experimentId` = `exp_human-lab_2026q2_001`
- `experimentRunId` = `run_human-lab_2026q2_001`
- `projectId` = `proj_human-lab`
- `campaignName` = `human-lab-validation`
- `utmSource` = `rehearsal`
- `utmMedium` = `sandbox`
- `utmCampaign` = `wf3-test`
- `fbclid` = `IwAR0_rehearsal_fbclid_001`
- `consentStatus` = `unknown`
- `metaCampaignId` / `metaAdSetId` / `metaAdId` / `placement` = empty
- `receivedAt` = ISO timestamp set by n8n at receive time (not equal to client `timestamp` necessarily)

Full expected arrays: `fixtures/expected-sheet-rows.json`.

### Pass criteria

- All four POSTs return HTTP 200 within ~2 seconds.
- Four Sheet rows appear with correct `eventType` and event-specific fields.
- All 33 columns present; Meta columns blank.
- No Drive `app.json` write from WF3.
- No production assets modified.
- WF4 not activated.
