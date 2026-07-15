# Manual Meta Account Setup Checklist

**Audience:** Operator (you)  
**When:** After Prompt A research review; before Prompt B  
**Scope:** Create/configure Meta resources only as needed for future paused ads. **Do not create campaigns or spend.**

---

## Before you start

- [x] Prompt A results reviewed (`notes/meta-research-prompt-a-results.md`)
- [ ] You understand WF4 will keep Campaign / Ad Set / Ad **PAUSED** until you activate in Ads Manager (Creative is an asset, not PAUSED)
- [ ] Global n8n cap: `MAX_DAILY_BUDGET_USD = 10`
- [ ] First-test app budget target: **$1/day** (14 USD / 14 days) — **conditional** on account `min_daily_budget`
- [ ] Reconciled V1 Meta pairing: `OUTCOME_TRAFFIC` + `LANDING_PAGE_VIEWS` + `IMPRESSIONS`

---

## A. Business Portfolio

- [ ] Create or select a Meta Business Portfolio (Business Manager)
- [ ] Record **Business Portfolio ID** (`META_BUSINESS_PORTFOLIO_ID`)
- [ ] Confirm you have admin access

## B. Ad Account

- [ ] Create or select an ad account under the Portfolio
- [ ] Record **Ad Account ID** (`act_…`)
- [ ] Add a payment method (billing ready) — campaigns will still be created PAUSED later
- [ ] Confirm timezone/currency (prefer USD for V1)
- [ ] Note account `min_daily_budget` during Prompt B

## C. Facebook Page

- [ ] Create or select a Facebook Page usable as ad actor
- [ ] Record **Page ID** (injected as `object_story_spec.page_id`)
- [ ] Confirm Page is connected to the Business Portfolio / ad account

## D. Instagram (if ads.platforms includes instagram)

- [ ] Connect Instagram professional account to the Page / Portfolio
- [ ] Record **Instagram user ID** (`instagram_user_id`), or mark **N/A** if Facebook-only for first test
- [ ] Confirm linkage visible in Business Settings

## E. Developer / token prep (do not paste token into chat or git)

- [ ] Meta Developer App exists (or create one)
- [ ] Plan **system-user** token (preferred for unattended n8n)
- [ ] Confirm scopes: `ads_management`, `ads_read`
- [ ] Own ad account: Standard Access is sufficient (no App Review); Advanced Access only for other businesses' accounts
- [ ] Store token later in **n8n Credentials only** — never in app.json or repo

## F. n8n Config Set (non-secret) — after Prompt B returns IDs

- [ ] `META_BUSINESS_PORTFOLIO_ID`
- [ ] `META_AD_ACCOUNT_ID`
- [ ] `META_PAGE_ID`
- [ ] `META_INSTAGRAM_USER_ID` (or N/A)
- [ ] `META_API_VERSION` = `v25.0`
- [ ] Objective / billing / optimization: V1 funnel `OUTCOME_TRAFFIC` / `IMPRESSIONS` / `LANDING_PAGE_VIEWS`
- [ ] `SPECIAL_AD_CATEGORIES` = `[]` (decision NONE)
- [ ] `MAX_DAILY_BUDGET_USD` = `10`

## G. n8n Credentials (secrets)

- [ ] Meta system-user access token
- [ ] `WF4_CREATE_PAUSED_APPROVAL_TOKEN` (operator-generated secret)

## H. Explicitly do NOT do yet

- [ ] Do not create Campaign / Ad Set / Creative / Ad
- [ ] Do not activate anything
- [ ] Do not enable WF4 create-paused branch
- [ ] Do not modify production Drive app.json

---

## Next step

Run [`CLAUDE-PROMPT-B-META-ACCOUNT-INSPECTION.md`](./CLAUDE-PROMPT-B-META-ACCOUNT-INSPECTION.md) with attachments listed in the Context Package.
