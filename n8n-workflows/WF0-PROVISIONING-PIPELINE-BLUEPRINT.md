# WF0 — Provisioning Pipeline

**Blueprint for n8n AI / human workflow builders**  
**Status:** Blueprint only — no workflow JSON yet  
**Spec version:** 1.5.0  
**Last updated:** 2026-07-09  
**n8n target:** n8n Cloud

---

## 1. Purpose

WF0 provisions **tracking infrastructure** for App Packages on Google Drive before the deploy pipeline runs.

**WF0 is the sole owner of `tracking.webhookUrl`.** No other workflow may create, overwrite, or clear this field. WF3 receives POSTs at the URL; WF2 only embeds whatever value is already on `app.json`.

**Production Drive (1.5.0):** `App Validation/{appId}/app.json` **ONLY** — no `copy/`, `media/`, `mockup/`, `docs/`, `logs/`, `reports/`, README, package files, or lockfiles. Warn if the folder contains anything else.

**WF0 does:**

1. Trigger on `status: provisioning` (schedule poll or manual `appId`)
2. Read `App Validation/{appId}/app.json` from Google Drive
3. Validate package completeness (`experiment`, `analytics`, `ads`) and Drive hygiene (`app.json` only)
4. Create or resolve n8n webhook URL for landing events
5. Merge-write `tracking.webhookUrl` to Drive `app.json`
6. Set `status` to `"ready"`

**WF0 does NOT:**

| Out of scope | Owned by |
|--------------|----------|
| Mockup or landing deploy | **WF1**, **WF2** |
| Receive webhook events / Sheets | **WF3** |
| Meta ads | **WF-Ads** |
| Metrics / decision | **WF-Decision** |
| Modify `deployment.*`, `ads.meta`, `validation` | Other workflows |
| Store webhook auth secrets in `app.json` | n8n env / Credentials only (see WF3) |

**Drive `app.json` remains control-plane SSOT.** WF0 never changes author content sections.

---

## 2. Where each value goes

| Value | n8n Credentials | Config Set node | `.env` | `PLATFORM_SETUP_VALUES.md` | Drive `app.json` |
|-------|-----------------|-----------------|----------------|---------------------------|------------------|
| Google Service Account JSON | ✅ | — | optional | redacted | — |
| Drive folder ID | — | ✅ | ✅ | ✅ | — |
| `N8N_BASE_URL` | — | ✅ | ✅ | ✅ | — |
| `tracking.webhookUrl` | — | — | — | — | ✅ **written by WF0 only** |
| `status` | — | — | — | — | Human sets `provisioning`; WF0 sets `ready` |
| Webhook auth secret | n8n env / Credentials | — | — | — | **never** in Drive `app.json` |

---

## 3. Workflow config (Set node — no secrets)

```json
{
  "driveParentFolderId": "1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A",
  "n8nBaseUrl": "https://scooter.app.n8n.cloud",
  "webhookPathPrefix": "app-validation"
}
```

Webhook URL pattern: `{n8nBaseUrl}/webhook/{webhookPathPrefix}/{appId}-events` (or per-app n8n Webhook node path).

---

## 4. Flow

```mermaid
flowchart TD
  T[Schedule or Manual appId] --> R[Read app.json from Drive]
  R --> G{status === provisioning?}
  G -->|no| SKIP[Skip with log]
  G -->|yes| V[Validate package completeness]
  V -->|fail| ERR[Alert — stay provisioning]
  V -->|pass| WH[Create or resolve webhook URL]
  WH --> WB[Merge-write tracking.webhookUrl]
  WB --> READY[Set status ready]
  READY --> DONE[Done]
```

---

## 5. Node inventory

| # | Node | Type |
|---|------|------|
| 1 | Schedule Poll | Schedule Trigger (e.g. every 15 min) **or** Manual Trigger (`appId`) |
| 2 | Workflow Config | Set |
| 3 | List Drive folders / Read app.json | Google Drive |
| 4 | Parse + Gate status | Code |
| 5 | Gate: status provisioning | IF |
| 6 | Validate package completeness | Code |
| 7 | Validation Pass? | IF |
| 8 | Resolve Webhook URL | Code |
| 9 | Re-read app.json | Google Drive |
| 10 | Merge-Write app.json | Code + Drive Upload |
| 11 | Notify Failure | HTTP (optional) |

