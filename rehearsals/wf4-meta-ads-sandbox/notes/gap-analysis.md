# WF4 Gap Analysis

## Proven

- Local dry-run bundle builder (`scripts/wf4-rehearse.js`)
- Idempotency refusal when any `ads.meta.*` ID exists
- Triple approval contract (`mode` + `approval` + n8n token)
- VERIFY_* placeholders for all Meta-dependent fields
- Inactive n8n workflow dry-run execution (execution 30)
- Zero Meta HTTP and zero Drive mutations in dry-run
- Provider-neutral `ads.*` / Meta `ads.meta.*` split documented

## Remaining (non-blocking for dry-run)

| Item | Owner | Priority |
|------|-------|----------|
| Meta API verification (objective, billing, optimization, budget units, special ad categories, interest IDs) | Web AI / operator | P1 |
| Return Section B YAML from external handoff | Operator | P1 |
| Meta credential attach in n8n | Operator | Before create-paused |
| Approval token in n8n Config Set | Operator | Before create-paused |
| Drive read (replace fixture) for production path | Cursor | Spec 1.5.0 pass |
| Sheet Meta column writer | Cursor | Create-paused follow-up |
| Spec 1.5.0 production doc sync | Cursor | After operator approves payloads |

## Cursor Tasks

- Maintain workflow export + canonical meta after n8n changes
- Implement Drive read path when promoting beyond fixture
- Wire remaining create-paused nodes when approved
- Spec 1.5.0 coordinated update (blueprint, backlog, starter)

## Web AI Tasks

- Read-only Meta Business inspection
- Return filled Section B YAML (no tokens)
- Verify current Marketing API mappings
