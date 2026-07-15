# WF4 Doc Drift and Required Updates

**Rule:** Do not edit production docs until Spec 1.5.0 coordinated pass.

## Proven in Sandbox (differs from production docs)

| Topic | Sandbox proof | Production doc state |
|-------|---------------|---------------------|
| Node count | 7 active + 2 disabled create-paused stubs | Blueprint lists 14 nodes, no dry-run/approval |
| Dry-run mode | Default `dry_run`, fixture `app.json` | Blueprint assumes Meta HTTP always |
| Triple approval | `mode` + `approval` + n8n token | Blueprint has no approval token |
| Idempotency | Mandatory pre-create check | Blueprint mentions partial create only |
| VERIFY_* fields | All Meta-dependent values placeholder | Blueprint has example `v21.0` |
| n8n Code constraint | No URLSearchParams in sandbox | Not documented |

## Files for Spec 1.5.0 Pass

- `n8n-workflows/WF-ADS-META-PIPELINE-BLUEPRINT.md`
- `n8n-workflows/WF4-N8N-AI-PROMPT.md` (create)
- `PLATFORM_SETUP_VALUES.md`
- `rehearsals/SANDBOX-MASTER-BACKLOG.md`
- `rehearsals/DEPENDENCY_GRAPH.md`
- `rehearsals/REUSABLE_COMPONENTS.md`
- `app-package-starter/README.md` (WF4 setup expectations)

## Schema Changes

None required for v1 dry-run. Conditional: `ads.specialAdCategories` if Meta verification requires it (BL-018).

## No Production Meta Writes

This rehearsal did not create or modify any production Meta assets.
