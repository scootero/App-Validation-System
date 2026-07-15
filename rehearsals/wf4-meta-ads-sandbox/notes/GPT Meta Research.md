# WF4 Meta Marketing API Research — Prompt A Results

**Verification date:** 2026-07-15  
**Scope:** Documentation research only; no Meta account inspection, token request, object creation, or mutation.  
**Architecture source:** WF4 context package, ownership rules, field classification, Meta ads contract, and dry-run payload supplied by the operator.

> **Evidence note:** Meta's interactive `developers.facebook.com` reference pages and Ads Guide were rate-limited or login-blocked during this research session. To avoid guessing, this report relies primarily on Meta's official Business SDK generated source, Meta's official Marketing API Postman collection, and Meta's official SDK release history. Values that could not be firmly resolved from those primary sources are explicitly `UNVERIFIED`.

## A. Executive summary

- **API version:** configure `v25.0` for the current implementation, but classify it as an **INFERENCE** from Meta's official 25.x Business SDK release line; re-check the Graph API changelog immediately before enabling `create_paused`.
- **Modern objective mapping:** `conversions → OUTCOME_SALES`, `traffic → OUTCOME_TRAFFIC`, `awareness → OUTCOME_AWARENESS`, `leads → OUTCOME_LEADS`, `app-installs → OUTCOME_APP_PROMOTION`.
- **Recommended V1 objective:** `OUTCOME_TRAFFIC`, because WF4 currently has no Pixel/CAPI event signal for Meta to optimize toward email submissions or Buy Now clicks.
- **Recommended optimization:** `LINK_CLICKS`. `LANDING_PAGE_VIEWS` may be preferable later if Meta has a reliable landing-page signal. The valid `billing_event` combination is still **UNVERIFIED** and should not be hardcoded yet.
- **Practical create sequence:** Campaign → Ad Set → image upload (before creative) → Ad Creative → Ad. Image upload can occur earlier, but the returned `image_hash` must exist before creative creation.
- **Paused safety:** Campaign, Ad Set, and Ad support `PAUSED`. The Ad Creative is an asset and is created normally; it is not another spend-bearing object that must be set to `PAUSED`.
- **Budget:** `daily_budget` is an unsigned integer and should be treated as currency minor units; for USD, `$1.00` should be sent as `100` (**INFERENCE**, not directly stated in the accessible primary reference). Meta exposes an account-level `min_daily_budget`, so there is no safe universal `$1/day` assumption.
- **Identity:** use `object_story_spec.page_id`; the current SDK field is `instagram_user_id`, not legacy `instagram_actor_id`. Whether an IG identity is mandatory solely because Instagram placement is selected remains **UNVERIFIED**.
- **Permissions:** Meta's official Postman collection says Standard Access with `ads_read` and `ads_management` is sufficient for an app managing its own ad account; Advanced Access is required when managing other people's ad accounts.
- **Still blocking live enablement:** billing/optimization compatibility, the actual account's `min_daily_budget`, Page/IG asset authorization, exact Page permission scopes, and current placement-specific image/copy limits.

## B. VERIFY_RESOLUTION_TABLE

