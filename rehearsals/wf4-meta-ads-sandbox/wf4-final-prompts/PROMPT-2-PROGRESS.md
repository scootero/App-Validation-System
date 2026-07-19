# Prompt 2 Progress — Image Create-Paused V1

**Status:** Phase 4 local implementation PASS — awaiting Scott approval for Phase 5 (live n8n sync + dry_run still operator-gated)

**On resume:** Read this file first, then [`PROMPT-2.md`](PROMPT-2.md). Continue only the next unchecked phase after Scott approves.

**Related:**

- Prompt: [`PROMPT-2.md`](PROMPT-2.md)
- Proof SSOT: [`../external-proof-status.md`](../external-proof-status.md)
- Canonical: [`../CANONICAL-WF4.md`](../CANONICAL-WF4.md)
- Creative specs (living): [`../CREATIVE-ASSET-SPECS.md`](../CREATIVE-ASSET-SPECS.md)
- Create-paused contract: [`../architecture/CREATE-PAUSED-V1-CONTRACT.md`](../architecture/CREATE-PAUSED-V1-CONTRACT.md)

---

## Prerequisites (from Prompt 1)

- [x] Prompt 1 verdict PASS
- [x] Live dry_run execution ID recorded
- [x] Live WF4 inactive, clean graph, create-path disabled
- [x] Prompt 1 handoff pasted into the Prompt 2 chat

Prompt 1 execution ID: `48`

Prompt 1 handoff summary: PASS — live WF4 `YIc53GBq4upelYp6` inactive; dry_run execution 48; create-path disabled; `_createPausedAllowed: false`.

---

## Phase checklist

### Phase 1 — Blockers + living creative specs (plan only)

- [x] Blocker table completed
- [x] `CREATIVE-ASSET-SPECS.md` created/updated (living stub OK)
- [x] Actual `og-image.png` dimensions/MIME/size recorded
- [x] Feed-first V1 placements proposed
- [x] Stories/Reels marked out of V1 (unless Scott approved variants)
- [x] Scott approved moving to Phase 2

### Phase 2 — Idempotency contract (design only)

- [x] Same-request behavior defined
- [x] Concurrent single-writer design defined
- [x] Partial-failure resume defined
- [x] Post-Meta / pre-ledger reconciliation defined
- [x] Revision model defined
- [x] Operation fingerprint includes creative SHA-256 (not timestamp-only)
- [x] Scott approved moving to Phase 3 *(combined 2+3)*

### Phase 3 — Approval-token design (design only)

- [x] Secret storage location proposed
- [x] Operator setup steps proposed
- [x] Redacted logging / rotation / rollback proposed
- [x] Gate requirements listed (mode + approval + token + caps + locks)
- [x] Scott approved design

### Phase 4 — Implement gates, idempotency, recovery

- [x] Approval check implemented
- [x] Deterministic operation key implemented
- [x] Duplicate detection implemented
- [x] Concurrency protection implemented
- [x] Ledger phases / resume-from-partial implemented *(decision + seeding; mid-phase Data Table upsert nodes still deferred to create enablement)*
- [x] Local rehearsal PASS
- [ ] Live dry_run PASS *(blocked: n8n MCP unavailable; live workflow not yet re-synced from workflow.ts)*
- [x] Missing-token → zero writes
- [x] Wrong-token → zero writes
- [x] approval=false → zero writes
- [x] Over-budget → zero writes
- [x] Duplicate-operation dry test PASS
- [x] Partial-failure simulation documented/proven
- [x] Concurrent-lock: **simulation-proven**
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

1. **Approve Phase 4 → Phase 5** after reviewing local proofs.
2. **Live n8n sync:** Re-import/update live WF4 `YIc53GBq4upelYp6` from [`wf4-meta-ads-sandbox.workflow.ts`](../n8n/wf4-meta-ads-sandbox.workflow.ts) (or export→import-ready), then Manual `dry_run` — expect `metaHttpCalls: 0`, new `operationKey`, Feed positions, `approvalGate` redacted. n8n MCP was unavailable this session.
3. Before create-paused: add ledger Data Table columns (`environment`, `creativeRevision`, `contentFingerprint`, `creativeSha256`, `lockOwner`, `lockExpiresAt`, `resumeFrom`, `outcome`) + mid-phase upsert nodes on create enablement.
4. Create Header Auth vault when ready (still empty Config token until enablement).
5. Do **not** create Meta objects until exact phrase: `APPROVE WF4 IMAGE CREATE-PAUSED V1`

---

## Latest compact handoff

```text
Status: Phase 4 local PASS — live dry_run pending n8n sync; create-path still disabled
Last completed phase: Phase 4 (local gates/idempotency/resume simulation)
Next phase: Phase 5 preflight — after Scott approves + live dry_run recorded
Live WF4 ID: YIc53GBq4upelYp6 (repo SDK updated; live may lag until re-sync)
Dry-run execution ID: 48 (Prompt 1); Phase 4 live dry_run: pending
Create-paused: NOT enabled (_createPausedAllowed=false)
Meta objects: none
operationKey: human-lab-wf1-sandbox|sandbox|meta|image-v1
contentFingerprint: 114e6616448920563bb41301292dfbddb1c48d32e2ab87df0a9e290b10881f6d
creativeSha256: ae73b936b39bb5d86c357c9bb2aab8d10b5b017f09d17e43a908ac49ce7e055d
Placements: facebook_positions=[feed], instagram_positions=[stream]
Local proofs: wf4-rehearse.js PASS; wf4-resolve-creative.js PASS; concurrent-lock simulation-proven
Git: adapter + workflow.ts + fixtures + dry-run payload + progress (uncommitted unless Scott asks)
Exact next action: Scott reviews Phase 4; sync live n8n; approve Phase 5 — still no Meta creates without exact phrase
```

---

## Phase 4 local proof summary (2026-07-19)

| Test | Result |
|------|--------|
| `node scripts/wf4-rehearse.js` | PASS (incl. gates, ledger decisions, redaction, Feed positions) |
| `node scripts/wf4-resolve-creative.js` | PASS (SHA matches Phase 1) |
| Missing / wrong token / approval=false / over-budget | PASS → `createPathOpen=false` |
| Partial resume simulation | PASS → `resume` + reuse `campaignId` |
| Lock held / expired | PASS (simulation-proven) |
| already_complete | PASS |
| revision_conflict | PASS |
| Live n8n dry_run | Pending sync (MCP down) |

---

## Handoff history (append-only)

### 2026-07-19 — Phase 1 complete

- Measured og-image; created CREATIVE-ASSET-SPECS.md; Feed-first policy

### 2026-07-19 — Phases 2+3 design complete

- CREATE-PAUSED-V1-CONTRACT.md + OPERATION-LEDGER.md

### 2026-07-19 — Phase 4 local implement

- Adapter: operationKey, contentFingerprint, evaluateLedgerDecision, evaluateCreatePausedGates, redact, Feed positions
- Process: WF4_CREATIVE_SHA256 config, approvalGate redacted, `_createPausedAllowed=false`
- Ledger Idempotency Check: resume / already_complete / lock / revision_conflict
- Local rehearse + resolve PASS; live dry_run pending n8n re-sync
