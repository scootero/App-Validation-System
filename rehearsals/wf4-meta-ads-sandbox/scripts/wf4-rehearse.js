#!/usr/bin/env node
/**
 * WF4 local dry-run proof. Consumes lib/meta-adapter.js (SSOT).
 * Do not duplicate Meta mappings here.
 */
const fs = require("fs");
const path = require("path");
const adapter = require("../lib/meta-adapter");

const root = path.resolve(__dirname, "..");
const appJsonPath = path.join(root, "fixtures", "app-json-wf4-sandbox.json");
const capExceededPath = path.join(root, "fixtures", "app-json-budget-cap-exceeded.json");
const expectedDryRunPath = path.join(root, "dry-run-payloads", "human-lab-wf4-dry-run.json");
const expectedWritebackPath = path.join(root, "fixtures", "expected-ads-meta-writeback.json");

const RUNTIME_PLACEHOLDERS = ["VERIFY_AFTER_IMAGE_UPLOAD"];
const SANDBOX_META = {
  maxDailyBudgetUsd: 2,
  metaApiVersion: "v25.0",
  pageId: "1237104852815793",
  adAccountId: "act_979257825150251",
  instagramUserId: "17841440875992246",
  businessPortfolioId: "1074341285117707",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoActiveStatus(bundle) {
  assert(bundle.computed.statusForDeliveryEntities === "PAUSED", "delivery entities must be PAUSED");
  assert(bundle.computed.pausedStatuses.campaign === "PAUSED", "campaign must be PAUSED");
  assert(bundle.computed.pausedStatuses.adSet === "PAUSED", "adSet must be PAUSED");
  assert(bundle.computed.pausedStatuses.ad === "PAUSED", "ad must be PAUSED");
  assert(bundle.computed.pausedStatuses.creative === "N/A_ASSET", "creative must be N/A_ASSET");
  assert(bundle.requests.campaign.status === "PAUSED", "campaign request PAUSED");
  assert(bundle.requests.adSet.status === "PAUSED", "adSet request PAUSED");
  assert(bundle.requests.ad.status === "PAUSED", "ad request PAUSED");
  assert(bundle.safety.neverSendActive === true, "neverSendActive must be true");
}

function assertReconciledMetaFields(bundle) {
  assert(bundle.metaApiVersion === "v25.0", "metaApiVersion must be v25.0");
  assert(bundle.adPlan.authorObjective === "traffic", "author objective must be traffic");
  assert(bundle.requests.campaign.objective === "OUTCOME_TRAFFIC", "objective must be OUTCOME_TRAFFIC");
  assert(
    Array.isArray(bundle.requests.campaign.special_ad_categories) &&
      bundle.requests.campaign.special_ad_categories.length === 0,
    "special_ad_categories must be []"
  );
  assert(bundle.requests.adSet.daily_budget === 100, "daily_budget must be 100 cents");
  assert(bundle.budgetCapCheck.maxDailyBudgetUsd === 2, "MAX_DAILY_BUDGET_USD must be 2");
  assert(bundle.requests.adSet.billing_event === "IMPRESSIONS", "billing_event must be IMPRESSIONS");
  assert(
    bundle.requests.adSet.optimization_goal === "LINK_CLICKS",
    "optimization_goal must be LINK_CLICKS"
  );
  assert(bundle.v1Pairing.optimization_goal === "LINK_CLICKS", "v1Pairing opt must be LINK_CLICKS");
  assert(
    bundle.requests.creative.object_story_spec.page_id === SANDBOX_META.pageId,
    "page_id must be META_PAGE_ID"
  );
  assert(
    bundle.requests.creative.object_story_spec.instagram_user_id === SANDBOX_META.instagramUserId,
    "instagram_user_id must be META_INSTAGRAM_USER_ID"
  );
  assert(
    bundle.requests.imageUpload.endpoint.indexOf(SANDBOX_META.adAccountId) !== -1,
    "imageUpload endpoint must include META_AD_ACCOUNT_ID"
  );
  assert(bundle.requests.imageUpload, "imageUpload step required");
  assert(bundle.ledgerPlan && bundle.ledgerPlan.phase === "planned", "ledgerPlan planned");
  assert(
    bundle.writeBackAfterCreatePausedOnly.ads.meta.status === "created_paused",
    "write-back status must be created_paused"
  );
  assert(
    bundle.writeBackAfterCreatePausedOnly.rootStatusUnchanged === true,
    "root status must remain unchanged on write-back preview"
  );
  assert(
    !Object.prototype.hasOwnProperty.call(bundle.writeBackAfterCreatePausedOnly, "status"),
    "write-back must not set root status"
  );

  const serialized = JSON.stringify(bundle);
  for (const token of RUNTIME_PLACEHOLDERS) {
    assert(serialized.includes(token), "Missing runtime placeholder: " + token);
  }
  assert(!serialized.includes("CONFIG_META_PAGE_ID"), "CONFIG_META_PAGE_ID placeholder must be gone");
  assert(!bundle.requests.adSet.targeting.interests, "omit interests when fixture has none");
}

function assertSafety(bundle) {
  assert(bundle.safety.externalWritePerformed === false, "externalWritePerformed must be false");
  assert(bundle.safety.liveAdsCreated === false, "liveAdsCreated must be false");
  assert(bundle.safety.spendPossible === false, "spendPossible must be false");
  assert(
    bundle.safety.requiresExplicitApprovalBeforeCreatePaused === true,
    "requiresExplicitApprovalBeforeCreatePaused must be true"
  );
}

function assertMatchesExpectedDryRun(actual, expected) {
  assert(actual.mode === expected.mode, "mode mismatch");
  assert(actual.appId === expected.appId, "appId mismatch");
  assert(actual.wf3Gate.status === "proven", "wf3Gate must be proven");
  assert(
    actual.computed.destinationUrl === expected.computed.destinationUrl,
    "destinationUrl mismatch"
  );
  assert(actual.computed.dailyBudget === expected.computed.dailyBudget, "dailyBudget mismatch");
  assert(actual.computed.totalBudget === expected.computed.totalBudget, "totalBudget mismatch");
  assert(actual.source.creative.value === expected.source.creative.value, "creative mismatch");
  assert(actual.budgetCapCheck.maxDailyBudgetUsd === 2, "maxDailyBudgetUsd must be 2");
  assert(actual.requests.adSet.optimization_goal === expected.requests.adSet.optimization_goal);
  assert(actual.requests.adSet.billing_event === expected.requests.adSet.billing_event);
  assert(
    actual.writeBackAfterCreatePausedOnly.ads.meta.status ===
      expected.writeBackAfterCreatePausedOnly.ads.meta.status
  );
}

function testIdempotencyRefusal() {
  const app = readJson(appJsonPath);
  app.ads.meta.campaignId = "123";
  const result = adapter.buildDryRunBundle(app, SANDBOX_META);
  assert(!result.ok, "must refuse when campaignId exists");
  assert(result.error.includes("Idempotency refusal"), "must include refusal message");
}

function testBudgetCapExceeded() {
  const app = readJson(capExceededPath);
  const result = adapter.buildDryRunBundle(app, SANDBOX_META);
  assert(!result.ok, "must fail when daily budget exceeds cap");
  assert(result.error.includes("MAX_DAILY_BUDGET_USD"), "must mention MAX_DAILY_BUDGET_USD");
  assert(result.error.includes("35.71"), "must report calculated daily budget");
}

function testWritebackFixtureShape() {
  const expected = readJson(expectedWritebackPath);
  assert(expected.ads.meta.status === "created_paused", "fixture status created_paused");
  assert(
    !Object.prototype.hasOwnProperty.call(expected, "status"),
    "expected writeback fixture must not set root status"
  );
  assert(expected.rootStatusUnchanged === true, "fixture must mark rootStatusUnchanged");
}

function main() {
  const app = readJson(appJsonPath);
  assert(app.ads.objective === "traffic", "sandbox fixture objective must be traffic");

  const expectedDryRun = readJson(expectedDryRunPath);
  const result = adapter.buildDryRunBundle(
    app,
    Object.assign({ mode: "dry_run", wf3GateStatus: "proven" }, SANDBOX_META)
  );

  assert(result.ok, result.error || "bundle build failed");
  const bundle = result.bundle;

  assert(bundle.computed.dailyBudget === 1, "first-test daily budget must be $1");
  assertNoActiveStatus(bundle);
  assertReconciledMetaFields(bundle);
  assertSafety(bundle);
  assertMatchesExpectedDryRun(bundle, expectedDryRun);
  testIdempotencyRefusal();
  testBudgetCapExceeded();
  testWritebackFixtureShape();

  console.log("WF4 local dry-run proof: PASS");
  console.log("  adapter SSOT: lib/meta-adapter.js");
  console.log("  appId: " + bundle.appId);
  console.log("  authorObjective: " + bundle.adPlan.authorObjective);
  console.log("  runKey: " + JSON.stringify(bundle.runKey));
  console.log("  destinationUrl: " + bundle.computed.destinationUrl);
  console.log("  dailyBudget: " + bundle.computed.dailyBudget + " (first-test $1/day)");
  console.log("  daily_budget minor units: " + bundle.requests.adSet.daily_budget);
  console.log("  metaApiVersion: " + bundle.metaApiVersion);
  console.log(
    "  objective/opt/billing: " +
      bundle.requests.campaign.objective +
      " / " +
      bundle.requests.adSet.optimization_goal +
      " / " +
      bundle.requests.adSet.billing_event
  );
  console.log("  writeBack ads.meta.status: " + bundle.writeBackAfterCreatePausedOnly.ads.meta.status);
  console.log("  rootStatusUnchanged: " + bundle.writeBackAfterCreatePausedOnly.rootStatusUnchanged);
  console.log("  ledger phase: " + bundle.ledgerPlan.phase);
  console.log("  safety: zero external writes; Campaign/AdSet/Ad PAUSED; never ACTIVE");
}

try {
  main();
} catch (err) {
  console.error("WF4 local dry-run proof: FAIL");
  console.error(err.message || err);
  process.exit(1);
}
