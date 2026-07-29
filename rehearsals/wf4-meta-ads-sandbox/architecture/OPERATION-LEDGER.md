# WF4 Operation Ledger (n8n Data Table)

**Status:** Image V1 row complete **2026-07-27** — `operationKey=human-lab-wf1-sandbox|sandbox|meta|image-v1`, `phase=writeback_done`, `outcome=already_complete` (exec **95**). Dry-run does **not** write rows. Create-path ledger nodes stay **disabled** after safety restore.  
**Design SSOT:** [`CREATE-PAUSED-V1-CONTRACT.md`](CREATE-PAUSED-V1-CONTRACT.md).  
**Live table:** `WF4 Operation Ledger` (`Yys4vVmQGk8fTxag`) in personal project `3H7cB0ckKR59RwsE`  
**Store:** n8n Data Table only — **not** Google Sheets (WF3 landing events stay separate).

## Keys

| Key | Format | Role |
|-----|--------|------|
| **`operationKey`** (unique) | `{appId}\|{environment}\|{provider}\|{creativeRevision}` | Ledger match / single logical op |
| `contentFingerprint` | SHA-256 hex of canonical identity JSON | Detect same vs changed content |
| `creativeSha256` | SHA-256 of image **bytes** | Media identity (rename-safe) |

Example: `human-lab-wf1-sandbox|sandbox|meta|image-v1`

**Note:** Pre–Phase-4 dry-run still emits `appId|experimentRunId|provider`. Phase 4 migrates `buildLedgerPlan` to the key above. `experimentRunId` remains an audit column value, not uniqueness.

## Purpose

Persist each successfully created external Meta ID **immediately** after each API call so partial failure can resume or stop safely. Support operation lock + fingerprint checks per CREATE-PAUSED-V1-CONTRACT.

## Columns

| Column | Type | Notes |
|--------|------|-------|
| `operationKey` | string | Unique match key |
| `appId` | string | |
| `experimentRunId` | string | Audit only (not part of unique key after Phase 4) |
| `provider` | string | `meta` |
| `environment` | string | **live 2026-07-20** — `sandbox` |
| `creativeRevision` | string | **live 2026-07-20** — default `image-v1` |
| `contentFingerprint` | string | **live 2026-07-20** |
| `creativeSha256` | string | **live 2026-07-20** |
| `phase` | string | see phases |
| `campaignId` | string \| null | |
| `adSetId` | string \| null | |
| `imageHash` | string \| null | |
| `creativeId` | string \| null | |
| `adId` | string \| null | |
| `lockOwner` | string \| null | **live 2026-07-20** — n8n execution id |
| `lockExpiresAt` | string \| null | **live 2026-07-20** — ISO-8601, ~5m TTL |
| `resumeFrom` | string \| null | **live 2026-07-20** |
| `outcome` | string \| null | **live 2026-07-20** — e.g. `already_complete` |
| `lastError` | string \| null | |
| `updatedAt` | string (built-in) | Data Table system column — do not redefine |

## Phases

`planned` → `campaign` → `adset` → `image` → `creative` → `ad` → `verified` → `writeback_done`  
Failure terminals: `manual_review_required` | `failed`

Upsert **after every successful Meta stage**. Local `workflow.ts` now wires disabled mid-phase upserts (`campaign`→`ad`→`verified`→`writeback_done`). **Live canvas** still needs those mid-phase + Drive write-back nodes synced from `workflow.ts` before Phase 6 (planned/verified column maps already updated live).

## V1 reconciliation (per contract)

1. **No row** → claim lock → start fresh (when create-paused enabled + gates pass).
2. **Complete** (`verified` / `writeback_done` / four IDs) + **matching fingerprint** → `already_complete`; refuse duplicate creates.
3. **Partial IDs** + **matching fingerprint** → resume next missing step (reuse IDs); do **not** throw blind `LEDGER_MANUAL_REVIEW_REQUIRED`.
4. **Fingerprint mismatch** on existing key → refuse / require new `creativeRevision`.
5. **Lock held** by another execution (unexpired) → `LEDGER_LOCK_HELD`; zero writes.
6. **Meta without ledger** → reconcile via deterministic names + ads.meta + Meta lookup; else `manual_review_required`.
7. **Never** auto-delete Meta objects in V1.

## Dry-run

Dry-run bundles include a `ledgerPlan` snapshot (`phase: planned`). No Data Table writes until create-paused is approved and ledger nodes are enabled.
