# WF4 n8n Sandbox

## Live Workflow

| Field | Value |
|-------|-------|
| Name | `WF4 - Meta Ads Sandbox` |
| ID | `YIc53GBq4upelYp6` |
| URL | https://scottyo.app.n8n.cloud/workflow/YIc53GBq4upelYp6 |
| Active | **No** |
| Last proven dry-run (pre creative-binary SDK) | `39` (success) |

## Files

| File | Role |
|------|-------|
| `wf4-meta-ads-sandbox.workflow.ts` | SDK source (adapter Process Code + disabled create chain) |
| `WF4-meta-ads-sandbox.canonical-meta.json` | Proven IDs and execution proof |
| `../CANONICAL-WF4.md` | Values index |
| `../external-proof-status.md` | Continuity / left-off |

## Creative binary path (disabled create chain)

Generic nodes (bundle expressions only; no hardcoded repo/filename):

1. Resolve Creative Download Plan  
2. Download Creative Binary  
3. Validate Creative Binary  
4. Upload Ad Image (multipart binary → Meta `adimages`)  
5. Merge Image Hash (fail closed without hash)

Safety (2026-07-28, still disabled until approval):

- **Already Complete Gate** → Respond Already Complete (zero Meta POSTs)
- **Needs Campaign/AdSet Create** → skip POST when ID already on ledger
- **Verify PAUSED Statuses** + **Assert PAUSED** before ledger verified / Drive write-back
- **`ads.meta.variants[creativeRevision]`** SSOT; flat fields mirror `currentVariant`; migrate-on-write-back for legacy flat IDs

## Manual operator steps (after this repo change)

1. Import [`WF4-meta-ads-sandbox.import-ready.json`](WF4-meta-ads-sandbox.import-ready.json) into live workflow `YIc53GBq4upelYp6` (replace existing). Re-bind **Meta Marketing API - Orro** and Google SA credentials if the import drops them.
2. Keep workflow **inactive**. Keep all create / ledger / Drive write-back nodes **disabled**. Keep `_createPausedAllowed` false / Process hard-gate false.
3. Optional: Manual Execute with defaults (`mode=dry_run`, `approval=false`) → expect Respond Dry Run, `metaHttpCalls: 0`, no Drive write.
4. Add video assets when ready: `media/ad-hero-feed.mp4` + `media/ad-thumb-feed.png` in `scootero/Human-Lab-WF1-Sandbox` (and local `rehearsals/github/Human-Lab-WF1-Sandbox/media/`).
5. Do **not** enable create-paused until phrase `APPROVE WF4 VIDEO CREATE-PAUSED V1`. First successful video write-back auto-migrates Drive flat image IDs into `variants.image-v1` and adds `variants.video-feed-v1`. No manual Drive edit unless migrate fails closed.
6. Leave existing Meta image campaigns (and orphan `120250622864710199`) **PAUSED**.

## Dry-Run Test

1. Keep workflow **inactive**.
2. After importing this SDK, Manual run with defaults (`mode=dry_run`, `approval=false`).
3. Expect **Respond Dry Run** with `metaHttpCalls: 0`, `driveWrites: 0`.
4. Confirm create-paused + creative download/upload nodes remain **disabled**.

Local proofs (no n8n required):

```bash
node rehearsals/wf4-meta-ads-sandbox/scripts/wf4-rehearse.js
node rehearsals/wf4-meta-ads-sandbox/scripts/wf4-resolve-creative.js
```

Do not enable create-paused without explicit operator approval.
