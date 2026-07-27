# WF4 Meta Adapter Contract

**Status:** Design pass 2026-07-15  
**SSOT module:** [`../lib/meta-adapter.js`](../lib/meta-adapter.js)  
**Do not** independently maintain mappings in rehearsal scripts, workflow TypeScript, n8n Code nodes, or docs. Edit the adapter; sync consumers via [`../scripts/sync-wf4-adapter-into-workflow.js`](../scripts/sync-wf4-adapter-into-workflow.js).

## V1 Meta pairing (locked for sandbox)

| Field | Value |
|-------|-------|
| Campaign objective | `OUTCOME_TRAFFIC` (from author `traffic`) |
| `optimization_goal` | **`LINK_CLICKS`** |
| `billing_event` | **`IMPRESSIONS`** |

`LANDING_PAGE_VIEWS` (+ `IMPRESSIONS`) is an **alternative** pending account-specific validation — not the V1 default.

Author `ads.objective` is mapped in the adapter (`traffic` → `OUTCOME_TRAFFIC`, `conversions` → `OUTCOME_SALES`, …). Author hints are never sent raw to Meta.

## Also owned by adapter

- Budget minor units (USD cents)
- `special_ad_categories: []`
- `is_adset_budget_sharing_enabled: false` (required when using ad-set budgets / not CBO; probe-proven 2026-07-26)
- Payload builders: campaign / ad set / image upload / creative / ad
- **Creative binary resolution plan** via `resolveCreativeSource` (repo/branch/path → `downloadUrl` / `filename`; V1 image extensions only)
- Create order: Campaign → Ad Set → **download binary** → image upload (`adimages`) → Creative → Ad
- PAUSED: Campaign, Ad Set, Ad only; Creative/image are assets; never ACTIVE
- Read-back / write-back preview (`ads.meta.status = created_paused`; root status unchanged)

Dry-run bundles include `source.creative.downloadUrl` and `requests.imageUpload.*` resolution fields. Runtime download + Meta multipart upload live in the workflow template (disabled until create-paused). Adapter must not hardcode app ids, repos, or filenames.

## Operator Config (not adapter)

- `META_API_VERSION` (default `v25.0`)
- Business Portfolio / Ad Account / Page / `instagram_user_id`
- `MAX_DAILY_BUDGET_USD`
- Secrets: Meta token, approval token

## Sync rule

```bash
node rehearsals/wf4-meta-ads-sandbox/scripts/sync-wf4-adapter-into-workflow.js
node rehearsals/wf4-meta-ads-sandbox/scripts/wf4-rehearse.js
```
