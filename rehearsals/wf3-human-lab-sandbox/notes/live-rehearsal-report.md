# WF3 Live Curl Rehearsal Results

**Posted at:** 2026-07-10T19:14:24Z (approx)  
**Webhook:** `https://scottyo.app.n8n.cloud/webhook/app-validation/human-lab-wf1-sandbox-events`  
**Workflow ID:** `7G2fJmqKsr8CGVID`  
**Verdict:** **PASS**

## 1. HTTP responses

| eventType | HTTP | Body | Elapsed | Pass |
|-----------|------|------|---------|------|
| `page_view` | 200 | `{"ok":true}` | ~4208 ms | Yes |
| `email_captured` | 200 | `{"ok":true}` | ~1560 ms | Yes |
| `buy_now_clicked` | 200 | `{"ok":true}` | ~1643 ms | Yes |
| `mockup_interacted` | 200 | `{"ok":true}` | ~2025 ms | Yes |

## 2. n8n executions (Sheet append)

| Execution ID | Status | Append Row | eventType | eventId | receivedAt |
|--------------|--------|------------|-----------|---------|------------|
| 2 | success | success | `page_view` | `evt_page_view_…001` | `2026-07-10T19:14:26.210Z` |
| 3 | success | success | `email_captured` | `evt_email_captured_…002` | `2026-07-10T19:14:28.342Z` |
| 4 | success | success | `buy_now_clicked` | `evt_buy_now_clicked_…003` | `2026-07-10T19:14:29.958Z` |
| 5 | success | success | `mockup_interacted` | `evt_mockup_interacted_…004` | `2026-07-10T19:14:31.535Z` |

Four successful Google Sheets Append executions = four rows written to sandbox Sheet `1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0` / `Sheet1`.

## 3. Column mapping (from Map To Sheet Row output)

All four mapped rows included the full 33 contract fields:

`timestamp`, `eventType`, `appId`, `appName`, `experimentId`, `experimentRunId`, `projectId`, `deploymentId`, `landingVersion`, `landingVariantId`, `mockupVersionId`, `campaignName`, `visitorId`, `sessionId`, `email`, `price`, `pageUrl`, `referrer`, `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`, `timeOnPageSeconds`, `mockupInteracted`, `eventId`, `receivedAt`, `fbclid`, `consentStatus`, `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement`

## 4. eventId / receivedAt

- `eventId`: fixture values present on all four rows  
- `receivedAt`: n8n-generated ISO timestamps on all four (distinct from client `timestamp`)

## 5. Meta fields

All blank (`""`) on all four: `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement`

## 6. Production / app.json

- No Drive `app.json` writes  
- No production Sheet / landing-template / spec edits  
- Only sandbox Sheet appends via WF3 sandbox workflow  

## Event-specific checks

| eventType | email | price | timeOnPageSeconds | mockupInteracted |
|-----------|-------|-------|-------------------|------------------|
| `page_view` | empty | empty | 0 | false |
| `email_captured` | `wf3-rehearsal+email@example.com` | empty | 45 | false |
| `buy_now_clicked` | `wf3-rehearsal+buy@example.com` | `$6.99` | 62 | true |
| `mockup_interacted` | empty | empty | 18 | true |

Shared: `appId=human-lab-wf1-sandbox`, `experimentRunId=run_human-lab_2026q2_001`, `fbclid=IwAR0_rehearsal_fbclid_001`, `consentStatus=unknown`

## Mismatches

None found against the frozen contract / fixtures.

**Note:** Direct Google Sheets UI/API read was not available from this environment (no local SA JSON). Sheet write success is confirmed via n8n `Append Row` node success on all four executions. Spot-check in the Sheet UI is optional confirmation.
