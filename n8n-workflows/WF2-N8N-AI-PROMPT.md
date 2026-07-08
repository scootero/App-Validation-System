# WF2 — n8n AI Builder Prompt

Copy everything in each **prompt box** below into n8n's AI workflow builder.

**Upstream:** WF1 must have run first and written `deployment.mockup.url` / `mockup.previewUrl` to Drive `app.json`.

**Blueprint:** [WF2-LANDING-DEPLOY-PIPELINE-BLUEPRINT.md](./WF2-LANDING-DEPLOY-PIPELINE-BLUEPRINT.md)

---

## Before you paste — do this manually

| Step | Where | What |
|------|-------|------|
| 1 | n8n → **Credentials** | Add **Google Service Account** (paste JSON from Google Cloud) |
| 2 | n8n → **Credentials** | Add **Header Auth** — Name: `Authorization`, Value: `Bearer YOUR_VERCEL_TOKEN` |
| 3 | n8n → **Credentials** | Add **GitHub PAT** (repo scope: `contents`, `metadata`) — WF2 only |
| 4 | vercel.com → **Team settings** | Install **GitHub integration** for your Vercel team (one-time platform setup) |
| 5 | WF1 | Run WF1 for the app; confirm `deployment.mockup.url` on Drive (e.g. `https://human-lab.vercel.app`); verify incognito + `?embed=1` |
| 6 | drive.google.com | Package at `App Validation/{appId}/` with `copy/`, `media/`, **`status: "ready"`** |

**Upstream:** **WF0** should provision `tracking.webhookUrl` before production runs. **WF1** must have written mockup URL before WF2.

**Not required for WF2:** creating a GitHub landing repo manually, creating a Vercel project manually, manual first deploy in vercel.com, or `tracking.webhookUrl` (WF3 provisions receiver; WF0 writes URL to app.json).

---

## Where values go (quick reference)

| Value | Put it here |
|-------|-------------|
| Google Service Account JSON | **n8n Credentials** → Google Service Account |
| Vercel API token | **n8n Credentials** → Header Auth (`Bearer …`) |
| GitHub PAT | **n8n Credentials** → GitHub API / HTTP Auth — WF2 only |
| Drive folder ID, Vercel team ID, GitHub org, template repo | **Workflow Config Set node** |
| Landing repo `{org}/{appId}-landing` | **Derived**; WF2 bootstraps from `landingTemplateRepo` if missing |
| Vercel landing project `{appId}-landing` | **Derived**; WF2 creates via deploy API on first run |
| WF1 mockup URL | **Drive `app.json`** — `deployment.mockup.url` or `mockup.previewUrl` |
| Package copy/media | **Drive** `copy/`, `media/` — SSOT, read-only for WF2 |
| Landing deploy URLs after run | **Drive `app.json`** — `deployment.landing.*` (written by WF2) |
| Same non-secret values for your records | **`.env`** (local, gitignored) |
| Status tracker, no secrets | **`PLATFORM_SETUP_VALUES.md`** |

**n8n does NOT read `.env`.** Paste credentials in n8n UI. **Secrets never go in `app.json`.**

---

## Staged build (recommended)

Build WF2 in three stages. Paste one stage at a time into n8n AI, verify, then paste the next.

---

### Stage 1 — Load and gate

**Builds:** Manual trigger, Config Set, Drive read, status gate, WF1 mockup URL gate, resolve landing repo + Vercel project name.

**Stops before:** Transform, GitHub push, Vercel deploy.

#### Prompt box (copy all)