```yaml
verification_date: "2026-07-15"
META_API_VERSION: "v25.0 (INFERENCE from Meta official Business SDK 25.x release line; re-check before live enablement)"
OBJECTIVE_MAPPING:
  conversions: "OUTCOME_SALES"
  traffic: "OUTCOME_TRAFFIC"
  awareness: "OUTCOME_AWARENESS"
  leads: "OUTCOME_LEADS"
  app-installs: "OUTCOME_APP_PROMOTION"
RECOMMENDED_OBJECTIVE_FOR_LANDING_FUNNEL: "OUTCOME_TRAFFIC"
RECOMMENDED_OBJECTIVE_RATIONALE: "WF4 tracks email and Buy Now events outside Meta and currently supplies no Pixel/CAPI optimization signal; optimize for a Meta-observable traffic action instead."
BILLING_EVENT: "UNVERIFIED (candidate for account validation: IMPRESSIONS)"
OPTIMIZATION_GOAL: "LINK_CLICKS"
BUDGET_MINOR_UNIT_RULE: "INFERENCE: unsigned integer minor currency units; for USD, cents; $1.00 => 100"
MIN_DAILY_BUDGET_USD: "UNVERIFIED — account-specific; read AdAccount.min_daily_budget and validate the proposed ad set"
SPECIAL_AD_CATEGORIES: "NONE for the described general wellness/self-experimentation app; send [] unless actual ad content falls into a listed category"
PAGE_ID_FIELD: "object_story_spec.page_id"
INSTAGRAM_ACTOR_FIELD: "instagram_user_id (current SDK field; object_story_spec.instagram_user_id in this payload shape; requirement for IG placement alone is UNVERIFIED)"
TOKEN_SCOPES_REQUIRED:
  - "ads_management"
  - "ads_read"
APP_REVIEW_REQUIRED: "no for the app's own ad account with Standard Access; Advanced Access required for other people's ad accounts"
PAUSED_CREATE_SUPPORTED: "yes for Campaign, Ad Set, and Ad; N/A for Ad Creative asset"
BROAD_TARGETING_INTERESTS_OPTIONAL: "yes"
SOURCES:
  - url: "https://github.com/facebook/facebook-python-business-sdk/tags"
    title: "Tags · facebook/facebook-python-business-sdk"
    checked: "2026-07-15"
  - url: "https://github.com/facebook/facebook-python-business-sdk/blob/main/CHANGELOG.md"
    title: "facebook-python-business-sdk/CHANGELOG.md"
    checked: "2026-07-15"
  - url: "https://github.com/facebook/facebook-python-business-sdk"
    title: "facebook/facebook-python-business-sdk"
    checked: "2026-07-15"
  - url: "https://www.postman.com/meta/facebook-marketing-api/documentation/0zr4mes/facebook-marketing-api-mapi"
    title: "Facebook Marketing API (MAPI) | Meta Postman Collection"
    checked: "2026-07-15"
  - url: "https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/campaign.py"
    title: "campaign.py — Meta Business SDK"
    checked: "2026-07-15"
  - url: "https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adset.py"
    title: "adset.py — Meta Business SDK"
    checked: "2026-07-15"
  - url: "https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/targeting.py"
    title: "targeting.py — Meta Business SDK"
    checked: "2026-07-15"
  - url: "https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adaccount.py"
    title: "adaccount.py — Meta Business SDK"
    checked: "2026-07-15"
  - url: "https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adcreative.py"
    title: "adcreative.py — Meta Business SDK"
    checked: "2026-07-15"
  - url: "https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adcreativeobjectstoryspec.py"
    title: "adcreativeobjectstoryspec.py — Meta Business SDK"
    checked: "2026-07-15"
  - url: "https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adcreativelinkdata.py"
    title: "adcreativelinkdata.py — Meta Business SDK"
    checked: "2026-07-15"
  - url: "https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adcreativelinkdatacalltoaction.py"
    title: "adcreativelinkdatacalltoaction.py — Meta Business SDK"
    checked: "2026-07-15"
  - url: "https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/ad.py"
    title: "ad.py — Meta Business SDK"
    checked: "2026-07-15"
  - url: "https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adimage.py"
    title: "adimage.py — Meta Business SDK"
    checked: "2026-07-15"
```

## C. Field placement table

