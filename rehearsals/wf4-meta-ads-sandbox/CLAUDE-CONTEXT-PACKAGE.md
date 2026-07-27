# Claude Context Package — WF4 Meta Ads V1

**Purpose:** Give Claude enough platform context to research Meta Marketing API requirements (Prompt A) or inspect a Meta account (Prompt B) **without repository access**.

**Date:** 2026-07-15  
**Audience:** Claude / Web AI (external)  
**Operator:** Attach this file plus the listed attachments to each Claude chat.

---

## 1. Platform architecture (relevant excerpt)

The App Validation System validates iOS app ideas before building a real product.

Canonical workflow order:

```
WF0 Provisioning → WF1 Mockup Deploy → WF2 Landing Deploy → WF3 Tracking → WF4 / WF-Ads (Meta paused) → WF-Decision
```

| Workflow | Role |
|----------|------|
| WF0 | Provision webhook; set `status: ready` |
| WF1 | Deploy mockup; write `deployment.mockup.*` |
| WF2 | Deploy landing; write `deployment.landing.url` |
| WF3 | Receive landing events; append Google Sheet rows (33 columns) |
| **WF4 / WF-Ads** | Build Meta campaign request (dry-run) or create **PAUSED** campaign → write `ads.meta.*` (`created_paused`); root status preserved until human activation → `validating` |
| WF-Decision | Read Sheet + Meta insights; kill/winner rules |

**SSOT:** Google Drive `App Validation/{appId}/app.json` (production). Sandbox dry-run may use fixture JSON. Do not add Drive files/folders.

**Naming:** Rehearsal folder uses **WF4**; platform docs use **WF-Ads**. Same stage.

---

## 2. WF4 V1 behavior

### Modes

| Mode | Behavior |
|------|----------|
| `dry_run` (default) | Validate app.json, build request bundle, respond. **No Meta HTTP. No Drive write-back.** |
| `create_paused` | Only if triple approval passes. Create campaign/ad set/creative/ad all **PAUSED**. Never ACTIVE. |

### Triple approval (create-paused only)

All required:

1. `mode === "create_paused"`
2. `approval === true`
3. `_createPausedAllowed === true` (Process hard-gate; Triple Approval Gate IF)

### Idempotency

Refuse if **any** of `ads.meta.campaignId`, `adSetId`, `creativeId`, `adId` is non-null.  
Run key: `{ appId, experimentRunId, provider: "meta" }`.

### Creative selection

1. First usable `ads.media[]` (`url` or `githubPath`)
2. Else `media.ogImage`
3. Else fail (no silent text-only)

### Destination URL

`deployment.landing.url` + expanded `ads.utmTemplate` query string.

### Write-back (create-paused only, after all four entities exist)

Only `ads.meta.*` (`status: created_paused`). **Do not** change root `status` to `validating` on paused create — that happens only after a separate human-approved activation step. Never overwrite author `ads.*` copy/targeting/media, `experiment`, or `deployment`.

---

## 3. Budget rules

```
dailyBudgetUsd = experiment.testBudget.amount / experiment.testBudget.durationDays
```

| Rule | Value |
|------|-------|
| Global safety cap (n8n Config Set) | `MAX_DAILY_BUDGET_USD = 10` |
| First-test sandbox fixture | `amount: 14`, `durationDays: 14` → **$1.00 / day** |
| Cap-exceeded test fixture | `amount: 500`, `durationDays: 14` → **$35.71 / day** → must **fail** |
| On exceed | Fail with clear error; **never auto-reduce or clamp** |
| Cap change | Operator edits n8n Config Set only — no code/schema change |

---

## 4. Targeting V1 (broad only)

**Required:**

- `ads.targeting.locations[]` (country/region)
- `ads.targeting.ageMin` / `ageMax`
- `ads.platforms[]` includes `facebook` and/or `instagram`

**Not required for V1:**

- Interests
- Gender
- Detailed placements
- Custom audiences / retargeting

These may be added later without restructuring WF4 (extension points only).

---

## 5. Current app.json sections (sandbox excerpt)

```json
{
  "appId": "human-lab-wf1-sandbox",
  "ads": {
    "campaignName": "human-lab-validation",
    "objective": "traffic",
    "platforms": ["facebook", "instagram"],
    "headlines": ["Stop guessing. Start testing."],
    "primaryTexts": ["Discover what actually works for your stress, sleep, and habits."],
    "descriptions": ["Human Lab turns self-improvement into structured experiments."],
    "callToAction": "SIGN_UP",
    "utmTemplate": {
      "source": "facebook",
      "medium": "paid_social",
      "campaign": "human-lab-validation"
    },
    "targeting": {
      "locations": ["United States"],
      "ageMin": 25,
      "ageMax": 55
    },
    "media": [{ "githubPath": "media/og-image.png", "role": "primary" }],
    "meta": {
      "status": null,
      "campaignId": null,
      "adSetId": null,
      "creativeId": null,
      "adId": null,
      "landingUrl": null,
      "dailyBudget": null,
      "createdAt": null,
      "lastSyncedAt": null
    }
  },
  "media": {
    "ogImage": { "githubPath": "media/og-image.png" }
  },
  "analytics": {
    "experimentRunId": "run_human-lab_2026q2_001"
  },
  "experiment": {
    "testBudget": { "currency": "USD", "amount": 14, "durationDays": 14 }
  },
  "deployment": {
    "landing": { "url": "https://human-lab-wf2-sandbox.vercel.app" }
  }
}
```

