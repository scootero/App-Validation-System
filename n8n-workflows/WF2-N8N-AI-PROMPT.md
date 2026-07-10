# WF2 — n8n AI Builder Prompt

Copy everything in each **prompt box** below into n8n's AI workflow builder.

**Spec version:** 1.5.0  
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
| 5 | github.com / vercel.com | Create the landing GitHub repo and Vercel landing project after approval; Vercel Root Directory = repository root/default |
| 6 | WF1 | Run WF1 for the app; confirm `deployment.mockup.url` on Drive (e.g. `https://human-lab.vercel.app`); verify incognito + `?embed=1` |
| 7 | drive.google.com | Package at `App Validation/{appId}/` with **`app.json` ONLY** and **`status: "ready"`** (inline `landingPage`; media via `url`/`githubPath`) |

**Upstream:** **WF0** should provision `tracking.webhookUrl` before production runs. **WF1** must have written mockup URL before WF2.

**Required before WF2 external writes:** prepared landing GitHub repo and Vercel landing project. **Not required for WF2:** Drive `copy/`/`media/` folders, npm inside n8n, mockup source downloads, or `tracking.webhookUrl` (WF0 writes URL; WF3 receives events).

---

## Where values go (quick reference)

| Value | Put it here |
|-------|-------------|
| Google Service Account JSON | **n8n Credentials** → Google Service Account |
| Vercel API token | **n8n Credentials** → Header Auth (`Bearer …`) |
| GitHub PAT | **n8n Credentials** → GitHub API / HTTP Auth — WF2 only |
| Drive folder ID, Vercel team ID, GitHub org, template repo | **Workflow Config Set node** |
| Landing repo `{org}/{appId}-landing` | **Derived or supplied in `landingTargets`**; must exist before WF2 push |
| Vercel landing project `{appId}-landing` | **Derived or supplied in `landingTargets`**; must exist before WF2 deploy |
| WF1 mockup URL | **Drive `app.json`** — `deployment.mockup.url` or `mockup.previewUrl` |
| Package landing copy | **Drive `app.json`** — `landingPage.sections[].inline` + `landingPage.content` |
| Media binaries | **GitHub** via `url`/`githubPath` (`assetsGithubRepo ?? mockupGithubRepo`) — not Drive |
| Landing deploy URLs after run | **Drive `app.json`** — `deployment.landing.*` (written by WF2) |
| Same non-secret values for your records | **`.env`** (local, gitignored) |
| Status tracker, no secrets | **`PLATFORM_SETUP_VALUES.md`** |

**n8n does NOT read `.env`.** Paste credentials in n8n UI. **Secrets never go in `app.json`.**

---

## Staged build (recommended)

Build WF2 in three stages. Paste one stage at a time into n8n AI, verify, then paste the next.

---

### Stage 1 — Load and gate

**Builds:** Manual trigger, Config Set, Drive read (`app.json` only), status gate, WF1 mockup URL gate, resolve landing repo + Vercel project.

**Stops before:** Transform, GitHub push, Vercel deploy.

#### Prompt box (copy all)

```
Build an n8n Cloud workflow named "WF2 Landing Deploy" — STAGE 1 ONLY (load and gate).

This is stage 1 of 3. Build ONLY the nodes described below. Do NOT add transform, GitHub push, or Vercel deploy nodes yet.

SCOPE — stage 1 only (spec 1.5.0):
1. Manual trigger with input appId (string, required)
2. Workflow Config Set node immediately after trigger (NO secrets)
3. Google Drive → download App Validation/{appId}/app.json under driveParentFolderId
   - Production Drive has app.json ONLY — do NOT look for copy/, media/, mockup/, reports/
4. Code → parse JSON; if status !== "ready", return empty and stop branch
5. Code → validate WF1 mockup URL exists:
   - deployment.mockup.url OR mockup.previewUrl must be non-empty https URI
   - NEVER use deployment.mockup.deploymentUrl (raw SSO-protected hostname; debug only)
   - reject URLs whose hostname matches *-scooteros-projects.vercel.app (team-protected deployment pattern)
   - if missing, throw error: "Run WF1 first — mockup URL required"
6. Code → resolve landing targets from config + appId:
   - override = landingTargets[appId] ?? repoOverrides[appId] ?? {}
   - landingGithubRepo = override.landingGithubRepo ?? `${githubOrgOrUser}/${appId}-landing`
   - vercelLandingProjectName = override.vercelLandingProjectName ?? `${appId}-landing`
   - vercelLandingProjectId = override.vercelLandingProjectId ?? null
   - parse landingGithubRepo into { org, repo }
7. IF node → continue only when status ready AND mockup URL present
8. Log resolved appId, mockupUrl, landingGithubRepo, vercelLandingProjectName

OUT OF SCOPE for stage 1 — do NOT build:
- Downloading copy/ or media/ from Drive (forbidden in 1.5.0)
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
  "landingTargets": {},
  "repoOverrides": {}
}

landingTargets example (optional per-app prepared targets):
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

**Builds:** Read inline `landingPage` from `app.json`; fetch media via `url`/`githubPath`; Code node porting `generate-app-config.js`; output `appConfig` JSON + image file payloads.

**Stops before:** GitHub push, Vercel deploy, Drive write-back.

**Prerequisite:** Stage 1 nodes exist and pass gates.

#### Prompt box (copy all)

```
Extend the existing "WF2 Landing Deploy" workflow — STAGE 2 ONLY (transform and assets).

