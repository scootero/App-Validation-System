# WF4 Create-Paused V1 Contract (Phases 2+3 Design)

**Status:** Image V1 create-paused **PASS** (2026-07-27). One PAUSED ad exists; Drive `ads.meta` written; ledger `phase=writeback_done` / `outcome=already_complete`. Create-path remains **disabled**; `_createPausedAllowed=false`; WF4 inactive. Runtime gates: `mode=create_paused` + `approval=true` + `_createPausedAllowed` + Triple IF + budget/ledger/creative.

**Variants (2026-07-28):** `ads.meta.variants[creativeRevision]` is SSOT for Meta IDs. Flat ID fields mirror `currentVariant`. New revision → new PAUSED Campaign/Ad Set (no reuse). Migrate-on-write-back seeds legacy flat IDs into `variants` (known image-v1 proof IDs → `image-v1`).
**Date:** 2026-07-27  
**Scope:** Image create-paused only.  
**Related:** [`OPERATION-LEDGER.md`](OPERATION-LEDGER.md), [`../CONFIG-DRIVEN-VS-HARDCODED.md`](../CONFIG-DRIVEN-VS-HARDCODED.md), [`../CREATIVE-ASSET-SPECS.md`](../CREATIVE-ASSET-SPECS.md)

### Write-back destination (Image V1 proof)

- Merge **`ads.meta.variants[creativeRevision]`** plus flat mirror of `currentVariant` into sandbox Drive file `1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn` (**proof-only** file ID — not long-term production lookup strategy).
- Write **after** full PAUSED verify only; partial IDs stay in the ledger. Prior variant keys are never deleted.
- On write-back, legacy flat-only IDs are migrated into `variants` in-memory (known Image V1 proof → `image-v1`) before merging the new revision.
- Root `status` unchanged.

### Approval / create gates (no Header Auth token)

- Exact operator phrase for Phase 6: `APPROVE WF4 IMAGE CREATE-PAUSED V1`
- Runtime: `mode=create_paused` AND `approval=true` AND `_createPausedAllowed===true` (Process + Triple Approval Gate IF)
- Config fields `approvalToken` / `wf4CreatePausedApprovalToken` **removed** (2026-07-21)
- Header Auth vault is **not** a WF4 runtime dependency (optional unused credential may remain in n8n)

---

## Part A — Idempotency & recovery (Phase 2)

### A1. Goals

When WF4 is triggered more than once for the same logical Image V1 operation:

1. Do **not** create duplicate Campaign / Ad Set / Creative / Ad.
2. Concurrent runs must have a single writer.
3. Partial failure must **resume** from the first incomplete stage (same fingerprint).
4. Meta-succeeded / ledger-failed must **reconcile**, not assume “nothing exists.”
5. Material config/creative change requires an explicit **new revision** (new operation key).

Timestamps are never the sole identity.

### A2. Identity model

#### `creativeRevision` (operator-controlled)

- Package/config field: `ads.meta.creativeRevision` (string).
- Image V1 default: `image-v1`.
- Deliberate new variant → operator sets a new value (e.g. `image-v1.1`) **before** re-running create-paused.
- Renaming the same binary file does **not** change revision; changing bytes does (via fingerprint).

#### `operationKey` (ledger unique match key)

```text
{appId}|{environment}|{provider}|{creativeRevision}
```

| Part | V1 value |
|------|----------|
| `appId` | e.g. `human-lab-wf1-sandbox` |
| `environment` | `sandbox` (from Config; never omit) |
| `provider` | `meta` |
| `creativeRevision` | `image-v1` (default) |

**Migration from current dry-run key** (`appId|experimentRunId|provider`): Phase 4 replaces `buildLedgerPlan` / ledger lookups with this key. `experimentRunId` remains recorded on the row for audit but is **not** part of uniqueness (avoids accidental new ops when run id churns).

Example:

```text
human-lab-wf1-sandbox|sandbox|meta|image-v1
```

#### `contentFingerprint` (byte-stable operation identity)

SHA-256 hex of a **canonical JSON** object (keys sorted, no whitespace variance) containing:

