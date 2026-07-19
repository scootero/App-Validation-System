# WF4 Create-Paused V1 Contract (Phases 2+3 Design)

**Status:** Phase 4 implementation landed in adapter/workflow (2026-07-19). Create-path remains **disabled**; `_createPausedAllowed=false`. Awaiting Scott approval before Phase 5 preflight / Meta writes.  
**Date:** 2026-07-19  
**Scope:** Image create-paused only.  
**Related:** [`OPERATION-LEDGER.md`](OPERATION-LEDGER.md), [`../CONFIG-DRIVEN-VS-HARDCODED.md`](../CONFIG-DRIVEN-VS-HARDCODED.md), [`../CREATIVE-ASSET-SPECS.md`](../CREATIVE-ASSET-SPECS.md)

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
5. Do **not** overwrite or delete the previous revision’s objects in V1.

Document-only in Prompt 2 Phase 8; do not execute a second revision in that chat unless Scott separately asks.

### A9. Required proofs (Phase 4 / 8 — not this design phase)

| Proof | Expectation |
|-------|-------------|
| Same logical op twice | `already_complete`; zero new Meta objects |
| Partial retry | Resume; no duplicate campaign |
| Changed creative/copy/budget without revision bump | Refuse / conflict |
| Blind rerun after error | Forbidden — reconcile first |
| Concurrent lock | Simulation-proven minimum; live only if safe |

---

## Part B — Approval-token design (Phase 3)

### B1. Secret storage (SSOT)

| Item | Decision |
|------|----------|
| Store | n8n **Credentials** only — Header Auth named `WF4 Create-Paused Approval Token` |
| Header name (vault metadata) | `X-WF4-Approval-Token` (not sent to Meta) |
| Git | **Never** |
| Proof docs / chat / Respond body | **Never** paste the value |
| Workflow Config `wf4CreatePausedApprovalToken` | Empty by default; filled **only** for an approved create-paused enablement window (compare source for Process). Clear after. |

Smallest fit for current n8n graph: Process already compares `approvalToken` (run input) to `wf4CreatePausedApprovalToken` (Config). Credential vault remains the operator’s password-manager-backed SSOT; Config is a short-lived mirror for the compare, not the long-term store.

Do **not** commit Config exports that contain the token.

### B2. Operator setup steps

1. n8n → Credentials → Add → **Header Auth**.
2. Name: `WF4 Create-Paused Approval Token`.
3. Header: `X-WF4-Approval-Token`; Value: long random secret (password manager).
4. Save. Leave Workflow Config `wf4CreatePausedApprovalToken` **empty**.
5. Keep create nodes disabled; keep `_createPausedAllowed === false` until Phase 5/6 approval.
6. At create enablement only (after Scott’s exact phrase in Phase 5/6):
   - Paste token into Config `wf4CreatePausedApprovalToken`.
   - Set run: `mode=create_paused`, `approval=true`, `approvalToken=<same>`.
   - Flip `_createPausedAllowed` / enable create path per Phase 4/5 procedure.
7. After successful proof (or abort): clear Config token; disable create path; set `_createPausedAllowed` false again.

### B3. Runtime comparison

```text
tripleApproved =
  mode === "create_paused"
  && approval === true
  && approvalToken.length > 0
  && configToken.length > 0
  && approvalToken === configToken

createPathOpen = tripleApproved && _createPausedAllowed === true && allOtherGatesPass
```

- Compare in Process (or dedicated gate node) **before** any Meta / Drive / ledger **mutation** that is part of create (ledger claim may occur only after gates pass — prefer claim after approval gates to avoid lock spam from unauthorized runs).
- On failure: Respond with structured error; **zero** external writes.

### B4. Redacted logging

| May log | Must never log |
|---------|----------------|
| `tokenPresent` (bool) | Raw `approvalToken` |
| `configTokenPresent` (bool) | Raw Config token |
| `tokenMatch` (bool) | Any substring of the secret |
| `tripleApproved`, `mode`, `approval` | Credential export payloads |

Strip token fields from dry_run / create Respond payloads and from proof markdown.

### B5. Full create-paused gate list (all required)

Any failure → **zero new external writes** (no Meta create/upload; no Drive/app.json write-back; no ledger claim preferred — if a safety audit row is ever added later, it needs explicit Scott approval first).

1. `mode=create_paused`
2. `approval=true`
3. Matching approval token (B3)
4. `_createPausedAllowed === true` (code hard-gate)
5. Daily budget ≤ `MAX_DAILY_BUDGET_USD` (fail-closed; never clamp)
6. Required Meta IDs in Config: ad account, Page, Instagram (when IG in platforms)
7. Valid HTTPS landing URL
8. Valid supported **image** creative (resolve + MIME/size checks)
9. Feed-first placement set encoded (Stories/Reels excluded) — per Phase 1
10. Successful operation-lock claim (A4)
11. No conflicting ledger row / fingerprint (A5)
12. Ledger Data Table reachable
13. Write-back destination available (Phase 4 must implement package write-back; until then treat missing write-back path as gate fail for “V1 complete,” or document temporary ledger-only with Scott approval)

### B6. Rotation

1. Generate new secret in password manager.
2. Update Header Auth credential value.
3. If Config mirror is set, update it in the same change window.
4. Old token immediately fails `tokenMatch`.
5. Record rotation time in operator notes (not the secret).

### B7. Rollback (kill create-paused)

1. Set `_createPausedAllowed = false` (redeploy/sync workflow).
2. Disable create / upload / ledger-write nodes (or keep disabled).
3. Clear Config `wf4CreatePausedApprovalToken`.
4. Clear run defaults: `mode=dry_run`, `approval=false`, `approvalToken=""`.
5. If any Meta object is ACTIVE → pause immediately; stop; incident report.
6. Optional: rotate token so leaked Config value is useless.

---

## Part C — What Phase 4 must implement (preview; do not start until Scott approves)

1. Fingerprint + new `operationKey` in adapter / Process.
2. Creative binary SHA-256 before claim.
3. Ledger column adds + mid-phase upserts.
4. Claim/lock + resume (replace partial → manual_review for matching fingerprint).
5. Orphan reconciliation helper (name + ledger + ads.meta).
6. Approval redaction + gate ordering.
7. Negative tests: missing/wrong token, `approval=false`, over-budget, duplicate op, partial resume sim, lock sim.
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
