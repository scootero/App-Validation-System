# Prompt 2 Progress — Image Create-Paused V1

**Status:** Image V1 **PASS** (2026-07-27). Phase 8 already_complete + Phase 9 docs done. Objects remain **PAUSED**. WF4 create path stays disabled. **Not activated** — still `development_access` + business `not_verified`.

**On resume:** Prompt 2 is **complete**. For next work, paste the Prompt 3 handoff below into a new chat with [`PROMPT-3.md`](PROMPT-3.md). Do **not** re-enable create path without a new exact approval phrase. Do **not** start Prompt 3 until Scott explicitly asks.

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

- [x] Operation lock claimed *(exec 74 resume from creative; prior planned from 54 reconciled)*
- [x] Image uploaded; `image_hash` captured
- [x] Campaign created *(status PAUSED expected — Scott confirm in Ads Manager)*
- [x] Ad Set created *(status PAUSED expected — Scott confirm in Ads Manager)*
- [x] Creative created
- [x] Ad created *(status PAUSED expected — Scott confirm in Ads Manager)*
- [x] Zero delivery / zero spend *(created PAUSED via API; Scott confirm no spend in Ads Manager)*
- [x] Ledger complete through `phase=verified` *(later promoted to writeback_done in Phase 8)*
- [x] ID write-back complete *(repair exec **94**; live Merge node patched)*
- [x] No ACTIVE incident reported from WF4 create nodes

Meta IDs (ledger / writeBackMeta from exec **74**):

- Campaign: `120250607331460199`
- Ad Set: `120250622864980199`
- Creative: `1007406578799368`
- Ad: `120250622866330199`
- Image hash: `3dd4a70bea3678c35714a2d06d718c3c`

**Phase 6 execution:** `74` — create SUCCESS; Drive write-back later FIXED in **94**  
**Prior fail:** exec `54` — Meta `API access blocked` (resolved via new app + budget-sharing field)  
**Gates:** `createPathOpen=true` (mode/approval/hard-gate all passed)  
**Drive write-back:** FIXED via repair workflow `AhfEnOEMW7sbq3bR` exec **94**. Live WF4 Merge node patched to use `getBinaryDataBuffer`. File id `1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn` now has ads.meta IDs.  
**Note:** run resumed `resumeFrom=creative`; Create Campaign also returned orphan id `120250622864710199` (not used in ledger chain) — leave PAUSED / do not activate.  
**Safety restore:** applied — create path disabled; `_createPausedAllowed=false`; `mode=dry_run`; `approval=false`; workflow inactive

### Phase 7 — Feed previews

- [x] Facebook desktop Feed previewed *(exec 93 — preview iframe OK)*
- [x] Facebook mobile Feed previewed *(exec 93 — preview iframe OK)*
- [x] Instagram Feed previewed *(exec 93 — preview iframe OK)*
- [x] Stories/Reels disabled or separately approved *(V1 Feed-only; Stories/Reels out of scope)*
- [x] Poor placements disabled or asset revision requested *(none disabled; landscape Feed accepted for V1)*
- [x] Preview evidence captured (no secrets) *(n8n exec 93; iframe bodies present; tokens not copied into docs)*

### Phase 8 — Repeated-trigger live proof

- [x] Same logical operation re-run *(ledger evaluate on live row — create path NOT re-enabled)*
- [x] Existing IDs reconciled; zero new objects *(exec **95** already_complete; Meta GET exec **96** same IDs still PAUSED)*
- [x] Ledger `already_complete` (or equivalent) *(phase=`writeback_done`, outcome=`already_complete`)*
- [x] Deliberate new-revision procedure documented (not executed)

### Phase 9 — Documentation + Prompt 3 handoff

- [x] Image-path operator docs updated *(CREATE-PAUSED-V1-CONTRACT §B8 + A9)*
- [x] Canonical metadata / proof logs updated
- [x] Image V1 verdict recorded (PASS / PARTIAL / FAIL)
- [x] Prompt 3 handoff written below

