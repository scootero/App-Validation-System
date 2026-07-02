# WF1 — n8n AI Builder Prompt

Copy everything in the **prompt box** below into n8n's AI workflow builder.

---

## Before you paste — do this manually

| Step | Where | What |
|------|-------|------|
| 1 | n8n → **Credentials** | Add **Google Service Account** (paste JSON from Google Cloud) |
| 2 | n8n → **Credentials** | Add **Header Auth** — Name: `Authorization`, Value: `Bearer YOUR_VERCEL_TOKEN` |
| 3 | github.com | Create mockup repo; push `mockup/` code to branch (e.g. `main`) |
| 4 | vercel.com | Create project → Import GitHub repo → Root Directory = `mockup` → deploy once manually |
| 5 | drive.google.com | Upload `{appId}/` to **App Validation/** folder; service account has Editor |
| 6 | Drive `app.json` | Fill `source.*` (repo, branch, root directory, Vercel project ID or name) |
| 7 | Drive `app.json` | Set **`"status": "ready"`** (webhook NOT required for WF1) |

---

## Where values go (quick reference)

| Value | Put it here |
|-------|-------------|
| Google Service Account JSON | **n8n Credentials** → Google Service Account |
| Vercel API token | **n8n Credentials** → Header Auth (`Bearer …`) |
| Drive folder ID | **Workflow Config Set node** (not Credentials) |
| Vercel team ID | **Workflow Config Set node** |
| Mockup GitHub repo, branch, root directory | **Drive `app.json`** → `source.*` |
| Vercel mockup project ID or name | **Drive `app.json`** → `source.*` |
| Same non-secret values for your records | **`.env`** (local, gitignored) |
| Status tracker, no secrets | **`PLATFORM_SETUP_VALUES.md`** |
| Deploy URLs after run | **Drive `app.json`** (written by workflow) |
| GitHub repo + root directory | **Vercel project settings** (one-time) |

**n8n does NOT read `.env`.** Paste credentials in n8n UI. **Secrets never go in `app.json`.**

---

## Prompt box (copy all)

```
Build an n8n Cloud workflow named "WF1 Mockup Deploy".

SCOPE — mockup deploy orchestration only (v1):
WF1 assumes mockup infrastructure is ALREADY provisioned:
- GitHub repo exists with mockup code
- Vercel project exists and is connected to that GitHub repo
- Vercel root directory is already configured (e.g. mockup)

WF1 must:
1. Manual trigger only with input appId (string, required)
2. Read App Validation/{appId}/app.json from Google Drive
3. Continue ONLY if status === "ready"; else stop with log
4. Validate source metadata exists:
   - source.mockupGithubRepo (org/repo or GitHub URL)
   - source.mockupBranch
   - source.mockupRootDirectory
   - at least one of source.vercelMockupProjectId OR source.vercelMockupProjectName
5. Parse mockupGithubRepo into org and repo (strip https://github.com/ if present)
6. POST https://api.vercel.com/v13/deployments?teamId={vercelTeamId} with:
   - project: source.vercelMockupProjectId (if set), OR name: source.vercelMockupProjectName
   - target: production
   - gitSource: { type: github, org, repo, ref: source.mockupBranch }
7. Poll GET /v13/deployments/{deploymentId}?teamId={vercelTeamId} until readyState === "READY"
   - interval: vercelPollIntervalSeconds (default 15)
   - max wait: vercelPollMaxMinutes (default 10)
8. Re-read full app.json from Drive; merge-write ONLY these fields:
   - deployment.mockup.vercelProjectId
   - deployment.mockup.url
   - deployment.mockup.lastDeployedAt (ISO 8601)
   - mockup.previewUrl (MUST equal deployment.mockup.url)
9. Upload merged app.json back to Drive (same file path)
10. Log success with appId and deployment.mockup.url
11. Leave status as "ready" — do NOT change status

OUT OF SCOPE — do NOT build any of these:
- Schedule trigger or Drive folder discovery loop
- GitHub repo creation or code push nodes
- Downloading mockup/ from Drive
- Vercel project creation
- Landing page deploy or app-config transform
- Webhook provisioning or tracking fields
- Google Sheets or analytics
- Meta ads

CREDENTIALS (I will attach in n8n UI):
1. Google Service Account — Drive read/write for app.json
2. Header Auth Bearer — Vercel API token

WORKFLOW CONFIG — Set node immediately after Manual Trigger (NO secrets in this node):
{
  "driveParentFolderId": "1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A",
  "vercelTeamId": "team_CvzW7iL13TaNbaIiaCHfjafe",
  "vercelPollIntervalSeconds": 15,
  "vercelPollMaxMinutes": 10
}

TRIGGER:
- Manual Trigger only with input: appId (string, required)

FLOW (node-by-node):
1. Manual Trigger → receives appId
2. Set node → Workflow Config JSON above
3. Google Drive → find and download file at path App Validation/{appId}/app.json under driveParentFolderId
4. Code → parse JSON; if status !== "ready", return empty and stop branch
5. Code → validate source.* fields; if invalid, throw error with clear message
6. Code → parse source.mockupGithubRepo into { org, repo }
7. HTTP Request → POST Vercel /v13/deployments with gitSource
8. Wait + HTTP Request loop → poll deployment until readyState === "READY"
9. Code → extract url, projectId, timestamp from Vercel response
10. Google Drive → re-download current app.json (fresh read for merge)
11. Code → merge-write only the four output fields (see MERGE-WRITE below)
12. Google Drive → upload merged app.json (overwrite same file)

MERGE-WRITE Code node pattern:
// Read existing app.json object (full document)
const pkg = $input.first().json;
const deployUrl = $('Extract URLs').first().json.url;
const projectId = $('Extract URLs').first().json.projectId;
const deployedAt = new Date().toISOString();
pkg.mockup = pkg.mockup || {};
pkg.mockup.previewUrl = deployUrl;
pkg.deployment = pkg.deployment || {};
pkg.deployment.mockup = pkg.deployment.mockup || {};
pkg.deployment.mockup.vercelProjectId = projectId;
pkg.deployment.mockup.url = deployUrl;
pkg.deployment.mockup.lastDeployedAt = deployedAt;
// Do NOT modify: appId, specVersion, source, identity, copy, experiment, tracking, deployment.landing
return [{ json: pkg }];

ERROR HANDLING:
- status !== "ready" or missing source fields: stop with log; no deploy; status unchanged
- Vercel API fail: retry 3x with exponential backoff, then alert
- Poll timeout: alert; status stays ready
- Drive write-back fail: CRITICAL alert — deploy may be live but SSOT stale

RULES:
- App Package on Drive is SSOT — no hardcoded app names, repos, or project IDs in Code nodes
- Per-app deploy inputs come from app.json source.* only
- GitHub is deployable code source; Vercel builds from connected repo; n8n never runs npm
- n8n Cloud does not read .env — credentials only in n8n Credentials UI

Test with manual trigger appId=human-lab after source.* is filled and status is ready.
```

---

## After n8n builds it

- [ ] Attach Google Service Account and Vercel Header Auth credentials to the right nodes
- [ ] Confirm Workflow Config Set node has the JSON above
- [ ] Confirm no GitHub nodes exist in the workflow
- [ ] Confirm no Schedule trigger exists (manual only for v1)
- [ ] Manual test: `appId = human-lab`
- [ ] Check Drive `app.json` for `deployment.mockup.url` and `mockup.previewUrl`
- [ ] Open mockup URL in browser
- [ ] Export workflow JSON to `n8n-workflows/WF1-mockup-deploy.json`

---

## FAQ

**Do I need a webhook URL for WF1?**  
No. Webhooks are **WF3** (tracking + Google Sheets). WF1 only triggers mockup deploy.

**Do I need a GitHub PAT for WF1?**  
No. WF1 does not push code. GitHub repo must already exist; Vercel pulls from it.

**What status triggers WF1?**  
`"status": "ready"` on Drive `app.json`. Human sets this when package and mockup infrastructure are ready.

**Where do repo and Vercel project details go?**  
In `app.json` → `source.*` on Google Drive — not in the Config Set node.

**Does `.env` wire n8n?**  
No. `.env` is your local cheat sheet. Paste secrets into **n8n Credentials**.

**What does Vercel "connected" mean?**  
Vercel project imports the GitHub repo from `source.mockupGithubRepo` and builds with Root Directory = `source.mockupRootDirectory`.