```
Build an n8n Cloud workflow named "WF2 Landing Deploy" — STAGE 1 ONLY (load and gate).

This is stage 1 of 3. Build ONLY the nodes described below. Do NOT add transform, GitHub push, or Vercel deploy nodes yet.

SCOPE — stage 1 only:
1. Manual trigger with input appId (string, required)
2. Workflow Config Set node immediately after trigger (NO secrets)
3. Google Drive → download App Validation/{appId}/app.json under driveParentFolderId
4. Code → parse JSON; if status !== "ready", return empty and stop branch
5. Code → validate WF1 mockup URL exists:
   - deployment.mockup.url OR mockup.previewUrl must be non-empty https URI
   - NEVER use deployment.mockup.deploymentUrl (raw SSO-protected hostname; debug only)
   - reject URLs whose hostname matches *-scooteros-projects.vercel.app (team-protected deployment pattern)
   - if missing, throw error: "Run WF1 first — mockup URL required"
6. Code → resolve landing targets from config + appId:
   - landingGithubRepo = repoOverrides[appId]?.landingGithubRepo ?? `${githubOrgOrUser}/${appId}-landing`
   - vercelLandingProjectName = repoOverrides[appId]?.vercelLandingProjectName ?? `${appId}-landing`
   - vercelLandingProjectId = repoOverrides[appId]?.vercelLandingProjectId ?? null
   - parse landingGithubRepo into { org, repo }
7. IF node → continue only when status ready AND mockup URL present
8. Log resolved appId, mockupUrl, landingGithubRepo, vercelLandingProjectName

OUT OF SCOPE for stage 1 — do NOT build:
- Downloading copy/ or media/ from Drive
- Transform / app-config generation
- GitHub nodes or HTTP push
- Vercel deployment API
- Drive write-back

CREDENTIALS (I will attach in n8n UI):
1. Google Service Account — Drive read for app.json

WORKFLOW CONFIG — Set node (NO secrets):
{
  "driveParentFolderId": "1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A",
  "vercelTeamId": "team_CvzW7iL13TaNbaIiaCHfjafe",
  "githubOrgOrUser": "scootero",
  "landingTemplateRepo": "scootero/Landing-Page-Template",
  "landingTemplateBranch": "main",
  "vercelPollIntervalSeconds": 15,
  "vercelPollMaxMinutes": 10,
  "repoOverrides": {}
}

repoOverrides example (optional per-app overrides):
{
  "human-lab": {
    "landingGithubRepo": "scootero/custom-landing-repo",
    "vercelLandingProjectName": "custom-vercel-name",
    "vercelLandingProjectId": "prj_optional"
  }
}

FLOW (stage 1 nodes only):
1. Manual Trigger → appId
2. Set → Workflow Config JSON above
3. Google Drive → download app.json
4. Code → parse; gate status === "ready"
5. Code → gate mockup URL from deployment.mockup.url ?? mockup.previewUrl
6. Code → resolve landingGithubRepo + vercelLandingProjectName from config
7. IF → pass only when gates pass
8. Code → log summary (appId, mockupUrl, landingGithubRepo, vercelProject)

ERROR HANDLING (stage 1):
- status !== "ready": stop with log
- missing mockup URL: throw "Run WF1 first"
- Drive read fail: alert

RULES:
- No Schedule trigger
- No app-specific hardcoding (use appId from trigger + config)
- Do not modify app.json on Drive in stage 1

Test stage 1 with appId=human-lab after WF1 has written deployment.mockup.url.
```

---

### Stage 2 — Transform and assets

**Builds:** Download `copy/*.md` and `media/*` from Drive; Code node porting `generate-app-config.js`; output `appConfig` JSON + image file payloads.

**Stops before:** GitHub push, Vercel deploy, Drive write-back.

**Prerequisite:** Stage 1 nodes exist and pass gates.

#### Prompt box (copy all)

