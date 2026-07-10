# WF1 rehearsal vs blueprint / Spec 1.5.0 / starter — gap analysis

Rehearsal completed 2026-07-10 against sandbox only. No Drive I/O.

## What matched (proven)

| Area | Result |
|------|--------|
| Spec 1.5.0 Drive model (app.json control plane) | Validated conceptually; local fixture used |
| `source.*` required fields | Validated |
| Vercel POST body (`name`, `project`, `target`, `gitSource`) | HTTP 200; deploy READY |
| Public alias ≠ raw deployment URL | Proven: raw is SSO + XFO DENY; alias is 200 public |
| Write-back only `deployment.mockup.*` + `mockup.previewUrl` | Diff showed exactly 5 allowed fields |
| Starter guidance: full repo + `/mockup` root | Matched user provisioning |
| WF0 webhook not required for WF1 | Confirmed (tracking null; deploy still worked) |

## Gaps / mismatches / missing automation

### P0 — must automate in n8n before calling WF1 “done”

1. **Google Drive read** of `App Validation/{appId}/app.json` (rehearsal used local file only).
2. **Google Drive merge-write** upload after verification (rehearsal wrote local sandbox only).
3. **Alias resolution Code node** — pick non-protected `.vercel.app` from `alias[]`; fallback to project domains API (`GET /v9/projects/{id}/domains`). Rehearsal used known alias + response `alias[]` containing `human-lab-wf1-sandbox.vercel.app`.
4. **Public URL verification gate** as IF before write-back (200 / no SSO / no XFO DENY) — logic proven; not yet an n8n node graph.
5. **Poll loop** with Wait + max timeout (`vercelPollIntervalSeconds` / `vercelPollMaxMinutes`) — deploy was fast; still need timeout/error path.

### P1 — should fix in docs/starter before or with n8n build

6. **`app-package-starter/mockup/README.md`** still omits `deployment.mockup.deploymentUrl` in the write-back list (blueprint requires it as debug field).
7. **Drive hygiene check** (folder contains only `app.json`) — documented in Spec 1.5.0 / WF0; not part of WF1 blueprint node list; decide whether WF1 warns or ignores.
8. **Failure notify node** (optional HTTP) — not rehearsed.
9. **n8n workflow JSON** does not exist yet (`WF1-mockup-deploy.json` listed as future export).

### P2 — nice to have / out of WF1 scope

10. Confirm GitHub `mockup/` tree exists via API — blueprint says no GitHub nodes; human one-time setup is enough.
11. Re-deploy idempotency / skip if already fresh — not in blueprint v1.
12. Embed/`?embed=1` visual check — blueprint test plan mentions it; not automated in WF1.

## Spec / starter alignment notes

- Spec 1.5.0 and START_HERE correctly describe one-file Drive + full GitHub repo + WF1 write-back ownership.
- Blueprint alias rules correctly predicted raw URL SSO behavior (confirmed live).
- No Spec 1.5.0 field-shape blockers found for WF1.

## Verdict

**WF1 is ready to implement in n8n** for the Vercel deploy + verify + merge-write logic.

**Not ready to call production-complete** until Drive read/write nodes are built and tested against a sandbox Drive folder (still not production `human-lab`).

### Remaining fixes (priority)

1. Build n8n WF1 from blueprint (nodes 1–15) with Config Set + Credentials.
2. Rehearse Drive read/merge-write on `App Validation/human-lab-wf1-sandbox/app.json` only.
3. Patch starter `mockup/README.md` write-back list to include `deploymentUrl`.
4. Export `n8n-workflows/WF1-mockup-deploy.json` when graph works.
5. Then consider production `human-lab` — only after sandbox Drive rehearsal passes.
