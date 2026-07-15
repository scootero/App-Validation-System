# WF1 n8n Sandbox Artifact

- Source: [`wf1-mockup-deploy.workflow.ts`](./wf1-mockup-deploy.workflow.ts)
- Created in n8n: **yes**
- Workflow ID: `aErcPyCDrFCvvQks`
- Name: `WF1 Mockup Deploy`
- URL: https://scottyo.app.n8n.cloud/workflow/aErcPyCDrFCvvQks
- Active: `false` (not published)
- Export: [`n8n-workflows/WF1-mockup-deploy.json`](../../../n8n-workflows/WF1-mockup-deploy.json)
- Credentials:
  - Google Drive: `Google Service Account account` (`AW9ZTTTBz7JeSKKN`) — attached
  - Vercel HTTP: `Header Auth account` (`1ZTiyXWjTSUKSISf`) — attached

## Live execute status (2026-07-10)

- Live execute success: execution `12`
- Write-back verified
- Header Auth fix: credential **Name** = `Authorization` (not the credential label); **Value** = `Bearer <VERCEL_API_TOKEN>`

Earlier execution `9` failed at **Trigger Vercel Deploy** with `Header name must be a valid HTTP token` before that fix.

Archived throwaway: `WF1 Sandbox Drive Setup` (`Xd0jHempN3mPtxPM`).
