# WF3 External Setup Guide

> **WF3 event contract is frozen and ready for external implementation.**  
> Full handoff (A–E + copy-paste prompt): [`EXTERNAL-SETUP-HANDOFF.md`](./EXTERNAL-SETUP-HANDOFF.md).

## Google Sheets Setup

1. Create a sandbox spreadsheet named `App Validation - WF3 Sandbox`.
2. Keep the first tab named `Sheet1`.
3. Paste the header row exactly (**33 columns**):

```txt
timestamp	eventType	appId	appName	experimentId	experimentRunId	projectId	deploymentId	landingVersion	landingVariantId	mockupVersionId	campaignName	visitorId	sessionId	email	price	pageUrl	referrer	utmSource	utmMedium	utmCampaign	utmContent	utmTerm	timeOnPageSeconds	mockupInteracted	eventId	receivedAt	fbclid	consentStatus	metaCampaignId	metaAdSetId	metaAdId	placement
```

4. Share the sheet with `app-validation-sa@app-validation-501106.iam.gserviceaccount.com` as Editor.

## n8n Setup

Build a sandbox workflow named `WF3 - Tracking Sandbox`.

Config Set values:

```json
{
  "googleSheetId": "<SANDBOX_SPREADSHEET_ID>",
  "googleSheetTabName": "Sheet1",
  "webhookAuthSecret": null
}
```

Required nodes:

1. Webhook Trigger, POST JSON.
2. Set node for workflow config.
3. Code node for optional auth.
4. Code node for payload validation (`_validationFailed` → still HTTP 200).
5. Code node for row mapping (`receivedAt` always; `eventId` fallback; `consentStatus` default `unknown`; Meta columns blank; `_skipAppend` when invalid).
6. IF node: Route Valid Events (skip Append when `_skipAppend`).
7. Google Sheets Append (33 columns, retry 3×).
8. Respond to Webhook.
9. Optional alert node for append failure.

## Values To Return To Cursor

```yaml
GOOGLE_SHEET_ID_SANDBOX: "<spreadsheet-id>"
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

## Do Not Return

- Service account JSON.
- n8n API tokens.
- Vercel tokens.
- Meta API tokens.
- Production Sheet IDs unless explicitly requested for final production setup.
