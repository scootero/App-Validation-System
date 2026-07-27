# Agent entry

Read this first. Then open **only** the files relevant to the task.

## Roles

| Who | Owns |
|-----|------|
| **Human** | Priorities, spend, credentials, production, destructive actions, “good enough” |
| **Cursor** | Inspect repo, plan smallest change, implement, test, update living docs, report evidence |
| **ChatGPT** | Cross-system tradeoffs, safety design, challenge overengineering — not file-level work or living status |
| **Repo** | Source of truth. Prefer schemas/tests/code over prose. |

## Read order

1. `project/STATUS.md` — current milestone
2. `project/PROJECT.md` — goal and non-goals (if scope unclear)
3. `project/SYSTEM.md` — only if touching architecture or integrations
4. `project/DECISIONS.md` — only if reversing or extending a locked choice
5. `tech/*` — only for stack-specific build/test rules
6. Code, schemas, tests — authoritative for behavior

Do **not** reconstruct the project from chat. Do **not** create handoff docs.

## Default loop

1. **Spike** — cheapest experiment for the biggest unknown (disposable OK)
2. **Contract** — only if multi-system agreement, persistence, money, or irreversible risk
3. **Implement** — narrowest change that can make the demo green
4. **Prove** — run checks / real evidence; record in `PROOFS.md` when promoting a slice
5. **Update** — `STATUS.md` always; `SYSTEM.md` / `DECISIONS.md` only when proven behavior or a durable decision changed

## Stop and ask the human when

- Credentials, secrets, or production access needed
- Paid / spend / financial side effects
- Destructive deletes or irreversible account changes
- Architecture ownership or sequencing is unclear
- Scope would expand past the active milestone

## Report format

Return briefly:

- Changed files
- What was proven (commands, IDs, results)
- Failures / blockers
- Unresolved decisions needing human input
- Whether `STATUS.md` was updated

## Anti-patterns (warn the human)

- Scope drift past the active milestone
- New abstraction before 3 real uses (rule of three)
- Docs that restate code/schemas
- Planning instead of a small reversible experiment
- Second progress/handoff/canonical file for the same fact