Provider-neutral author fields: `ads.*` except `ads.meta.*`.  
Meta runtime: `ads.meta.*` only (written by WF4 after successful paused create).

---

## 6. Field ownership rules

| Value | Location | Owner |
|-------|----------|-------|
| Ad copy, platforms, targeting, creative refs, UTM | `app.json` → `ads.*` | Author |
| Experiment budget | `app.json` → `experiment.testBudget` | Author |
| Meta IDs / status / dailyBudget write-back | `app.json` → `ads.meta.*` | WF4 |
| Landing URL | `app.json` → `deployment.landing.url` | WF2 |
| Business Portfolio ID | n8n Config Set (non-secret) | Operator |
| Ad Account ID | n8n Config Set (non-secret) | Operator |
| Facebook Page ID | n8n Config Set (non-secret) | Operator |
| Instagram actor ID | n8n Config Set (non-secret) | Operator |
| Meta API version | n8n Config Set (non-secret) | Operator |
| Objective / billing / optimization mappings | n8n Config Set (non-secret) | Operator |
| `MAX_DAILY_BUDGET_USD` | n8n Config Set (non-secret) | Operator |
| Meta access token | n8n Credentials (secret) | Operator |

**Never store secrets or Meta account IDs in app.json.**

---

## 7. Safety model

- Default mode: dry_run
- Create-paused branch disabled until operator explicitly approves
- All Meta entities created **PAUSED** only (when eventually approved)
- No spend by automation
- Idempotency before any Meta create
- Partial create → alert; no `ads.meta` write-back / no root `validating` until all four IDs verified and activation approved separately
- Zero Meta mutations in current sandbox proof pass

---

## 8. Exact questions Claude must answer

### Prompt A (documentation research)

See `CLAUDE-PROMPT-A-META-RESEARCH.md`. Summarized:

1. Current Marketing API version
2. Campaign → Ad Set → Creative → Ad create order
3. Supported objectives; best objective for landing page + email signup + Buy Now click tracking
4. billing_event and optimization_goal for that objective
5. Budget minor units and minimum daily budget
6. Page and Instagram actor requirements
7. Business Portfolio / ad account requirements
8. Token model, scopes, app review / advanced access
9. Creative/image specs and copy/CTA limits
10. Special ad categories
11. Broad targeting requirements (geo, age, platforms)
12. Paused-object creation behavior
13. API verification / read-back requirements
14. Common failure cases
15. For every field: where it belongs (app.json / ads.meta.* / n8n config / n8n secrets / Meta UI only / not V1)

### Prompt B (account inspection)

See `CLAUDE-PROMPT-B-META-ACCOUNT-INSPECTION.md`. Return IDs and readiness only — no creates.

---

## 9. Attachment lists

### Prompt A chat — attach these files

1. `CLAUDE-CONTEXT-PACKAGE.md` (this file)
2. `CLAUDE-PROMPT-A-META-RESEARCH.md`
3. `VALUE-LOCATION-OWNERSHIP.md`
4. `WF4-V1-FIELD-CLASSIFICATION.md`
5. `meta-ads-contract.md`
6. `dry-run-payloads/human-lab-wf4-dry-run.json`
7. `fixtures/app-json-wf4-sandbox.json`

### Prompt B chat — attach these files

1. `CLAUDE-CONTEXT-PACKAGE.md` (this file)
2. `CLAUDE-PROMPT-B-META-ACCOUNT-INSPECTION.md`
3. `VALUE-LOCATION-OWNERSHIP.md`
4. `MANUAL-META-ACCOUNT-SETUP-CHECKLIST.md`
5. `external-proof-status.md` (YAML template to fill)

### Do not attach

- Meta access tokens
- Approval tokens
- Production Drive credentials
- Any file containing secrets

---

## 10. Research rules (Prompt A)

- Prefer **official Meta documentation** first
- For every API-dependent answer: exact page URL + verification date
- If Meta docs unclear: use multiple reputable sources; reconcile; do not treat third-party alone as confirmed
- Mark inferences explicitly
- Unresolved items → `UNVERIFIED`
- Never invent interest IDs, objectives, budget rules, or permissions
