# WF3 Doc Drift And Required Production Updates

**Rule:** Record only. Do **not** edit production files until Spec 1.5.0 coordinated pass.

## Proven vs production docs

| Area | Current production / blueprint state | Proven sandbox state | Required update |
|------|--------------------------------------|----------------------|-----------------|
| `N8N_BASE_URL` | `https://scooter.app.n8n.cloud` in `PLATFORM_SETUP_VALUES.md`, many handoffs | `https://scottyo.app.n8n.cloud` | Replace scooter → scottyo everywhere |
| Google credential label | `Google Service Account` | `Google Service Account account` | Document actual label + ID |
| Sheet schema | **25** columns in WF3 blueprint, architecture §6 | **33** columns | Sync blueprint, architecture, n8n-integration-notes |
| Node list | 7 nodes (no IF) in blueprint | 8 nodes (+ Route Valid Events) | Update blueprint + AI prompt |
| Blueprint status | “Blueprint only — no workflow JSON” | Live workflow `7G2fJmqKsr8CGVID` + SDK source | Export `n8n-workflows/WF3-tracking.json` + prompt |
| `landing-template` | No `eventId` / `fbclid` persist / `consentStatus` | Sandbox landing has them | Port from `rehearsals/wf2-.../landing-project/lib/` |
| Architecture checklist | “25 fields matching Sheet” | 33 fields | Update checklist |
| Spec / starter | No 33-col Sheet contract documented | Canonical in rehearsal | Add Sheet contract + event field notes to spec docs |
| WF0 path examples | Often `scooter` host | `scottyo` host | Align examples |

## Files to update in Spec 1.5.0 pass (production)

1. `PLATFORM_SETUP_VALUES.md` — base URL, credential label, Sheet proof status  
2. `n8n-workflows/WF3-TRACKING-PIPELINE-BLUEPRINT.md` — 33 cols, Route Valid Events, proven status  
3. New: `n8n-workflows/WF3-tracking.json` (export) + `WF3-N8N-AI-PROMPT.md`  
4. `N8N_PLATFORM_ARCHITECTURE.md` §6 — payload + Sheet columns  
5. `app-validation-spec/docs/n8n-integration-notes.md` — Sheet columns  
6. `landing-template/lib/tracking.ts` + `session.ts` + `TrackingProvider.tsx`  
7. `landing-template/README.md` — payload example  
8. `app-package-starter` README / START_HERE — WF3 webhook + Sheet expectations  
9. `AI_IMPLEMENTATION_GUIDE.md` — WF3 proven  
10. Any remaining `scooter.app.n8n.cloud` references  

## Spec / schema

- **No new `app.json` fields required** for WF3 (confirmed).  
- Optional later: `tracking.lastEventAt` (still deferred).  
- Meta Sheet columns are runtime-only, not `ads.*` author fields.

## Rehearsal backlog items covering these updates

See `rehearsals/SANDBOX-MASTER-BACKLOG.md` BL-031+.
