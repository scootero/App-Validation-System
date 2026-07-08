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
| 7 | Drive `app.json` | Set **`"status": "ready"`** (run **WF0** first in production to provision `tracking.webhookUrl`; WF1 does not require webhook for v1 testing) |

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

**Prerequisite:** WF0 should have provisioned `tracking.webhookUrl` in production. WF1 gates on `status: ready` only.

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
8. Resolve public production alias — NEVER write raw deployment response url to deployment.mockup.url or mockup.previewUrl:
   a. From deployment alias[] — pick hostname ending in .vercel.app that is NOT a team-protected pattern (*-{teamSlug}.vercel.app or hash-prefixed deployment hostnames)
   b. Fallback if alias[] lacks public domain: GET /v9/projects/{source.vercelMockupProjectId}/domains?production=true&target=production&teamId={vercelTeamId} — first verified production domain
   c. Normalize to https://{hostname} → this is publicUrl
   d. Store raw deployment url as deploymentUrl: https://{response.url} (debug only)
9. Verify publicUrl with unauthenticated HTTP HEAD or GET (no auth headers). FAIL if:
   - status is not 200
   - Location header redirects to vercel.com/sso-api
   - response includes X-Frame-Options: DENY
   On failure: alert with deploymentId, publicUrl, deploymentUrl; do NOT write to Drive
10. Only if verification passes: re-read full app.json from Drive; merge-write ONLY:
   - deployment.mockup.vercelProjectId
   - deployment.mockup.url (= publicUrl)
   - deployment.mockup.deploymentUrl (= raw deploymentUrl, optional debug)
   - deployment.mockup.lastDeployedAt (ISO 8601)
   - mockup.previewUrl (MUST equal deployment.mockup.url)
11. Upload merged app.json back to Drive (same file path)
12. Log success with appId and deployment.mockup.url (public alias)
13. Leave status as "ready" — do NOT change status

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
9. Code → Extract URLs: resolve publicUrl from alias[] (see step 8); set deploymentUrl from response.url; set projectId
10. IF public alias not found in alias[] → HTTP GET /v9/projects/{projectId}/domains?production=true&target=production&teamId={vercelTeamId}; Code → pick first verified production domain as publicUrl
11. HTTP Request → unauthenticated HEAD/GET to publicUrl (follow redirects=false or check Location)
12. Code → verify: status 200, no SSO redirect, no X-Frame-Options DENY; throw if fail
13. IF verification passed
14. Google Drive → re-download current app.json (fresh read for merge)
15. Code → merge-write only mockup fields (see MERGE-WRITE below)
16. Google Drive → upload merged app.json (overwrite same file)

EXTRACT URLS Code node pattern:
const dep = $('Poll Vercel').first().json;
const teamSlug = 'scooteros-projects'; // derive from vercelTeamId config if needed

function isProtectedHost(host) {
  return /-[a-z0-9]{5,}-/.test(host) || host.endsWith(`-${teamSlug}.vercel.app`);
}

function pickPublicAlias(aliases = []) {
  const hosts = aliases
    .map(a => (typeof a === 'string' ? a : a.domain || a))
    .filter(Boolean)
    .map(h => h.replace(/^https?:\\/\\//, ''));
  return hosts.find(h => h.endsWith('.vercel.app') && !isProtectedHost(h)) || null;
}

let publicUrl = pickPublicAlias(dep.alias);
const deploymentUrl = dep.url ? `https://${dep.url}` : null;

return [{ json: {
  publicUrl: publicUrl ? (publicUrl.startsWith('http') ? publicUrl : `https://${publicUrl}`) : null,
  deploymentUrl,
  projectId: dep.projectId,
  deploymentId: dep.id,
  needsDomainsFallback: !publicUrl,
}}];

MERGE-WRITE Code node pattern:
const pkg = $input.first().json;
const urls = $('Extract URLs').first().json;
const deployedAt = new Date().toISOString();
pkg.mockup = pkg.mockup || {};
pkg.mockup.previewUrl = urls.publicUrl;
pkg.deployment = pkg.deployment || {};
pkg.deployment.mockup = pkg.deployment.mockup || {};
pkg.deployment.mockup.vercelProjectId = urls.projectId;
pkg.deployment.mockup.url = urls.publicUrl;
pkg.deployment.mockup.deploymentUrl = urls.deploymentUrl;
pkg.deployment.mockup.lastDeployedAt = deployedAt;
// Do NOT modify: appId, specVersion, source, identity, copy, experiment, tracking, deployment.landing
return [{ json: pkg }];

ERROR HANDLING:
- status !== "ready" or missing source fields: stop with log; no deploy; status unchanged
- Vercel API fail: retry 3x with exponential backoff, then alert
- Poll timeout: alert; status stays ready
- Public alias resolution fail: alert; no Drive write-back
- Public URL verification fail: alert with deploymentId + publicUrl + deploymentUrl; no Drive write-back
- Drive write-back fail: CRITICAL alert — deploy may be live but SSOT stale

RULES:
- App Package on Drive is SSOT — no hardcoded app names, repos, or project IDs in Code nodes
- Per-app deploy inputs come from app.json source.* only
- GitHub is deployable code source; Vercel builds from connected repo; n8n never runs npm
- n8n Cloud does not read .env — credentials only in n8n Credentials UI
- deployment.mockup.url and mockup.previewUrl MUST be the public production alias (e.g. https://human-lab.vercel.app), NEVER the raw SSO-protected deployment hostname

Test with manual trigger appId=human-lab after source.* is filled and status is ready.
```

---

## After n8n builds it

- [ ] Attach Google Service Account and Vercel Header Auth credentials to the right nodes
- [ ] Confirm Workflow Config Set node has the JSON above
- [ ] Confirm no GitHub nodes exist in the workflow
- [ ] Confirm no Schedule trigger exists (manual only for v1)
- [ ] Manual test: `appId = human-lab`
- [ ] Check Drive `app.json` for `deployment.mockup.url` and `mockup.previewUrl` — must be public alias (e.g. `https://human-lab.vercel.app`)
- [ ] Confirm `deployment.mockup.deploymentUrl` holds raw deployment hostname (debug only)
- [ ] Open mockup URL in **incognito** — no Vercel login
- [ ] Open `{url}?embed=1` — mockup UI renders, nav bar hidden
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

**Why not write the deployment response url directly?**  
Team projects with Deployment Protection use SSO-gated deployment hostnames that break incognito access and iframe embeds. WF1 resolves the public production alias instead.

**What is deployment.mockup.deploymentUrl?**  
The raw Vercel deployment hostname for debugging. WF2 must never use it for `mockup.embedUrl`.
