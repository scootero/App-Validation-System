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