```
Extend the existing "WF2 Landing Deploy" workflow — STAGE 2 ONLY (transform and assets).

Stage 1 (load and gate) already exists. Add ONLY the nodes below after the stage 1 IF pass branch. Do NOT add GitHub push, Vercel deploy, or Drive write-back yet.

SCOPE — stage 2 only:
1. After stage 1 gates pass, download from Drive under App Validation/{appId}/:
   - copy/hero.md, copy/benefits.md, copy/features.md, copy/faq.md (when present)
   - media files referenced in app.json: screenshots[], logo, ogImage
2. Code → transform App Package into app-data/app-config.json equivalent
   - Port logic from landing-template/scripts/generate-app-config.js
   - Field mapping per landing-template/scripts/APP_PACKAGE_TRANSFORM.md
   - NO app-specific hardcoded content — generic fallbacks only
3. Set mockup.embedUrl from WF1 output:
   mockupUrl = deployment.mockup.url ?? deployment.mockupUrl ?? mockup.previewUrl
   NEVER use deployment.mockup.deploymentUrl
   Example human-lab: https://human-lab.vercel.app
   (Landing adds ?embed=1 client-side — do not append in transform)
4. Output:
   - appConfig object (full app-config.json structure)
   - images array: { githubPath, base64Content } for each copied binary
     - app-data/images/logo.png
     - app-data/images/og-image.png
     - app-data/images/{screenshot-basename}.png
5. tracking.webhookUrl may be empty string until WF3 — pass through from app.json

TRANSFORM must implement (port from generate-app-config.js):
- parseHeroSection, parseBenefits, parseFeatures, parseFaq
- mapTracking (analytics → tracking block)
- mapAccentColor, mapLandingStyle, mapBadgeText, mapTargetAudience, mapSeo, mapFooter
- formatPrice, formatBuyNowCta, pricingHeadlineLabel
- screenshots with missing: true when binary not on Drive

OUT OF SCOPE for stage 2 — do NOT build:
- GitHub commit or push
- Vercel deployment API
- Drive app.json write-back
- npm / Execute Command nodes

CREDENTIALS:
- Google Service Account (Drive download) — already attached from stage 1

FLOW (stage 2 nodes only — after stage 1 IF pass):
9. Google Drive → download copy/*.md files (parallel or sequential)
10. Google Drive → download media binaries from app.json paths
11. Code → generateAppConfig(app, copyTexts, mediaPresent) → { appConfig, images }
12. Code → log appConfig.appId, mockup.embedUrl, image count

ERROR HANDLING (stage 2):
- Missing required copy file for enabled section with source=file: fail with path
- Missing media binary: warn; set screenshots[].missing true; continue
- Transform exception: alert with appId

RULES:
- app-data/app-config.json is DISPOSABLE — regenerated every run
- Never change App Package content on Drive
- No npm — all transform in Code node

Verify stage 2 output: appConfig.mockup.embedUrl equals WF1 mockup URL for human-lab.
```

---

### Stage 3 — Push, deploy, write-back

**Builds:** GitHub bootstrap (if needed), commit `app-data/`; Vercel POST + poll; merge-write `deployment.landing.*`; Drive upload.

**Prerequisite:** Stages 1 and 2 exist.

#### Prompt box (copy all)

```
Extend the existing "WF2 Landing Deploy" workflow — STAGE 3 ONLY (push, deploy, write-back).

Stages 1 (load/gate) and 2 (transform/assets) already exist. Add ONLY the nodes below after stage 2 output. Complete the end-to-end pipeline.

SCOPE — stage 3 only:
1. If landingGithubRepo does not exist (GitHub API 404): create repo and seed from landingTemplateRepo@landingTemplateBranch
2. GitHub → commit to landingGithubRepo:
   - app-data/app-config.json (pretty JSON from stage 2 appConfig)
   - app-data/images/* (binaries from stage 2 images array)
   - On first bootstrap: commit landing template tree + app-data/
   - Commit message: "WF2 deploy {appId} {ISO8601}"
3. POST https://api.vercel.com/v13/deployments?teamId={vercelTeamId} with:
   - name: vercelLandingProjectName (required on first run — creates project)
   - project: vercelLandingProjectId OR deployment.landing.vercelProjectId from Drive (subsequent runs, if known)
   - target: production
   - gitSource: { type: github, org, repo, ref: landingTemplateBranch or "main" }
   - Do NOT require manual Vercel project setup — first deploy creates the project via API
3. Poll GET /v13/deployments/{deploymentId}?teamId={vercelTeamId} until readyState === "READY"
   - interval: vercelPollIntervalSeconds (default 15)
   - max wait: vercelPollMaxMinutes (default 10)
4. Code → extract from Vercel response:
   - canonical/production URL → deployment.landing.url
   - deployment url → deployment.landing.deploymentUrl
   - projectId → deployment.landing.vercelProjectId
   - timestamp → deployment.landing.lastDeployedAt (ISO 8601)
5. Google Drive → re-download current app.json (fresh read for merge)
6. Code → merge-write ONLY:
   - deployment.landing.vercelProjectId
   - deployment.landing.url
   - deployment.landing.deploymentUrl
   - deployment.landing.lastDeployedAt
   - deployment.githubRepoUrl (only if currently null): https://github.com/{org}/{repo}
7. Google Drive → upload merged app.json (overwrite same file)
8. Log success with appId and deployment.landing.url
9. Leave status as "ready" — do NOT change status

OUT OF SCOPE — do NOT build:
- Mockup deploy or WF1 re-run
- Webhook provisioning
- Google Sheets
- Meta ads
- npm / Execute Command nodes
- Modifying deployment.mockup.* or mockup.previewUrl

CREDENTIALS (attach to stage 3 nodes):
1. GitHub PAT — GitHub push
2. Header Auth Bearer — Vercel API
3. Google Service Account — Drive write-back

MERGE-WRITE Code node pattern:
const pkg = $input.first().json;
const urls = $('Extract Landing URLs').first().json;
const repo = $('Resolve Landing Repo').first().json;
pkg.deployment = pkg.deployment || {};
pkg.deployment.landing = pkg.deployment.landing || {};
pkg.deployment.landing.vercelProjectId = urls.projectId;
pkg.deployment.landing.url = urls.canonicalUrl;
pkg.deployment.landing.deploymentUrl = urls.deploymentUrl;
pkg.deployment.landing.lastDeployedAt = urls.deployedAt;
if (!pkg.deployment.githubRepoUrl) {
  pkg.deployment.githubRepoUrl = `https://github.com/${repo.org}/${repo.repo}`;
}
// Do NOT modify: appId, specVersion, status, source, identity, copy,
// experiment, tracking, deployment.mockup, mockup.previewUrl
return [{ json: pkg }];

