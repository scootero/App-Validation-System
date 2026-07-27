# Manual Meta Account Setup Checklist

**Audience:** Operator (you)  
**When:** After Prompt A; before create-paused  
**Scope:** Meta resources for future paused ads. **Do not create campaigns or spend.**

---

## Confirmed account (2026-07-16)

| Key | Value |
|-----|-------|
| Business Portfolio | Orro — `1074341285117707` |
| Ad Account | App Validation Platform — `act_979257825150251` |
| Currency | USD |
| Payment method | present |
| `min_daily_budget` | $1 |
| Page | Orro — `1237104852815793` |
| Instagram | @useorro — `17841440875992246` |
| System User | Orro n8n — `61591805738163` |
| Developer App | Orro Marketing API — `917652350641212` |
| n8n credential | `Meta Marketing API - Orro` (token in n8n only) |
| API version | `v25.0` |
| Safety ceiling | `MAX_DAILY_BUDGET_USD = 2` (not default ad budget) |
| V1 pairing (adapter) | `OUTCOME_TRAFFIC` + `LINK_CLICKS` + `IMPRESSIONS` |
| Campaign create field | `is_adset_budget_sharing_enabled: false` (required for ad-set budgets) |

---

## Before you start

- [x] Prompt A results reviewed
- [x] Campaign / Ad Set / Ad created **PAUSED** later; Creative is an asset
- [x] Global n8n cap: `MAX_DAILY_BUDGET_USD = 2`
- [x] First-test fixture budget: **$1/day** (14/14) — within account min and ceiling
- [x] V1 pairing: `OUTCOME_TRAFFIC` + `LINK_CLICKS` + `IMPRESSIONS`

## A–E. Meta setup

- [x] Business Portfolio ID recorded
- [x] Ad Account ID recorded (`act_…`); USD; payment present
- [x] Page ID recorded
- [x] Instagram user ID recorded (connected to Page)
- [x] Developer App + system user; credential in n8n (`Meta Marketing API - Orro`)
- [x] Scopes include `ads_management`, `ads_read` (+ page/business scopes as configured)

## I. Meta App Live / publish readiness (before Ad / creative create)

These URLs come from the **deployed landing site** (WF2), not from n8n Config secrets.

Human Lab (sandbox) targets after deploy:

| Field | URL |
|-------|-----|
| Privacy Policy | `https://human-lab-wf2-sandbox.vercel.app/privacy` |
| Data Deletion Instructions | `https://human-lab-wf2-sandbox.vercel.app/data-deletion` |

- [ ] Landing `/privacy` and `/data-deletion` are live and publicly reachable
- [ ] Footer links: Privacy Policy, Data Deletion, Contact (`mailto:` from `identity.contactEmail`)
- [ ] Canonical package has `identity.contactEmail` (schema-optional; **required for Meta advertising**)
- [ ] Canonical package has `identity.privacyEffectiveDate` (`YYYY-MM-DD`) when publishing policy pages
- [ ] Privacy Policy URL pasted into Meta Developer App settings (when moving app to Live / Public)
- [ ] Data Deletion Instructions URL pasted into Meta Developer App settings if Meta asks for it
- [ ] Meta Developer App mode is **Live / Public** (not Development / Unpublished)

**Blocker:** WF4 cannot complete creative / Ad creation while the Meta app remains in Development / Unpublished mode (Meta error: ads creative post created by an app in development mode). Do not resume create-paused until Live + URLs are set.

**Drive note:** Local landing `app-config.json` patches are overwritten by the next WF2 run unless the live Google Drive `app.json` is updated with the same `identity` / FAQ / footer fields.

## F. n8n Workflow Config (non-secret) — sync live after repo update

Add/set on workflow **WF4 - Meta Ads Sandbox** → node **Workflow Config**:

| Key | Value |
|-----|-------|
| `META_BUSINESS_PORTFOLIO_ID` | `1074341285117707` |
| `META_AD_ACCOUNT_ID` | `act_979257825150251` |
| `META_PAGE_ID` | `1237104852815793` |
| `META_INSTAGRAM_USER_ID` | `17841440875992246` |
| `META_API_VERSION` / `metaApiVersion` | `v25.0` |
| `MAX_DAILY_BUDGET_USD` | `2` |

Do **not** put objective/billing/optimization in Config — adapter SSOT owns those.  
Do **not** put Meta token in Config.

## G. n8n Credentials (secrets)

- [x] Meta token in credential `Meta Marketing API - Orro` (never in git)
- [x] ~~Header Auth approval vault~~ **removed 2026-07-21** — not required for WF4 runtime (gates = mode + approval + `_createPausedAllowed`)

## H. Explicitly do NOT do yet

- [ ] Do not create Campaign / Ad Set / Creative / Ad
- [ ] Do not activate ads or enable spend
- [ ] Do not enable WF4 create-paused branch
- [ ] Do not activate the WF4 workflow
- [ ] Do not modify production Drive app.json
- [ ] Do not attach Meta credential to create HTTP nodes until create-paused is approved

---

## Next

1. After Cursor finishes repo/source updates: paste non-secret Config values into live **Workflow Config**.
2. Keep workflow inactive; keep create-paused disabled.
3. Create-paused only after explicit operator approval.
