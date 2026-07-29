# Track C Proof — WF0→WF3 Paid-Traffic Measurement Loop

**Date:** 2026-07-27  
**Prompt 3 track:** C  
**Verdict:** **PASS** (measurement loop closable; Meta Sheet ID join remains design-only)

No Meta POSTs. WF4 create path remained disabled throughout.

---

## Shared webhook (canonical)

```text
https://scottyo.app.n8n.cloud/webhook/app-validation/events
```

WF0 writes this URL into Drive `app.json`. WF2 pass-through embeds it in landing `app-config.json`. WF3 (`7G2fJmqKsr8CGVID`) receives POSTs. Apps distinguished by payload `appId` / experiment fields — not per-app paths.

Older `…/human-lab-wf1-sandbox-events` is historical curl-only.

---

## BL-005 — WF0 webhook provisioning

| Check | Result |
|-------|--------|
| WF0 workflow | `kM6JiXaJMVje5sxR` — proof exec **27** ([`wf0-provisioning-test-report.md`](../../wf0-provisioning-test-report.md)) |
| Fields written | only `status: ready` + `tracking.webhookUrl` → shared URL |
| Live landing still embeds URL | **Yes** (2026-07-27 HTML contains `app-validation/events`) |
| Local fixtures synced | `wf1-human-lab-sandbox/app.json` + WF2 drive-fixture `app.json` now have shared URL |

**Status:** Proven. No re-run required while live landing embed remains correct.

---

## BL-006 — WF2 tracking embed

| Check | Result |
|-------|--------|
| GitHub `app-config.json` | `tracking.webhookUrl` = shared URL |
| Live `https://human-lab-wf2-sandbox.vercel.app/` | embeds shared URL |
| Mechanism | WF2 pass-through `pkg.tracking.webhookUrl` → `app-data/app-config.json` |

**Status:** Proven.

---

## WF3 browser event E2E (live, 2026-07-27)

Real browsers POSTed from the deployed landing (not curl). Evidence via n8n executions:

| Exec | Browser | eventType | Attribution | Sheet Append |
|------|---------|-----------|-------------|--------------|
| **91** | Safari macOS | `page_view` | organic (no UTM) | success · `eventId` `65bd6d98-…` |
| **89** | Safari macOS | `page_view` | organic | success |
| **88** | Chrome (FB in-app) | `page_view` | `utm_source=facebook` `utm_medium=paid_social` + `fbclid` | success |
| **87** | iPhone Safari | `page_view` | facebook paid_social + `fbclid` | success |
| **84** | Android Chrome | `page_view` | facebook paid_social + `fbclid` | success |
| **83** | iPhone Safari | `page_view` | facebook UTMs persisted on `/data-deletion` | success |
| **82** / **81** | iPhone / Android | `page_view` | facebook paid_social + `fbclid` | success |

Common proofs on sampled rows:

- `origin` / `referer` = live landing
- Client `eventId` present (landing-generated UUID)
- n8n `receivedAt` set
- `consentStatus=unknown`
- Meta columns blank (`""`) — expected until URL dynamic params / join populate them
- Append Row → Respond 200 success

Historical curl rehearsal still covers all four event types (`page_view`, `email_captured`, `buy_now_clicked`, `mockup_interacted`) → Sheet.

**Browser E2E status:** Proven for live landing → webhook → Sheet (`page_view` critical path + paid attribution params).

---

## Attribution / eventId / Sheet writes

| Capability | Status |
|------------|--------|
| `eventId` from landing | Proven (browser execs) |
| UTM + `fbclid` persistence | Proven (execs 81–88) |
| Sheet 33-col append | Proven (Append Row success) |
| Curl 4-event matrix | Proven (earlier WF3 rehearsal) |

---

## Paid-click-to-event

**Partial → Proven at attribution layer (2026-07-27):**

Multiple live `page_view` rows arrived with:

- `utm_source=facebook`
- `utm_medium=paid_social`
- `utm_campaign=human-lab-validation`
- non-empty `fbclid`
- `referrer` from facebook / m.facebook.com

Sheet Meta ID columns remain blank (no `metaCampaignId` / `metaAdSetId` / `metaAdId` / `placement` yet). Full ID-level join is the design item below — not required to close the browser measurement loop.

Public delivery / Standard Access remains a separate Scott UI ops item; these events prove the landing can measure paid-click traffic when it arrives.

---

## Meta ID / placement joins (design)

**Goal:** Populate Sheet columns `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement` for Decision joins.

**Preferred (package-driven):**

1. WF4 destination URL includes Meta URL dynamic parameters (`{{campaign.id}}`, `{{adset.id}}`, `{{ad.id}}`, `{{placement}}`) per Meta Help Center specs already cited in `CREATIVE-ASSET-SPECS.md`.
2. Landing tracking lib reads query params into payload fields (or maps into existing Meta columns).
3. Every event in the session carries the IDs (same persistence pattern as UTMs/`fbclid`).

**Fallback (offline):**

- WF-Decision / enrichment job joins Sheet rows to `ads.meta.*` (Drive write-back) by `appId` + time window + `fbclid` when dynamic params absent.

**Not done in Track C:** implementation of dynamic-param mapping or Decision join. Design recorded for Track B / E.

---

## WF4 safety (unchanged)

| Gate | Value |
|------|-------|
| Workflow | `YIc53GBq4upelYp6` |
| Active | `false` |
| `mode` | `dry_run` |
| `approval` | `false` |
| Create Campaign / Image / Creative / Ad nodes | `disabled: true` |
| Meta POSTs this track | **0** |

---

## Residual / next

1. Optional: Scott UI spot-check Sheet rows for exec 91 / 84.
2. Track A (video) is unblocked from a measurement-P0 perspective — still requires exact `APPROVE WF4 VIDEO CREATE-PAUSED V1` later.
3. Before any create re-enable: Already Complete IF (Track B safety).
4. Meta Standard Access + business verify remain Scott UI for public delivery.
