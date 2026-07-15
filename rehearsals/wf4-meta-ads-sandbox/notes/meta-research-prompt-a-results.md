# WF4 Prompt A — Canonical Reconciled Results

**Status:** Reconciled 2026-07-15  
**Scope:** Documentation research only. No Meta mutations. Create-paused remains disabled.  
**Sources:**

- [`Claude Meta Research.md`](./Claude%20Meta%20Research.md)
- [`GPT Meta Research.md`](./GPT%20Meta%20Research.md)
- Official Meta Marketing API docs cited below (Billing Events, Versioning, Special Ad Categories, Ad Set / Creative references)

**Evidence weight:** Where Claude and GPT disagree, prefer Claude’s official Marketing API citations plus Meta’s Billing Events compatibility matrix over GPT’s SDK-only / login-blocked caution—unless GPT is more precise on field paths or remaining uncertainty.

---

## A. Executive summary

1. Configure Marketing API **`v25.0`** (documented current version).
2. V1 Meta objective is **`OUTCOME_TRAFFIC`** — no Pixel/CAPI in V1; do not send author `ads.objective: conversions` as a Meta enum.
3. V1 ad-set pairing: **`optimization_goal = LANDING_PAGE_VIEWS`** + **`billing_event = IMPRESSIONS`** (Meta Billing Events matrix).
4. Budget: USD **`daily_budget` in cents**; `$1.00 → 100`. Retain n8n `MAX_DAILY_BUDGET_USD = 10` fail-closed.
5. `$1/day` sits at Meta’s published US/`IMPRESSIONS` floor — **conditional**; always read account `min_daily_budget` in Prompt B.
6. **`special_ad_categories: []`** (decision label `NONE`) for general wellness/self-experimentation; avoid personal-attribute health claims in copy.
7. Page required via **`object_story_spec.page_id`**; Instagram field is **`instagram_user_id`** (not legacy `instagram_actor_id`).
8. Create sequence: **Campaign → Ad Set → image upload → Ad Creative → Ad**. Only Campaign / Ad Set / Ad are **PAUSED**; Creative is an asset.
9. Token: **system user** with `ads_management` + `ads_read`; Standard Access sufficient for own ad account (no App Review).
10. **Do not enable create-paused** until Manual Meta setup + Prompt B + explicit operator approval.

---

## B. VERIFY_RESOLUTION_TABLE (canonical)

```yaml
verification_date: "2026-07-15"
META_API_VERSION: "v25.0"
OBJECTIVE_MAPPING:
  conversions: "OUTCOME_SALES"
  traffic: "OUTCOME_TRAFFIC"
  awareness: "OUTCOME_AWARENESS"
  leads: "OUTCOME_LEADS"
  app-installs: "OUTCOME_APP_PROMOTION"
RECOMMENDED_OBJECTIVE_FOR_LANDING_FUNNEL: "OUTCOME_TRAFFIC"
RECOMMENDED_OBJECTIVE_RATIONALE: "External Sheet/webhook tracking only; no Pixel/CAPI. Prefer Meta-observable landing traffic over Sales/Leads optimization."
BILLING_EVENT: "IMPRESSIONS"
OPTIMIZATION_GOAL: "LINK_CLICKS"
ALT_OPTIMIZATION_GOAL: "LANDING_PAGE_VIEWS (alternative; not V1 default)"
BUDGET_MINOR_UNIT_RULE: "unsigned integer minor currency units; USD cents; $1.00 => 100"
MIN_DAILY_BUDGET_USD: "UNVERIFIED account-specific (Prompt B: AdAccount.min_daily_budget). Published guidance: ~$1.00 for IMPRESSIONS in US/tier-2; $1/day fixture is conditional with zero margin."
SPECIAL_AD_CATEGORIES: "[]"
SPECIAL_AD_CATEGORY_DECISION: "NONE"
PAGE_ID_FIELD: "object_story_spec.page_id"
INSTAGRAM_ACTOR_FIELD: "instagram_user_id"
TOKEN_MODEL_RECOMMENDED: "system-user access token"
TOKEN_SCOPES_REQUIRED:
  - "ads_management"
  - "ads_read"
APP_REVIEW_REQUIRED: "no for own ad account with Standard Access; Advanced Access only when managing other businesses' accounts"
PAUSED_CREATE_SUPPORTED: "yes for Campaign, Ad Set, and Ad; N/A for Ad Creative asset"
BROAD_TARGETING_INTERESTS_OPTIONAL: "yes"
CREATE_SEQUENCE: "Campaign -> Ad Set -> Image upload (adimages) -> Ad Creative -> Ad"
IMAGE_HASH_FIELD: "object_story_spec.link_data.image_hash (after POST /act_{id}/adimages)"
ONE_DOLLAR_PER_DAY_ALLOWED: "conditional"
SOURCES:
  - url: "https://developers.facebook.com/docs/marketing-api/versions"
    title: "Versioning (Marketing API) — current v25.0"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/bidding/overview/billing-events"
    title: "Billing Events — LANDING_PAGE_VIEWS requires IMPRESSIONS"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/special-ad-category"
    title: "Special Ad Categories"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/reference/ad-campaign/"
    title: "Ad Set reference"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/reference/ad-creative/"
    title: "Ad Creative reference"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/reference/ad-image/"
    title: "Ad Image reference"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/business-management-apis/system-users"
    title: "System Users"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/instagram/ads-api/guides/pages-ig-account"
    title: "Set Up Instagram Accounts With Pages"
    checked: "2026-07-15"
```