ERROR HANDLING (stage 3):
- GitHub push fail: retry 3x exponential backoff, then alert
- Vercel API fail: retry 3x, then alert
- Poll timeout: alert; status stays ready
- Drive write-back fail: CRITICAL alert — deploy may be live but SSOT stale

RULES:
- GitHub → Vercel builds; n8n never runs npm
- Re-running WF2 is idempotent: new commit + new deploy + updated lastDeployedAt
- No app-specific hardcoding

Test end-to-end: appId=human-lab after WF1 mockup URL is on Drive.
```

---

## Consolidated prompt (full workflow)

Use this single prompt if you prefer to build WF2 in one pass instead of three stages.

### Prompt box (copy all)

```
Build an n8n Cloud workflow named "WF2 Landing Deploy".

SCOPE — landing deploy orchestration only (v1):
WF2 runs AFTER WF1. It requires deployment.mockup.url OR mockup.previewUrl from WF1.

WF2 assumes PLATFORM setup only (not per-app):
- Vercel team GitHub integration installed (one-time)
- n8n Credentials attached

WF2 handles per-app on every run (no manual Vercel dashboard steps):
- Bootstrap landing GitHub repo from landingTemplateRepo if missing
- Push app-data/ to {githubOrgOrUser}/{appId}-landing
- POST Vercel /v13/deployments with name + gitSource (creates project on first run)

WF2 must:
1. Manual trigger only with input appId (string, required)
2. Read App Validation/{appId}/app.json from Google Drive
3. Continue ONLY if status === "ready"; else stop with log
4. Gate on WF1 output: deployment.mockup.url OR mockup.previewUrl — non-empty https URI
   - NEVER use deployment.mockup.deploymentUrl for mockup.embedUrl
   - reject team-protected deployment hostnames (*-scooteros-projects.vercel.app)
   - if missing, throw "Run WF1 first — mockup URL required"
5. Resolve landing targets from config:
   - landingGithubRepo = repoOverrides[appId]?.landingGithubRepo ?? `${githubOrgOrUser}/${appId}-landing`
   - vercelLandingProjectName = repoOverrides[appId]?.vercelLandingProjectName ?? `${appId}-landing`
   - vercelLandingProjectId = repoOverrides[appId]?.vercelLandingProjectId ?? null
