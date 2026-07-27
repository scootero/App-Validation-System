# Prompt 2 Progress — Image Create-Paused V1

**Status:** Phase 6 PREP complete (2026-07-26). Safer probe proved new app write path (`campaignId=120250604736240199` with `is_adset_budget_sharing_enabled:false`). Adapter + live Process updated; local rehearse PASS; live dry_run exec **60** PASS (`metaHttpCalls=0`, `driveWrites=0`). Create path still disabled. **Do not run full Phase 6 until Scott sends exact approval phrase.**

**On resume:** Read this file first, then [`PROMPT-2.md`](PROMPT-2.md). Full Phase 6 only after Scott sends `APPROVE WF4 IMAGE CREATE-PAUSED V1`.

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
- [x] Scott approved moving to Phase 5

### Phase 5 — Create-paused preflight

- [x] Full preflight table presented
- [x] Waiting for exact phrase: `APPROVE WF4 IMAGE CREATE-PAUSED V1`
- [x] Exact phrase received from Scott

### Phase 5.5 — Blocker clearance (no Meta writes) — 2026-07-20

- [x] `mergeAdsMetaWriteBack` + local rehearse PASS
- [x] Fixture dims 1734×907
- [x] Local `workflow.ts`: disabled mid-phase ledger upserts + verified-only Drive write-back chain
- [x] Live Data Table: 8 Phase-4 columns added
- [x] Live Config `fixtureAppJson` aligned to repo fixture SSOT
- [x] Live Ledger Upsert Planned / Mark Verified column maps expanded
- [x] Fingerprint reconcile: live exec **50** = repo SSOT `114e6616448920563bb41301292dfbddb1c48d32e2ab87df0a9e290b10881f6d`
- [x] Local rehearse PASS; live dry_run exec **50** PASS (`metaHttpCalls=0`, `driveWrites=0`)
- [x] Live canvas: mid-phase upsert + Drive write-back nodes synced (**37** nodes; all create/ledger/Drive disabled)
- [x] Import-ready JSON regenerated / drift PASS vs live (`workflow.ts` ↔ import-ready ↔ live)
- [x] Final dry_run after live sync — exec **51** PASS (`metaHttpCalls=0`, `driveWrites=0`)
- [x] Header Auth / dual-token gates **removed** (2026-07-21); dry_run exec **53** PASS (tokenless failures only)

### Phase 6 — One PAUSED image-ad proof

- [x] Operation lock claimed *(ledger planned upsert on exec 54; no Meta IDs)*
- [ ] Image uploaded; `image_hash` captured
- [ ] Campaign PAUSED
- [ ] Ad Set PAUSED
- [ ] Creative created
- [ ] Ad PAUSED
- [x] Zero delivery / zero spend *(no Meta objects created)*
- [ ] Ledger complete
- [ ] ID write-back complete
- [x] No ACTIVE incident (or incident paused + reported) *(none created)*

Meta IDs:

- Campaign: `_none_ — Create Campaign failed`
- Ad Set: `_none_`
- Creative: `_none_`
- Ad: `_none_`
- Image hash: `_none_`

**Phase 6 execution:** `54` — **FAIL**  
**Blocker:** Meta Graph `POST /act_979257825150251/campaigns` → HTTP 400 OAuthException code **200** `"API access blocked."` fbtrace `AlDDQr1uZSKx6XygxOyZKxT`  
**Credential used:** `Meta Marketing API - Orro` (`pphgFAkucBMaBs8A`) — attached correctly on the node  
**Gates:** `createPathOpen=true` (mode/approval/hard-gate all passed)  
**Drive write-back:** not reached  
**Safety restore:** applied — create path disabled; `_createPausedAllowed=false`; `mode=dry_run`; `approval=false`; workflow inactive

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

1. **Meta Campaign POST blocked** (exec 54) — `API access blocked` OAuthException 200 / fbtrace `AlDDQr1uZSKx6XygxOyZKxT`. Read-only GETs (exec 56) show `ads_management`+`ads_read` **granted**, ad account ACTIVE+MANAGE, campaign list GET OK — **do not assume a missing scope**; use manual checklist (app mode / Access Tier / BM restriction / Meta support).
2. Do **not** activate WF4; do **not** spend; create path stays disabled until Scott re-approves Phase 6 retry.
3. Ledger reconcile for exec 54: **done** (exec 55).