Stage 1 (load and gate) already exists. Add ONLY the nodes below after the stage 1 IF pass branch. Do NOT add GitHub push, Vercel deploy, or Drive write-back yet.

SCOPE — stage 2 only (spec 1.5.0):
1. After stage 1 gates pass, use the already-loaded app.json — do NOT download Drive copy/ or media/
2. Landing copy from inline app.json only:
   - landingPage.sections[].inline (hero, pricing, cta, footer) when source === "inline"
   - landingPage.content.benefits, features, faq, testimonials
   - FAIL if enabled section uses source === "file" (local-dev only; not production Drive)
3. Resolve assets repo:
   repo = source.assetsGithubRepo ?? source.mockupGithubRepo
   branch = source.assetsBranch ?? source.mockupBranch ?? "main"
   root = source.assetsRootDirectory ?? ""
4. For each media asset (screenshots[], logo, ogImage, icon if used):
   - Prefer mediaAsset.url if set → HTTP GET
   - Else mediaAsset.githubPath → GitHub Contents API from assets repo (root + githubPath)
   - Fetch DECLARED asset paths ONLY — never mockup source (src/, package.json, vite config, etc.)
5. Code → transform App Package into app-data/app-config.json equivalent
   - Port logic from landing-template/scripts/generate-app-config.js
   - Field mapping per landing-template/scripts/APP_PACKAGE_TRANSFORM.md
   - Prefer inline landingPage.content / sections[].inline over any file parsers
   - NO app-specific hardcoded content — generic fallbacks only
6. Set mockup.embedUrl from WF1 output:
   mockupUrl = deployment.mockup.url ?? deployment.mockupUrl ?? mockup.previewUrl
   NEVER use deployment.mockup.deploymentUrl
   Example human-lab: https://human-lab.vercel.app
   (Landing adds ?embed=1 client-side — do not append in transform)
7. Output:
   - appConfig object (full app-config.json structure)
   - images array: { githubPath, base64Content } for each fetched binary
     - app-data/images/logo.png
     - app-data/images/og-image.png
     - app-data/images/{screenshot-basename}.png
8. tracking.webhookUrl may be empty string until WF0 — pass through from app.json

TRANSFORM must implement:
- Map sections[hero].inline → heroHeadline, heroSubheadline, heroBody
- Map landingPage.content.benefits / features / faq / testimonials
- mapTracking (analytics → tracking block)
- mapAccentColor, mapLandingStyle, mapBadgeText, mapTargetAudience, mapSeo, mapFooter
- formatPrice, formatBuyNowCta, pricingHeadlineLabel
- screenshots with missing: true when asset cannot be fetched

