#!/usr/bin/env node
/**
 * Sync lib/meta-adapter.js into n8n/wf4-meta-ads-sandbox.workflow.ts Process Code.
 * Single source of truth: edit the adapter, then run this script.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const adapterPath = path.join(root, "lib", "meta-adapter.js");
const workflowPath = path.join(root, "n8n", "wf4-meta-ads-sandbox.workflow.ts");

const adapterSource = fs.readFileSync(adapterPath, "utf8");

const processBody =
  adapterSource +
  "\n" +
  "const input = $input.first().json;\n" +
  "const mode = input.mode || 'dry_run';\n" +
  "const approval = Boolean(input.approval);\n" +
  "const approvalToken = input.approvalToken || '';\n" +
  "const configToken = input.wf4CreatePausedApprovalToken || '';\n" +
  "let app = null;\n" +
  "if (input.appJson && typeof input.appJson === 'object') {\n" +
  "  app = input.appJson;\n" +
  "} else if (input.useFixtureAppJson) {\n" +
  "  app = JSON.parse(input.fixtureAppJson || '{}');\n" +
  "} else {\n" +
  "  throw new Error('No appJson provided and fixture disabled');\n" +
  "}\n" +
  "const result = WF4MetaAdapter.buildDryRunBundle(app, {\n" +
  "  mode: mode,\n" +
  "  provider: input.provider || 'meta',\n" +
  "  maxDailyBudgetUsd: input.MAX_DAILY_BUDGET_USD != null ? Number(input.MAX_DAILY_BUDGET_USD) : 10,\n" +
  "  metaApiVersion: input.metaApiVersion || 'v25.0',\n" +
  "  wf3GateStatus: input.wf3GateStatus || 'proven',\n" +
  "  pageId: 'CONFIG_META_PAGE_ID',\n" +
  "});\n" +
  "if (!result.ok) {\n" +
  "  throw new Error(result.error || 'WF4 dry-run bundle failed');\n" +
  "}\n" +
  "const tripleApproved = mode === 'create_paused' && approval === true && approvalToken && configToken && approvalToken === configToken;\n" +
  "return [{ json: Object.assign({}, input, { bundle: result.bundle, tripleApproved: tripleApproved, _createPausedAllowed: false }) }];\n";

function toTsStringLiteral(code) {
  return (
    code
      .split("\n")
      .map(function (line, idx, arr) {
        const escaped = line.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const suffix = idx < arr.length - 1 ? "\\n" : "";
        return '  "' + escaped + suffix + '"';
      })
      .join(" +\n")
  );
}

const processWf4CodeTs = "const processWf4Code =\n" + toTsStringLiteral(processBody) + ";\n";

let workflow = fs.readFileSync(workflowPath, "utf8");

const startMarker = "const processWf4Code =";
const endMarker = "const respondDryRunCode =";
const startIdx = workflow.indexOf(startMarker);
const endIdx = workflow.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
  throw new Error("Could not locate processWf4Code block in workflow.ts");
}

workflow = workflow.slice(0, startIdx) + processWf4CodeTs + "\n" + workflow.slice(endIdx);

// Ensure fixture objective is traffic
workflow = workflow.replace(
  /objective: 'conversions'/g,
  "objective: 'traffic'"
);

fs.writeFileSync(workflowPath, workflow);
console.log("Synced meta-adapter.js into wf4-meta-ads-sandbox.workflow.ts Process Code");
console.log("Fixture objective set to traffic where present");