---

## C. Conflicts / disagreements

| Topic | Claude | GPT | Official Meta evidence | Final V1 decision |
|-------|--------|-----|------------------------|-------------------|
| API version certainty | `v25.0` DOCUMENTED | `v25.0` INFERENCE from Business SDK 25.x | [Marketing API Versioning](https://developers.facebook.com/docs/marketing-api/versions): current version is **v25.0** | **`v25.0` DOCUMENTED**; keep in n8n Config |
| Optimization goal | `LANDING_PAGE_VIEWS` | `LINK_CLICKS` | Ad Set / objective mapping supports both under Traffic; Billing Events restricts LPV | **`LANDING_PAGE_VIEWS`** (better landing-funnel fit without Pixel) |
| Billing event | `IMPRESSIONS` | `UNVERIFIED` (candidate `IMPRESSIONS`) | [Billing Events](https://developers.facebook.com/docs/marketing-api/bidding/overview/billing-events): `LANDING_PAGE_VIEWS` → **`IMPRESSIONS` only** | **`IMPRESSIONS`** |
| Min daily budget | Published `$0.50` / `$1.00` US tier for IMPRESSIONS | Account `min_daily_budget` only; no universal USD | Ad Set considerations + AdAccount `min_daily_budget` field | **Both:** publish Claude guidance; **require Prompt B** account read before create-paused |
| Special categories payload | `NONE` (or empty array) | `[]` empty array | Special Ad Categories: send categories array; empty/`NONE` for non-special | **API: `[]`**; decision label **`NONE`** |
| Instagram field / requirement | `instagram_user_id`; optional if IG omitted | `instagram_user_id`; requirement for IG placement UNVERIFIED | Pages–IG setup guide; object_story_spec uses `instagram_user_id` | Field **`instagram_user_id`**; requirement **UNVERIFIED** until Prompt B. If `ads.platforms` includes `instagram`, Config must supply ID before create-paused |
| Image / copy hard limits | Ads Guide sizes + soft char caps | Placement limits UNVERIFIED (Ads Guide blocked) | Ads Guide + Creative refs conflict slightly on soft caps | Soft guidance only; **do not hard-fail** dry-run on char counts |
| Creative PAUSED | No PAUSED on creative | Same | Creative is an asset (status ACTIVE/IN_PROCESS/etc., not delivery PAUSED) | Campaign / Ad Set / Ad **PAUSED**; Creative **N/A asset** |

---

## D. Remaining UNVERIFIED / account-specific (Prompt B gates)

- Ad account `currency`, `account_status`, `disable_reason`, funding / payment readiness
- Account `min_daily_budget` vs computed `$1/day` (`daily_budget: 100`)
- Whether `$1/day` is accepted on the real account (zero margin vs published US floor)
- Page ownership / assignment to the ad account and Business Portfolio
- Whether `instagram_user_id` is mandatory when `publisher_platforms` includes `instagram`
- Exact Page permission scopes beyond `ads_management` / `ads_read`
- Bid strategy default when `bid_strategy` / `bid_amount` omitted
- Soft headline / primary-text / description recommendation limits (use safer short copy operationally)
- Live acceptance of `OUTCOME_TRAFFIC` + `LANDING_PAGE_VIEWS` + `IMPRESSIONS` on the real account (docs-compatible; account may still reject)
- Business Portfolio ID, Ad Account ID (`act_…`), Page ID, Instagram user ID (fill via Prompt B into n8n Config)

---

## E. Required contract corrections (vs pre-Prompt-A dry-run)

| Area | Correction |
|------|------------|
| Objective | Map V1 landing funnel to **`OUTCOME_TRAFFIC`**. Keep author `ads.objective: conversions` as provider-neutral hint; never send it raw to Meta. Mapping table retains `conversions → OUTCOME_SALES` for future Pixel/CAPI. |
| Billing / optimization | Use **`IMPRESSIONS` + `LANDING_PAGE_VIEWS`**, not unresolved `VERIFY_FOR_OBJECTIVE`. |
| Budget | Convert daily USD to minor units (`× 100` for USD). Reject non-integral conversion. Fail-closed on `MAX_DAILY_BUDGET_USD`. Treat `$1/day` as conditional pending account min. |
| Page / Instagram | Inject `object_story_spec.page_id` from n8n Config. Use **`instagram_user_id`** (rename away from `instagram_actor_id` in operator docs). |
| Token / App Review | Prefer **system-user** token; scopes `ads_management`, `ads_read`; no App Review for own-account Standard Access. |
| Special ad categories | Send **`[]`**; decision `NONE`. Re-evaluate if copy becomes housing/employment/finance/politics/gambling. |
| Create sequence | **Campaign → Ad Set → `POST …/adimages` → Ad Creative → Ad**. Capture `image_hash` before creative. |
| PAUSED semantics | Only Campaign, Ad Set, Ad set `status: PAUSED`. Do not claim Creative is PAUSED. |
| Write-back | Still only after all four IDs verified + Campaign/Ad Set/Ad configured PAUSED; no `status: validating` on partial create. |

---

## F. Revised implementation recommendations (stop before create-paused)

1. **Dry-run / Config:** Apply reconciled VERIFY values in sandbox dry-run artifacts and document recommended n8n Config values (`v25.0`, objective maps, `IMPRESSIONS`, `LANDING_PAGE_VIEWS`, `special_ad_categories: []`, minor-unit rule). Keep Page ID / image_hash / account IDs as runtime placeholders until Prompt B.
2. **Operator next:** Complete [`MANUAL-META-ACCOUNT-SETUP-CHECKLIST.md`](../MANUAL-META-ACCOUNT-SETUP-CHECKLIST.md) → run Prompt B → fill Portfolio / Ad Account / Page / `instagram_user_id` into n8n **non-secret** Config; token + approval token into **credentials**.
3. **Human Lab budget:** Production Drive `500/14` still exceeds `$10` cap — do not edit Drive; before any create-paused on that package, lower budget or intentionally raise n8n cap.
4. **First create-paused (later, only if approved):** Prefer confirming account `min_daily_budget` and Page/IG readiness first. Consider `$2–3/day` buffer if `$1` is rejected—only with operator approval and still ≤ cap.
5. **Do not:** enable create-paused nodes, attach live Meta write credentials, sync production blueprints/spec/starter, or mutate Meta until explicit approval after Prompt B.

---

## G. Field placement (unchanged ownership model)

| Value | Location |
|-------|----------|
| Author ads copy / targeting / platforms / UTM / media | provider-neutral `app.json` `ads.*` |
| Experiment budget | `experiment.testBudget` |
| Meta IDs / status / landingUrl / dailyBudget write-back | `ads.meta.*` |
| API version, Portfolio / Ad Account / Page / IG user ID, `MAX_DAILY_BUDGET_USD` | n8n non-secret Config |
| Objective map, billing, optimization, payloads, verification | **Meta adapter SSOT** (`lib/meta-adapter.js`) |
| Meta access token, `WF4_CREATE_PAUSED_APPROVAL_TOKEN` | n8n secrets |
| Payment method, account min budget, Page/IG linkage | Meta account settings / Prompt B |

---

## Freeze

> Prompt A reconciled. Dry-run VERIFY placeholders updated to this table. Create-paused remains disabled until Manual setup, Prompt B, Config/credentials, and explicit operator approval.

---

## H. Architecture revision overrides (2026-07-15)

Applied after Prompt A reconciliation; supersede earlier V1 pairing recommendation where noted:

1. **V1 optimization/billing:** Use **`LINK_CLICKS` + `IMPRESSIONS`** with `OUTCOME_TRAFFIC`. Do **not** lock `LANDING_PAGE_VIEWS` for V1; treat it as an alternative pending account-specific validation.
2. **`ads.meta.status`:** Keep schema value **`created_paused`**. Do not rename to `paused_created` this pass.
3. **Root status:** After paused create, **preserve** existing root status. Set `validating` only after a separate human-approved activation step.
4. **Adapter SSOT:** Objective map, billing, optimization, payloads, and verification live in version-controlled [`lib/meta-adapter.js`](../lib/meta-adapter.js). Operator Config keeps API version, account/Page/IG IDs, budget cap, and secrets only. Rehearse scripts / workflow / n8n Code must consume or sync from the adapter — no independent mapping copies.
