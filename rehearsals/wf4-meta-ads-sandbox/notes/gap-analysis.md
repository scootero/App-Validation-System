# WF4 Gap Analysis

## Proven

- Local dry-run bundle builder (`scripts/wf4-rehearse.js`)
- Idempotency refusal when any `ads.meta.*` ID exists
- Triple approval contract (`mode` + `approval` + n8n token)
- Prompt A reconciled (`notes/meta-research-prompt-a-results.md`) — Meta-dependent dry-run fields resolved
- Inactive n8n workflow dry-run execution (execution **35**)
- Zero Meta HTTP and zero Drive mutations in dry-run
- Provider-neutral `ads.*` / Meta `ads.meta.*` split documented

## Remaining (blocking create-paused)

| Item | Owner | Priority |
|------|-------|----------|
| Manual Meta account setup | Operator | P1 |
| Prompt B account inspection YAML | Operator | P1 |
| Meta credential attach in n8n (system user) | Operator | Before create-paused |
| Approval token in n8n Credentials | Operator | Before create-paused |
| Account `min_daily_budget` vs $1/day | Operator / Prompt B | Before create-paused |
| Drive read (replace fixture) for production path | Cursor | Spec 1.5.0 pass |
| Sheet Meta column writer | Cursor | Create-paused follow-up |
| Spec 1.5.0 production doc sync | Cursor | After operator approves payloads |

## Cursor Tasks

- Maintain workflow export + canonical meta after n8n changes
- Implement Drive read path when promoting beyond fixture
- Wire remaining create-paused nodes when approved (sequence includes image upload)
- Spec 1.5.0 coordinated update (blueprint, backlog, starter)

## Web AI / Operator Tasks

- Read-only Meta Business inspection (Prompt B)
- Return filled account YAML (no tokens)
- Confirm Page / `instagram_user_id` readiness
