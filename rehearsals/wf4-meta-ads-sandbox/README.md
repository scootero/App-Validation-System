# WF4 Meta Ads Rehearsal — Architecture Revision (Design Pass)

**Status:** Prompt A reconciled; architecture revision in progress. Create-paused disabled. No Meta mutations.

## Safety

- No campaigns/ad sets/creatives/ads created
- No spend
- Workflow inactive
- Cap fail-closed; never clamp

## Proven / design

| Item | Value |
|------|-------|
| Workflow | `YIc53GBq4upelYp6` (inactive) |
| Dry-run execution | `35` (prior) |
| First-test budget | $1/day (14/14) |
| Global cap | `MAX_DAILY_BUDGET_USD = 10` |
| Adapter SSOT | `lib/meta-adapter.js` |
| V1 pairing | `OUTCOME_TRAFFIC` + `LINK_CLICKS` + `IMPRESSIONS` |
| Write-back status | `ads.meta.status = created_paused`; root preserved |

## Operator next

1. Complete Manual Meta Account Setup Checklist
2. Run Prompt B
3. Populate n8n Config (IDs + API version + cap)
4. Attach credentials
5. Explicit create-paused approval only after the above

## Key docs

| File | Purpose |
|------|---------|
| [architecture/](./architecture/) | Ad Plan, adapter, ledger |
| [lib/meta-adapter.js](./lib/meta-adapter.js) | Mapping SSOT |
| [notes/meta-research-prompt-a-results.md](./notes/meta-research-prompt-a-results.md) | Prompt A |
| [meta-ads-contract.md](./meta-ads-contract.md) | Contract |
| [CANONICAL-WF4.md](./CANONICAL-WF4.md) | Proven IDs |
