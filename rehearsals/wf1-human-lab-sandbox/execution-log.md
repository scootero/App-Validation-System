# WF1 execution log — `human-lab-wf1-sandbox`

**Phase A–C:** complete (local sandbox + Vercel API; **no Drive**)

| # | Step (n8n node equivalent) | Status | Notes |
|---|----------------------------|--------|-------|
| 1 | Manual trigger (`appId`) | PASS | `human-lab-wf1-sandbox` |
| 2 | Workflow Config | PASS | `team_CvzW7iL13TaNbaIiaCHfjafe` |
| 3 | Read `app.json` only | PASS | Local sandbox (Drive not rehearsed) |
| 4–5 | Gate `status === "ready"` | PASS | |
| 6–7 | Validate `source.*` | PASS | All required fields present |
| — | Confirm mockup in GitHub | PASS | User-provisioned sandbox repo |
| 9 | POST Vercel deployment | PASS | `dpl_F2ektZCrb5h8Lm9RoMiPsByaQbo7` HTTP 200 |
| 10 | Poll until READY | PASS | READY on first poll after POST |
| 11–12 | Resolve public production alias | PASS | `human-lab-wf1-sandbox.vercel.app` in `alias[]` |
| 13–14 | Verify public URL | PASS | 200, no SSO, no X-Frame-Options DENY |
| 15 | Merge-write mockup fields | PASS | Sandbox `app.json` only; unexpected changes: NONE |
| — | Drive write-back | SKIPPED | Stopped before Drive by design |
| — | Production untouched | PASS | See notes below |

## URLs

| Role | URL |
|------|-----|
| Public alias (written) | `https://human-lab-wf1-sandbox.vercel.app` |
| Raw deployment (debug) | `https://human-lab-wf1-sandbox-nngh0tvrb-scooteros-projects.vercel.app` (SSO + XFO DENY — correct to exclude from previewUrl) |
| Deployment ID | `dpl_F2ektZCrb5h8Lm9RoMiPsByaQbo7` |

## Write-back fields

- `mockup.previewUrl`
- `deployment.mockup.vercelProjectId`
- `deployment.mockup.url`
- `deployment.mockup.deploymentUrl`
- `deployment.mockup.lastDeployedAt`

## Production safety

- Human Lab local package: unchanged
- Production Vercel project `prj_hF5X5kvGbfgPQlajR5qf1KZ7rjUt`: not used
- Production Drive: not accessed
- Parent git: only `?? rehearsals/`
