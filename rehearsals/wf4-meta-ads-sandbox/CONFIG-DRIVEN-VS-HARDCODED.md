# WF4 Config-Driven vs Hardcoded

## n8n Workflow Config (non-secret)

| Key | Sandbox value (confirmed) |
|-----|---------------------------|
| `MAX_DAILY_BUDGET_USD` | **`2`** — safety ceiling only; not default ad budget |
| `META_BUSINESS_PORTFOLIO_ID` | `1074341285117707` |
| `META_AD_ACCOUNT_ID` | `act_979257825150251` |
| `META_PAGE_ID` | `1237104852815793` |
| `META_INSTAGRAM_USER_ID` | `17841440875992246` |
| `metaApiVersion` / `META_API_VERSION` | `v25.0` |
| `provider` | `meta` |
| `mode` default | `dry_run` |
| `useFixtureAppJson` | `true` for sandbox dry-run |
| `environment` | `sandbox` |
| `workflowVersion` | `wf4-image-v1` |
| `WF4_CREATIVE_SHA256` | Planning hash of `og-image.png` bytes (not a secret) |

**Not in Config:** objective mapping, billing_event, optimization_goal, payloads — [`lib/meta-adapter.js`](./lib/meta-adapter.js).  
**Not in Config:** Meta access token.

## Secrets (n8n Credentials only)

| Key | Notes |
|-----|-------|
| Meta access token | Credential name: `Meta Marketing API - Orro` (`facebookGraphApi`, id `pphgFAkucBMaBs8A`) — attached to disabled create HTTP nodes |
| `WF4_CREATE_PAUSED_APPROVAL_TOKEN` | Vault as n8n Credential (see below). Keep Workflow Config field empty until create-paused enablement |

### Approval-token vault (operator manual)

1. n8n → **Credentials** → **Add credential**
2. Type: **Header Auth**
3. Name: `WF4 Create-Paused Approval Token`
4. Header Name: `X-WF4-Approval-Token` (vault only; unused for Meta HTTP)
5. Value: long random secret from a password manager
6. Save. Do **not** paste into Workflow Config, git, or chat yet.

**Runtime compare (create-paused only, later):** Process requires  
`mode=create_paused` AND `approval=true` AND `approvalToken === wf4CreatePausedApprovalToken` (both non-empty)  
AND `_createPausedAllowed===true` (code hard-gate; still `false` in pre-create).

When enabling create-paused: copy Credential value into Config `wf4CreatePausedApprovalToken` and the same value into run `approvalToken` for that one manual execution.

## Adapter SSOT

- `OUTCOME_TRAFFIC` + `LINK_CLICKS` + `IMPRESSIONS`
- `special_ad_categories: []`
- Sync: `scripts/sync-wf4-adapter-into-workflow.js`

## Budget intent

| Item | Value |
|------|-------|
| Typical first-test daily | ~$1 (fixture 14/14) |
| Account `min_daily_budget` | $1 |
| Workflow ceiling | `MAX_DAILY_BUDGET_USD = 2` |
| Do not use ceiling as default campaign budget | Yes |

## Sandbox hardcodes (do not promote blindly)

| Value | Sandbox |
|-------|---------|
| Fixture budget | 14/14 = $1/day |
| Fixture objective | `traffic` |
| `_createPausedAllowed` | `false` |
| Workflow ID | `YIc53GBq4upelYp6` |
| Workflow active | `false` |
