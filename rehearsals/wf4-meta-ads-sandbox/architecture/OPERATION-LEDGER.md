# WF4 Operation Ledger (n8n Data Table)

**Status:** Table created 2026-07-16 — dry-run does **not** write rows. Create-path ledger nodes exist but stay **disabled** until create-paused is approved.  
**Design SSOT (Prompt 2 Phases 2+3):** [`CREATE-PAUSED-V1-CONTRACT.md`](CREATE-PAUSED-V1-CONTRACT.md) — implement in Phase 4.  
**Live table:** `WF4 Operation Ledger` (`Yys4vVmQGk8fTxag`) in personal project `3H7cB0ckKR59RwsE`

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
| `environment` | string | **add Phase 4** — `sandbox` |
| `creativeRevision` | string | **add Phase 4** — default `image-v1` |
| `contentFingerprint` | string | **add Phase 4** |
| `creativeSha256` | string | **add Phase 4** |
| `phase` | string | see phases |
| `campaignId` | string \| null | |
| `adSetId` | string \| null | |
| `imageHash` | string \| null | |
| `creativeId` | string \| null | |
| `adId` | string \| null | |
| `lockOwner` | string \| null | **add Phase 4** — n8n execution id |
| `lockExpiresAt` | string \| null | **add Phase 4** — ISO-8601, ~5m TTL |
| `resumeFrom` | string \| null | **add Phase 4** |
| `outcome` | string \| null | **add Phase 4** — e.g. `already_complete` |
| `lastError` | string \| null | |
| `updatedAt` | string (built-in) | Data Table system column — do not redefine |

## Phases

`planned` → `campaign` → `adset` → `image` → `creative` → `ad` → `verified` → `writeback_done`  
Failure terminals: `manual_review_required` | `failed`

Upsert **after every successful Meta stage** (Phase 4). Current disabled graph only planned → verified — insufficient for resume.

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