| Input | Source |
|-------|--------|
| `appId` | package |
| `environment` | config |
| `workflowVersion` | Config / canonical meta (e.g. import-ready version string) |
| `objective` | mapped Meta objective (`OUTCOME_TRAFFIC`) |
| `optimization` | `LINK_CLICKS` |
| `billing` | `IMPRESSIONS` |
| `landingUrl` | `deployment.landing.url` |
| `targetingFingerprint` | stable hash of locations, ageMin, ageMax, platforms, Feed-only positions |
| `budgetFingerprint` | `dailyBudgetUsd` + `currency` + `durationDays` + `totalAmount` |
| `creativeSha256` | SHA-256 of **image binary bytes** (not path/name) |
| `copyFingerprint` | stable hash of primary text, headline(s), description, CTA |
| `creativeRevision` | as above |
| `placementSet` | e.g. `facebook:feed|instagram:stream` (Feed-first V1) |

Rules:

- Same bytes + same config → same fingerprint → same logical operation.
- Path/filename rename only → same `creativeSha256` → same fingerprint.
- Any material field change → new fingerprint → must use new `creativeRevision` (or refuse).

Store both `operationKey` and `contentFingerprint` (+ `creativeSha256`) on the ledger row.

### A3. Required ledger columns (Phase 4 schema delta)

Keep existing columns; **add**:

| Column | Type | Notes |
|--------|------|-------|
| `environment` | string | `sandbox` |
| `creativeRevision` | string | |
| `contentFingerprint` | string | SHA-256 hex |
| `creativeSha256` | string | binary hash |
| `lockOwner` | string \| null | n8n execution id |
| `lockExpiresAt` | string \| null | ISO-8601 |
| `resumeFrom` | string \| null | next phase to execute |
| `outcome` | string \| null | `in_progress` \| `already_complete` \| `resumed` \| `manual_review_required` \| `failed` |

Phases remain:

`planned` → `campaign` → `adset` → `image` → `creative` → `ad` → `verified` → `writeback_done`  
Terminals: `manual_review_required` | `failed`

**Phase 4 must upsert after every successful Meta step** (not only planned + verified). Current gap: mid-phase persist missing — this contract requires it.

### A4. Claim / single-writer protocol

n8n Data Tables lack a true COMPARE-AND-SWAP API. V1 uses **claim-then-confirm**:

```text
1. Compute operationKey + contentFingerprint (+ download/hash creative for SHA).
2. Ledger Lookup by operationKey.
3. Branch (see A5).
4. If allowed to create/resume:
   a. Upsert row: lockOwner=<executionId>, lockExpiresAt=now+5m, phase at least planned,
      contentFingerprint, creativeSha256, creativeRevision, environment.
   b. Immediately Lookup again by operationKey.
   c. If lockOwner != this executionId AND lockExpiresAt > now → STOP with LEDGER_LOCK_HELD
      (zero Meta writes).
   d. If lockOwner == this executionId → proceed as single writer.
5. On success path end (or failure after partial): clear lockOwner / lockExpiresAt
   (or set outcome + lastError). Lock TTL allows crash recovery after 5 minutes.
```

Concurrent-lock proof in Phase 4: prefer **simulation-proven** (two sequential claims with overlapping TTL) if true parallel live test is unsafe; mark explicitly in progress file.

### A5. Decision table (same `operationKey`)

| Ledger state | Fingerprint | Action |
|--------------|-------------|--------|
| No row | — | Claim lock → create from `campaign` (after gates) |
| `writeback_done` or `verified` with all 4 IDs | **match** | `already_complete` — return existing IDs; **zero** Meta creates |
| `writeback_done` / complete | **mismatch** | Refuse: `LEDGER_REVISION_CONFLICT` — bump `creativeRevision` for deliberate new op |
| Partial IDs / mid phase | **match** | Resume: set `resumeFrom` = first missing stage; reuse stored IDs; continue |
| Partial | **mismatch** | `manual_review_required` — do not auto-create |
| Lock held by other, unexpired | any | `LEDGER_LOCK_HELD` — zero writes |
| Lock expired | match partial/complete | Re-claim per A4, then resume or already_complete |
| `ads.meta` has IDs in package but no ledger row | — | Reconcile (A7); do not blind-create |

Also keep adapter-level refuse when `ads.meta` already has Meta ID fields **and** fingerprint matches complete op (defense in depth). If package IDs exist with mismatched fingerprint → manual review.

