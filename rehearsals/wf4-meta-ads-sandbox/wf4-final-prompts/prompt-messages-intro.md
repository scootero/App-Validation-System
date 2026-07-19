# Prompt starter messages

Copy one of these into a **new Agent-mode** chat to start that phase. The agent should then read the linked prompt file (and progress file when noted).

Paths are relative to the workspace root:

`/Users/scott/Desktop/App-Validation/App-Validation-System`

---

## Prompt 1 — start message

```text
Start WF4 Prompt 1: Verification and Safe Reconciliation.

Workspace: /Users/scott/Desktop/App-Validation/App-Validation-System

Read and follow exactly:
rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-1.md

Also skim:
rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/README.md

Agent mode. Independently verify claims. One live dry_run only after local proof + clean live match. Update external-proof-status.md after PASS. Stop when Prompt 1 says stop. Do not start Prompt 2, approval tokens, create-paused, video, or Meta writes.
```

---

## Prompt 2 — start message

Use only after Prompt 1 returns **PASS**. Paste your Prompt 1 handoff in the placeholder.

```text
Start WF4 Prompt 2: Image Create-Paused V1 Completion.

Workspace: /Users/scott/Desktop/App-Validation/App-Validation-System

Read first (in order):
1. rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-2-PROGRESS.md
2. rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-2.md

Also skim:
rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/README.md

Prompt 1 PASS handoff:
---
[PASTE PROMPT 1 HANDOFF HERE]
---

Work one phase at a time. After each approved phase: update PROMPT-2-PROGRESS.md (checkboxes + Latest compact handoff), then STOP and wait for my approval before Phase N+1.

Do not create Meta objects until I send exactly: APPROVE WF4 IMAGE CREATE-PAUSED V1
Do not implement video. Do not activate ads. Do not spend.
```

### Prompt 2 — resume mid-work

```text
Resume WF4 Prompt 2 from progress docs.

Workspace: /Users/scott/Desktop/App-Validation/App-Validation-System

Read first:
1. rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-2-PROGRESS.md
2. rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-2.md

Continue only the next unchecked phase after I approve it. Update PROMPT-2-PROGRESS.md after the phase, then stop. Do not skip phases. Do not create Meta objects without the exact approval phrase.
```

---

## Prompt 3 — start message

Use only after Prompt 2 Image V1 is **PASS** (or PARTIAL with explicit gaps). Paste your Prompt 2 handoff in the placeholder.

```text
Start WF4 Prompt 3: Platform completion after Image V1.

Workspace: /Users/scott/Desktop/App-Validation/App-Validation-System

Read first (in order):
1. rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-3-PROGRESS.md
2. rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-3.md

Also skim:
rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/README.md

Prompt 2 handoff:
---
[PASTE PROMPT 2 HANDOFF HERE]
---

First response must be PLANNING ONLY (maturity scorecard, backlog, P0 decision rule, recommended track). Update PROMPT-3-PROGRESS.md with the planning outcome. Do not implement anything until I select or approve a track.

Do not activate ads. Do not spend. Do not create Meta objects without the exact video approval phrase when we reach that step.
```

### Prompt 3 — resume mid-work

```text
Resume WF4 Prompt 3 from progress docs.

Workspace: /Users/scott/Desktop/App-Validation/App-Validation-System

Read first:
1. rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-3-PROGRESS.md
2. rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-3.md

Continue only the selected track’s next unchecked phase after I approve it. One track at a time. Update PROMPT-3-PROGRESS.md after each substantial phase, then stop.
```

---

## Quick order

1. Prompt 1 start message → PASS + handoff  
2. Prompt 2 start message (+ handoff) → Image V1 PASS + handoff  
3. Prompt 3 start message (+ handoff) → planning → you pick a track  
