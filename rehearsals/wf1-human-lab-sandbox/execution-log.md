# WF1 execution log — `human-lab-wf1-sandbox`

**Phase A–C:** complete (local sandbox + Vercel API)  
**Phase D:** complete (n8n live — Drive read + write-back)

| # | Step (n8n node equivalent) | Status | Notes |
|---|----------------------------|--------|-------|
| 1 | Manual trigger (`appId`) | PASS | `human-lab-wf1-sandbox` |
| 2 | Workflow Config | PASS | `team_CvzW7iL13TaNbaIiaCHfjafe` |
| 3 | Read `app.json` only | PASS | Drive file `1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn` |
| 4–5 | Gate `status === "ready"` | PASS | |
| 6–7 | Validate `source.*` | PASS | All required fields present |
| — | Confirm mockup in GitHub | PASS | User-provisioned sandbox repo |
| 9 | POST Vercel deployment | PASS | n8n exec `12`: `dpl_4tpnkWbv7aRHLbqn3nZRApWKNn6K` |
| 10 | Poll until READY | PASS | READY after Wait + poll |
| 11–12 | Resolve public production alias | PASS | `human-lab-wf1-sandbox.vercel.app` |
| 13–14 | Verify public URL | PASS | 200, no SSO, no X-Frame-Options DENY |
| 15 | Merge-write mockup fields | PASS | Five owned fields only |
| — | Drive write-back | PASS | Updated sandbox `app.json` only (exec `12`) |
| — | Production untouched | PASS | See notes below |

## URLs (n8n live exec `12`)

| Role | URL |
|------|-----|
| Public alias (written) | `https://human-lab-wf1-sandbox.vercel.app` |
| Raw deployment (debug) | `https://human-lab-wf1-sandbox-bri8bs5xa-scooteros-projects.vercel.app` |
| Deployment ID | `dpl_4tpnkWbv7aRHLbqn3nZRApWKNn6K` |
| Workflow | `aErcPyCDrFCvvQks` → export `n8n-workflows/WF1-mockup-deploy.json` |

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