---

## 6. Validation

**Required before WF0 runs:**

| Gate | Rule |
|------|------|
| `status` | Must be `"provisioning"` |
| Drive hygiene | Folder contains **only** `app.json` (warn/error on extra files) |
| `experiment` | Full section: name, hypothesis, successCriteria, testBudget, decisionRules |
| `analytics` | `projectId`, `experimentId`, `experimentRunId`, `landingVariantId`, `mockupVersionId` |
| `ads` | `campaignName`, `platforms`, at least one headline and primaryText |
| Landing copy (production) | Enabled sections use `source: "inline"`; `landingPage.content` for long-form |
| Media refs | Used assets have `url` or `githubPath` (not Drive `path`) |
| `appId` | Matches folder name (warn on mismatch) |

**Optional:** `ads.targeting`, `experiment.thresholds`, `ads.media[]` (recommended before WF-Ads/WF-Decision).

---

## 7. Webhook provisioning

**Ownership:** WF0 alone writes `tracking.webhookUrl`. WF1/WF2/WF3/WF-Ads/WF-Decision must not overwrite it.

1. Use n8n Webhook node (production URL) or construct stable path from Config Set + `appId`
2. URL must be HTTPS and reachable from deployed Vercel landing pages
3. Store in `tracking.webhookUrl` only — not in `tracking.webhooks.*` legacy keys
4. Do **not** write auth secrets into `app.json` — future Bearer auth lives in n8n env / Credentials (WF3)

WF3 (separate workflow) receives POSTs at this URL and appends Google Sheets rows.

---

## 8. Write-back (merge only)

```json
{
  "tracking": {
    "webhookUrl": "https://scooter.app.n8n.cloud/webhook/app-validation/human-lab-events"
  },
  "status": "ready"
}
```

**Never modify:** `appId`, `specVersion`, `deployment.*`, `ads.meta`, `validation`, author sections.

---

## 9. Error handling

| Error | Action |
|-------|--------|
| `status !== provisioning` | Log; skip |
| Package incomplete | Alert; stay `provisioning` |
| Webhook creation fail | Retry 3×; alert; stay `provisioning` |
| Drive write-back fail | **Critical alert** — webhook may exist but SSOT stale |

---

## 10. Testing

**Prerequisites:**

1. Drive folder is `app.json` only (inline landing copy; media via `url`/`githubPath`)
2. Package has full `experiment`, `analytics`, `ads`
3. `status: "provisioning"`

**Test steps:**

1. Trigger WF0 with `appId=human-lab`
2. Verify `tracking.webhookUrl` on Drive (written by WF0 only)
3. Verify `status: "ready"`
4. Confirm no secrets written into `app.json`
5. POST test payload to webhook URL; confirm WF3 appends Sheet row (when WF3 is built)

---

## 11. Related workflows

```mermaid
flowchart LR
  WF0[WF0 Provisioning] --> WF1[WF1 Mockup Deploy]
  WF1 --> WF2[WF2 Landing Deploy]
  WF2 --> WF3[WF3 Tracking]
  WF3 --> WFAds[WF-Ads]
  WFAds --> WFDec[WF-Decision]
```

---

## 12. Definition of done

- [ ] Schedule poll and/or manual trigger with `appId`
- [ ] Gates on `status: provisioning` only
- [ ] Validates experiment, analytics, ads completeness + Drive `app.json`-only hygiene
- [ ] Sole owner: provisions non-null `tracking.webhookUrl`
- [ ] Merge-write `tracking.webhookUrl` and `status: ready` only
- [ ] Never stores auth secrets in Drive `app.json`
- [ ] Never modifies `deployment.*`, `ads.meta`, `validation`
- [ ] Export JSON to `n8n-workflows/WF0-provisioning.json` when built

---

*Normative contract: [APP_PACKAGE_SPEC.md](../app-validation-spec/APP_PACKAGE_SPEC.md). Setup: [PLATFORM_SETUP_VALUES.md](../PLATFORM_SETUP_VALUES.md).*
