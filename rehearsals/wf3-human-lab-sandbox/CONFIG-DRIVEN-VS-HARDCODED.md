# WF3 Config-Driven vs Hardcoded

Future apps must reuse the **proven logic**, not the sandbox hardcodes.

## Must be config-driven (per app / per environment)

| Value | Where it lives | Pattern |
|-------|----------------|---------|
| `appId` | `app.json` + webhook path suffix | `{prefix}/{appId}-events` |
| Webhook path | WF0 provisions into `tracking.webhookUrl` | `{N8N_BASE_URL}/webhook/app-validation/{appId}-events` |
| `googleSheetId` | n8n Config Set (platform or per-env) | Not in `app.json` |
| `googleSheetTabName` | n8n Config Set | Usually `Sheet1` |
| Credential label / ID | n8n Credentials | Platform shared SA |
| `experimentId` / `experimentRunId` | `app.json` → landing app-config | Client sends on every event |
| Landing URL | `deployment.landing.url` | Client `pageUrl` only |
| `webhookAuthSecret` | n8n Config / Credentials only | Default null; never Drive |

## Must be shared platform constants (not per-app forks)

| Value | Rule |
|-------|------|
| Event contract (33 columns + ownership) | One shared column list + map/validate snippets |
| Allowed `eventType` set | Shared |
| Required payload fields | Shared |
| Node sequence (incl. Route Valid Events) | Shared template |
| `receivedAt` / `eventId` fallback / `consentStatus` default | Shared Code |
| Meta columns blank until WF4 | Shared |
| HTTP 200 on malformed (except auth 401) | Shared |
| Sheets append retry 3× | Shared |

## Sandbox hardcodes (do not copy into production blindly)

| Hardcode | Sandbox value | Production rule |
|----------|---------------|-----------------|
| Webhook path appId | `human-lab-wf1-sandbox` | Use real `appId` |
| Sheet ID | `1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0` | Production event Sheet (or shared platform Sheet) |
| Workflow name | `WF3 - Tracking Sandbox` | `WF3 - Tracking` (or per-env name) |
| Fixture emails / fbclid | rehearsal values | Real traffic |

## Reuse model for future apps

**Recommended v1:** One shared WF3 workflow with path pattern `app-validation/:appId-events` **or** one webhook path per app provisioned by WF0 (current proven pattern: per-app path).

Proven pattern today: **per-app webhook path** + **one shared Sheet** (or per-env Sheet) with `appId` column for filtering.

WF0 must write:

```txt
tracking.webhookUrl = {N8N_BASE_URL}/webhook/app-validation/{appId}-events
```

WF2 embeds that URL into landing `app-config`. Landing posts the shared 33-field payload shape.
