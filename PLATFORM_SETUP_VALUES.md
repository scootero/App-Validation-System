# Platform Setup Values

Master tracker for n8n and external integrations. **No real secrets in this file.**

Production secrets live in **n8n Credentials**. Local overrides may go in `.env` (gitignored).

## Build model

**GitHub → Vercel build → n8n orchestration.** n8n Cloud does not run Node/npm locally.

WF1 v1 assumes GitHub repo and Vercel project are **already provisioned**. WF1 triggers Vercel deploy API only — no GitHub push from n8n.

## Workflow map

| Workflow | Scope |
|----------|-------|
| **WF1** | Mockup deploy only (manual trigger) → reads `source.*`, writes `deployment.mockup.*`, `mockup.previewUrl` |
| **WF2** | Landing transform + deploy → writes `deployment.landing.*` |
| **WF3** | Webhooks + Google Sheets analytics |

## Status legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Collected / configured |
| ❌ | Still needed |
| ⏳ | In progress |

## Values tracker

| Item | Status | Value | Stored In | Used By | Notes |
|------|--------|-------|-----------|---------|-------|
| `VERCEL_API_TOKEN` | ✅ | *(n8n Credentials only)* | n8n Credentials | WF1, WF2 | Header Auth Bearer |
| `VERCEL_TEAM_ID` | ✅ | `team_CvzW7iL13TaNbaIiaCHfjafe` | Config Set node, `.env` | Vercel API | Non-secret |
| `GOOGLE_CLOUD_PROJECT_ID` | ✅ | `app-validation-501106` | `.env` | Reference | |
| `GOOGLE_DRIVE_API` | ✅ | Enabled | Google Cloud | Drive | |
| `GOOGLE_SHEETS_API` | ✅ | Enabled | Google Cloud | WF3 | Not WF1 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ✅ | `app-validation-sa@app-validation-501106.iam.gserviceaccount.com` | `.env` | Share Drive + Sheet | Editor on folder |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | ✅ | *(n8n only)* | n8n Credentials | Drive nodes | Never commit |
| `DRIVE_PARENT_FOLDER_ID` | ✅ | `1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A` | Config Set node, `.env` | WF1 | App Validation |
| `GOOGLE_SHEET_ID` | ✅ | *(in .env)* | Config Set node, `.env` | WF3 only | Not WF1 |
| `GOOGLE_SHEET_TAB_NAME` | ✅ | `Sheet1` | Config Set node, `.env` | WF3 | |
| `N8N_BASE_URL` | ✅ | `https://scooter.app.n8n.cloud` | `.env` | WF3 webhooks | Not WF1 |
| `N8N_ADMIN_EMAIL` | ✅ | *(in .env)* | `.env` | Admin | |
| `GITHUB_PAT` | ✅ | *(n8n only)* | n8n Credentials | WF2 only | Not WF1 — WF1 does not push code |
| `GITHUB_ORG_OR_USER` | ✅ | `scootero` | Config Set node, `.env` | WF2 | Not WF1 |
| `LANDING_TEMPLATE_REPO` | ✅ | `scootero/Landing-Page-Template` | Config Set node, `.env` | WF2 only | Not WF1 |
| `ALERT_WEBHOOK_URL` | ❌ | optional | n8n Credentials | Error alerts | |
| `WEBHOOK_AUTH_SECRET` | ❌ | optional | n8n Credentials | WF3 | |
| `VERCEL_POLL_INTERVAL_SECONDS` | ✅ | `15` | Config Set node, `.env` | WF1 | Poll deployment status |
| `VERCEL_POLL_MAX_MINUTES` | ✅ | `10` | Config Set node, `.env` | WF1 | Max poll wait |

## Where values go

| Value | n8n Credentials | Config Set node | `.env` | This file | Drive app.json | Vercel / GitHub |
|-------|-----------------|-----------------|--------|-----------|----------------|-----------------|
| Google SA JSON | ✅ | — | optional | redacted | — | — |
| Vercel token | ✅ | — | optional | redacted | — | — |
| GitHub PAT | ✅ | — | optional | redacted | — | WF2 only |
| Drive folder ID | — | ✅ | ✅ | ✅ | — | — |
| Vercel team ID | — | ✅ | ✅ | ✅ | — | API param |
| `source.mockupGithubRepo` etc. | — | — | — | — | human sets | repo must exist |
| `deployment.mockup.*` | — | — | — | — | WF1 writes | — |
| `tracking.webhookUrl` | — | — | — | — | WF3 writes | — |
| `status: ready` | — | — | — | — | Human sets | — |

## WF1 readiness checklist

- [ ] Google SA and Vercel token in **n8n Credentials** (no GitHub PAT for WF1)
- [ ] Config Set node values in WF1 workflow (`driveParentFolderId`, `vercelTeamId`, poll settings)
- [ ] GitHub repo exists with mockup code on `source.mockupBranch`
- [ ] Vercel project connected to repo; root directory = `source.mockupRootDirectory`; manual deploy succeeded
- [ ] Package on Drive with `source.*` filled and **`status: "ready"`**
- [ ] Build WF1 using [WF1-N8N-AI-PROMPT.md](n8n-workflows/WF1-N8N-AI-PROMPT.md)

## Related docs

- [n8n-workflows/WF1-DEPLOY-PIPELINE-BLUEPRINT.md](n8n-workflows/WF1-DEPLOY-PIPELINE-BLUEPRINT.md)
- [n8n-workflows/WF1-N8N-AI-PROMPT.md](n8n-workflows/WF1-N8N-AI-PROMPT.md)
- [N8N_PLATFORM_ARCHITECTURE.md](N8N_PLATFORM_ARCHITECTURE.md)