**Replace** current workflow behavior that throws `LEDGER_MANUAL_REVIEW_REQUIRED` on any partial (same fingerprint) with **resume** (Phase 4).

### A6. Resume-from-partial

Order of stages (Image V1):

1. `campaign` — create Campaign PAUSED if `campaignId` missing  
2. `adset` — create Ad Set PAUSED if `adSetId` missing (needs campaignId)  
3. `image` — upload if `imageHash` missing  
4. `creative` — create Creative if `creativeId` missing  
5. `ad` — create Ad PAUSED if `adId` missing  
6. `verified` — read-back statuses; confirm PAUSED / zero delivery intent  
7. `writeback_done` — package write-back

After each successful Meta call: upsert ledger with new ID + phase **before** next call.

Never auto-delete Meta objects. Never create a second object for a stage that already has an ID on the row.

### A7. Post-Meta / pre-ledger reconciliation

If Meta returned an ID but ledger/write-back failed:

1. Re-read ledger by `operationKey`.
2. If ID present on row → continue resume.
3. If missing: Meta lookup by deterministic names (`campaignName`, ad set/creative/ad names from adapter) + ad account; if unique match found → write ID to ledger → resume.
4. If ambiguous or none → `manual_review_required` + `lastError`; operator reconciles in Ads Manager.
5. Never assume absence of local write-back means absence of Meta objects.

Deterministic names already planned in adapter (`campaignName`, `…-creative-a`, `…-ad-a`) — Phase 4 must keep them stable per `operationKey` / fingerprint.

### A8. Revision model (deliberate new variant)

To create a **new** Image ad intentionally:

1. Change creative bytes and/or copy/budget/URL/targeting/placements as needed.
2. Set `ads.meta.creativeRevision` to a **new** string.
3. Obtain fresh create-paused approval (Phase 3 gates + Scott phrase when required).
4. New `operationKey` → new ledger row → new Meta objects.
5. Do **not** overwrite or delete the previous revision’s Meta objects in V1. Package write-back stores the new revision under `ads.meta.variants[newRevision]` and updates the flat mirror to `currentVariant` without removing prior variant keys.

Document-only in Prompt 2 Phase 8; do not execute a second revision in that chat unless Scott separately asks.

### A9. Required proofs (Phase 4 / 8)

| Proof | Expectation | Result |
|-------|-------------|--------|
| Same logical op twice | `already_complete`; zero new Meta objects | **PASS** exec **95** (ledger evaluate) + Meta GET exec **96** (same IDs, PAUSED, $0) |
| Partial retry | Resume; no duplicate campaign | **PASS** live exec **74** resumed from `creative` |
| Changed creative/copy/budget without revision bump | Refuse / conflict | Local rehearse + Phase 4 |
| Blind rerun after error | Forbidden — reconcile first | Documented; exec54 archived before retry |
| Concurrent lock | Simulation-proven minimum; live only if safe | Simulation-proven (Phase 4) |

**Graph caveat (fixed in source 2026-07-28):** `Already Complete Gate` short-circuits `already_complete` → `Respond Already Complete` (zero Meta POSTs). `Needs Campaign Create` / `Needs AdSet Create` skip POSTs when IDs already exist (prevents resume orphans). `Verify PAUSED Statuses` + `Assert PAUSED` run before ledger verified / Drive write-back. Create path remains **disabled** until operator approval. Orphan campaign `120250622864710199` from earlier resume — leave PAUSED.

---

## Part B — Approval gates (Phase 3 design; token compare removed 2026-07-21)

### B1. Secret storage

| Item | Decision |
|------|----------|
| Meta access token | n8n Credentials only (`Meta Marketing API - Orro`) |
| Approval Header Auth vault | **Not required** for WF4 runtime (removed 2026-07-21) |
| Git / proof docs | Never store Meta token values |

### B2. Operator enablement (create-paused)

1. Receive exact phrase `APPROVE WF4 IMAGE CREATE-PAUSED V1`.
2. Keep create nodes disabled until one-run enablement.
3. Set Config: `mode=create_paused`, `approval=true`.
4. Flip `_createPausedAllowed=true`; enable create/ledger/Drive write-back for one run.
5. Execute once; verify PAUSED + zero spend; then re-disable and set `_createPausedAllowed=false`, `mode=dry_run`, `approval=false`.

### B3. Runtime comparison