OUT OF SCOPE for stage 2 — do NOT build:
- Google Drive download of copy/*.md or media/*
- GitHub commit or push to landing repo
- Vercel deployment API
- Drive app.json write-back
- npm / Execute Command nodes

CREDENTIALS:
- Google Service Account (Drive app.json) — already attached from stage 1
- GitHub PAT — fetch githubPath assets (attach now)

FLOW (stage 2 nodes only — after stage 1 IF pass):
9. Code → extract inline landing copy from app.json
10. HTTP/GitHub → fetch media binaries (url or githubPath only)
11. Code → generateAppConfig(app, mediaPresent) → { appConfig, images }
12. Code → log appConfig.appId, mockup.embedUrl, image count

ERROR HANDLING (stage 2):
- Missing required inline copy for enabled section: fail with section id
- source === "file" on production package: fail with clear message
- Missing media asset: warn; set screenshots[].missing true; continue
- Transform exception: alert with appId

RULES:
- app-data/app-config.json is DISPOSABLE — regenerated every run
- Never change App Package content on Drive
- No npm — all transform in Code node
- Never fetch mockup application source — declared media assets only

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
1. Verify landingGithubRepo exists and is writable; if missing, fail with setup instructions
2. GitHub → commit to landingGithubRepo:
   - app-data/app-config.json (pretty JSON from stage 2 appConfig)
   - app-data/images/* (binaries from stage 2 images array)
   - If repo is empty: commit landing template tree + app-data/
   - Commit message: "WF2 deploy {appId} {ISO8601}"
3. POST https://api.vercel.com/v13/deployments?teamId={vercelTeamId} with:
   - name: vercelLandingProjectName
   - project: vercelLandingProjectId OR deployment.landing.vercelProjectId from Drive (required)
   - target: production
   - gitSource: { type: github, org, repo, ref: "main" }
   - Do NOT include rootDirectory; Vercel project uses repository root/default
4. Poll GET /v13/deployments/{deploymentId}?teamId={vercelTeamId} until readyState === "READY"
   - interval: vercelPollIntervalSeconds (default 15)
   - max wait: vercelPollMaxMinutes (default 10)
5. Code → extract from Vercel response:
   - canonical/production URL → deployment.landing.url
   - deployment url → deployment.landing.deploymentUrl
   - projectId → deployment.landing.vercelProjectId
   - timestamp → deployment.landing.lastDeployedAt (ISO 8601)
6. Google Drive → re-download current app.json (fresh read for merge)
7. Code → merge-write ONLY:
   - deployment.landing.vercelProjectId
   - deployment.landing.url
   - deployment.landing.deploymentUrl
   - deployment.landing.lastDeployedAt
   - deployment.githubRepoUrl (only if currently null): https://github.com/{org}/{repo}
8. Google Drive → upload merged app.json (overwrite same file)
9. Log success with appId and deployment.landing.url
10. Leave status as "ready" — do NOT change status

OUT OF SCOPE — do NOT build:
- Mockup deploy or WF1 re-run
- Webhook provisioning (WF0 owns tracking.webhookUrl)
- Google Sheets
- Meta ads
- npm / Execute Command nodes
- Modifying deployment.mockup.* or mockup.previewUrl
- Writing Drive copy/, media/, or reports/

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
// Do NOT modify: appId, specVersion, status, source, identity, landingPage,
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

SCOPE — landing deploy orchestration only (spec 1.5.0):
WF2 runs AFTER WF1. It requires deployment.mockup.url OR mockup.previewUrl from WF1.

Production Drive: App Validation/{appId}/app.json ONLY.
- Landing copy from landingPage.sections[].inline + landingPage.content
- Media from url or githubPath (assetsGithubRepo ?? mockupGithubRepo)
- NEVER download Drive copy/, media/, mockup/, or reports/
- NEVER fetch mockup application source — declared media assets only

WF2 assumes platform setup and approved per-app landing targets:
- Vercel team GitHub integration installed (one-time)
- n8n Credentials attached
- Landing GitHub repo exists before WF2 external writes
- Vercel landing project exists and is linked to that repo
- Vercel Root Directory is repository root/default, not ..

WF2 must:
1. Manual trigger only with input appId (string, required)
2. Read App Validation/{appId}/app.json from Google Drive (only file)
3. Continue ONLY if status === "ready"; else stop with log
4. Gate on WF1 output: deployment.mockup.url OR mockup.previewUrl — non-empty https URI
   - NEVER use deployment.mockup.deploymentUrl for mockup.embedUrl
   - reject team-protected deployment hostnames (*-scooteros-projects.vercel.app)
   - if missing, throw "Run WF1 first — mockup URL required"
5. Resolve landing targets from config:
   - override = landingTargets[appId] ?? repoOverrides[appId] ?? {}
   - landingGithubRepo = override.landingGithubRepo ?? `${githubOrgOrUser}/${appId}-landing`
   - vercelLandingProjectName = override.vercelLandingProjectName ?? `${appId}-landing`
   - vercelLandingProjectId = override.vercelLandingProjectId ?? deployment.landing.vercelProjectId
6. Read inline landing copy from app.json (sections[].inline + landingPage.content)
7. Fetch media via url or githubPath from assets repo; stage to app-data/images/
8. Code transform → app-data/app-config.json (port generate-app-config.js + APP_PACKAGE_TRANSFORM.md)
9. Set mockup.embedUrl = deployment.mockup.url ?? mockup.previewUrl (WF1 public alias only — never deployment.mockup.deploymentUrl)
10. Verify prepared landing GitHub repo exists and is writable
11. GitHub commit landing template tree (when repo is empty) + app-data/app-config.json + app-data/images/*
12. POST https://api.vercel.com/v13/deployments?teamId={vercelTeamId} with project + gitSource; omit rootDirectory from body
13. Poll GET /v13/deployments/{id}?teamId={vercelTeamId} until readyState === "READY"
14. Re-read full app.json from Drive; merge-write ONLY:
    - deployment.landing.vercelProjectId
    - deployment.landing.url (canonical public URL)
    - deployment.landing.deploymentUrl (latest Vercel deployment URL)
    - deployment.landing.lastDeployedAt (ISO 8601)
    - deployment.githubRepoUrl (only if currently null)
15. Upload merged app.json back to Drive
16. Log success with appId and deployment.landing.url
17. Leave status as "ready" — do NOT change status

OUT OF SCOPE — do NOT build any of these:
- Schedule trigger or Drive folder discovery loop
- Drive copy/ or media/ downloads
- Mockup deploy or WF1 re-run
- Modifying deployment.mockup.* or mockup.previewUrl
- Webhook provisioning (WF0) or tracking field writes
- Google Sheets or analytics
- Meta ads
- npm / Execute Command / local build nodes
- Creating landing GitHub/Vercel resources without prior approval
- Changing App Package landingPage content on Drive

CREDENTIALS (I will attach in n8n UI):
1. Google Service Account — Drive read/write
2. Header Auth Bearer — Vercel API token
3. GitHub PAT — asset fetch + push app-data to landing repo

WORKFLOW CONFIG — Set node immediately after Manual Trigger (NO secrets):
{
  "driveParentFolderId": "1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A",
  "vercelTeamId": "team_CvzW7iL13TaNbaIiaCHfjafe",
  "githubOrgOrUser": "scootero",
  "landingTemplateRepo": "scootero/Landing-Page-Template",
  "landingTemplateBranch": "main",
  "vercelPollIntervalSeconds": 15,
  "vercelPollMaxMinutes": 10,
  "landingTargets": {},
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
7. Code → extract inline landing copy; resolve assets repo
8. HTTP/GitHub → fetch media (url or githubPath only)
9. Code → transform to appConfig + images (generate-app-config.js equivalent)
10. GitHub → verify prepared repo; commit landing template tree when empty plus app-data/app-config.json and app-data/images/*
11. HTTP Request → POST Vercel /v13/deployments with project + gitSource
12. Wait + HTTP Request loop → poll until readyState === "READY"
13. Code → extract canonicalUrl, deploymentUrl, projectId, deployedAt
14. Google Drive → re-download current app.json
15. Code → merge-write landing fields only (see MERGE-WRITE below)
16. Google Drive → upload merged app.json
17. Code → log success

TRANSFORM rules:
- Port landing-template/scripts/generate-app-config.js — no app-specific content
- Prefer landingPage.content + sections[].inline (production); no Drive copy/*.md
- mockup.embedUrl from WF1 public alias only (e.g. https://human-lab.vercel.app) — never deployment.mockup.deploymentUrl
- tracking.webhookUrl may be "" until WF0
- Generic fallbacks per APP_PACKAGE_TRANSFORM.md only
- Push generated app-data/images; Vercel prebuild mirrors images to public/

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
// Do NOT modify: appId, specVersion, status, source, identity, landingPage,
// experiment, tracking, deployment.mockup, mockup.previewUrl
return [{ json: pkg }];

ERROR HANDLING:
- status !== "ready" or missing mockup URL: stop; no deploy
- Missing required inline copy: fail with clear section id
- Missing media: warn; continue with missing flags
- GitHub push fail: retry 3x with backoff, then alert
- Vercel API fail: retry 3x, then alert
- Poll timeout: alert; status stays ready
- Drive write-back fail: CRITICAL alert — deploy may be live but SSOT stale

RULES:
- Drive app.json is control-plane SSOT — no hardcoded app names or URLs in Code nodes
- Landing repo and Vercel project derived from config + appId, or supplied in landingTargets / overrides
- GitHub → Vercel builds; n8n never runs npm
- WF2 is idempotent — safe to re-run after inline copy or GitHub media updates
- n8n Cloud does not read .env — credentials only in n8n Credentials UI

Test with manual trigger appId=human-lab after WF1 has written deployment.mockup.url and status is ready.
```

---

## After n8n builds it

- [ ] Attach Google Service Account, Vercel Header Auth, and GitHub PAT to the right nodes
- [ ] Confirm Workflow Config Set node has the JSON above (including `landingTargets` / overrides)
- [ ] Confirm no Schedule trigger exists (manual only for v1)
- [ ] Confirm no npm / Execute Command nodes exist
- [ ] Confirm no Drive downloads of `copy/` or `media/`
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

**Where is landing copy?**  
Inline in Drive `app.json`: `landingPage.sections[].inline` + `landingPage.content`. Not Drive `copy/`.

**Where are media binaries?**  
Referenced by `url` or `githubPath` in `app.json` → `media.*`. Fetched from `source.assetsGithubRepo ?? source.mockupGithubRepo`. Declared assets only.

**Where is the landing GitHub repo name?**  
Derived from Workflow Config: `{githubOrgOrUser}/{appId}-landing` (e.g. `scootero/human-lab-landing`) or supplied per app via `landingTargets` / overrides. The repo must exist before WF2 pushes.

**Where is the Vercel landing project name?**  
Derived: `{appId}-landing` (e.g. `human-lab-landing`) or supplied via `landingTargets`. The Vercel project must exist before WF2 deploys.

**Do I need to create a Vercel project manually?**  
Yes, as an approval-gated setup step before WF2 external writes. WF2 deploys the prepared project with `project` + `gitSource`; the root directory stays repository root/default.

**Do I need to create the GitHub landing repo manually?**  
Yes, as an approval-gated setup step before WF2 external writes. WF2 can seed an empty prepared repo with the landing-template tree and generated `app-data/`.

**Do I need a webhook URL for WF2?**  
No. **WF0** provisions `tracking.webhookUrl`. WF3 receives POSTs. Generated config may have empty webhook until WF0.

**Does WF2 change `status`?**  
No. `status` stays `ready` after WF2. WF-Ads or an operator sets `validating` later.

**Does WF2 modify the mockup?**  
No. WF2 never deploys or writes mockup fields. It only **reads** the WF1 public mockup URL (`deployment.mockup.url` or `mockup.previewUrl`) for `mockup.embedUrl`. Never use `deployment.mockup.deploymentUrl`.

**What mockup URL should WF1 write?**  
The public production alias (e.g. `https://human-lab.vercel.app`), verified incognito-safe and iframe-safe before Drive write-back. See WF1 blueprint Pre-WF2 gate.

**Can I override the repo for one app?**  
Yes. Set `landingTargets.{appId}` or `repoOverrides.{appId}` in the Workflow Config Set node.

**Does n8n run npm?**  
No. WF2 pushes `app-data/` to GitHub; Vercel runs `npm run build` (including `prebuild` image copy).

**Does `.env` wire n8n?**  
No. `.env` is your local cheat sheet. Paste secrets into **n8n Credentials**.

**What if landing copy changes?**  
Update inline fields in Drive `app.json` (or sync from local package), then re-run WF2.

---

*Blueprint: [WF2-LANDING-DEPLOY-PIPELINE-BLUEPRINT.md](./WF2-LANDING-DEPLOY-PIPELINE-BLUEPRINT.md). Upstream: [WF1-N8N-AI-PROMPT.md](./WF1-N8N-AI-PROMPT.md).*
