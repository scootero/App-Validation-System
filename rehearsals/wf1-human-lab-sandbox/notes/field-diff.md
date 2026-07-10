# Field diff — sandbox `app.json`

Compare `app.json.before.json` (Phase A snapshot) to `app.json` after WF1 merge-write (Phase C).

## Allowed writes (WF1 only) — APPLIED 2026-07-10

| Path | Before | After |
|------|--------|-------|
| `mockup.previewUrl` | `null` | `https://human-lab-wf1-sandbox.vercel.app` |
| `deployment.mockup.vercelProjectId` | `null` | `prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM` |
| `deployment.mockup.url` | `null` | `https://human-lab-wf1-sandbox.vercel.app` |
| `deployment.mockup.deploymentUrl` | `null` | `https://human-lab-wf1-sandbox-nngh0tvrb-scooteros-projects.vercel.app` |
| `deployment.mockup.lastDeployedAt` | `null` | `2026-07-10T03:39:17.017Z` |

Unexpected changes: **NONE**

## Must remain unchanged

- `appId`, `specVersion`, `status`
- `source.*`
- `identity`, `audience`, `commerce`, `branding`, `landingPage`, `media`, `ads`, `tracking`, `analytics`, `experiment`, `validation`
- `deployment.landing.*`, `deployment.githubRepoUrl`

## Diff command (Phase C)

```bash
diff -u rehearsals/wf1-human-lab-sandbox/app.json.before.json \
        rehearsals/wf1-human-lab-sandbox/app.json
```
