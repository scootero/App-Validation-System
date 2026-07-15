# WF4 Meta Ads Rehearsal — Dry Run Proven

**Status:** Dry-run sandbox proven (local + n8n). Create-paused disabled. Zero Meta/Drive mutations.

## Safety Rules

- Do not create campaigns, ad sets, creatives, or ads.
- Do not activate campaigns or spend money.
- Create-paused branch is disabled until explicit operator approval.

## Proven Values

| Item | Value |
|------|-------|
| n8n workflow | `WF4 - Meta Ads Sandbox` (`YIc53GBq4upelYp6`) — **inactive** |
| Dry-run execution | `30` (success) |
| Local proof | `node scripts/wf4-rehearse.js` → PASS |
| WF3 gate | proven |

## Goal Flow

```
app.json (fixture) → gates → dry-run bundle → Respond Dry Run
[create-paused path disabled]
```

## Key Docs

| File | Purpose |
|------|---------|
| [CANONICAL-WF4.md](./CANONICAL-WF4.md) | Proven IDs, node flow, ownership |
| [meta-ads-contract.md](./meta-ads-contract.md) | Frozen contract |
| [EXTERNAL-SETUP-HANDOFF.md](./EXTERNAL-SETUP-HANDOFF.md) | External setup A–E |
| [PRODUCTION-PROMOTION-CHECKLIST.md](./PRODUCTION-PROMOTION-CHECKLIST.md) | Promotion rules |
| [n8n/README.md](./n8n/README.md) | Workflow export + live IDs |
| [notes/live-rehearsal-report.md](./notes/live-rehearsal-report.md) | Dry-run execution proof |

## Next Step

Web AI read-only Meta inspection → return Section B YAML → operator reviews verified payloads → approve create-paused testing separately.
