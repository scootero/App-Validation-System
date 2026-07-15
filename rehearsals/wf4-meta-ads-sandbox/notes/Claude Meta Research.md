# WF4 Meta Marketing API Research Report

**Scope confirmed:** This was documentation-only research. No Meta account was inspected, no tokens were requested or generated, and no campaigns/ad sets/creatives/ads/Pages/billing resources were created or modified.

---

## A. Executive Summary

- Current Marketing API version is **v25.0** (Marketing API has its own 90-day deprecation cycle, separate from core Graph API versioning).
- **OUTCOME_TRAFFIC** is the correct V1 objective: it drives clicks to an external URL, supports the **LANDING_PAGE_VIEWS** optimization goal, and does **not** require a Pixel or CAPI when the destination is a plain website (Pixel is only mandated for OFFSITE_CONVERSIONS-style optimization goals).
- Recommended pairing: `billing_event = IMPRESSIONS`, `optimization_goal = LANDING_PAGE_VIEWS`. This is the only billing event Meta's own compatibility table allows for that optimization goal.
- Campaign, ad set, and ad **all officially support `status: "PAUSED"` at creation**; ad creative has no PAUSED state of its own (it's just a stored asset with ACTIVE/IN_PROCESS/WITH_ISSUES/DELETED).
- Budget minimums are billing-event- and country-tier-dependent. For `IMPRESSIONS` billing in a "tier-2" country (the US is one), Meta's documented floor is **$1.00/day** — exactly your $1/day target, but with zero margin.
- `daily_budget` is submitted in the account currency's minor unit (cents for USD); the field-level technical floor is 100 (i.e., $1.00), separate from the billing-event minimum above.
- Special ad category should be **NONE** — general wellness/self-experimentation content is explicitly outside Meta's Housing/Employment/Financial/Political categories, but ad copy must avoid asserting personal health attributes (a distinct, separate policy risk).
- A Facebook Page is required to create any modern link-ad creative (`page_id` inside `object_story_spec`); Instagram is fully optional in V1 via `instagram_user_id`.
- For managing your own ad account, **Standard Access** to `ads_management`/`ads_read` is sufficient — no App Review needed. A **system-user token** (not a personal user token) is the right model for unattended n8n automation.
- Description-field character limits and exact CTA availability by objective remain UNVERIFIED in official docs — flagged below, not guessed.

---

## B. V1 Decision Table

| Item | Classification |
|---|---|
| Objective (OUTCOME_TRAFFIC) | Required for V1 |
| Pixel | Not needed for V1 |
| CAPI | Not needed for V1 |
| Interests | Not needed for V1 |
| Instagram | Optional future enhancement |
| Custom audiences | Not needed for V1 |
| Detailed placements | Not needed for V1 |
| Retargeting | Not needed for V1 |
| Special ad categories field (must be sent, value NONE) | Required for V1 |
| System-user token | Required for V1 |

---

## C. VERIFY Resolution YAML

```yaml
verification_date: "2026-07-15"

META_API_VERSION: "v25.0"

RECOMMENDED_OBJECTIVE_FOR_V1: "OUTCOME_TRAFFIC"

RECOMMENDED_OBJECTIVE_RATIONALE: "Sends traffic to an external URL, supports LANDING_PAGE_VIEWS optimization which measures landing-page loads, and does not require promoted_object/pixel_id for a plain website destination."

OBJECTIVE_MAPPING:
  conversions: "OUTCOME_SALES (legacy CONVERSIONS) - requires pixel_id, not used in V1"
  traffic: "OUTCOME_TRAFFIC (legacy LINK_CLICKS)"
  awareness: "OUTCOME_AWARENESS (legacy BRAND_AWARENESS / REACH)"
  leads: "OUTCOME_LEADS (legacy LEAD_GENERATION)"
  app-installs: "OUTCOME_APP_PROMOTION (legacy APP_INSTALLS)"

BILLING_EVENT_FOR_V1: "IMPRESSIONS"

OPTIMIZATION_GOAL_FOR_V1: "LANDING_PAGE_VIEWS"

BUDGET_MINOR_UNIT_RULE: "daily_budget is an integer in the ad account's currency minor unit (cents for USD); field-level floor is 100 (i.e. $1.00 USD)"

ONE_DOLLAR_PER_DAY_ALLOWED: "conditional"

MIN_DAILY_BUDGET_USD: "0.50 (standard) / 1.00 (tier-2 countries incl. US, UK, CA, AU, DE, FR, JP, etc.) for IMPRESSIONS billing_event with LOWEST_COST_WITHOUT_CAP bid strategy. LINK_CLICKS billing minimums are higher ($2.50 / $5.00)."

SPECIAL_AD_CATEGORY_DECISION: "NONE"

PAGE_ID_FIELD: "page_id"

INSTAGRAM_ACTOR_FIELD: "instagram_user_id or N/A if Instagram is omitted"

TOKEN_MODEL_RECOMMENDED: "system-user access token (Business Manager system user)"

TOKEN_SCOPES_REQUIRED: ["ads_management", "ads_read"]

APP_REVIEW_OR_ADVANCED_ACCESS_REQUIRED: "no, for managing your own ad account under Standard Access; conditional/yes only if managing other businesses' accounts or seeking higher rate-limit tier"

PAUSED_CREATE_SUPPORTED: "yes"

BROAD_TARGETING_WITHOUT_INTERESTS_SUPPORTED: "yes"

IMAGE_FORMATS: ["JPG", "PNG"]

IMAGE_RECOMMENDED_SIZE: "1440x1800 px, 4:5 ratio; minimum 600x750 px; 3% aspect-ratio tolerance"

IMAGE_SIZE_LIMIT: "30 MB max file size"

HEADLINE_LIMIT: "UNVERIFIED - Ads Guide recommends 27 characters, Ad Creative reference recommends 25 characters as a general title cap; use 25 as the safer figure"

PRIMARY_TEXT_LIMIT: "UNVERIFIED - Ads Guide recommends 50-150 characters, Ad Creative reference recommends 90 characters as a general body cap; these are design recommendations, not hard API limits"

DESCRIPTION_LIMIT: "UNVERIFIED - no explicit character count found for the link-ad description field in current Marketing API reference"

CTA_VALUES_RECOMMENDED: ["LEARN_MORE", "SIGN_UP"]

SOURCES:
  - url: "https://developers.facebook.com/docs/marketing-api/versions"
    title: "Versioning (Marketing API)"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview"
    title: "Marketing API Overview"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group/"
    title: "Ad Campaign Group (Campaign reference)"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/reference/ad-campaign/"
    title: "Ad Set reference"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/reference/ad-creative/"
    title: "Ad Creative reference"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data/"
    title: "Ad Creative Link Data reference"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/reference/ad-image/"
    title: "Ad Image reference"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/reference/adgroup/"
    title: "Ad (Adgroup) reference"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/audiences/reference/basic-targeting"
    title: "Basic Targeting"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/targeting-specs/"
    title: "Advanced Targeting"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/bidding/overview/billing-events"
    title: "Billing Events"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/support/faq/"
    title: "Developer FAQ - Marketing API"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/special-ad-category"
    title: "Special Ad Categories"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/marketing-api/overview/authorization"
    title: "Authorization"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/business-management-apis/system-users"
    title: "System Users - Business Management APIs"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/instagram/ads-api/guides/pages-ig-account"
    title: "Set Up Instagram Accounts With Pages"
    checked: "2026-07-15"
  - url: "https://developers.facebook.com/docs/sharing/domain-verification"
    title: "Domain Verification"
    checked: "2026-07-15"
  - url: "https://www.facebook.com/business/ads-guide/update/image/facebook-feed/traffic"
    title: "Traffic Image Ad Specs on Facebook Feed (Meta Ads Guide)"
    checked: "2026-07-15"
  - url: "https://transparency.meta.com/policies/ad-standards/restricted-goods-services/health-wellness/"
    title: "Health and Wellness (Meta Advertising Standards)"
    checked: "2026-07-15"
  - url: "https://transparency.meta.com/en-gb/policies/ad-standards/objectionable-content/privacy-violations-personal-attributes/"
    title: "Privacy violations and personal attributes (Meta Advertising Standards)"
    checked: "2026-07-15"
```

---

## D. Field Ownership Table

| Field | Location |
|---|---|
| `ads.objective`, `ads.headlines`, `ads.primaryTexts`, `ads.descriptions`, `ads.callToAction`, `ads.targeting.*`, `ads.platforms`, `ads.media`, `ads.utmTemplate` | provider-neutral `app.json` |
| `ads.meta.campaignId/adSetId/creativeId/adId/status/dailyBudget/landingUrl/createdAt/lastSyncedAt` | `ads.meta.*` in `app.json` |
| Meta API version, Business Portfolio ID, Ad Account ID, Facebook Page ID, Instagram actor ID | n8n non-secret config |
| Objective → billing_event/optimization_goal mapping table, MAX_DAILY_BUDGET_USD, special_ad_categories value | n8n non-secret config |
| Meta access token (system-user), WF4_CREATE_PAUSED_APPROVAL_TOKEN | n8n credentials/secrets |
| Business Manager domain verification, Page/Instagram account claiming, ad account currency/timezone/payment method setup | Meta account settings only |
| Pixel ID, CAPI dataset, interests IDs, custom audience IDs, detailed placement lists | not needed for V1 |

---

## E. Stability Classification

| Value | Classification |
|---|---|
| `v25.0` API version | Meta-version-specific (expires ~90 days after next version ships) |
| OUTCOME_TRAFFIC / LANDING_PAGE_VIEWS / IMPRESSIONS combination | Stable (documented, current-generation ODAX pattern) |
| Budget minimums ($0.50/$1.00 tiers) | Meta-version-specific / subject to change without a version bump (explicitly "can change based on situation" per Meta's own note) |
| `page_id`, `instagram_user_id`, `image_hash` field names | Stable |
| special_ad_categories enum values | Stable, but list has changed historically (CREDIT → FINANCIAL_PRODUCTS_SERVICES in Jan 2025) |
| Business Portfolio ID, Ad Account ID, Page ID, Instagram actor ID | Account-specific |
| Headline/primary-text/description character recommendations | App-specific in effect (soft design guidance, not enforced identically everywhere) |
| Token scopes (`ads_management`, `ads_read`) | Stable |

---

## F. Research Answers

**1. API and object creation** — DOCUMENTED FACT. Current version v25.0. Creation order is Campaign → Ad Set → Ad Creative (and Ad Image upload, which can happen any time before creative creation) → Ad. Each POST returns an `id`; the Ad references the Creative by `creative_id`, the Ad Set references the Campaign by `campaign_id`, the Ad references the Ad Set by `adset_id`. All three of Campaign, Ad Set, and Ad accept `status: "PAUSED"` at creation; Ad Creative has no PAUSED state. Read-back fields: `id`, `status`/`effective_status`, `issues_info` on each object. Source: developers.facebook.com Ad Campaign Group, Ad Set, Ad, and Ad Image reference pages, checked 2026-07-15. Impact: WF4's four-ID write-back gate (campaignId/adSetId/creativeId/adId) matches Meta's actual dependency graph.

**2. Best V1 objective** — DOCUMENTED FACT. OUTCOME_TRAFFIC with `optimization_goal: LANDING_PAGE_VIEWS` and `billing_event: IMPRESSIONS` is the only Meta-sanctioned combination for this optimization goal. Meta's own objective-mapping table shows no `promoted_object` (and therefore no pixel_id) requirement for this path when the destination is a plain website rather than an app. Source: Ad Campaign Group reference, Objective Mapping table and Billing Events page, checked 2026-07-15. Impact: confirms V1 needs no Pixel/CAPI setup.

**3. Budget rules** — DOCUMENTED FACT (with a caveat). `daily_budget` is an integer in the account currency's minor unit. Meta's Developer FAQ states a hard floor of 100 (minor units) for the field itself. Separately, Meta's Ad Set "Considerations" section sets billing-event-specific floors: $0.50/day standard, doubled to $1.00/day in a list of ~20 countries including the US, for IMPRESSIONS billing under the default (uncapped) bid strategy. $1/day therefore sits exactly at, not comfortably above, the documented US floor. INFERENCE: because Meta itself notes these figures "can change based on situation," a $1/day test carries real rejection risk with zero buffer; a first live test at $2–3/day would be safer if the workflow allows it, though your $1 target is not contradicted by documentation. Source: developers.facebook.com Ad Set reference and Developer FAQ, checked 2026-07-15. Impact: ONE_DOLLAR_PER_DAY_ALLOWED is "conditional," not a clean "yes."

**4. Account and actor requirements** — DOCUMENTED FACT. An Ad Account is tied to a Business Manager (`business` field) and has a `currency`, funding/payment status, and `account_status`. A Facebook Page is required for any modern link-ad creative via `object_story_spec.page_id`. Instagram requires an `instagram_user_id`, obtainable either from a Page-connected Instagram Business account or from a Page-Backed Instagram Account (a "shadow" IG identity Meta will auto-create from just an ADVERTISER role on the Page, no real Instagram account needed) — and can be omitted entirely for V1. Source: developers.facebook.com Ad Account reference and "Set Up Instagram Accounts With Pages" guide, checked 2026-07-15.

**5. Token and permissions** — DOCUMENTED FACT. System-user tokens are Meta's documented mechanism for "servers or software making API calls" and are the right fit for unattended n8n automation (a personal user token requires an OAuth login flow tied to a human). For managing only your own ad account, Standard Access to `ads_management` and `ads_read` is sufficient — no App Review / Advanced Access is required. Advanced Access / App Review is only required if the app manages other businesses' ad accounts. Source: developers.facebook.com Authorization guide and System Users overview, checked 2026-07-15. Non-secret config: Business Portfolio ID, Ad Account ID, Page ID, Instagram actor ID, API version. Secrets: the system-user access token itself.

**6. Creative requirements** — DOCUMENTED FACT for format/size/CTA; UNVERIFIED for exact description length. JPG/PNG, recommended 1440×1800 (4:5), minimum 600×750, 30MB max file size, uploaded via `POST /act_{id}/adimages` (base64 `bytes` or `image_file`) returning an `image_hash`. Headline and primary-text limits differ slightly between Meta's own Ads Guide (27/50–150 chars) and its API reference field-limit table (25/90 chars) — both are soft recommendations, not hard rejections, but the smaller figures are safer. `call_to_action_type` has a large documented enum including `LEARN_MORE`, `SIGN_UP`, `BUY_NOW`, `SHOP_NOW`. No description-field character cap is documented anywhere I found — flagged UNVERIFIED rather than guessed. Source: developers.facebook.com Ad Creative and Ad Creative Link Data references, plus facebook.com/business/ads-guide, checked 2026-07-15.

**7. Broad targeting** — DOCUMENTED FACT. Meta explicitly states at least one country must be specified in `geo_locations` unless using a Custom Audience; `age_min` defaults to 18, `age_max` is optional (max 65), `genders` defaults to all if omitted, and `interests`/`flexible_spec` are optional fields that simply aren't sent when not needed. `publisher_platforms: ["facebook","instagram"]` controls platform inclusion. Source: developers.facebook.com Basic Targeting and Advanced Targeting pages, checked 2026-07-15.

**8. Special ad categories** — DOCUMENTED FACT. Valid values: `HOUSING`, `EMPLOYMENT`, `FINANCIAL_PRODUCTS_SERVICES`, `ISSUES_ELECTIONS_POLITICS`, `NONE`. `NONE` (or an empty array) is required on every campaign that isn't one of those four categories. A general wellness/self-experimentation app is not itself a special ad category. Separately (not a special-ad-category issue), Meta's "Health and Wellness" ad standard exempts "general wellbeing" products like fitness apps from age-targeting restrictions that apply to weight-loss/cosmetic ads, and its "Privacy violations and personal attributes" standard prohibits ad copy that asserts a viewer has a specific health condition (e.g., copy resembling "Do you have diabetes?" is disallowed; framing as a service offering, e.g. "Sleep counseling available," is allowed). Source: developers.facebook.com Special Ad Category page and transparency.meta.com Health & Wellness / Privacy Violations & Personal Attributes standards, checked 2026-07-15. Impact: keep ad copy benefit-framed, not symptom/condition-framed, to reduce rejection risk.

**9. Common failures** — INFERENCE, synthesized from the documentation above rather than from a single failure-catalog page. Likely causes: missing/insufficient `ads_management` permission on the token; ad account not yet payment-ready (`account_status` not ACTIVE); Page not connected/owned by the same Business Manager as the ad account; `instagram_user_id` referencing an IG account not connected to the supplied `page_id`; objective/billing_event/optimization_goal mismatches outside Meta's compatibility table (e.g., requesting `LINK_CLICKS` billing with `LANDING_PAGE_VIEWS` optimization); requesting a promoted_object/pixel_id-dependent optimization goal without a Pixel configured; daily budget below the billing-event/country floor; creative failing title/body/CTA validation or missing `call_to_action` when required; omitting `special_ad_categories`; ad copy implying a personal health attribute; and calling a deprecated/expired API version. Source: synthesized from all reference pages above, checked 2026-07-15.

---

## G. Open Risks

The $1/day figure sits exactly on Meta's documented US floor for IMPRESSIONS billing with no safety margin; if Meta rounds up, applies a slightly different multiplier for your specific currency/account, or changes this "can change based on situation" value, the create-paused call could fail purely on budget even though everything else is correct — this blocks a guaranteed-clean $1/day test today.

Headline, primary-text, and description length limits are inconsistently documented (two different official numbers for headline/primary text, and no number at all for description); the dry-run bundle should validate against the smaller/safer figures until Meta's own docs are reconciled or a real create-paused test confirms behavior.

Whether a Facebook Page is strictly mandatory for every current-generation (ODAX) creative, or whether a legacy page-less link-ad creative path still functions under `v25.0`, is not fully confirmed — the only page-less example in the docs is explicitly a legacy pattern; treat "Page required" as the safe assumption for the first real account setup.

Bid strategy defaults (whether omitting both `bid_strategy` and `bid_amount` yields automatic/uncapped bidding) were not conclusively pinned down and could affect whether the $1/day budget is actually usable in practice versus merely accepted at creation.

None of this was verified against an actual ad account, Business Portfolio, Page, or token — account-specific readiness (payment method, Page ownership, Business Manager membership, token scopes actually granted) is unknown until Prompt B's account inspection is run, and that inspection itself must stay read-only per your instructions.

No Meta account was inspected or modified in the course of this research, and no campaigns, ad sets, creatives, ads, tokens, Pages, or billing resources were created.
