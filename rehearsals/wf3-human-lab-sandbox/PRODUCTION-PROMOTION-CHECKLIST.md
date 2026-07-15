# WF3 Production Promotion Checklist

Promote the **proven sandbox logic**, not the sandbox Sheet ID or sandbox-only workflow name, without editing production until this checklist is executed in the Spec 1.5.0 pass.

## A. Preconditions

- [x] Local `wf3-rehearse.js` passes (33 columns)
- [x] Sandbox Sheet exists with 33 headers
- [x] Sandbox n8n workflow active and live curls passed
- [ ] Spec 1.5.0 coordinated update approved
- [ ] Production Google Sheet (or shared platform Sheet) prepared with 33 headers
- [ ] Production Sheet shared Editor with `app-validation-sa@app-validation-501106.iam.gserviceaccount.com`

## B. Export / save (sandbox — done)

| Artifact | Location |
|----------|----------|
| SDK source | `rehearsals/wf3-human-lab-sandbox/n8n/wf3-tracking-sandbox.workflow.ts` |
| Canonical meta | `rehearsals/wf3-human-lab-sandbox/n8n/WF3-tracking-sandbox.canonical-meta.json` |
| Contract | `rehearsals/wf3-human-lab-sandbox/contract.md` |
| Live proof | `notes/live-rehearsal-report*.md` |

## C. How to promote sandbox → production

1. **Copy logic, not hardcodes**
   - Keep node sequence: Webhook → Config → Auth → Validate → Map → Route IF → Append → Respond 200
   - Keep Code node semantics (`receivedAt`, `eventId` fallback, `consentStatus`, Meta blanks, `_skipAppend`)
2. **Create production workflow** (new n8n workflow or rename after clone)
   - Name: `WF3 - Tracking` (or env-qualified)
   - Webhook path: `app-validation/{appId}-events` per app **or** shared pattern decided with WF0
   - Config Set: production `googleSheetId`, `Sheet1`, `webhookAuthSecret: null`
   - Credential: `Google Service Account account` (`AW9ZTTTBz7JeSKKN`) unless renamed in n8n
3. **Publish / activate** production workflow
4. **WF0** must write `tracking.webhookUrl` using `https://scottyo.app.n8n.cloud/webhook/...`
5. **Sync landing-template** with sandbox attribution/`eventId`/`consentStatus` before relying on browser events
6. **Export** production JSON to `n8n-workflows/WF3-tracking.json`
7. **Update** blueprint + architecture + PLATFORM_SETUP_VALUES in the same Spec pass
8. **Smoke test** one real app: four events → Sheet rows → no `app.json` write

## D. Do not promote

- Sandbox Sheet ID as the only production analytics store without an explicit decision
- Fixture `eventId`s / rehearsal emails
- `scooter.app.n8n.cloud` URLs
- 25-column Sheet headers
- Blueprint without Route Valid Events

## E. Reusability confirmation

WF3 **is reusable for future apps** if:

1. Event contract stays the shared 33-column schema  
2. Webhook URL is provisioned per `appId` by WF0  
3. Sheet ID/tab and credentials stay in n8n Config/Credentials  
4. Landing template sends the proven payload shape  
5. WF-Decision filters by `appId` + `experimentRunId` + `eventType`  

Per-app forks of Code nodes are **not** required.
