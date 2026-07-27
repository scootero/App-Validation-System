# AI Dev Starter

Reusable, project-agnostic starter for building software with **Cursor** (implementer) and **ChatGPT** (occasional architect). Copy this folder into a new repo and fill in `project/`.

The repository is the source of truth. Chat history is not.

## Contents

| File | Purpose |
|------|---------|
| [AGENTS.md](AGENTS.md) | Short entry for AI agents: roles, loop, read order |
| [project/PROJECT.md](project/PROJECT.md) | What you're building, MVP, non-goals |
| [project/STATUS.md](project/STATUS.md) | Only living progress: proven / blocked / next |
| [project/SYSTEM.md](project/SYSTEM.md) | Current architecture map (supported behavior only) |
| [project/DECISIONS.md](project/DECISIONS.md) | Locked decisions worth remembering |
| [project/PROOFS.md](project/PROOFS.md) | Evidence that a slice actually worked |
| [project/VALUES.example.yml](project/VALUES.example.yml) | Optional non-secret IDs / env pointers |
| [cursor-rules/](cursor-rules/) | Cursor rules — rename to `.cursor/rules/` in a real project |
| [tech/](tech/) | Drop project-specific tech rules here |
| [prompts/](prompts/) | Short Cursor / ChatGPT prompt templates |

## Start a new project

1. Copy `ai-dev-starter/` into your new repo (or move this folder out and rename).
2. Rename `cursor-rules/` → `.cursor/rules/` so Cursor loads the rules automatically.
3. Fill in `project/PROJECT.md`.
4. Set the first milestone in `project/STATUS.md` (one falsifiable demo).
5. Add tech rules under `tech/` only if needed (iOS, n8n, web, etc.).
6. Open the repo in Cursor and paste [prompts/cursor-milestone.md](prompts/cursor-milestone.md) with your objective filled in.
7. Use ChatGPT only between milestones via [prompts/chatgpt-review.md](prompts/chatgpt-review.md).

## What you must supply per project

- Product goal, users, MVP, and non-goals (`PROJECT.md`)
- First milestone definition of done (`STATUS.md`)
- Real components and integrations (`SYSTEM.md` as they appear)
- Tech stack build/test commands (`tech/` as needed)
- Secrets and credentials (never in git)

## Design intent

Smallest end-to-end slice → prove → record → harden. No duplicate progress docs, no giant handoffs, no architecture novels before proof.
