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
  "const creativeSha256 = input.WF4_CREATIVE_SHA256 || input.creativeSha256 || '';\n" +
  "if (!creativeSha256) {\n" +
  "  throw new Error('CREATIVE_SHA256_REQUIRED: set WF4_CREATIVE_SHA256 in Workflow Config (sandbox planning hash)');\n" +
  "}\n" +
  "const result = WF4MetaAdapter.buildDryRunBundle(app, {\n" +
  "  mode: mode,\n" +
  "  provider: input.provider || 'meta',\n" +
  "  environment: input.environment || 'sandbox',\n" +
  "  workflowVersion: input.workflowVersion || 'wf4-image-v1',\n" +
  "  creativeSha256: creativeSha256,\n" +
  "  maxDailyBudgetUsd: input.MAX_DAILY_BUDGET_USD != null ? Number(input.MAX_DAILY_BUDGET_USD) : 2,\n" +
  "  metaApiVersion: input.metaApiVersion || input.META_API_VERSION || 'v25.0',\n" +
  "  wf3GateStatus: input.wf3GateStatus || 'proven',\n" +
  "  pageId: input.META_PAGE_ID || 'CONFIG_META_PAGE_ID',\n" +
  "  adAccountId: input.META_AD_ACCOUNT_ID || null,\n" +
  "  instagramUserId: input.META_INSTAGRAM_USER_ID || null,\n" +
  "  businessPortfolioId: input.META_BUSINESS_PORTFOLIO_ID || null,\n" +
  "});\n" +
  "if (!result.ok) {\n" +
  "  throw new Error(result.error || 'WF4 dry-run bundle failed');\n" +
  "}\n" +
  "const gate = WF4MetaAdapter.evaluateCreatePausedGates({\n" +
  "  mode: mode,\n" +
  "  approval: approval,\n" +
  "  approvalToken: approvalToken,\n" +
  "  configToken: configToken,\n" +
  "  createPausedAllowed: false,\n" +
  "  budgetCapPassed: result.bundle.budgetCapCheck && result.bundle.budgetCapCheck.passed !== false,\n" +
  "  requiredMetaIdsPresent: Boolean(input.META_AD_ACCOUNT_ID && input.META_PAGE_ID),\n" +
  "  landingUrlValid: Boolean(result.bundle.computed && result.bundle.computed.destinationUrl),\n" +
  "  creativeValid: Boolean(result.bundle.source && result.bundle.source.creative),\n" +
  "});\n" +
  "const safeOut = WF4MetaAdapter.redactSensitiveFields({\n" +
  "  bundle: result.bundle,\n" +
  "  tripleApproved: gate.tripleApproved,\n" +
  "  approvalGate: gate,\n" +
  "  _createPausedAllowed: false,\n" +
  "});\n" +
  "return [{ json: Object.assign({}, WF4MetaAdapter.redactSensitiveFields(input), safeOut) }];\n";

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
