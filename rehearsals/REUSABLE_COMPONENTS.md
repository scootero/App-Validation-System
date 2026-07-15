# Reusable Platform Components

This registry identifies shared components to avoid workflow-specific implementations.

## Component Registry

| Component | Workflows | Responsibility | Initial location |
|-----------|-----------|----------------|------------------|
| Common validation | WF0, WF1, WF2, WF3, WF-Ads, WF-Decision | Required fields, status gates, event types, lifecycle checks | Backlog only |
| Common merge-write logic | WF0, WF1, WF2, WF-Ads, WF-Decision | Read full `app.json`, patch owned keys, preserve author fields | Backlog only |
| Common logging | All workflows | Structured execution logs and evidence capture | Backlog only |
| Common error handling | All workflows | Retry, alert, recoverable state handling | Backlog only |
| Common status handling | WF0, WF-Ads, WF-Decision | Enforce canonical lifecycle transitions | Backlog only |
| Common `app.json` parsing | All Drive workflows | Parse JSON, validate `specVersion`, check `appId` | Backlog only |
| Common HTTP helpers | WF1, WF2, WF3, WF-Ads, WF-Decision | Auth headers, JSON handling, retry/backoff, timeout | Backlog only |
| Common Google Drive helpers | WF0, WF1, WF2, WF-Ads, WF-Decision | Read file, merge-write, preserve content | Backlog only |
| Common Google Sheets helpers | WF3, WF-Decision | Canonical **33** columns, append rows, filter event rows; `receivedAt` / `eventId` / consent / Meta defaults — **live-proven** in sandbox WF3 |
| Common Vercel helpers | WF1, WF2 | Deploy, poll, resolve alias, verify public/iframe-safe URLs | WF1/WF2 rehearsal evidence |
| Common Meta Ads helpers | WF-Ads, WF-Decision | Dry-run bundle, idempotency, triple approval, create paused entities, insights read, pause-on-kill | **Sandbox-proven** dry-run in WF4 `YIc53GBq4upelYp6`; create-paused not built |

## Promotion Criteria

A component should be promoted from rehearsal guidance to production docs/workflow snippets when:

- It is used by at least two workflows.
- It reduces duplicated Code node logic.
- It preserves existing Spec 1.5.0 field ownership.
- It has a rehearsal fixture or execution log proving behavior.
- It does not introduce app-specific branching.

## Immediate Candidates

1. WF3 `sheetColumns` (33) and `mapPayloadToSheetRow()` with `receivedAt`, `eventId` fallback, `consentStatus` default, Meta blanks, invalid-event `_skipAppend` routing — **proven in live workflow** `7G2fJmqKsr8CGVID`; export in `rehearsals/wf3-human-lab-sandbox/n8n/`.
2. Landing attribution capture (`utm_*` + `fbclid` persistence) and per-event `eventId` generation — proven in sandbox landing; production `landing-template` sync pending (BL-028).
3. Drive merge-write helper for WF0/WF1/WF2/WF-Ads/WF-Decision.
4. Vercel deploy/poll/alias verification helper for WF1/WF2.
5. Meta dry-run bundle builder + idempotency checker + triple approval gate for WF-Ads — **proven in sandbox WF4** `YIc53GBq4upelYp6` (dry-run execution 30); export in `rehearsals/wf4-meta-ads-sandbox/n8n/`.
6. Status transition validator for WF0/WF-Ads/WF-Decision.
7. Config-driven WF3 template: per-app `appId`/webhook path/Sheet ID; shared event contract (see `CONFIG-DRIVEN-VS-HARDCODED.md`).
