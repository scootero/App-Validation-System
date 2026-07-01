# Platform Setup Values

Master tracker for n8n and external integrations. **No real secrets in this file.**

Production secrets live in **n8n Credentials**. Local overrides may go in `.env` (gitignored).

## Build model

**GitHub → Vercel build → n8n orchestration.** n8n Cloud does not run Node/npm locally. n8n triggers deploys via APIs, reads deploy URLs, and writes `deployment.*` back to the App Package on Google Drive.

## Status legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Collected / configured |
| ❌ | Still needed |
| ⏳ | In progress |

## Values tracker

| Item | Status | Value | Stored In | Used By | Notes |
|------|--------|-------|-----------|---------|-------|
| `VERCEL_API_TOKEN` | ✅ | *(redacted — n8n only)* | n8n Credentials | Mockup + landing deploy workflows | Rotate if ever exposed outside n8n |
| `VERCEL_TEAM_ID` | ✅ | `team_CvzW7iL13TaNbaIiaCHfjafe` | PLATFORM_SETUP_VALUES.md, `.env` | Vercel API (team scope) | Non-secret |
| `GOOGLE_CLOUD_PROJECT_ID` | ✅ | `app-validation-501106` | PLATFORM_SETUP_VALUES.md | Reference | Project name: app-validation |
| `GOOGLE_DRIVE_API` | ✅ | Enabled | Google Cloud Console | Drive read/write | APIs & Services → Library |
| `GOOGLE_SHEETS_API` | ✅ | Enabled | Google Cloud Console | Event log append | APIs & Services → Library |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ✅ | `app-validation-sa@app-validation-501106.iam.gserviceaccount.com` | PLATFORM_SETUP_VALUES.md, `.env` | Share Drive folder + Sheet with this email | Editor access required |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | ✅ | *(full JSON in n8n only)* | n8n Credentials | Google Drive + Sheets nodes | Never commit; rotate key if exposed |
| `DRIVE_PARENT_FOLDER_ID` | ✅ | `1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A` | PLATFORM_SETUP_VALUES.md, `.env` | Package discovery workflow | Drive folder: App Validation |
| `GOOGLE_SHEET_ID` | ❌ | | PLATFORM_SETUP_VALUES.md, `.env` | Event logger workflow | Create sheet; share with service account |
| `GOOGLE_SHEET_TAB_NAME` | ❌ | `Sheet1` | PLATFORM_SETUP_VALUES.md, `.env` | Sheets append node | Default tab name |
| `N8N_BASE_URL` | ❌ | | PLATFORM_SETUP_VALUES.md, `.env` | Webhook provisioning | Public HTTPS URL (n8n Cloud or self-hosted) |
| `N8N_ADMIN_EMAIL` | ❌ | | PLATFORM_SETUP_VALUES.md | Admin login | |
| `GITHUB_PAT` | ❌ | *(n8n only)* | n8n Credentials | Push artifacts / trigger Vercel via GitHub | Required for GitHub → Vercel build model |
| `GITHUB_ORG_OR_USER` | ❌ | | PLATFORM_SETUP_VALUES.md, `.env` | Repo namespace | Where mockup/landing repos live |
| `LANDING_TEMPLATE_REPO` | ❌ | | PLATFORM_SETUP_VALUES.md, `.env` | Landing deploy | e.g. `org/landing-template` on GitHub |
| `ALERT_WEBHOOK_URL` | ❌ | *(optional)* | n8n Credentials | Failure notifications | Slack incoming webhook or similar |
| `WEBHOOK_AUTH_SECRET` | ❌ | *(optional)* | n8n Credentials | Inbound landing event webhooks | Harden public webhook endpoints |
| `DRIVE_POLL_INTERVAL_MIN` | ❌ | `5` | PLATFORM_SETUP_VALUES.md, `.env` | Package discovery schedule | Suggested default |

## Google Sheet header (row 1)

Create one spreadsheet; append all events to one tab. Canonical column order:

```
timestamp | eventType | appId | appName | experimentId | experimentRunId | projectId | deploymentId | landingVersion | landingVariantId | mockupVersionId | campaignName | visitorId | sessionId | email | price | pageUrl | referrer | utmSource | utmMedium | utmCampaign | utmContent | utmTerm | timeOnPageSeconds | mockupInteracted
```

## n8n credential mapping

| n8n credential type | Source variable | Workflows |
|--------------------|-----------------|-----------|
| Google Service Account | `GOOGLE_SERVICE_ACCOUNT_JSON` | Drive discovery, `app.json` read/write, Sheets append |
| Vercel API / HTTP Bearer | `VERCEL_API_TOKEN` | Mockup deploy, landing deploy |
| GitHub | `GITHUB_PAT` | Push build artifacts, repo management |
| HTTP Webhook / Header Auth | `WEBHOOK_AUTH_SECRET` | Inbound tracking (optional) |
| Slack / Email | `ALERT_WEBHOOK_URL` | Error alerts (optional) |

## Still to do

- [ ] Create Google Sheet with 25-column header; share with service account; record `GOOGLE_SHEET_ID`
- [ ] Stand up n8n instance; record `N8N_BASE_URL`
- [ ] Add credentials in n8n UI (Google SA JSON, Vercel token, GitHub PAT)
- [ ] Connect GitHub repos to Vercel projects (per app: mockup + landing)
- [ ] Build n8n workflows (discovery → provision → validate → deploy → track → sheet)
- [ ] Upload first App Package to Drive; set `status: provisioning`

## Related docs

- [N8N_PLATFORM_ARCHITECTURE.md](N8N_PLATFORM_ARCHITECTURE.md) — system design
- [AI_IMPLEMENTATION_GUIDE.md](AI_IMPLEMENTATION_GUIDE.md) — onboarding for AI agents
- [app-validation-spec/docs/n8n-integration-notes.md](app-validation-spec/docs/n8n-integration-notes.md) — workflow wiring