| Researched value | Placement | Notes |
|---|---|---|
| Campaign name and provider-neutral objective hint | provider-neutral `app.json` | `ads.campaignName`, `ads.objective`; map objective in n8n. |
| Headline, primary text, description, CTA | provider-neutral `app.json` | Author-owned `ads.*`; never overwritten. |
| Country/location, age range, platforms | provider-neutral `app.json` | Author-owned broad-targeting intent. |
| Interests | not needed for V1 | Existing optional extension point; omit for broad targeting. |
| Creative URL/GitHub reference | provider-neutral `app.json` | `ads.media[]` or fallback `media.ogImage`. |
| UTM template and landing destination | provider-neutral `app.json` | UTM author-owned; landing URL written by WF2. |
| Experiment amount, duration, currency | provider-neutral `app.json` | `experiment.testBudget`. |
| Meta IDs, Meta status, final landing URL, computed daily budget, timestamps | `ads.meta.*` in `app.json` | Write only after all required Meta objects are created and read back successfully. |
| API version | n8n non-secret config | Keep operator-changeable. |
| Objective mapping | n8n non-secret config | Provider-specific mapping. |
| Billing-event mapping | n8n non-secret config | Keep `UNVERIFIED` until account validation. |
| Optimization-goal mapping | n8n non-secret config | V1 candidate `LINK_CLICKS`. |
| Budget minor-unit conversion | n8n non-secret config / workflow logic | USD candidate: dollars × 100; reject non-integral conversion. |
| Global safety cap | n8n non-secret config | `MAX_DAILY_BUDGET_USD = 10`; fail, never clamp. |
| Business Portfolio ID | n8n non-secret config | Needed for the chosen business/system-user operating model, not an app author field. |
| Ad Account ID | n8n non-secret config | Store normalized account ID; construct `act_<id>` where endpoint requires it. |
| Facebook Page ID | n8n non-secret config | Inject into `object_story_spec.page_id`. |
| Instagram user ID | n8n non-secret config | Optional until an IG identity requirement is confirmed for the chosen placements. |
| Meta access token | n8n credentials/secrets | Never in JSON, git, logs, or report output. |
| WF4 approval token | n8n credentials/secrets | Separate from Meta access token. |
| Funding source, account status, spending limit, `min_daily_budget` | Meta account settings only | Inspect before first create-paused attempt. |
| Page ownership/authorization and IG connection | Meta account settings only | Must be assigned to the ad account/operator. |
| Pixel/CAPI dataset and event configuration | not needed for V1 | Required later for conversion-event optimization, not for external-only measurement. |
| Gender, detailed placement list, custom audiences | not needed for V1 | Deferred extension points. |
| Exact image/copy recommendation limits | not needed for V1 schema | Validate creative operationally before live enablement; do not add schema fields solely for platform recommendations. |

## D. Research questions 1–18

### 1. Current Marketing API version

**Status: INFERENCE**

Meta's official Python Business SDK release tags are on the 25.x line (`25.0.0`, `25.0.1`, `25.0.2` visible during verification). The generated Business SDK tracks the Marketing API closely, so the best current configuration is `v25.0`. The directly accessible SDK evidence does not itself state, in one sentence, “the current Graph API version is v25.0,” so this is not labeled a fully documented fact.

- Source: https://github.com/facebook/facebook-python-business-sdk/tags
- Title: Tags · facebook/facebook-python-business-sdk
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/CHANGELOG.md
- Title: facebook-python-business-sdk/CHANGELOG.md
- Checked: 2026-07-15
- Implementation note: keep `META_API_VERSION` in n8n Config and re-check before enabling live HTTP nodes.

### 2. Create order and dependencies

**Status: DOCUMENTED FACT, with sequencing INFERENCE**

Documented endpoint/object dependencies:

1. **Campaign** returns `campaign_id`.
2. **Ad Set** requires/contains `campaign_id`, targeting, budget, billing event, and optimization goal.
3. **Image upload** to the ad account returns an image `hash`.
4. **Ad Creative** accepts `object_story_spec`, `image_hash`, Page identity, and optional Instagram identity.
5. **Ad** contains `adset_id` and a creative reference.

Recommended deterministic sequence:

`Campaign → Ad Set → Image upload → Ad Creative → Ad`

Image upload may happen before Campaign or Ad Set, but it must complete before creative creation. This means the original four-object ordering is correct conceptually, but image upload is a separate prerequisite and should not be hidden inside creative creation without preserving the returned `image_hash`.

- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adaccount.py
- Title: adaccount.py — Meta Business SDK
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adimage.py
- Title: adimage.py — Meta Business SDK
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adcreative.py
- Title: adcreative.py — Meta Business SDK
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/ad.py
- Title: ad.py — Meta Business SDK
- Checked: 2026-07-15

### 3. Objectives relevant to an external landing page

**Status: DOCUMENTED FACT**

Current outcome objective enums exposed by the official generated Campaign class include:

- `OUTCOME_TRAFFIC`
- `OUTCOME_SALES`
- `OUTCOME_LEADS`
- `OUTCOME_AWARENESS`
- `OUTCOME_ENGAGEMENT`
- `OUTCOME_APP_PROMOTION`

Provider-neutral mapping for WF4:

| App objective hint | Meta objective |
|---|---|
| `traffic` | `OUTCOME_TRAFFIC` |
| `conversions` | `OUTCOME_SALES` |
| `leads` | `OUTCOME_LEADS` |
| `awareness` | `OUTCOME_AWARENESS` |
| `app-installs` | `OUTCOME_APP_PROMOTION` |

- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/campaign.py
- Title: campaign.py — Meta Business SDK
- Checked: 2026-07-15

### 4. Best objective for this landing funnel

