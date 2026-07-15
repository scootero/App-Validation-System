# WF0 Provisioning — Test Report & Closeout

**Date:** 2026-07-15  
**Status:** **Complete — canonical workflow deployed, sandbox proof passed, end-to-end chain verified**

---

## Summary

WF0 is the **canonical generic provisioning workflow** (not a sandbox-only workflow). It provisions every App Package by writing a fixed shared WF3 webhook URL into Drive `app.json` and advancing `status` from `provisioning` to `ready`.

Initial proof target: **`human-lab-wf1-sandbox`**

End-to-end proof succeeded after WF0 execution `27`:

1. WF0 updated the sandbox `app.json` on Drive
2. WF2 re-read it and redeployed the landing page
3. The deployed landing page sent a live event to the shared WF3 webhook
4. WF3 recorded the event in the Google Sheet

**No remaining WF0 work.**

---

## Workflow

| Field | Value |
|-------|-------|
| Name | `WF0 Provisioning` |
| Workflow ID | `kM6JiXaJMVje5sxR` |
| URL | `https://scottyo.app.n8n.cloud/workflow/kM6JiXaJMVje5sxR` |
| Version ID | `9639f40f-a06c-4c34-af67-1f6525f53352` |
| Scope | Canonical generic provisioning — operator changes only `appId` in Workflow Config |
| Active | `false` — manual only; not production-promoted |
| Node count | 13 |
| Successful proof execution | `27` |

---

## Shared webhook (every app)

WF0 writes this **exact** URL into every `app.json` as `tracking.webhookUrl`. WF0 never derives or generates per-app webhook URLs.

```text
https://scottyo.app.n8n.cloud/webhook/app-validation/events
```

WF3 (`7G2fJmqKsr8CGVID`) receives POSTs at this path. Apps are distinguished by payload (`appId`, `experimentId`, `experimentRunId`), not by endpoint.

---

## What WF0 writes (only)

| Field | Before | After |
|-------|--------|-------|
| `status` | `provisioning` | `ready` |
| `tracking.webhookUrl` | `null` | `https://scottyo.app.n8n.cloud/webhook/app-validation/events` |

No other fields are modified. Merge Write + Diff Guard aborts if any other path would change.

---

## Preflight

| Check | Result |
|-------|--------|
| `N8N_BASE_URL` | `https://scottyo.app.n8n.cloud` |
| WF3 `7G2fJmqKsr8CGVID` | Active |
| WF3 path | `app-validation/events` |
| Shared webhook URL | `https://scottyo.app.n8n.cloud/webhook/app-validation/events` |
| Google credential | `Google Service Account account` (`AW9ZTTTBz7JeSKKN`) |
| Initial proof `appId` | `human-lab-wf1-sandbox` |
| Live sandbox folder ID | `16A8D5u2wDYlrlnqd-Sv0O0IPARwV-jF8` |
| Live sandbox `app.json` ID | `17JpSbiHXgdayoPEiTuPpQfvX7Kfvs5n9` |

The rehearsal file ID in older WF1 docs (`1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn`) was stale. WF0 resolves the current file by folder name + exact filename `app.json`; `17JpSbiHXgdayoPEiTuPpQfvX7Kfvs5n9` is the canonical sandbox `app.json`.

---

## Canonical node list

1. Manual Run
2. Workflow Config (`appId`, `driveParentFolderId`, `sharedWebhookUrl`)
3. Search App Folder
4. List Folder Files
5. Resolve app.json
6. Download app.json
7. Parse + Validate Provisioning
8. Status Provisioning?
9. Validation Passed?
10. Re-download app.json
11. Merge Write + Diff Guard
12. Update Drive app.json
13. Summarize Result

The false outputs of the two IF nodes are intentionally terminal: non-provisioning or invalid packages stop without write-back.

---

## WF0 proof (execution 27)

Execution `27` passed all gates and completed the Drive update.

```json
{
  "status": {
    "before": "provisioning",
    "after": "ready"
  },
  "tracking.webhookUrl": {
    "before": null,
    "after": "https://scottyo.app.n8n.cloud/webhook/app-validation/events"
  }
}
```

`Summarize Result` output:

```json
{
  "ok": true,
  "appId": "human-lab-wf1-sandbox",
  "fileId": "17JpSbiHXgdayoPEiTuPpQfvX7Kfvs5n9",
  "diff": {
    "status": { "before": "provisioning", "after": "ready" },
    "tracking.webhookUrl": {
      "before": null,
      "after": "https://scottyo.app.n8n.cloud/webhook/app-validation/events"
    }
  },
  "summary": "WF0 provisioning complete — only status and tracking.webhookUrl changed"
}
```

### No-unrelated-change proof

- Merge Write + Diff Guard passed before upload (allows only `status` and `tracking.webhookUrl`).
- Protected-content hash (all fields except `status` and `tracking.webhookUrl`): **`24508687`** before and after WF0 — unchanged.
- Post-write read-only verification (execution `28`) confirmed `status: ready`, correct `webhookUrl`, and matching protected hash.

---

## End-to-end proof (post-WF0)

After execution `27`, the full pipeline chain was verified:

| Step | Result |
|------|--------|
| WF0 Drive write | `tracking.webhookUrl` set; `status: ready` |
| WF2 re-read + redeploy | Landing `app-config.json` picked up the new webhook URL |
| Live landing page | Sent an event to the shared WF3 webhook |
| WF3 | Received and processed the event |
| Google Sheet | Row recorded (`1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0`) |

This confirms WF0's output is consumed correctly by downstream workflows and the deployed landing surface.

---

## Sandbox preparation (authorized)

The live sandbox started with `status: ready` and `tracking.webhookUrl: null`. A temporary helper set only `status` to `provisioning` before the WF0 proof run, then was archived.

---

## Artifacts

| File | Result |
|------|--------|
| `n8n-workflows/wf0-provisioning.workflow.ts` | Canonical validated SDK source |
| `n8n-workflows/WF0-provisioning.json` | 13-node export with live workflow metadata |
| `n8n-workflows/WF0-PROVISIONING-PIPELINE-BLUEPRINT.md` | Blueprint updated to reflect deployed canonical workflow |
| `rehearsals/wf0-provisioning-test-report.md` | This report |

---

## Operational notes

- **To provision another app:** set `appId` in Workflow Config and run manually; folder must be `App Validation/{appId}/` with `status: provisioning`.
- **WF0 remains inactive/manual** — not published; no schedule trigger.
- **Production promotion** of WF0 itself is a separate future step; the workflow design and sandbox proof are complete.

---

## Remaining WF0 work

**None.** WF0 is complete for its defined scope.
