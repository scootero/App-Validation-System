# WF3 n8n Sandbox Artifact

**Canonical.** Do not edit production `n8n-workflows/` until Spec 1.5.0 pass.

## Live workflow

| Field | Value |
|-------|--------|
| Name | `WF3 - Tracking Sandbox` |
| ID | `7G2fJmqKsr8CGVID` |
| Active | `true` |
| Base URL | `https://scottyo.app.n8n.cloud` |
| Production webhook | `https://scottyo.app.n8n.cloud/webhook/app-validation/human-lab-wf1-sandbox-events` |
| Credential | `Google Service Account account` (`AW9ZTTTBz7JeSKKN`) |

## Files

| File | Purpose |
|------|---------|
| `wf3-tracking-sandbox.workflow.ts` | SDK source used to create the workflow |
| `WF3-tracking-sandbox.export.json` | Full node/connection export (importable shape) |
| `WF3-tracking-sandbox.canonical-meta.json` | Proven IDs + 33-column list |

## Promote

See `../PRODUCTION-PROMOTION-CHECKLIST.md`. Parameterize Sheet ID and webhook path; do not copy sandbox Sheet ID blindly into production.