**Status: INFERENCE**

Use **`OUTCOME_TRAFFIC`** for V1.

Reasoning: WF4 records `email_captured` and `buy_now_clicked` through its own webhook/Google Sheet. Those events are not automatically visible to Meta's delivery system. Choosing Sales/offsite conversion optimization without a Meta Pixel/CAPI dataset and event signal would ask Meta to optimize for an event it cannot observe. Traffic is therefore the cleanest match for the current architecture.

A future V2 can evaluate `OUTCOME_SALES` or a lead objective after Pixel/CAPI is deliberately added and verified. Meta's official SDK CAPI examples require a `pixel_id`, supporting the conclusion that Meta-side web conversion optimization needs a Meta-owned event source.

- Source: https://github.com/facebook/facebook-python-business-sdk
- Title: facebook/facebook-python-business-sdk
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/campaign.py
- Title: campaign.py — Meta Business SDK
- Checked: 2026-07-15

### 5. Billing event and optimization goal

**Status: PARTLY DOCUMENTED / PARTLY UNVERIFIED**

- `LINK_CLICKS` is a documented `OptimizationGoal` enum and best matches the current external-only tracking model.
- `IMPRESSIONS` and `LINK_CLICKS` are documented `BillingEvent` enums.
- The accessible primary sources did **not** provide a sufficiently authoritative compatibility matrix proving which billing event is currently accepted for this exact account/objective/bid setup.

Resolution:

- `optimization_goal = LINK_CLICKS`
- `billing_event = UNVERIFIED`
- Candidate to validate: `IMPRESSIONS`

Do not promote the candidate to n8n production Config until Meta accepts it in a validation-only/account-scoped request.

- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adset.py
- Title: adset.py — Meta Business SDK
- Checked: 2026-07-15

### 6. Budget minor units and `daily_budget`

**Status: INFERENCE**

The official generated Ad Set API type defines `daily_budget` as an `unsigned int`, not a decimal. Meta's examples commonly use integer values. The safe interpretation is currency minor units; for USD:

- `$1.00/day → daily_budget: 100`
- `$10.00/day → daily_budget: 1000`

WF4 should convert using the account currency's minor-unit exponent and reject values that cannot be represented exactly rather than silently round. Because the accessible primary source did not explicitly say “USD cents,” this remains an inference.

- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adset.py
- Title: adset.py — Meta Business SDK
- Checked: 2026-07-15

### 7. Minimum daily budget

**Status: UNVERIFIED as a universal USD number; DOCUMENTED as account-specific data**

The official Ad Account object exposes `min_daily_budget`. That strongly indicates the minimum should be read from the actual account rather than hardcoded globally. No stable universal USD minimum was confirmed from accessible official sources.

For WF4:

1. Read `currency` and `min_daily_budget` from the configured ad account during account inspection.
2. Compare the computed minor-unit budget against that value.
3. Fail clearly if `$1/day` is below the account minimum.
4. Retain the independent internal safety cap of `$10/day`.

- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adaccount.py
- Title: adaccount.py — Meta Business SDK
- Checked: 2026-07-15

### 8. Facebook Page requirement

**Status: DOCUMENTED FACT for field existence; authorization requirement INFERENCE**

The current object story spec includes `page_id`, and the existing link creative shape should use:

```json
{
  "object_story_spec": {
    "page_id": "<META_PAGE_ID>",
    "link_data": { "...": "..." }
  }
}
```

The Page must be accessible to the token/operator and usable by the configured ad account. The exact additional Page permission scope set was not conclusively verified from accessible primary documentation and remains an account-readiness item.

- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adcreativeobjectstoryspec.py
- Title: adcreativeobjectstoryspec.py — Meta Business SDK
- Checked: 2026-07-15

### 9. Instagram actor requirement

**Status: PARTLY DOCUMENTED / PARTLY UNVERIFIED**

The current SDK exposes **`instagram_user_id`**, including within `AdCreativeObjectStorySpec`; it does not require the legacy name `instagram_actor_id` for this payload design.

What is not confirmed: whether selecting `publisher_platforms: ["instagram"]` always requires a connected Instagram identity or whether Page-backed identity behavior is available for this account/setup. Therefore:

- Use `instagram_user_id` when a connected IG account is explicitly selected.
- Do not fail every Instagram placement solely because this value is absent until Prompt B/account inspection confirms the operating requirement.

- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adcreativeobjectstoryspec.py
- Title: adcreativeobjectstoryspec.py — Meta Business SDK
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adcreative.py
- Title: adcreative.py — Meta Business SDK
- Checked: 2026-07-15

### 10. Business Portfolio and ad-account requirements

**Status: DOCUMENTED FACT plus operating-model INFERENCE**

Meta's official Marketing API Postman collection lists these prerequisites: a Meta developer account, a Facebook app with Marketing API, an access token, and an ad account. Most ad operations are performed in the context of `act_<AD_ACCOUNT_ID>`.

A Business Portfolio is operationally required for the preferred system-user automation model and asset assignment, but the primary collection does not establish that every possible user-token call against one's own ad account must be business-owned. Keep the Portfolio ID in n8n Config because WF4's intended production model is business-managed automation.

- Source: https://www.postman.com/meta/facebook-marketing-api/documentation/0zr4mes/facebook-marketing-api-mapi
- Title: Facebook Marketing API (MAPI) | Meta Postman Collection
- Source: https://github.com/facebook/facebook-python-business-sdk
- Title: facebook/facebook-python-business-sdk
- Checked: 2026-07-15

### 11. Access-token model, scopes, and App Review

**Status: DOCUMENTED FACT, scoped to the official collection's stated use cases**

The official Meta Postman collection supports user and system-user tokens and states:

- For an app managing **its own ad account**, Standard Access plus `ads_read` and `ads_management` is sufficient.
- For an app managing **other people's ad accounts**, Advanced Access is required.

WF4 should use a system-user token for durable production automation where possible. Token duration and asset access must still be verified in Prompt B. Do not log or store the token outside n8n Credentials.

Potential Page-related permissions are **UNVERIFIED** in this report and must be checked during account setup because Page identity authorization is distinct from ad-account permissions.

- Source: https://www.postman.com/meta/facebook-marketing-api/documentation/0zr4mes/facebook-marketing-api-mapi
- Title: Facebook Marketing API (MAPI) | Meta Postman Collection
- Source: https://github.com/facebook/facebook-python-business-sdk
- Title: facebook/facebook-python-business-sdk
- Checked: 2026-07-15

### 12. Single-image creative specifications

**Status: UNVERIFIED for exact placement-specific limits**

The official SDK confirms the API supports image upload, image URL/file input, `image_hash`, width, height, and common single-image link creative fields. The exact current recommended dimensions, aspect ratios, file formats, and maximum file sizes are placement-specific and were not reliably retrievable from Meta's login-blocked Ads Guide during this session.

Do not hardcode guessed limits into WF4. Before live enablement, validate the chosen source image against the current Meta Ads Guide for every enabled placement. For V1, a single high-quality square asset is an operational recommendation, not a verified API contract.

- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adimage.py
- Title: adimage.py — Meta Business SDK
- Source checked but inaccessible: https://www.facebook.com/business/ads-guide/update/image/facebook-feed
- Intended title: Meta Ads Guide — Facebook Feed image ad
- Checked: 2026-07-15

### 13. Text and CTA limits

**Status: DOCUMENTED for fields/enums; UNVERIFIED for exact character recommendations/limits**

The official generated creative classes confirm the link creative fields:

- `message` — primary text
- `name` — headline
- `description`
- `call_to_action`
- `link`
- `image_hash`

The CTA enum explicitly includes `SIGN_UP`, `BUY_NOW`, `LEARN_MORE`, `SHOP_NOW`, and many others. Therefore the fixture's `SIGN_UP` value is valid as an enum.

Exact character truncation/recommendation limits were not confirmed from accessible official sources and should not be treated as API validation limits in WF4.

- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adcreativelinkdata.py
- Title: adcreativelinkdata.py — Meta Business SDK
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adcreativelinkdatacalltoaction.py
- Title: adcreativelinkdatacalltoaction.py — Meta Business SDK
- Checked: 2026-07-15

### 14. Special ad categories

**Status: DOCUMENTED FACT for enum values; INFERENCE for this app's classification**

Current official SDK enum values include:

- `CREDIT`
- `EMPLOYMENT`
- `FINANCIAL_PRODUCTS_SERVICES`
- `HOUSING`
- `ISSUES_ELECTIONS_POLITICS`
- `ONLINE_GAMBLING_AND_GAMING`
- `NONE`

A general health/wellness self-experimentation app does not match a listed special-ad-category enum based solely on the supplied description. Use an empty array in the campaign create payload:

