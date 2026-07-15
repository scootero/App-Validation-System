# WF4 External Setup Handoff Package

**Canonical for Claude research/inspection:** Start with [`CLAUDE-CONTEXT-PACKAGE.md`](./CLAUDE-CONTEXT-PACKAGE.md).

| Step | Artifact |
|------|----------|
| 1. Context | [`CLAUDE-CONTEXT-PACKAGE.md`](./CLAUDE-CONTEXT-PACKAGE.md) |
| 2. Research | [`CLAUDE-PROMPT-A-META-RESEARCH.md`](./CLAUDE-PROMPT-A-META-RESEARCH.md) |
| 3. Manual Meta setup | [`MANUAL-META-ACCOUNT-SETUP-CHECKLIST.md`](./MANUAL-META-ACCOUNT-SETUP-CHECKLIST.md) |
| 4. Account inspection | [`CLAUDE-PROMPT-B-META-ACCOUNT-INSPECTION.md`](./CLAUDE-PROMPT-B-META-ACCOUNT-INSPECTION.md) |
| 5. Ownership | [`VALUE-LOCATION-OWNERSHIP.md`](./VALUE-LOCATION-OWNERSHIP.md) |

> **Dry-run only.** Zero Meta mutations. Create-paused disabled.

---

## A. Configure (summary)

### A1. Meta (read-only until Prompt B)

See Manual Checklist. Do not create campaigns.

### A2. n8n

| Item | Value |
|------|-------|
| Workflow | `WF4 - Meta Ads Sandbox` (`YIc53GBq4upelYp6`) |
| Active | **No** |
| Config | `MAX_DAILY_BUDGET_USD=10`; Meta IDs after Prompt B |
| Secrets | Meta token + approval token (later) |

### A3. Budget fixtures

| Fixture | Daily |
|---------|-------|
| Happy path | $1.00 (14/14) |
| Cap exceed | $35.71 (500/14) → fail |

---

## B. Values to return

See Prompt A YAML + Prompt B YAML. Ownership:

- IDs / mappings / cap → n8n **non-secret** Config
- Tokens → n8n **Credentials**
- Never → app.json for secrets or Meta account IDs

---

## C. Dry-run assertions

- `dailyBudget === 1`
- `totalBudget === 14`
- No interests in targeting when fixture has none
- Cap exceed fixture fails locally
- `metaHttpCalls: 0`, `driveWrites: 0`

---

## D. Verification

```bash
node rehearsals/wf4-meta-ads-sandbox/scripts/wf4-rehearse.js
```

Then n8n dry-run on inactive workflow.

---

## E. Prompts

Do **not** use the old single merged Web AI prompt. Use Prompt A and Prompt B separately with Context Package attachments.
