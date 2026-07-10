# Platform Setup Values

Master tracker for n8n and external integrations. **No real secrets in this file.**

Production secrets live in **n8n Credentials**. Local overrides may go in `.env` (gitignored).

## Build model

**GitHub → Vercel build → n8n orchestration.** n8n Cloud does not run Node/npm locally.

**WF0** provisions `tracking.webhookUrl` when `status: provisioning` → `ready`.

**WF1** assumes mockup GitHub repo and Vercel project are **already provisioned**. WF1 triggers Vercel deploy API only — no GitHub push from n8n.

**WF2** requires platform-level setup: Vercel team GitHub integration + n8n credentials. WF2 bootstraps `{githubOrgOrUser}/{appId}-landing` from `landingTemplateRepo` if missing. WF2 requires WF1 mockup URL on Drive first.

## Workflow map

| Workflow | Scope |
|----------|-------|
| **WF0** | Provisioning → writes `tracking.webhookUrl`, promotes `status` to `ready` |
| **WF1** | Mockup deploy (manual) → reads `source.*`, writes `deployment.mockup.*`, `mockup.previewUrl` |
| **WF2** | Landing transform + deploy → writes `deployment.landing.*` |
| **WF3** | Webhooks + Google Sheets analytics (always-on receiver) |
| **WF-Ads** | Meta/Facebook ad creation (paused by default) → writes `ads.meta.*` |
| **WF-Decision** | Validation monitoring → writes `validation.*`, root `status` |

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
| `GOOGLE_SHEETS_API` | ✅ | Enabled | Google Cloud | WF3, WF-Decision | |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ✅ | `app-validation-sa@app-validation-501106.iam.gserviceaccount.com` | `.env` | Share Drive + Sheet | Editor on folder |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | ✅ | *(n8n only)* | n8n Credentials | Drive nodes | Never commit |
| `DRIVE_PARENT_FOLDER_ID` | ✅ | `1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A` | Config Set node, `.env` | WF0–WF-Decision | App Validation |
| `LANDING_TEMPLATE_BRANCH` | ✅ | `main` | Config Set node, `.env` | WF2 | Bootstrap source branch |
| `REPO_OVERRIDES` | ✅ | `{}` | Config Set node | WF2 | Per-app repo/project overrides |
| `GOOGLE_SHEET_ID` | ✅ | *(in .env)* | Config Set node, `.env` | WF3, WF-Decision | Unified event log |
| `GOOGLE_SHEET_TAB_NAME` | ✅ | `Sheet1` | Config Set node, `.env` | WF3, WF-Decision | |
| `N8N_BASE_URL` | ✅ | `https://scooter.app.n8n.cloud` | `.env` | WF0, WF3 | Webhook URL base |
| `N8N_ADMIN_EMAIL` | ✅ | *(in .env)* | `.env` | Admin | |
| `GITHUB_PAT` | ✅ | *(n8n only)* | n8n Credentials | WF2 only | Not WF1 |
| `GITHUB_ORG_OR_USER` | ✅ | `scootero` | Config Set node, `.env` | WF2 | Not WF1 |
| `LANDING_TEMPLATE_REPO` | ✅ | `scootero/Landing-Page-Template` | Config Set node, `.env` | WF2 only | |
| `META_API_ACCESS_TOKEN` | ❌ | *(n8n only)* | n8n Credentials | WF-Ads, WF-Decision | Meta Marketing API |
| `META_AD_ACCOUNT_ID` | ❌ | *(n8n only)* | n8n Credentials | WF-Ads, WF-Decision | Ad account |
| `ALERT_WEBHOOK_URL` | ❌ | optional | n8n Credentials | Error alerts | |
| `WEBHOOK_AUTH_SECRET` | ❌ | optional | n8n Credentials | WF3 | |
| `VERCEL_POLL_INTERVAL_SECONDS` | ✅ | `15` | Config Set node, `.env` | WF1, WF2 | Poll deployment status |
| `VERCEL_POLL_MAX_MINUTES` | ✅ | `10` | Config Set node, `.env` | WF1, WF2 | Max poll wait |

## Where values go

| Value | n8n Credentials | Config Set node | `.env` | This file | Drive app.json | Vercel / GitHub |
|-------|-----------------|-----------------|--------|-----------|----------------|-----------------|
| Google SA JSON | ✅ | — | optional | redacted | — | — |
| Vercel token | ✅ | — | optional | redacted | — | — |
| GitHub PAT | ✅ | — | optional | redacted | — | WF2 only |
| Meta API token | ✅ | — | optional | redacted | — | WF-Ads, WF-Decision |
| Drive folder ID | — | ✅ | ✅ | ✅ | — | — |
| Vercel team ID | — | ✅ | ✅ | ✅ | — | API param |
| `githubOrgOrUser`, `landingTemplateRepo`, `repoOverrides` | — | ✅ | ✅ | ✅ | — | WF2 derived repo/project |
| `source.mockupGithubRepo` etc. | — | — | — | — | human sets | WF1 mockup repo |
| `tracking.webhookUrl` | — | — | — | — | WF0 writes | WF3 receives |
| `deployment.mockup.*`, `mockup.previewUrl` | — | — | — | — | WF1 writes | WF2 reads |
| `deployment.landing.*`, `githubRepoUrl` | — | — | — | — | WF2 writes | WF-Ads reads url |
| `ads.meta.*` | — | — | — | — | WF-Ads writes | — |
| `validation.*` | — | — | — | — | WF-Decision writes | — |
| `status: provisioning` | — | — | — | — | Human sets | WF0 promotes to `ready` |