```json
"special_ad_categories": []
```

This is an inference about the actual ad content, not legal advice. Re-evaluate if the copy concerns employment, credit/finance, housing, politics, gambling, or other regulated claims.

- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/campaign.py
- Title: campaign.py — Meta Business SDK
- Checked: 2026-07-15

### 15. Broad targeting and optional interests

**Status: DOCUMENTED FACT for independent fields; INFERENCE for minimal valid combination**

The current Targeting object exposes separate fields for:

- `geo_locations`
- `age_min`
- `age_max`
- `publisher_platforms`
- `interests`
- genders, custom audiences, placements, and many other optional extensions

Nothing in the generated object structure makes `interests` structurally mandatory. WF4 can therefore omit interests and submit broad geo/age/platform targeting. Final validity still depends on objective, account, geography, and Meta's current targeting rules.

- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/targeting.py
- Title: targeting.py — Meta Business SDK
- Checked: 2026-07-15

### 16. Creating objects as PAUSED

**Status: DOCUMENTED FACT**

`PAUSED` is a documented status for Campaign, Ad Set, and Ad. Meta's official SDK README includes a campaign creation example using PAUSED status. An Ad created as PAUSED cannot deliver until it and its parent delivery objects are activated.

Important correction: Ad Creative creation does not expose a normal delivery `status=PAUSED` parameter in the create method. The creative is a reusable asset. WF4's safety statement should be:

> Create Campaign, Ad Set, and Ad as PAUSED; create the image and Ad Creative assets normally. Never issue an ACTIVE update.

- Source: https://github.com/facebook/facebook-python-business-sdk
- Title: facebook/facebook-python-business-sdk
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/campaign.py
- Title: campaign.py — Meta Business SDK
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adset.py
- Title: adset.py — Meta Business SDK
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/ad.py
- Title: ad.py — Meta Business SDK
- Checked: 2026-07-15

### 17. Read-back fields before write-back

**Status: DOCUMENTED FACT for field availability; verification policy is an INFERENCE**

Recommended read-back set:

**Campaign**

- `id`
- `name`
- `objective`
- `status`
- `configured_status`
- `effective_status`
- `special_ad_categories`

**Ad Set**

- `id`
- `campaign_id`
- `name`
- `status`
- `configured_status`
- `effective_status`
- `daily_budget`
- `billing_event`
- `optimization_goal`
- `targeting`
- `issues_info`

**Image**

- `hash`
- `width`
- `height`
- `status`
- `url`

**Ad Creative**

- `id`
- `name`
- `object_story_spec`
- `image_hash` or nested link-data image hash
- `instagram_user_id` when used
- `effective_object_story_id` when available

**Ad**

- `id`
- `adset_id`
- `creative`
- `name`
- `status`
- `configured_status`
- `effective_status`
- `issues_info`
- `ad_review_feedback`

Write `ads.meta.*` and root `status: validating` only after all required IDs exist, the Campaign/Ad Set/Ad configured status is PAUSED, parent-child IDs match, and no immediate create/read-back error is present. `effective_status` may legitimately be `PENDING_REVIEW`, `WITH_ISSUES`, `CAMPAIGN_PAUSED`, or `ADSET_PAUSED`; do not require it to equal only `PAUSED`.

- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/campaign.py
- Title: campaign.py — Meta Business SDK
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adset.py
- Title: adset.py — Meta Business SDK
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/ad.py
- Title: ad.py — Meta Business SDK
- Source: https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adimage.py
- Title: adimage.py — Meta Business SDK
- Checked: 2026-07-15

### 18. Common failure cases

**Status: MIXED DOCUMENTED FACT / INFERENCE**

