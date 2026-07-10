# WF1 rehearsal — `human-lab-wf1-sandbox`

**Phase:** B complete (source.* + payload filled locally)  
**Status:** Stopped for deploy/write-back approval — no external API calls yet

This folder is a **safe duplicate** for manually rehearsing WF1 (mockup deploy). It does not modify production Human Lab, Drive, or Vercel.

## Approved identity

| Field | Value |
|-------|-------|
| `appId` | `human-lab-wf1-sandbox` |
| GitHub repo | `scootero/Human-Lab-WF1-Sandbox` |
| Vercel project name | `human-lab-wf1-sandbox` |
| Mockup root directory | `mockup` |
| Branch | `main` |

Content in `app.json` is copied from Human Lab for realism. This is a **deploy sandbox**, not a second product.

## Files

| File | Purpose |
|------|---------|
| `app.json` | Sandbox control manifest (WF1 reads this) |
| `app.json.before.json` | Snapshot before any merge-write (Phase C diff) |
| `EXPECTED_WRITEBACK.json` | Fields WF1 is allowed to write |
| `vercel-deploy-request.json` | Exact POST body stub (do not POST until Phase C) |
| `execution-log.md` | Pass/fail checklist for WF1 steps 1–15 |
| `notes/field-diff.md` | Before/after field diff (fill in Phase C) |

## Filled values

| Field | Value |
|-------|-------|
| `source.vercelMockupProjectId` | `prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM` |
| `vercelTeamId` | `team_CvzW7iL13TaNbaIiaCHfjafe` |
| Public alias | `https://human-lab-wf1-sandbox.vercel.app` |
| Raw deployment URL (debug) | `https://human-lab-wf1-sandbox-67h6xq0nz-scooteros-projects.vercel.app` |

## Safety

- Do **not** push to `scootero/Human-Lab`
- Do **not** use production Vercel project `human-lab` / `prj_hF5X5kvGbfgPQlajR5qf1KZ7rjUt`
- Do **not** overwrite Drive `App Validation/human-lab/app.json`
- No secrets in this folder

## Next

Approve POST deploy and/or merge-write of `EXPECTED_WRITEBACK.json` into sandbox `app.json` only.
