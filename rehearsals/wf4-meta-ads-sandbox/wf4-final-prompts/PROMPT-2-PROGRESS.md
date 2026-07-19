# Prompt 2 Progress — Image Create-Paused V1

**Status:** Phase 4 complete — live Process verified + Respond/Ledger patched + dry_run `49` PASS. Waiting for Scott to approve Phase 5.

**On resume:** Read this file first, then [`PROMPT-2.md`](PROMPT-2.md). Continue only the next unchecked phase after Scott approves.

**Related:**

- Prompt: [`PROMPT-2.md`](PROMPT-2.md)
- Proof SSOT: [`../external-proof-status.md`](../external-proof-status.md)
- Canonical: [`../CANONICAL-WF4.md`](../CANONICAL-WF4.md)
- Creative specs (living): [`../CREATIVE-ASSET-SPECS.md`](../CREATIVE-ASSET-SPECS.md)
- Create-paused contract: [`../architecture/CREATE-PAUSED-V1-CONTRACT.md`](../architecture/CREATE-PAUSED-V1-CONTRACT.md)
- Phase 4 sync artifacts: [`../n8n/.phase4-sync/`](../n8n/.phase4-sync/)

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
- [x] Live Process jsCode manually pasted from `.phase4-sync/process-jsCode.js`
- [x] Live Process paste verified (bytes **39269**, SHA-256 `9f10544340c80f3e2c240f640bb200efb65bd9801ae482a1e809d152c1604a96`)
- [x] Respond Dry Run + Ledger Idempotency Check aligned to Phase 4 (MCP patches from `.phase4-sync/`; Ledger remains **disabled**)
- [x] Live dry_run PASS — execution **`49`**
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

1. **Approve Phase 5** (create-paused preflight only — no Meta writes yet).
2. Before create-paused: add ledger Data Table columns (`environment`, `creativeRevision`, `contentFingerprint`, `creativeSha256`, `lockOwner`, `lockExpiresAt`, `resumeFrom`, `outcome`) + mid-phase upsert nodes on create enablement.
3. Create Header Auth vault when ready (keep Config token empty until enablement).
4. Do **not** create Meta objects until exact phrase: `APPROVE WF4 IMAGE CREATE-PAUSED V1`

---

## Latest compact handoff

```text
Status: Phase 4 COMPLETE — waiting Scott approve Phase 5
Last completed: Live Process verified (39269 / 9f105443…); Respond+Ledger patched from .phase4-sync; dry_run execution 49 PASS
Proof: metaHttpCalls=0, driveWrites=0, externalWritePerformed=false
Phase4 signals: operationKey=human-lab-wf1-sandbox|sandbox|meta|image-v1; creativeSha256=ae73b936…; contentFingerprint=2c5c0a2b…; approvalGate.createPathOpen=false; Feed facebook_positions=[feed] instagram_positions=[stream]
Live WF4 ID: YIc53GBq4upelYp6 (inactive; create-path disabled; Ledger Idempotency still disabled)
Process node: 5392da6c-0590-432b-b497-414bbc77bfcd (evaluateCreatePausedGates + WF4_CREATIVE_SHA256 present)
Config: WF4_CREATIVE_SHA256 + environment=sandbox + workflowVersion=wf4-image-v1; approval token empty
Dry-run: Prompt 1 = 48; Phase 4 live = 49 PASS
Create-paused: NOT enabled (_createPausedAllowed=false)
Meta objects: none
Exact next action: Scott approve Phase 5 preflight only — do NOT combine Phase 5+6; no Meta creates without exact phrase
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
| Live Process paste | VERIFIED 39269 / `9f105443…` (markers present) |
| Respond + Ledger MCP patch | Applied from `.phase4-sync/`; Ledger remains disabled |
| Live n8n dry_run | **PASS** execution `49` (zero writes + Phase 4 signals) |

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
- Local rehearse + resolve PASS

### 2026-07-19 — Live Process manually pasted

- Scott pasted `.phase4-sync/process-jsCode.js` into live **Process WF4 Dry Run**
- Path forward: verify hash/size + one dry_run; **no full-import**
- Respond/Ledger may still need small `.phase4-sync` patches

### 2026-07-19 — Phase 4 closeout complete

- Live Process verified: 39269 bytes / SHA-256 `9f10544340c80f3e2c240f640bb200efb65bd9801ae482a1e809d152c1604a96`
- MCP patched **Respond Dry Run** + **Ledger Idempotency Check** only (no full-import; create-path stayed disabled)
- Live dry_run execution **49** PASS: `metaHttpCalls=0`, `driveWrites=0`, `externalWritePerformed=false`
- `operationKey=human-lab-wf1-sandbox|sandbox|meta|image-v1`; Feed positions `feed` / `stream`; `createPathOpen=false`
- STOP — wait for Scott to approve Phase 5
