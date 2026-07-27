# Manual one-node Process patch (if MCP hangs)

## Pre-checks (already verified)
- Workflow: WF4 - Meta Ads Sandbox (`YIc53GBq4upelYp6`) — **inactive**
- Target node: **Process WF4 Dry Run**
- Node id: `5392da6c-0590-432b-b497-414bbc77bfcd`
- Create-path nodes: all remain **disabled**
- Local source: `n8n/.phase4-sync/process-jsCode.js`
- Expected size: **41123** bytes
- Expected SHA-256: `c774f000cc471fdafbdf8eca2fcd214155646285ed1bc9fa5ac348fd45c83bb3`
- Includes: `is_adset_budget_sharing_enabled: false` on campaign payload (Phase 6 PREP 2026-07-26)

## Steps
1. Open https://scottyo.app.n8n.cloud/workflow/YIc53GBq4upelYp6
2. Open node **Process WF4 Dry Run**
3. Select all existing JavaScript and delete it
4. Paste the entire contents of:
   `rehearsals/wf4-meta-ads-sandbox/n8n/.phase4-sync/process-jsCode.js`
5. Save the workflow (do **not** activate; do **not** enable create nodes)
6. Tell the agent: "Process node pasted — verify + dry_run"

## Do not
- Full-import / replace canvas
- Enable create-paused or Meta upload/create nodes
- Activate WF4