---

## Image V1 verdict

**Verdict:** `PASS`

**Notes:** Exec 74 created PAUSED objects; 92/93/96 confirm PAUSED+$0+Feed previews; **94** Drive `ads.meta` write-back; **95** ledger `already_complete` + `writeback_done`. Create path remains disabled. Public delivery / Standard Access / business verify remain **out of Image V1 scope** (manual Meta UI + optional future activate phrase). Graph still needs Already Complete IF before any future create re-enablement.

---

## Open blockers / wait for Scott

1. **Prompt 2 complete** — paste Prompt 3 handoff when ready for video / remaining tracks.
2. **Real live delivery blocker:** Marketing API tier is `development_access`; Business Portfolio `verification_status=not_verified` (Scott in Meta UI).
3. **Before next create enablement:** add Already Complete IF short-circuit (Create Campaign still POSTs on resume — orphan `120250622864710199`).
4. Do **not** activate via WF4 create path without exact phrase; development-tier may not deliver publicly.

### 2026-07-27 — Phase 8 + Phase 9 complete

- Reused helper workflow `ooM24nOGKfuefHVM` as **WF4 Phase8 Idempotency Proof**
- Exec **95** SUCCESS: ledger decision `already_complete`; IDs match exec74; upserted `phase=writeback_done`, `outcome=already_complete`; zero Meta POSTs
- Exec **96** Meta readonly GET: campaign/adset/ad/orphan still PAUSED; `amount_spent=0`; insights empty
- WF4 `YIc53GBq4upelYp6` re-checked: inactive; `mode=dry_run`; `approval=false`; create nodes disabled
- Docs: CANONICAL, external-proof-status, CREATE-PAUSED-V1-CONTRACT, OPERATION-LEDGER, CREATIVE-ASSET-SPECS
- Image V1 verdict **PASS**; Prompt 3 handoff below
- STOP — do not start Prompt 3 until Scott asks

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
Status: Prompt 2 COMPLETE — Image V1 PASS
IDs: campaign 120250607331460199 | adset 120250622864980199 | creative 1007406578799368 | ad 120250622866330199 | hash 3dd4a70bea3678c35714a2d06d718c3c
Ledger: phase=writeback_done outcome=already_complete (exec 95)
Drive ads.meta: written (exec 94) file 1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn
Objects: PAUSED; $0; Feed previews OK (93/96); orphan 120250622864710199 leave PAUSED
WF4: inactive dry_run approval=false _createPausedAllowed=false create path DISABLED
Blocker for public delivery: development_access + business not_verified
Before next create: add Already Complete IF (Create Campaign still POSTs on resume)
Exact next: Scott starts Prompt 3 when ready (video + remaining tracks) — do NOT auto-start
```

### 2026-07-26 — Phase 6 PREP (budget-sharing field; no create enablement)

- Safer probe PASS after adding `is_adset_budget_sharing_enabled: false` (old `API access blocked` resolved by new app)
- SSOT: `lib/meta-adapter.js` → synced `workflow.ts` + live Process + `process-jsCode.js`
- Fixture: `dry-run-payloads/human-lab-wf4-dry-run.json` updated
- Live dry_run exec **60** PASS — campaign payload includes new field; zero Meta/Drive writes
- STOP — wait for exact Phase 6 approval phrase



### 2026-07-27 — Drive write-back repair (exec 94)

- Root cause: Merge decoded `item.binary.data.data === "filesystem-v2"` pointer instead of using `getBinaryDataBuffer`
- Repair workflow `AhfEnOEMW7sbq3bR` / exec **94** SUCCESS — Drive file updated `application/json`
- Live WF4 `YIc53GBq4upelYp6` Merge node patched with same fix (create path still disabled)
- Local `workflow.ts` + `import-ready.json` updated

### 2026-07-27 — Phase 7 Feed previews (API verify)

- Readonly workflow `c445mYtMEfsQsJoA` exec **92** (status) + **93** (insights+previews)
- Campaign/AdSet/Ad/orphan: all `status=PAUSED` / `effective_status=PAUSED`
- Account `amount_spent=0`; campaign insights `data=[]`
- Preview iframes returned for DESKTOP_FEED_STANDARD, MOBILE_FEED_STANDARD, INSTAGRAM_STANDARD
- Stories/Reels remain out of V1
- STOP short of ACTIVE: development_access tier + unverified business

### 2026-07-27 — Phase 6 create-paused PARTIAL (exec 74)

- Exact phrase received: `APPROVE WF4 IMAGE CREATE-PAUSED V1`
- Enabled one-run create path; manual exec **74**
- Meta creates SUCCESS: campaign `120250607331460199`, ad set `120250622864980199`, creative `1007406578799368`, ad `120250622866330199`, image_hash `3dd4a70bea3678c35714a2d06d718c3c`
- Ledger `phase=verified`
- Drive write-back FAIL at Merge (invalid JSON from Drive download)
- Safety restore applied (disabled create path; dry_run; hard gate false; inactive)
- Verdict **PARTIAL** — STOP for Scott PAUSED confirm + Phase 7

---

## Enablement procedure (document only — do not execute)

1. Exact phrase received + live mid-phase/Drive nodes present + drift PASS
2. **Prerequisite:** Already Complete IF short-circuit before Meta POSTs (see A9 caveat)
3. Set `mode=create_paused`, `approval=true`
4. Flip `_createPausedAllowed=true`; enable create/ledger/**verified** write-back nodes for one run
5. Execute once; verify PAUSED + zero spend; ledger complete; **then** Drive `ads.meta` merge
6. Re-disable; `_createPausedAllowed=false`; leave inactive

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

## Phase 8 idempotency proof summary (2026-07-27)

| Test | Result |
|------|--------|
| Ledger evaluate same op | **PASS** exec **95** — `already_complete`; IDs match |
| Ledger writeback_done | **PASS** — phase=`writeback_done`, outcome=`already_complete` |
| Meta GET same IDs | **PASS** exec **96** — all PAUSED; amount_spent=0 |
| Zero new Meta objects | **PASS** — no Meta POSTs this phase; create path stayed disabled |
| Deliberate new revision | Documented only; not executed |
| Full WF4 create re-trigger | **Not run** (unsafe until Already Complete IF) |

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

---

## Prompt 3 handoff (paste-ready)

```text
Prompt 2 COMPLETE — Image V1 PASS. Do NOT re-run create-paused without a new exact approval phrase.

