# WF4 Operation Ledger (n8n Data Table)

**Status:** Table created 2026-07-16 — dry-run does **not** write rows. Create-path ledger nodes exist but stay **disabled** until create-paused is approved.  
**Live table:** `WF4 Operation Ledger` (`Yys4vVmQGk8fTxag`) in personal project `3H7cB0ckKR59RwsE`  
**Key:** `appId` + `experimentRunId` + `provider`  
**operationKey:** `appId|experimentRunId|provider`

## Purpose

Persist each successfully created external Meta ID **immediately** after each API call so partial failure can resume or stop safely.

## Columns

| Column | Type | Notes |
|--------|------|-------|
| `operationKey` | string | Unique match key |
| `appId` | string | |
| `experimentRunId` | string | |
| `provider` | string | `meta` |
| `phase` | string | see phases |
| `campaignId` | string \| null | |
| `adSetId` | string \| null | |
| `imageHash` | string \| null | |
| `creativeId` | string \| null | |
| `adId` | string \| null | |
| `lastError` | string \| null | |
| `updatedAt` | string (built-in) | Data Table system column — do not redefine |

## Phases

`planned` → `campaign` → `adset` → `image` → `creative` → `ad` → `verified` → `writeback_done`  
Failure terminals: `manual_review_required` | `failed`

## V1 reconciliation (minimal)

1. **No row** → start fresh (when create-paused enabled).
2. **Complete + verified** (all IDs + phase `writeback_done` or `ads.meta` IDs present) → refuse duplicate.
3. **Partial IDs** → read-back prior objects; if still valid, resume next missing step; else `manual_review_required`.
4. **Never** auto-delete Meta objects in V1.

## Dry-run

Dry-run bundles include a `ledgerPlan` snapshot (`phase: planned`). No Data Table writes until create-paused is approved and ledger nodes are enabled.
