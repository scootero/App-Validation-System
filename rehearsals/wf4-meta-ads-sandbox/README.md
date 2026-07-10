# WF4 Meta Ads Rehearsal — Dry Run Only

**Status:** Research/design complete; no live Meta actions performed.  
**Scope:** Sandbox payloads, requirements, safety gates, and write-back contract only.

## Safety Rules

- Do not create campaigns, ad sets, creatives, or ads.
- Do not activate campaigns.
- Do not spend money.
- Do not modify production Meta accounts, Pages, ad accounts, n8n workflows, or Drive files.
- WF4 remains blocked until WF3 has proven event rows in Google Sheets.

## Purpose

WF4 maps to the platform's WF-Ads Meta flow plus downstream WF-Decision dependencies. It prepares a paused-by-default Meta campaign contract using existing Spec 1.5.0 `app.json` fields.

## Files

| File | Purpose |
|------|---------|
| `meta-ads-contract.md` | Requirements, credentials, flow, safeguards, n8n node list |
| `dry-run-payloads/human-lab-wf4-dry-run.json` | Example Meta request bundle with no live side effects |
| `notes/app-json-field-audit.md` | Existing schema support and optional future fields |
| `production-implementation-checklist.md` | Go-live readiness checklist |

## Definition Of Done

- Dry-run payload contract documented.
- Existing `app.json` support audited.
- Required future n8n nodes identified.
- Manual and external setup tasks documented.
- WF3 dependency is explicit.
- No production or external Meta assets modified.