| Failure | Why it happens | WF4 handling |
|---|---|---|
| Invalid/expired token | User token expired, system user revoked, wrong business/app | Fail before mutation; never retry blindly with the same token. |
| Missing `ads_management` | Token can read but cannot create/update | Credential readiness failure. |
| Standard vs Advanced Access mismatch | App tries to manage another party's account | Block and require Advanced Access/business authorization. |
| Disabled/restricted ad account | Policy, verification, or account state | Read account status and `disable_reason`; stop. |
| Missing funding/billing readiness | No usable funding source or pending billing info | Prompt B readiness blocker; do not create partial hierarchy. |
| Budget below account minimum | `$1/day` below `min_daily_budget` or combination minimum | Compare before create; fail clearly. |
| Objective/billing/optimization mismatch | Enum values individually valid but combination rejected | Keep mapping configurable; use validation-only/account test before create-paused. |
| Missing Page access | Token/ad account cannot use `page_id` | Fail before creative creation. |
| Missing/invalid IG identity | IG account not connected/assigned, or wrong field/ID | Omit IG placement or supply verified `instagram_user_id`; never guess. |
| Image upload failure | Unreachable/unsupported/corrupt image, size/ratio issue | Stop before creative; do not fall back to text-only. |
| Image hash belongs to another account | Hash is scoped to wrong ad account | Upload under the same configured ad account. |
| Invalid creative fields or CTA | Unsupported combination or malformed object story spec | Return Meta error with sanitized request metadata. |
| Special category misclassification | Required category omitted or restricted targeting used | Fail and require operator review. |
| Broad targeting invalid under current rules | Geography/age/platform combination rejected | Surface exact Meta error; do not silently add interests or widen age. |
| Partial create | Later object fails after earlier IDs exist | Record incident/temporary IDs outside `app.json`; do not write `status: validating`; operator cleanup required. |
| Duplicate run | Existing `ads.meta.*` IDs or repeated run key | Existing idempotency gate must refuse before first Meta mutation. |

Primary sources:

- https://www.postman.com/meta/facebook-marketing-api/documentation/0zr4mes/facebook-marketing-api-mapi
- https://github.com/facebook/facebook-python-business-sdk
- https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adaccount.py
- https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/ad.py
- Checked: 2026-07-15

## E. Conflicts and open risks

### Confirmed contract corrections

1. **Do not describe all four entities as PAUSED.** Campaign, Ad Set, and Ad are PAUSED. Ad Creative is created as an asset with no normal PAUSED delivery status.
2. **Add image upload explicitly to the create plan.** The workflow needs `POST /act_<id>/adimages`, capture `image_hash`, then create the creative.
3. **Replace legacy Instagram terminology.** Use `instagram_user_id`, not `instagram_actor_id`, unless a tested API response proves a legacy field is still required in a specific endpoint.
4. **Do not assume `$1/day` is accepted.** Read account `min_daily_budget` and validate the exact ad-set configuration.
5. **Do not use `ads.objective: conversions` directly as an API enum.** Map it to `OUTCOME_SALES`; for this V1 funnel, use the configured override/recommended mapping `OUTCOME_TRAFFIC`.

### Values safe to update in the dry-run bundle now

```yaml
metaApiVersion: "v25.0" # keep a re-verification comment/gate
objective: "OUTCOME_TRAFFIC"
optimization_goal: "LINK_CLICKS"
daily_budget: 100 # only after confirming USD account currency and minor-unit conversion
special_ad_categories: []
page_field: "object_story_spec.page_id"
instagram_field: "instagram_user_id"
status:
  campaign: "PAUSED"
  adSet: "PAUSED"
  creative: "N/A — asset"
  ad: "PAUSED"
```

### Values that must remain unresolved before `create_paused`

```yaml
billing_event: "UNVERIFIED"
account_min_daily_budget: "UNVERIFIED until Prompt B / account GET"
page_permission_scopes: "UNVERIFIED"
instagram_identity_required_for_selected_placements: "UNVERIFIED"
image_specs_for_every_enabled_placement: "UNVERIFIED"
text_recommendation_limits: "UNVERIFIED"
```

### Recommended next proof gate

Before enabling real create nodes, run an account-inspection/validation pass that:

1. Reads ad account `currency`, `account_status`, `disable_reason`, `funding_source_details`, `spend_cap`, and `min_daily_budget`.
2. Verifies token permissions and business/Page/IG assignments.
3. Confirms Page ID and optional IG user ID through read-only calls.
4. Uses Meta's validation-only mechanism, if supported for each target endpoint/version, or an isolated create-paused rehearsal with explicit operator approval to prove the billing/optimization combination.
5. Updates n8n Config only after the account-specific result is reviewed.

---

## Bottom-line implementation decision

WF4's architecture and safety model are sound. The dry-run placeholders can be narrowed substantially, but **do not enable `create_paused` yet**. The remaining uncertainty is not general research debt; it is mostly **account-specific compatibility/readiness**—especially `billing_event`, `min_daily_budget`, Page/IG authorization, and creative placement validation.