## WF0 readiness checklist

- [ ] Google SA in **n8n Credentials**
- [ ] `N8N_BASE_URL` in Config Set or `.env`
- [ ] Package on Drive with full `experiment`, `ads`, `analytics` and **`status: "provisioning"`**
- [ ] Build WF0 using [WF0-PROVISIONING-PIPELINE-BLUEPRINT.md](n8n-workflows/WF0-PROVISIONING-PIPELINE-BLUEPRINT.md)
- [ ] After WF0: `tracking.webhookUrl` populated; `status: "ready"`

## WF1 readiness checklist

- [ ] Google SA and Vercel token in **n8n Credentials** (no GitHub PAT for WF1)
- [ ] Config Set node values in WF1 workflow (`driveParentFolderId`, `vercelTeamId`, poll settings)
- [ ] WF0 completed — `tracking.webhookUrl` on Drive (recommended for production)
- [ ] GitHub repo exists with mockup code on `source.mockupBranch`
- [ ] Vercel project connected to repo; root directory = `source.mockupRootDirectory`
- [ ] Package on Drive with `source.*` filled and **`status: "ready"`** (Drive = `app.json` only; full app repo on GitHub with `/mockup` Vercel root)
- [ ] Build WF1 using [WF1-N8N-AI-PROMPT.md](n8n-workflows/WF1-N8N-AI-PROMPT.md)
- [ ] After WF1: mockup URL is public alias; verified incognito + `?embed=1` before WF2

## WF2 readiness checklist

- [ ] Vercel team **GitHub integration** installed (one-time platform setup)
- [ ] Google SA, Vercel token, and **GitHub PAT** in **n8n Credentials**
- [ ] Config Set node values in WF2 workflow
- [ ] WF1 completed — `deployment.mockup.url` or `mockup.previewUrl` on Drive
- [ ] Package on Drive with **`app.json` only**, inline `landingPage`, media via `url`/`githubPath`, and **`status: "ready"`**
- [ ] Build WF2 using [WF2-N8N-AI-PROMPT.md](n8n-workflows/WF2-N8N-AI-PROMPT.md)

## WF3 readiness checklist

- [ ] WF0 completed — `tracking.webhookUrl` provisioned and embedded in landing via WF2 transform
- [ ] `GOOGLE_SHEET_ID` and tab name in WF3 Config Set
- [ ] Google SA has Editor on Sheet
- [ ] Build WF3 using [WF3-TRACKING-PIPELINE-BLUEPRINT.md](n8n-workflows/WF3-TRACKING-PIPELINE-BLUEPRINT.md)
- [ ] Test: landing page POST produces Sheet row with canonical columns

## WF-Ads readiness checklist

- [ ] WF2 completed — `deployment.landing.url` on Drive
- [ ] Meta API credentials in n8n (access token, ad account ID)
- [ ] Package has complete `ads` section, optional `ads.targeting`, and creative (`ads.media[]` or `media.ogImage`)
- [ ] Build WF-Ads using [WF-ADS-META-PIPELINE-BLUEPRINT.md](n8n-workflows/WF-ADS-META-PIPELINE-BLUEPRINT.md)
- [ ] Verify campaign created **paused** in Meta Ads Manager

## WF-Decision readiness checklist

- [ ] WF-Ads completed — `status: validating` and `ads.meta` populated
- [ ] WF3 receiving events — Sheet has signup rows
- [ ] Meta API read credentials configured
- [ ] `experiment.thresholds` recommended in `app.json`
- [ ] Build WF-Decision using [WF-DECISION-MONITORING-PIPELINE-BLUEPRINT.md](n8n-workflows/WF-DECISION-MONITORING-PIPELINE-BLUEPRINT.md)
- [ ] Confirm write-back uses `validation.latestReportUrl` (no Drive `reports/`)

## Related docs

- [n8n-workflows/README.md](n8n-workflows/README.md) — workflow index
- [n8n-workflows/WF0-PROVISIONING-PIPELINE-BLUEPRINT.md](n8n-workflows/WF0-PROVISIONING-PIPELINE-BLUEPRINT.md)
- [n8n-workflows/WF1-DEPLOY-PIPELINE-BLUEPRINT.md](n8n-workflows/WF1-DEPLOY-PIPELINE-BLUEPRINT.md)
- [n8n-workflows/WF1-N8N-AI-PROMPT.md](n8n-workflows/WF1-N8N-AI-PROMPT.md)
- [n8n-workflows/WF2-LANDING-DEPLOY-PIPELINE-BLUEPRINT.md](n8n-workflows/WF2-LANDING-DEPLOY-PIPELINE-BLUEPRINT.md)
- [n8n-workflows/WF2-N8N-AI-PROMPT.md](n8n-workflows/WF2-N8N-AI-PROMPT.md)
- [n8n-workflows/WF3-TRACKING-PIPELINE-BLUEPRINT.md](n8n-workflows/WF3-TRACKING-PIPELINE-BLUEPRINT.md)
- [n8n-workflows/WF-ADS-META-PIPELINE-BLUEPRINT.md](n8n-workflows/WF-ADS-META-PIPELINE-BLUEPRINT.md)
- [n8n-workflows/WF-DECISION-MONITORING-PIPELINE-BLUEPRINT.md](n8n-workflows/WF-DECISION-MONITORING-PIPELINE-BLUEPRINT.md)
- [N8N_PLATFORM_ARCHITECTURE.md](N8N_PLATFORM_ARCHITECTURE.md)
