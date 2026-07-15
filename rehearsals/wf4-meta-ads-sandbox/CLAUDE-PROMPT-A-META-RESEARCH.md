# Claude Prompt A — Meta Marketing API Research (No Account)

**Use with:** [`CLAUDE-CONTEXT-PACKAGE.md`](./CLAUDE-CONTEXT-PACKAGE.md)  
**Mode:** Documentation research only. No Meta account required.  
**Do not:** create ads, invent API values, or return access tokens.

---

## Copy-paste prompt

```
You are researching Meta Marketing API requirements for the App Validation System WF4 / WF-Ads pipeline.

CONTEXT: I attached a Claude Context Package and supporting files. Read them first. Claude cannot access the git repository.

GOAL: Produce a verified research report so we can replace VERIFY_* placeholders in our dry-run Meta request bundle. We will create PAUSED Meta ads later; this research must not invent values.

RULES:
1. Prefer official Meta documentation first (developers.facebook.com / Meta Business Help / Marketing API reference).
2. For EVERY API-dependent answer, include:
   - Exact source page URL
   - Page title
   - Verification date (today's date when you checked)
3. If official Meta docs are unclear or conflicting:
   - Use multiple reputable secondary sources
   - Reconcile against Meta docs
   - Do NOT treat third-party information as confirmed until reconciled
4. Clearly mark:
   - DOCUMENTED FACT
   - INFERENCE (with reasoning)
   - UNVERIFIED (cannot confirm from docs)
5. Never invent interest IDs, objectives, billing events, optimization goals, budget rules, scopes, or permissions.
6. Do not ask me to create campaigns. Do not request tokens.

OUR V1 CONSTRAINTS (from context package):
- Provider-neutral ads.* in app.json; Meta runtime under ads.meta.*
- Broad targeting only: country/location, ageMin/ageMax, facebook and/or Instagram platforms
- Interests / gender / detailed placements / custom audiences are NOT required for V1
- Daily budget = experiment.testBudget.amount / durationDays
- Global n8n safety cap MAX_DAILY_BUDGET_USD = 10 (fail closed; never clamp)
- First-test budget example: $1/day (amount 14 / durationDays 14)
- Create order target: Campaign → Ad Set → Creative → Ad, all PAUSED
- Destination: HTTPS landing page with UTM; track email_captured and buy_now_clicked via our own webhook/Sheet (not necessarily Meta Pixel in V1)

RESEARCH QUESTIONS:

1. Current Marketing API version (Graph API version string for Marketing API calls).
2. Exact create order and dependencies for Campaign, Ad Set, Ad Creative, Ad (including image upload / image_hash).
3. Supported campaign objectives relevant to sending users to an external landing page.
4. Best objective for our funnel: landing page traffic + email submissions + Buy Now clicks tracked off-Meta. Justify with docs. If Pixel/CAPI is required for certain objectives, say so explicitly.
5. For that recommended objective: billing_event and optimization_goal values.
6. Budget minor units (e.g. cents) and how daily_budget is expressed on Ad Set.
7. Minimum daily budget rules (USD) and any account-level minimums.
8. Facebook Page requirements for link ads / object_story_spec.page_id.
9. Instagram actor requirements when publisher_platforms includes instagram.
10. Business Portfolio (Business Manager) and ad account requirements for creating paused campaigns.
11. Access token model: user vs system user; required scopes; whether App Review / Advanced Access is needed for ads_management / ads_read.
12. Creative / image specifications for single-image link ads (dimensions, formats, size limits).
13. Headline, primary text, description, and CTA character/type limits for link ads.
14. Special ad categories: when required; valid enum values; what to use for a health/wellness self-experimentation app if unclear (mark UNVERIFIED if needed).
15. Broad targeting: required fields for geo + age + publisher_platforms; whether interests can be omitted.
16. Creating objects with status PAUSED: confirmed behavior; can automation create without enabling spend?
17. Read-back / verification: which fields to GET after create to confirm IDs and status before write-back.
18. Common failure cases (permissions, billing, Page actor, IG actor, budget too low, objective/billing mismatch, special ad categories).

REQUIRED OUTPUT FORMAT:

### A. Executive summary (≤10 bullets)

### B. VERIFY_RESOLUTION_TABLE (YAML)
Fill every key. Use UNVERIFIED when not confirmed.

```yaml
verification_date: "YYYY-MM-DD"
META_API_VERSION: "<value or UNVERIFIED>"
OBJECTIVE_MAPPING:
  conversions: "<meta enum or UNVERIFIED>"
  traffic: "<meta enum or UNVERIFIED>"
  awareness: "<meta enum or UNVERIFIED>"
  leads: "<meta enum or UNVERIFIED>"
  app-installs: "<meta enum or UNVERIFIED>"
RECOMMENDED_OBJECTIVE_FOR_LANDING_FUNNEL: "<value or UNVERIFIED>"
RECOMMENDED_OBJECTIVE_RATIONALE: "<short>"
BILLING_EVENT: "<value or UNVERIFIED>"
OPTIMIZATION_GOAL: "<value or UNVERIFIED>"
BUDGET_MINOR_UNIT_RULE: "<e.g. cents or UNVERIFIED>"
MIN_DAILY_BUDGET_USD: "<number or UNVERIFIED>"
SPECIAL_AD_CATEGORIES: "<NONE | list | UNVERIFIED>"
PAGE_ID_FIELD: "<payload field name or UNVERIFIED>"
INSTAGRAM_ACTOR_FIELD: "<payload field name or N/A or UNVERIFIED>"
TOKEN_SCOPES_REQUIRED: []
APP_REVIEW_REQUIRED: "<yes|no|UNVERIFIED>"
PAUSED_CREATE_SUPPORTED: "<yes|no|UNVERIFIED>"
BROAD_TARGETING_INTERESTS_OPTIONAL: "<yes|no|UNVERIFIED>"
SOURCES: []  # list of {url, title, checked}
```

### C. Field placement table
For each researched field, classify exactly one of:
- provider-neutral app.json
- ads.meta.* in app.json
- n8n non-secret config
- n8n credentials/secrets
- Meta account settings only
- not needed for V1

### D. Answer each research question (1–18)
For each: DOCUMENTED FACT / INFERENCE / UNVERIFIED, source URL, verification date, notes.

### E. Conflicts and open risks
List anything that could block a $1/day paused create or our objective choice.

Do not invent values. Prefer UNVERIFIED over guessing.
```

---

## Expected operator follow-up

Save Claude's YAML into `notes/meta-research-prompt-a-results.md`. Do not paste into production n8n Config until you review and approve.
