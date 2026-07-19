# WF4 Final Prompts

Copy-paste agent prompts and living progress trackers for finishing WF4 / Meta Ads sandbox work.

**Order:** Prompt 1 → Prompt 2 → Prompt 3. Do not skip ahead.

| File | Role |
|------|------|
| [prompt-messages-intro.md](prompt-messages-intro.md) | Copy-paste starter messages for each new Agent chat |
| [PROMPT-1.md](PROMPT-1.md) | Verify live n8n, safely reconcile structural mismatches, one dry_run, document, stop |
| [PROMPT-2.md](PROMPT-2.md) | Image Create-Paused V1 (approval, idempotency, one PAUSED ad, previews) |
| [PROMPT-2-PROGRESS.md](PROMPT-2-PROGRESS.md) | Living checklist + latest handoff for Prompt 2 |
| [PROMPT-3.md](PROMPT-3.md) | After Image V1: video + remaining platform tracks (plan first) |
| [PROMPT-3-PROGRESS.md](PROMPT-3-PROGRESS.md) | Living checklist + latest handoff for Prompt 3 |

Related SSOT (do not replace these prompts):

- [`../external-proof-status.md`](../external-proof-status.md)
- [`../CANONICAL-WF4.md`](../CANONICAL-WF4.md)

## How to start

Easiest: copy the ready-made starter from [`prompt-messages-intro.md`](prompt-messages-intro.md) (Prompt 1 / 2 / 3 + resume variants).

1. Open a **new Agent-mode** chat.
2. Paste the Prompt 1 starter message from `prompt-messages-intro.md` (agent reads `PROMPT-1.md`).
3. When Prompt 1 returns **PASS**, use the Prompt 2 starter and paste the Prompt 1 handoff.
4. On every Prompt 2 / 3 phase stop, the agent must update the matching `*-PROGRESS.md` file.
5. When Image V1 is **PASS**, use the Prompt 3 starter + Prompt 2 handoff.

## Mid-chat / fresh-chat resume (Prompt 2 or 3)

1. Open a new Agent-mode chat.
2. Tell the agent: read `PROMPT-N-PROGRESS.md` first, then `PROMPT-N.md`.
3. Paste only the **Latest compact handoff** from the progress file (or ask the agent to load it from disk).
4. Scott must explicitly approve the next phase/track before implementation continues.

```text
Resume WF4 from progress docs.
Workspace: /Users/scott/Desktop/App-Validation/App-Validation-System
Read first:
  rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-2-PROGRESS.md
  rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-2.md
Continue only the next unchecked phase after my approval. Do not skip phases.
```

(Use PROMPT-3 files when resuming Prompt 3.)

## Progress file rules

- Checkboxes are the source of truth for what is done.
- After every approved phase: update checkboxes, overwrite/append **Latest compact handoff**, list blockers, then **stop**.
- Prompts (`PROMPT-*.md`) stay stable; progress files change.

## Flow

```text
PROMPT-1.md
  → dry_run PASS + external-proof-status update
PROMPT-2.md + PROMPT-2-PROGRESS.md
  → one phase at a time → Image V1 PASS
PROMPT-3.md + PROMPT-3-PROGRESS.md
  → planning-only first → one track at a time
```

## Hard invariants (all prompts)

- This is WF4 / WF-Ads, not WF5.
- Never print or commit secrets.
- Human activation / spend stays manual unless Scott separately approves a future product change.
- Repair guardrail: if a “fix” needs more than workflow JSON / import-ready alignment, fixture alignment, or narrowly scoped proof-doc changes → **stop and ask Scott**.
