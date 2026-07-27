# Cursor milestone prompt

```text
Milestone: <NAME>
Definition of done: <one falsifiable sentence>

Read only if needed:
  project/STATUS.md
  project/PROJECT.md
  project/SYSTEM.md
  project/DECISIONS.md
  tech/<relevant>

Constraints:
  - Inspect the repo first; do not reconstruct context from chat
  - Smallest change that makes the demo green
  - Update project/STATUS.md when done (proven / blocked / next)
  - Update SYSTEM.md / DECISIONS.md / PROOFS.md only if proven behavior or a durable decision changed
  - No secrets in git
  - Stop before paid, destructive, credential, or production actions — ask me
  - Warn if this expands past the milestone, overengineers, or duplicates docs

Out of scope: <list>

First action: smallest experiment that could falsify the approach.
```
