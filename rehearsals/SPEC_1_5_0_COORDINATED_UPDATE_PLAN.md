# Spec 1.5.0 Coordinated Update Plan

**Status:** WF3 sandbox proven. Backlog-only plan until coordinated production pass. Do not apply production edits yet.

## Update Principles

- Apply one coordinated update instead of piecemeal edits.
- Keep WF1/WF2 canonical unless a critical defect is found.
- Treat proven WF3 sandbox logic as canonical (`rehearsals/wf3-human-lab-sandbox/CANONICAL-WF3.md`).
- Treat WF4 as dry-run/design until user approves paused Meta creation.
- Validate existing `app.json` fields before adding schema fields.
- **No new `app.json` fields required for WF3** (confirmed).

## Implementation Order

1. ~~Finish WF3 local and external sandbox proof.~~ **Done** (curl runs 1–2).
2. Review WF4 dry-run payload against current Meta API docs.
3. Decide whether optional fields such as `ads.specialAdCategories` are required.
4. Promote WF3 export to `n8n-workflows/WF3-tracking.json` (parameterize Sheet/path).
5. Update production docs and examples in one pass (see file-level deltas below).
6. Update starter + landing-template after canonical docs are synchronized.
7. Run final consistency review against WF1-WF4 contracts.
8. Optional: browser E2E (BL-005/006) before or after doc sync.

## Proven deltas that must land in production docs

| Delta | Wrong / stale | Proven |
|-------|---------------|--------|
| n8n host | `scooter.app.n8n.cloud` | `scottyo.app.n8n.cloud` |
| Google SA credential label | `Google Service Account` | `Google Service Account account` |
| Sheet columns | 25 | **33** |
| WF3 nodes | 7 (no IF) | 8 (+ Route Valid Events) |
| WF3 export | “blueprint only” | Sandbox export + live ID `7G2fJmqKsr8CGVID` |
| Landing tracking | Missing `eventId` / `fbclid` persist / `consentStatus` | Sandbox landing libs proven |

Full drift list: `rehearsals/wf3-human-lab-sandbox/DOC-DRIFT-AND-REQUIRED-UPDATES.md`.

## Production Files To Update Later

| Area | Candidate files | Reason |
|------|-----------------|--------|
| Setup tracker | `PLATFORM_SETUP_VALUES.md` | `scottyo` URL, credential label, Sheet ID, webhook, proof status |
| Architecture | `N8N_PLATFORM_ARCHITECTURE.md` §6 | 33-col Sheet + TrackingPayload; WF3 proven |
| WF3 blueprint | `n8n-workflows/WF3-TRACKING-PIPELINE-BLUEPRINT.md` | 33 cols, Route Valid Events, proven IDs |
| WF3 export | `n8n-workflows/WF3-tracking.json` (new) | Promote from sandbox export (parameterized) |
| WF3 prompt | `n8n-workflows/WF3-N8N-AI-PROMPT.md` (new) | Mirror WF1/WF2 prompt pattern |
| Spec integration | `app-validation-spec/docs/n8n-integration-notes.md` | Sheet contract + ownership |
| Spec docs | `app-validation-spec/APP_PACKAGE_SPEC.md` | Clarifications only if needed; no new fields for WF3 |
| Schema | `app-validation-spec/schemas/app.schema.json` | Only if optional fields approved (not for WF3) |
| Examples | templates/examples `app.json` | Align event names |
| Starter | `app-package-starter/README.md`, `START_HERE.md` | WF3 webhook + Sheet expectations |
| Landing template | `landing-template/lib/tracking.ts`, `session.ts`, TrackingProvider, README | Port sandbox attribution/`eventId`/`consentStatus` |
| Implementation guide | `AI_IMPLEMENTATION_GUIDE.md` | WF3 proven; drop stale “no JSON” language |
| Global search | any `scooter.app.n8n.cloud` | Replace with `scottyo` |

## Config-driven promotion rules

See `rehearsals/wf3-human-lab-sandbox/CONFIG-DRIVEN-VS-HARDCODED.md`.

Must parameterize per app: `appId`, webhook path, Sheet ID/tab, experiment IDs, landing URL.  
Must share: 33-col event contract, validate/map Code, node sequence, credential type.

## Release Checklist

- [x] Master backlog updated with proven values (BL-031–BL-039).
- [x] Dependency graph reviewed.
- [x] WF3 external curl evidence attached.
- [ ] Browser E2E (optional for doc sync; required before paid traffic).
- [x] WF4 V1 dry-run revised and proven (local + n8n execution 35). Claude Context Package + Prompt A/B ready.
- [x] Prompt A VERIFY_* table reconciled (`rehearsals/wf4-meta-ads-sandbox/notes/meta-research-prompt-a-results.md`).
- [x] Architecture revision decided: Ad Plan → adapter SSOT → ledger; V1 `LINK_CLICKS`+`IMPRESSIONS`; `created_paused`; root preserved until activation.
- [ ] Defer production `app-validation-spec` / `app-package-starter` / WF-Ads blueprint sync until Prompt B + create-paused design freeze.
- [ ] After Prompt B: sync blueprint + starter; document WF-Ads does not set root `validating` until human activation.
- [ ] Schema: keep `ads.meta.status` = `created_paused` (no rename). `ads.specialAdCategories` not required for V1 (adapter `[]`).
- [x] Shared components / config-driven rules documented.
- [ ] Production docs updated in one pass.
- [x] No production secrets introduced.
- [ ] All references use `scottyo`, 33 columns, Route Valid Events, correct credential label.
