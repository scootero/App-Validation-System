# Canonical WF3 (Proven Sandbox)

**Status:** Proven and canonical for Spec 1.5.0 promotion planning.  
**Do not modify production resources from this folder until the coordinated Spec 1.5.0 pass.**

## Proven platform values

| Key | Proven value |
|-----|----------------|
| `N8N_BASE_URL` | `https://scottyo.app.n8n.cloud` (**not** `scooter.app.n8n.cloud`) |
| Credential label | `Google Service Account account` (id `AW9ZTTTBz7JeSKKN`) |
| Workflow name | `WF3 - Tracking Sandbox` |
| Workflow ID | `7G2fJmqKsr8CGVID` |
| Active | `true` |
| Version ID | `948926c0-b321-42c6-9c39-d0f0cb554dc1` |
| Production webhook URL | `https://scottyo.app.n8n.cloud/webhook/app-validation/events` |
| Webhook path | `app-validation/events` |
| Sandbox Sheet ID | `1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0` |
| Sheet tab | `Sheet1` |
| Column count | **33** |
| Auth | `webhookAuthSecret` empty / null |
| Live curl proof | Passed (runs 1 and 2) |

## Canonical node flow

```txt
Landing Event Webhook (POST)
  → Workflow Config (Set: sheetId, tab, authSecret)
  → Validate Auth (Code)
  → Validate Payload (Code)
  → Map To Sheet Row (Code: receivedAt, eventId fallback, consent/meta defaults; pass `_validationErrors` on skip)
  → Route Valid Events (IF: !_skipAppend)
       → true: Append Row (Google Sheets, defineBelow 33-col map, retry 3×) → Respond 200 `{ "ok": true }`
       → false: Respond 200 `{ "ok": false, "skipped": true, "errors": [...] }`
```

**Append Row hardening (2026-07-15):** explicit/`defineBelow` 1:1 column mapping (not `autoMapInputData`) so a corrupted header row cannot remap every column to `timestamp`.

Blueprint gap: production blueprint still lists 7 nodes / 25 columns and omits **Route Valid Events**.

## Final 33-column contract

```
timestamp | eventType | appId | appName | experimentId | experimentRunId | projectId | deploymentId | landingVersion | landingVariantId | mockupVersionId | campaignName | visitorId | sessionId | email | price | pageUrl | referrer | utmSource | utmMedium | utmCampaign | utmContent | utmTerm | timeOnPageSeconds | mockupInteracted | eventId | receivedAt | fbclid | consentStatus | metaCampaignId | metaAdSetId | metaAdId | placement
```

## Field ownership (canonical)

| Field | Owner |
|-------|--------|
| `eventId` | Landing generates; n8n fallback |
| `receivedAt` | Always n8n |
| UTMs + `fbclid` | Landing persists; every event |
| `consentStatus` | Default `unknown` |
| Meta columns | Blank until WF4 |
| `app.json` | WF3 does not write |

## MCP / setup issues encountered

1. `user-n8n` MCP discovery error → fixed with `mcp_auth`.
2. Docs said `scooter.app.n8n.cloud`; live instance is `scottyo.app.n8n.cloud`.
3. Docs said credential label `Google Service Account`; live label is `Google Service Account account`.
4. SDK forbids Array `.map`/`.join` in workflow source outside string literals.
5. No local SA JSON for direct Sheet API reads; Append success used as write proof.

## Artifacts

| File | Role |
|------|------|
| [`n8n/wf3-tracking-sandbox.workflow.ts`](./n8n/wf3-tracking-sandbox.workflow.ts) | SDK source used to create workflow |
| [`n8n/WF3-tracking-sandbox.canonical-meta.json`](./n8n/WF3-tracking-sandbox.canonical-meta.json) | Proven IDs + column list |
| [`contract.md`](./contract.md) | Frozen event contract |
| [`PRODUCTION-PROMOTION-CHECKLIST.md`](./PRODUCTION-PROMOTION-CHECKLIST.md) | How to promote |
| [`DOC-DRIFT-AND-REQUIRED-UPDATES.md`](./DOC-DRIFT-AND-REQUIRED-UPDATES.md) | Production doc deltas |
| [`CONFIG-DRIVEN-VS-HARDCODED.md`](./CONFIG-DRIVEN-VS-HARDCODED.md) | Reuse rules for future apps |