```text
tripleApproved =
  mode === "create_paused"
  && approval === true

createPathOpen = tripleApproved && _createPausedAllowed === true && allOtherGatesPass
```

- Evaluate in Process **before** any Meta / Drive mutation.
- On failure: Respond with structured error; **zero** external writes.

### B4. Redacted logging

| May log | Must never log |
|---------|----------------|
| `tripleApproved`, `mode`, `approval`, `_createPausedAllowed` | Meta access token / credential export payloads |

### B5. Full create-paused gate list (all required)

Any failure → **zero new external writes**.

1. `mode=create_paused`
2. `approval=true`
3. `_createPausedAllowed === true` (code hard-gate)
4. Daily budget ≤ `MAX_DAILY_BUDGET_USD` (fail-closed; never clamp)
5. Required Meta IDs in Config: ad account, Page, Instagram (when IG in platforms)
6. Valid HTTPS landing URL
7. Valid supported **image** creative (resolve + MIME/size checks)
8. Feed-first placement set encoded (Stories/Reels excluded) — per Phase 1
9. Successful operation-lock claim (A4)
10. No conflicting ledger row / fingerprint (A5)
11. Ledger Data Table reachable
12. Write-back destination available (verified-only Drive merge after full PAUSED)

### B6. Rotation

N/A for approval tokens (removed). Rotate Meta Graph credential per normal n8n credential hygiene.

### B7. Rollback (kill create-paused)

1. Set `_createPausedAllowed = false` (redeploy/sync workflow).
2. Disable create / upload / ledger-write / Drive write-back nodes.
3. Clear run defaults: `mode=dry_run`, `approval=false`.

### B8. Operator runbook (Image V1 — post-proof)

| Procedure | How |
|-----------|-----|
| Dry run | Config `mode=dry_run`, `approval=false`; create nodes disabled; expect Respond Dry Run; zero Meta/Drive |
| Approve create-paused | Exact phrase `APPROVE WF4 IMAGE CREATE-PAUSED V1` only |
| Enable one run | `mode=create_paused`, `approval=true`, `_createPausedAllowed=true`, enable create/ledger/**verified** write-back; **after** Already Complete IF exists |
| Safety restore | Disable create path; `_createPausedAllowed=false`; `mode=dry_run`; `approval=false`; leave inactive |
| Preview | Meta Marketing API `adpreviews` (Feed: DESKTOP_FEED_STANDARD, MOBILE_FEED_STANDARD, INSTAGRAM_STANDARD) or Ads Manager — Stories/Reels out of V1 |
| Pause / kill | Ads Manager or Graph POST `status=PAUSED` on campaign/ad set/ad; never leave ACTIVE after incident |
| Manual activate | Human only in Ads Manager (or explicit future activate phrase) — **not** WF4 auto |
| New revision | Bump `ads.meta.creativeRevision` → new `operationKey` → new approval → new objects; store under `variants[revision]`; never delete prior variant keys or Meta objects |
| Idempotent re-check | Helper `ooM24nOGKfuefHVM` (Phase8 proof) or ledger evaluate — do **not** blind re-enable create |
| ACTIVE incident | If any Meta object is ACTIVE → pause immediately; stop; incident report |

---

## Part C — What Phase 4 must implement (preview; do not start until Scott approves)

1. Fingerprint + new `operationKey` in adapter / Process.
2. Creative binary SHA-256 before claim.
3. Ledger column adds + mid-phase upserts.
4. Claim/lock + resume (replace partial → manual_review for matching fingerprint).
5. Orphan reconciliation helper (name + ledger + ads.meta).
6. Approval redaction + gate ordering (mode + approval + hard gate; **no** dual-token).
7. Negative tests: `approval=false`, over-budget, duplicate op, partial resume sim, lock sim.
8. Keep dry_run default; PAUSED-only creates; no activation.

---

## Part D — Explicit non-goals (this design)

- No Meta object creation in Phases 2–3.
- No video path.
- No automatic activation / spend.
- No force-create flag without separate Scott approval.

---

## Change log

| Date | Change |
|------|--------|
| 2026-07-19 | Initial combined Phase 2+3 design for Image Create-Paused V1 |
| 2026-07-21 | Removed Header Auth vault requirement + dual-token runtime compare; gates = mode + approval + hard gate |
