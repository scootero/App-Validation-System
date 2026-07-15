# WF3 External Proof Status

## Status

External sandbox Sheet + n8n workflow are **configured**.  
Live curl rehearsal for all four events: **PASSED** (2026-07-10; confirmed again run2 `mrfgv3h5`).

See [`notes/live-rehearsal-report.md`](./notes/live-rehearsal-report.md) and [`notes/live-rehearsal-report-run2.md`](./notes/live-rehearsal-report-run2.md).

Local event contract is **frozen**.

## Returned Sandbox Values

```yaml
GOOGLE_SHEET_ID_SANDBOX: "1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0"
GOOGLE_SHEET_TAB_NAME: "Sheet1"
GOOGLE_SHEET_URL: "https://docs.google.com/spreadsheets/d/1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0/edit#gid=0"
GOOGLE_SHEET_COLUMN_COUNT: 33
GOOGLE_SERVICE_ACCOUNT_EMAIL: "app-validation-sa@app-validation-501106.iam.gserviceaccount.com"
N8N_CREDENTIAL_GOOGLE_SA_LABEL: "Google Service Account account"
N8N_CREDENTIAL_GOOGLE_SA_ID: "AW9ZTTTBz7JeSKKN"
N8N_BASE_URL: "https://scottyo.app.n8n.cloud"
WF3_WEBHOOK_URL_SANDBOX: "https://scottyo.app.n8n.cloud/webhook/app-validation/human-lab-wf1-sandbox-events"
WF3_WEBHOOK_AUTH_SECRET: null
WF3_WORKFLOW_NAME: "WF3 - Tracking Sandbox"
WF3_WORKFLOW_ID: "7G2fJmqKsr8CGVID"
WF3_WORKFLOW_ACTIVE: true
SANDBOX_APP_ID: "human-lab-wf1-sandbox"
WF3_LIVE_CURL_REHEARSAL: passed
```

## Setup Notes

- Credential label in n8n is `Google Service Account account` (not exactly `Google Service Account`).
- Instance host is `scottyo.app.n8n.cloud` (docs previously said `scooter.app.n8n.cloud`).
- Notify Failure node omitted for first sandbox proof.

## Blocking Inputs (remaining)

| Required value/action | Status | Owner |
|-----------------------|--------|-------|
| Sandbox Google Sheet ID | **Done** | Web AI |
| Sandbox Sheet tab `Sheet1` with **33** headers | **Done** | Web AI |
| Google SA Editor permission on sandbox Sheet | **Done** | Web AI |
| WF3 sandbox n8n workflow | **Done** | Cursor MCP |
| WF3 webhook URL | **Done** | Cursor MCP |
| Live curl POSTs for four events | **Done / PASSED** | Cursor |
| WF0 sandbox `tracking.webhookUrl` provisioning | Missing | User / web AI |
| WF2 sandbox landing re-transform/redeploy with webhook | Missing | User / web AI |

## Next Step

Post-rehearsal consolidation is **done** (`CANONICAL-WF3.md`, export, promotion checklist, backlog BL-031–BL-039).

Optional next: Browser E2E — provision `tracking.webhookUrl` into sandbox landing and redeploy (WF0/WF2).  
Production: Spec 1.5.0 coordinated pass only — do not edit production yet.