Workspace: /Users/scott/Desktop/App-Validation/App-Validation-System

Read first:
1) rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-3-PROGRESS.md
2) rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-3.md
3) rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-2-PROGRESS.md (Image V1 PASS evidence)

Image V1 proof:
- Campaign 120250607331460199 | AdSet 120250622864980199 | Creative 1007406578799368 | Ad 120250622866330199
- image_hash 3dd4a70bea3678c35714a2d06d718c3c | orphan campaign 120250622864710199 leave PAUSED
- Ledger: operationKey human-lab-wf1-sandbox|sandbox|meta|image-v1 | phase=writeback_done | outcome=already_complete (exec 95)
- Drive ads.meta written (exec 94) file 1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn
- Feed previews OK (exec 93/96); Stories/Reels out of V1; amount_spent=0
- WF4 YIc53GBq4upelYp6 inactive; dry_run; approval=false; _createPausedAllowed=false; create path DISABLED

Known follow-ups (Prompt 3 / ops):
1) Meta Standard Access + business verify (Scott UI) before expecting public delivery
2) Add Already Complete IF before any future create re-enable (Create Campaign still POSTs on resume)
3) Video /advideos track per PROMPT-3.md — plan/audit first; wait for Scott track selection
4) Human activation remains manual — no WF4 auto-activate

First response of Prompt 3 must be planning/audit only per PROMPT-3.md.
```
