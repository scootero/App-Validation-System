# Claude Prompt B — Meta Account Inspection (Read-Only)

**Use with:** [`CLAUDE-CONTEXT-PACKAGE.md`](./CLAUDE-CONTEXT-PACKAGE.md)  
**Prerequisite:** Complete [`MANUAL-META-ACCOUNT-SETUP-CHECKLIST.md`](./MANUAL-META-ACCOUNT-SETUP-CHECKLIST.md) first.  
**Mode:** Read-only inspection of my real Meta setup.  
**Do not:** create, edit, activate, spend, upload creatives, or request/store tokens.

---

## Copy-paste prompt

```
You are inspecting my Meta Business setup for the App Validation System WF4 / WF-Ads sandbox.

CONTEXT: I attached the Claude Context Package, ownership table, manual setup checklist, and external-proof-status template. Read them first.

RULES:
1. READ-ONLY only. Do not create campaigns, ad sets, creatives, ads, audiences, or pixels.
2. Do not activate anything or spend money.
3. Do not ask for or paste access tokens. Report permission readiness only (scopes present / missing).
4. Do not invent IDs. If you cannot see a value, mark it MISSING or N/A with reason.
5. Prefer values visible in Meta Business Suite / Ads Manager / Business Settings / Developer App settings.

RETURN this YAML (fill every field):

```yaml
inspection_date: "YYYY-MM-DD"
META_BUSINESS_PORTFOLIO_ID: "<id or MISSING>"
META_AD_ACCOUNT_ID: "act_<id or MISSING>"
META_PAGE_ID: "<id or MISSING>"
META_INSTAGRAM_USER_ID: "<id or N/A or MISSING>"
BILLING_READINESS:
  payment_method_present: true|false|unknown
  account_can_run_ads: true|false|unknown
  notes: "<text>"
OWNERSHIP_ACCESS:
  portfolio_access: true|false|unknown
  ad_account_role: "<Admin|Advertiser|Analyst|unknown>"
  page_role: "<text or unknown>"
OBJECTIVE_SUPPORT_NOTES: "<what objectives appear available; do not invent API enums>"
TOKEN_PERMISSION_READINESS:
  ads_management_ready: true|false|unknown
  ads_read_ready: true|false|unknown
  notes: "<without revealing token>"
PAGE_IG_LINKAGE:
  page_usable_as_ad_actor: true|false|unknown
  instagram_connected: true|false|N/A|unknown
BLOCKERS: []
NEXT_STEPS_FOR_OPERATOR: []
```

Also provide a short human summary of blockers and what I must fix before any create-paused testing.

Remember: IDs returned here go into n8n NON-SECRET Config Set (not app.json, not credentials). Tokens stay in n8n Credentials only.
```

---

## Where results go

Paste YAML into [`external-proof-status.md`](./external-proof-status.md) under "Returned values".  
Do not commit secrets.