6. Download from Drive: app.json (already read), copy/hero.md, copy/benefits.md, copy/features.md, copy/faq.md, media/* from app.json paths
7. Code transform → app-data/app-config.json (port generate-app-config.js + APP_PACKAGE_TRANSFORM.md)
8. Set mockup.embedUrl = deployment.mockup.url ?? mockup.previewUrl (WF1 public alias only — never deployment.mockup.deploymentUrl)
9. Bootstrap landing GitHub repo from landingTemplateRepo if missing (GitHub API)
10. GitHub commit template (first run) + app-data/app-config.json + app-data/images/*
11. POST https://api.vercel.com/v13/deployments?teamId={vercelTeamId} with name + gitSource (omit project on first run; use project ID when known)
12. Poll GET /v13/deployments/{id}?teamId={vercelTeamId} until readyState === "READY"
13. Re-read full app.json from Drive; merge-write ONLY:
    - deployment.landing.vercelProjectId
    - deployment.landing.url (canonical public URL)
    - deployment.landing.deploymentUrl (latest Vercel deployment URL)
    - deployment.landing.lastDeployedAt (ISO 8601)
    - deployment.githubRepoUrl (only if currently null)
14. Upload merged app.json back to Drive
15. Log success with appId and deployment.landing.url
16. Leave status as "ready" — do NOT change status

OUT OF SCOPE — do NOT build any of these:
- Schedule trigger or Drive folder discovery loop
- Mockup deploy or WF1 re-run
- Modifying deployment.mockup.* or mockup.previewUrl
- Webhook provisioning or tracking fields
- Google Sheets or analytics
- Meta ads
- npm / Execute Command / local build nodes
- Manual per-app Vercel or GitHub repo setup in dashboards
- Changing App Package copy or content on Drive

CREDENTIALS (I will attach in n8n UI):
1. Google Service Account — Drive read/write
2. Header Auth Bearer — Vercel API token
3. GitHub PAT — push app-data to landing repo

WORKFLOW CONFIG — Set node immediately after Manual Trigger (NO secrets):
{
  "driveParentFolderId": "1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A",
  "vercelTeamId": "team_CvzW7iL13TaNbaIiaCHfjafe",
  "githubOrgOrUser": "scootero",
  "landingTemplateRepo": "scootero/Landing-Page-Template",
  "landingTemplateBranch": "main",
  "vercelPollIntervalSeconds": 15,
  "vercelPollMaxMinutes": 10,
  "repoOverrides": {}
}

TRIGGER:
- Manual Trigger only with input: appId (string, required)

FLOW (node-by-node):
1. Manual Trigger → receives appId
2. Set node → Workflow Config JSON above
3. Google Drive → download App Validation/{appId}/app.json
4. Code → parse JSON; if status !== "ready", stop
5. Code → validate mockup URL; throw if missing
6. Code → resolve landingGithubRepo + vercelLandingProjectName (+ parse org/repo)
7. Google Drive → download copy/*.md and media binaries
8. Code → transform to appConfig + images (generate-app-config.js equivalent)
9. GitHub → bootstrap repo if missing; commit app-data/app-config.json and app-data/images/*
10. HTTP Request → POST Vercel /v13/deployments with name + gitSource (project ID when known)
11. Wait + HTTP Request loop → poll until readyState === "READY"
12. Code → extract canonicalUrl, deploymentUrl, projectId, deployedAt
13. Google Drive → re-download current app.json
14. Code → merge-write landing fields only (see MERGE-WRITE below)
15. Google Drive → upload merged app.json
16. Code → log success

TRANSFORM rules:
- Port landing-template/scripts/generate-app-config.js — no app-specific content
- mockup.embedUrl from WF1 public alias only (e.g. https://human-lab.vercel.app) — never deployment.mockup.deploymentUrl
- tracking.webhookUrl may be "" until WF3
- Generic fallbacks per APP_PACKAGE_TRANSFORM.md only
- Push app-data/ only — Vercel prebuild mirrors images to public/

MERGE-WRITE Code node pattern:
const pkg = $input.first().json;
const urls = $('Extract Landing URLs').first().json;
const repo = $('Resolve Landing Repo').first().json;
pkg.deployment = pkg.deployment || {};
pkg.deployment.landing = pkg.deployment.landing || {};
pkg.deployment.landing.vercelProjectId = urls.projectId;
pkg.deployment.landing.url = urls.canonicalUrl;
pkg.deployment.landing.deploymentUrl = urls.deploymentUrl;
pkg.deployment.landing.lastDeployedAt = urls.deployedAt;
if (!pkg.deployment.githubRepoUrl) {
  pkg.deployment.githubRepoUrl = `https://github.com/${repo.org}/${repo.repo}`;
}
// Do NOT modify: appId, specVersion, status, source, identity, copy,
// experiment, tracking, deployment.mockup, mockup.previewUrl
return [{ json: pkg }];

ERROR HANDLING:
- status !== "ready" or missing mockup URL: stop; no deploy
- Missing required copy: fail with clear path
- Missing media: warn; continue with missing flags
- GitHub push fail: retry 3x with backoff, then alert
- Vercel API fail: retry 3x, then alert
- Poll timeout: alert; status stays ready
- Drive write-back fail: CRITICAL alert — deploy may be live but SSOT stale

RULES:
- App Package on Drive is SSOT — no hardcoded app names or URLs in Code nodes
- Landing repo and Vercel project derived from config + appId (repoOverrides for exceptions)
- GitHub → Vercel builds; n8n never runs npm
- WF2 is idempotent — safe to re-run for copy/media updates
- n8n Cloud does not read .env — credentials only in n8n Credentials UI

Test with manual trigger appId=human-lab after WF1 has written deployment.mockup.url and status is ready.
```

---

## After n8n builds it

- [ ] Attach Google Service Account, Vercel Header Auth, and GitHub PAT to the right nodes
- [ ] Confirm Workflow Config Set node has the JSON above (including `repoOverrides: {}`)
- [ ] Confirm no Schedule trigger exists (manual only for v1)
- [ ] Confirm no npm / Execute Command nodes exist
- [ ] Confirm WF1 mockup URL gate exists (fails with "Run WF1 first" when missing)
- [ ] Confirm merge-write does not touch `deployment.mockup.*` or `mockup.previewUrl`
- [ ] Confirm `status` is never changed by the workflow
- [ ] Manual test: run WF1 for `human-lab`, then WF2 with `appId = human-lab`
- [ ] Pre-WF2: confirm mockup URL opens incognito and works with `?embed=1`
- [ ] Check GitHub for updated `app-data/app-config.json` and images
- [ ] Check Drive `app.json` for `deployment.landing.url` and `deployment.landing.deploymentUrl`
- [ ] Open landing URL; verify mockup iframe loads WF1 deploy URL
- [ ] Export workflow JSON to `n8n-workflows/WF2-landing-deploy.json`

---

## FAQ

**Must WF1 run first?**  
Yes. WF2 requires `deployment.mockup.url` or `mockup.previewUrl` from WF1. Without it, the workflow must stop with "Run WF1 first."

**Where is the landing GitHub repo name?**  
Derived from Workflow Config: `{githubOrgOrUser}/{appId}-landing` (e.g. `scootero/human-lab-landing`). Override per app via `repoOverrides` in the Config Set node.

**Where is the Vercel landing project name?**  
Derived: `{appId}-landing` (e.g. `human-lab-landing`). Override via `repoOverrides.vercelLandingProjectName`.

**Do I need to create a Vercel project manually?**  
No. WF2 triggers `POST /v13/deployments` with `name: {appId}-landing` and `gitSource`. The first run creates the Vercel project when the team GitHub integration is installed. No manual deploy in vercel.com is required.

**Do I need to create the GitHub landing repo manually?**  
No. WF2 bootstraps `{githubOrgOrUser}/{appId}-landing` from `landingTemplateRepo` when the repo is missing.

**Do I need a webhook URL for WF2?**  
No. Webhooks are **WF3**. `tracking.webhookUrl` in generated config may be empty until then.

**Does WF2 change `status`?**  
No. `status` stays `ready` after WF2. WF-Ads or an operator sets `validating` later.

**Does WF2 modify the mockup?**  
No. WF2 never deploys or writes mockup fields. It only **reads** the WF1 public mockup URL (`deployment.mockup.url` or `mockup.previewUrl`) for `mockup.embedUrl`. Never use `deployment.mockup.deploymentUrl`.

**What mockup URL should WF1 write?**  
The public production alias (e.g. `https://human-lab.vercel.app`), verified incognito-safe and iframe-safe before Drive write-back. See WF1 blueprint Pre-WF2 gate.

**Can I override the repo for one app?**  
Yes. Set `repoOverrides.{appId}` in the Workflow Config Set node.

**Does n8n run npm?**  
No. WF2 pushes `app-data/` to GitHub; Vercel runs `npm run build` (including `prebuild` image copy).

**Does `.env` wire n8n?**  
No. `.env` is your local cheat sheet. Paste secrets into **n8n Credentials**.

**What if copy changes on Drive?**  
Re-run WF2. It regenerates `app-config.json` from the latest package and redeploys.

---

*Blueprint: [WF2-LANDING-DEPLOY-PIPELINE-BLUEPRINT.md](./WF2-LANDING-DEPLOY-PIPELINE-BLUEPRINT.md). Upstream: [WF1-N8N-AI-PROMPT.md](./WF1-N8N-AI-PROMPT.md).*
