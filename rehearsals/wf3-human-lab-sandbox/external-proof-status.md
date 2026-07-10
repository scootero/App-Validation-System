# WF3 External Proof Status

## Status

External sandbox rehearsal is **blocked**, not failed.

Local event contract is **frozen** and ready for external implementation.

Cursor did not send any webhook POSTs and did not modify n8n, Google Sheets, Drive, or Vercel.

Schema status: **33 columns** locked. Use [`EXTERNAL-SETUP-HANDOFF.md`](./EXTERNAL-SETUP-HANDOFF.md) before creating the Sheet or n8n workflow.

## Blocking Inputs

| Required value/action | Status | Owner |
|-----------------------|--------|-------|
| Sandbox Google Sheet ID | Missing | User / web AI |
| Sandbox Sheet tab `Sheet1` with **33** headers | Missing | User / web AI |
| Google SA Editor permission on sandbox Sheet | Missing | User / web AI |
| WF3 sandbox n8n workflow | Missing | User / web AI |
| WF3 webhook URL | Missing | User / web AI |
| WF0 sandbox `tracking.webhookUrl` provisioning | Missing | User / web AI |
| WF2 sandbox landing re-transform/redeploy with webhook | Missing | User / web AI |

## n8n MCP Status

The `user-n8n` MCP server may be unavailable during tool discovery; Cursor will not create or update n8n workflows until external setup values are returned and approved.

## Completion Evidence Available Now

- Local WF3 payload validation passes for 33-column schema.
- Local WF3 row normalization includes `receivedAt` / `eventId` / consent / Meta defaults.
- Exact n8n node list includes invalid-event IF routing.
- Exact external setup handoff is documented (`EXTERNAL-SETUP-HANDOFF.md`).
- Exact values to return to Cursor are documented.
- Production implementation checklist is documented.
- Freeze statement recorded.

## Next Approved External Step

After the user or web AI returns `GOOGLE_SHEET_ID_SANDBOX` and `WF3_WEBHOOK_URL_SANDBOX`, Cursor can prepare approved `curl` test commands for:

- `page_view`
- `email_captured`
- `buy_now_clicked`
- `mockup_interacted`

Those commands should not be run until the user explicitly approves external webhook POSTs.
