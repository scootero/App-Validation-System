# WF3 Rehearsal — `human-lab-wf1-sandbox`

**Status:** Sandbox path **proven** (local + live curl). Canonical for Spec 1.5.0 promotion planning.  
**Freeze:** 33-column event contract locked.  
**Do not modify production** until coordinated Spec 1.5.0 pass.

## Goal

Prove the WF3 flow:

```txt
Landing POST → n8n webhook → validate → map 33 cols → Google Sheets append → HTTP 200
```

## Canonical docs

| Doc | Role |
|-----|------|
| [`CANONICAL-WF3.md`](./CANONICAL-WF3.md) | Proven values + node flow |
| [`CONFIG-DRIVEN-VS-HARDCODED.md`](./CONFIG-DRIVEN-VS-HARDCODED.md) | Reuse rules for future apps |
| [`DOC-DRIFT-AND-REQUIRED-UPDATES.md`](./DOC-DRIFT-AND-REQUIRED-UPDATES.md) | Production doc deltas |
| [`PRODUCTION-PROMOTION-CHECKLIST.md`](./PRODUCTION-PROMOTION-CHECKLIST.md) | How to promote |
| [`n8n/WF3-tracking-sandbox.export.json`](./n8n/WF3-tracking-sandbox.export.json) | Workflow export |

## Proven summary

- Workflow ID: `7G2fJmqKsr8CGVID`
- Webhook: `https://scottyo.app.n8n.cloud/webhook/app-validation/human-lab-wf1-sandbox-events`
- Sheet: `1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0` / `Sheet1` / 33 columns
- Credential label: `Google Service Account account`
- Live curl rehearsals: **passed** (runs 1 and 2)

## Remaining (not blockers for “WF3 proven”)

1. Browser E2E: WF0 provision `tracking.webhookUrl` + WF2 re-transform/redeploy (BL-005/006)
2. Production doc/template sync (BL-028, BL-031–BL-038)
3. WF4 remains dry-run

## Notes

- No new `app.json` fields required for WF3 v1.
- WF3 does not write `app.json`.
- Meta Sheet columns stay blank until WF4.
