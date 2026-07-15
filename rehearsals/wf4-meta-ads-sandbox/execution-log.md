# WF4 Execution Log

## 2026-07-15 — Dry-run sandbox proof

| Step | Status | Notes |
|------|--------|-------|
| Contract frozen | Done | `meta-ads-contract.md` with idempotency, triple approval, VERIFY_* |
| Local `wf4-rehearse.js` | PASS | Fixture + idempotency refusal tested |
| External setup package | Done | `EXTERNAL-SETUP-HANDOFF.md` A–E |
| n8n workflow created | Done | `YIc53GBq4upelYp6`, **inactive** |
| URLSearchParams fix | Done | n8n Code sandbox lacks URLSearchParams; manual UTM builder |
| Dry-run execution | PASS | Execution 30, Respond Dry Run |
| Zero mutations verified | PASS | metaHttpCalls=0, driveWrites=0 |

## Canonical Node Flow (proven)

Manual Run → Workflow Config → Process WF4 Dry Run → Triple Approval Gate → Respond Dry Run

Create-paused branch: disabled (Create Paused Blocked, Create Campaign PAUSED).

## Blockers before create-paused

- Meta API VERIFY_* values from operator/Web AI
- Meta credential attach
- Approval token in n8n
- Explicit operator approval
- Final payload review
