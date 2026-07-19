# Prompt 2 Progress — Image Create-Paused V1

**Status:** Not started

**On resume:** Read this file first, then [`PROMPT-2.md`](PROMPT-2.md). Continue only the next unchecked phase after Scott approves.

**Related:**

- Prompt: [`PROMPT-2.md`](PROMPT-2.md)
- Proof SSOT: [`../external-proof-status.md`](../external-proof-status.md)
- Canonical: [`../CANONICAL-WF4.md`](../CANONICAL-WF4.md)
- Creative specs (living, created in Phase 1): [`../CREATIVE-ASSET-SPECS.md`](../CREATIVE-ASSET-SPECS.md)

---

## Prerequisites (from Prompt 1)

- [ ] Prompt 1 verdict PASS
- [ ] Live dry_run execution ID recorded
- [ ] Live WF4 inactive, clean graph, create-path disabled
- [ ] Prompt 1 handoff pasted into the Prompt 2 chat

Prompt 1 execution ID: `_pending_`

Prompt 1 handoff summary: `_pending_`

---

## Phase checklist

### Phase 1 — Blockers + living creative specs (plan only)

- [ ] Blocker table completed
- [ ] `CREATIVE-ASSET-SPECS.md` created/updated (living stub OK)
- [ ] Actual `og-image.png` dimensions/MIME/size recorded
- [ ] Feed-first V1 placements proposed
- [ ] Stories/Reels marked out of V1 (unless Scott approved variants)
- [ ] Scott approved moving to Phase 2

### Phase 2 — Idempotency contract (design only)

- [ ] Same-request behavior defined
- [ ] Concurrent single-writer design defined
- [ ] Partial-failure resume defined
- [ ] Post-Meta / pre-ledger reconciliation defined
- [ ] Revision model defined
- [ ] Operation fingerprint includes creative SHA-256 (not timestamp-only)
- [ ] Scott approved moving to Phase 3

### Phase 3 — Approval-token design (design only)

- [ ] Secret storage location proposed
- [ ] Operator setup steps proposed
- [ ] Redacted logging / rotation / rollback proposed
- [ ] Gate requirements listed (mode + approval + token + caps + locks)
- [ ] Scott approved design

### Phase 4 — Implement gates, idempotency, recovery

- [ ] Approval check implemented
- [ ] Deterministic operation key implemented
- [ ] Duplicate detection implemented
- [ ] Concurrency protection implemented
- [ ] Ledger phases / resume-from-partial implemented
- [ ] Local rehearsal PASS
- [ ] Live dry_run PASS
- [ ] Missing-token → zero writes
- [ ] Wrong-token → zero writes
- [ ] approval=false → zero writes
- [ ] Over-budget → zero writes
- [ ] Duplicate-operation dry test PASS
- [ ] Partial-failure simulation documented/proven
- [ ] Concurrent-lock: live-proven **or** design/simulation-proven (circle which)
- [ ] Scott approved moving to Phase 5

### Phase 5 — Create-paused preflight

- [ ] Full preflight table presented
- [ ] Waiting for exact phrase: `APPROVE WF4 IMAGE CREATE-PAUSED V1`
- [ ] Exact phrase received from Scott

### Phase 6 — One PAUSED image-ad proof

- [ ] Operation lock claimed
- [ ] Image uploaded; `image_hash` captured
- [ ] Campaign PAUSED
- [ ] Ad Set PAUSED
- [ ] Creative created
- [ ] Ad PAUSED
- [ ] Zero delivery / zero spend
- [ ] Ledger complete
- [ ] ID write-back complete
- [ ] No ACTIVE incident (or incident paused + reported)

Meta IDs:

- Campaign: `_pending_`
- Ad Set: `_pending_`
- Creative: `_pending_`
- Ad: `_pending_`
- Image hash: `_pending_`

### Phase 7 — Feed previews

- [ ] Facebook desktop Feed previewed
- [ ] Facebook mobile Feed previewed
- [ ] Instagram Feed previewed
- [ ] Stories/Reels disabled or separately approved
- [ ] Poor placements disabled or asset revision requested
- [ ] Preview evidence captured (no secrets)

### Phase 8 — Repeated-trigger live proof

- [ ] Same logical operation re-run
- [ ] Existing IDs reconciled; zero new objects
- [ ] Ledger `already_complete` (or equivalent)
- [ ] Deliberate new-revision procedure documented (not executed)

### Phase 9 — Documentation + Prompt 3 handoff

- [ ] Image-path operator docs updated
- [ ] Canonical metadata / proof logs updated
- [ ] Image V1 verdict recorded (PASS / PARTIAL / FAIL)
- [ ] Prompt 3 handoff written below

---

## Image V1 verdict

**Verdict:** `_pending_` (PASS / PARTIAL / FAIL)

**Notes:** `_pending_`

---

## Open blockers / wait for Scott

_None yet. Agent appends here at each stop._

---

## Latest compact handoff

```text
Status: Not started
Last completed phase: none
Next phase: Phase 1 (after Prompt 1 PASS)
Live WF4 ID: YIc53GBq4upelYp6
Dry-run execution ID: (from Prompt 1)
Create-paused: not started
Meta objects: none
Git: (update when relevant)
Blockers: waiting for Prompt 1 PASS + start of Prompt 2
Exact next action: Paste PROMPT-2.md + Prompt 1 handoff into a new Agent chat; agent reads this progress file first.
```

---

## Handoff history (append-only)

<!-- Agent: append dated mini-handoffs below; keep Latest compact handoff above current. -->