### 2026-07-22 — Meta read-only diagnosis + ledger reconcile (no Phase 6 retry)

**Ledger (exec 55, workflow `ooM24nOGKfuefHVM`):**
- Preserved failed attempt as `operationKey=human-lab-wf1-sandbox|sandbox|meta|image-v1|failed-exec-54`
- `phase=failed`, `outcome=failed`, lock cleared, `resumeFrom` cleared
- `lastError` records exec54 OAuthException 200 + fbtrace
- Original `operationKey=human-lab-wf1-sandbox|sandbox|meta|image-v1` has **no** row (clean claim on retry)

**Meta GETs (exec 56, workflow `c445mYtMEfsQsJoA`) — confirmed only:**
| Check | Result |
|-------|--------|
| Token identity `/me` | id `122103688311393524`, name `Orro n8n` (≠ checklist id `61591805738163`) |
| Granted scopes `/me/permissions` | includes **`ads_management`**, **`ads_read`**, `business_management`, page/IG-related scopes (all `granted`) |
| `/me/businesses` | empty `data` |
| Ad accounts `/me/adaccounts` | `act_979257825150251` present; `account_status=1`; `disable_reason=0`; `user_tasks` DRAFT/ANALYZE/ADVERTISE/**MANAGE**; business Orro `1074341285117707` |
| Ad account detail | funding Mastercard present; `amount_spent=0`; `min_daily_budget=100`; ACTIVE |
| Business `1074341285117707` | name Orro; **`verification_status=not_verified`** |
| Business owned ad accounts | includes `act_979257825150251` ACTIVE |
| Page `1237104852815793` | published; IG `17841440875992246` / `@useorro` linked |
| Campaigns GET `limit=1` | HTTP 200, empty list (read path works) |
| Page `/roles` | needs Page token (190) — not used to infer campaign-create cause |
| App mode / Access Tier / debug_token app_id+type+expiry | **not** confirmed via these GETs |

**Not claimed:** which single permission is missing for the POST (`ads_management` is present on the token).

**WF4 safety (re-checked):** inactive; `mode=dry_run`; `approval=false`; `_createPausedAllowed: false`; create/ledger nodes disabled. No Meta POSTs this session.

---

## Latest compact handoff

```text
Status: Phase 6 PREP complete; create path still DISABLED
Probe: new app write OK — campaign 120250604736240199 PAUSED (needs is_adset_budget_sharing_enabled:false)
Adapter+live Process: field added; Process sha c774f000…; fingerprint 114e6616… unchanged
Local rehearse PASS; live dry_run exec 60 PASS — metaHttpCalls=0 driveWrites=0
WF4: inactive dry_run approval=false _createPausedAllowed=false create nodes disabled; Meta creds NOT on create nodes
Exact next: Scott sends APPROVE WF4 IMAGE CREATE-PAUSED V1 for full Phase 6
```

### 2026-07-26 — Phase 6 PREP (budget-sharing field; no create enablement)

- Safer probe PASS after adding `is_adset_budget_sharing_enabled: false` (old `API access blocked` resolved by new app)
- SSOT: `lib/meta-adapter.js` → synced `workflow.ts` + live Process + `process-jsCode.js`
- Fixture: `dry-run-payloads/human-lab-wf4-dry-run.json` updated
- Live dry_run exec **60** PASS — campaign payload includes new field; zero Meta/Drive writes
- STOP — wait for exact Phase 6 approval phrase

---

## Enablement procedure (document only — do not execute)

1. Exact phrase received + live mid-phase/Drive nodes present + drift PASS
2. Set `mode=create_paused`, `approval=true`
3. Flip `_createPausedAllowed=true`; enable create/ledger/**verified** write-back nodes for one run
4. Execute once; verify PAUSED + zero spend; ledger complete; **then** Drive `ads.meta` merge
5. Re-disable; `_createPausedAllowed=false`; leave inactive

---

## Phase 4 local proof summary (2026-07-19)

| Test | Result |
|------|--------|
| `node scripts/wf4-rehearse.js` | PASS (incl. gates, ledger decisions, redaction, Feed positions) |
| Live n8n dry_run | **PASS** execution `49` (zero writes + Phase 4 signals) |

## Blocker-clearance proof summary (2026-07-20)

| Test | Result |
|------|--------|
| Local rehearse (incl. `mergeAdsMetaWriteBack`) | PASS |
| Fixture dims 1734×907 | PASS |
| Live dry_run exec **50** | PASS — fingerprint `114e6616…`; `metaHttpCalls=0`; `driveWrites=0` |
| Live dry_run exec **51** (post mid-phase sync) | PASS — same fingerprint; `metaHttpCalls=0`; `driveWrites=0`; `_createPausedAllowed=false` |
| Live Data Table 8 columns | PASS |
| Live Config fixture = repo fixture | PASS |
| Live mid-phase + Drive nodes | **PASS** — 37 nodes; create path via disabled Prepare/Upsert; write-back after Ledger Mark Verified |
| Google SA on Drive nodes | **applied** via `setNodeCredential` (`AW9ZTTTBz7JeSKKN`); details API may redact credentials |
| Header Auth exact name | **superseded** — token gates removed 2026-07-21 |
| Drift workflow.ts ↔ import-ready ↔ live | **PASS** |

## Token-gate removal proof summary (2026-07-21)

| Test | Result |
|------|--------|
| Local rehearse (tokenless gates) | PASS |
| Live Config: no `approvalToken` / `wf4CreatePausedApprovalToken` | PASS |
| Live Process: no dual-token compare | PASS — sha `983f3c95…` |
| Live dry_run exec **52** | FAIL — bad fixture (missing `experiment.testBudget`); fixed |
| Live dry_run exec **53** | PASS — `metaHttpCalls=0`; `driveWrites=0`; failures = mode/approval/hard-gate only |
| Import-ready / drift | PASS |

---

## Handoff history (append-only)

### 2026-07-19 — Phase 5 preflight complete

- Full create-paused preflight table presented
- Scott confirmed: **no ledger-only waiver**
- STOP — wait for exact phrase

### 2026-07-20 — Blocker clearance PARTIAL

- Adapter: `mergeAdsMetaWriteBack` (verified-complete only)
- Fixture dims fixed; Config live aligned; fingerprint SSOT `114e6616…` (exec 50)
- Local workflow.ts: mid-phase upserts + Drive write-back (all disabled)
- Live: 8 ledger columns; Planned/Verified maps updated; **mid-phase/Drive nodes not yet on canvas**
- Header Auth vault not created
- Phase 6 **not safe** until live sync + credential + drift PASS
- STOP

### 2026-07-20 — Blocker clearance continued (live sync finish)

- Live MCP patches: Campaign/AdSet/Image/Creative mid-phase Prepare+Upsert + Drive write-back chain (all `disabled: true`)
- Live `nodeCount` **23 → 37**; create-path skip edges removed
- Regenerated `n8n/WF4-meta-ads-sandbox.import-ready.json` from live version export
- Drift check **PASS**
- Dry_run exec **51** PASS — zero Meta/Drive writes
- Header Auth exact name still **not** in vault
- Phase 6 **still NOT SAFE** — wait for credential rename + exact phrase
- STOP

### 2026-07-21 — Token gates removed (no Phase 6)

- Removed Header Auth requirement + dual-token runtime compare from adapter, Process, Config, tests, docs
- Live Config token fields deleted; fixture restored to repo SSOT (`experiment.testBudget`)
- Live Process synced (sha `983f3c95…`); import-ready regenerated; drift PASS
- Dry_run exec **53** PASS — zero writes; gate failures no longer include token errors
- Phase 6 **not started** — still need Meta cred attach + enable create path + flip hard gate
- STOP

### 2026-07-21 — Phase 6 create-paused attempt FAIL

- Enabled one-run: Meta Orro + Google SA attached; `mode=create_paused`; `approval=true`; `_createPausedAllowed=true`; create/ledger/Drive nodes enabled; workflow stayed inactive
- Exec **54** FAIL at **Create Campaign PAUSED** — Meta `API access blocked` (OAuthException 200)
- No campaign/ad set/creative/ad created; no Drive write-back; zero spend
- Ledger: Planned upsert (`phase=planned`, `outcome=in_progress`) — reconcile before retry
- Safety restored: create path disabled; dry_run; `_createPausedAllowed=false`; inactive
- STOP — wait for Meta API access fix
