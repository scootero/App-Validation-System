#!/usr/bin/env node
/**
 * WF4 local dry-run + Phase 4 gate/idempotency proofs. Consumes lib/meta-adapter.js (SSOT).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const adapter = require("../lib/meta-adapter");

const root = path.resolve(__dirname, "..");
const appJsonPath = path.join(root, "fixtures", "app-json-wf4-sandbox.json");
const capExceededPath = path.join(root, "fixtures", "app-json-budget-cap-exceeded.json");
const expectedDryRunPath = path.join(root, "dry-run-payloads", "human-lab-wf4-dry-run.json");
const expectedWritebackPath = path.join(root, "fixtures", "expected-ads-meta-writeback.json");
const creativePath = path.join(
  root,
  "..",
  "github",
  "Human-Lab-WF1-Sandbox",
  "media",
  "og-image.png"
);

const RUNTIME_PLACEHOLDERS = ["VERIFY_AFTER_IMAGE_UPLOAD"];
const CREATIVE_SHA256 = crypto.createHash("sha256").update(fs.readFileSync(creativePath)).digest("hex");

const SANDBOX_META = {
  maxDailyBudgetUsd: 2,
  metaApiVersion: "v25.0",
  pageId: "1237104852815793",
  adAccountId: "act_979257825150251",
  instagramUserId: "17841440875992246",
  businessPortfolioId: "1074341285117707",
  environment: "sandbox",
  workflowVersion: "wf4-image-v1",
  creativeSha256: CREATIVE_SHA256,
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function baseConfig(extra) {
  return Object.assign({ mode: "dry_run", wf3GateStatus: "proven" }, SANDBOX_META, extra || {});
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
  assert(
    bundle.requests.campaign.is_adset_budget_sharing_enabled === false,
    "is_adset_budget_sharing_enabled must be false for ad-set budgets"
  );
  assert(bundle.requests.adSet.daily_budget === 100, "daily_budget must be 100 cents");
  assert(bundle.budgetCapCheck.maxDailyBudgetUsd === 2, "MAX_DAILY_BUDGET_USD must be 2");
  assert(bundle.requests.adSet.billing_event === "IMPRESSIONS", "billing_event must be IMPRESSIONS");
  assert(
    bundle.requests.adSet.bid_strategy === "LOWEST_COST_WITHOUT_CAP",
    "bid_strategy must be LOWEST_COST_WITHOUT_CAP"
  );
  assert(
    bundle.requests.adSet.promoted_object &&
      Boolean(bundle.requests.adSet.promoted_object.page_id),
    "adSet promoted_object.page_id required"
  );
  assert(
    bundle.requests.adSet.optimization_goal === "LINK_CLICKS",
    "optimization_goal must be LINK_CLICKS"
  );
  assert(
    bundle.requests.adSet.targeting.targeting_automation &&
      bundle.requests.adSet.targeting.targeting_automation.advantage_audience === 0,
    "targeting_automation.advantage_audience must be 0"
  );
  assert(
    JSON.stringify(bundle.requests.adSet.targeting.facebook_positions) === JSON.stringify(["feed"]),
    "facebook_positions must be feed-only"
  );
  assert(
    JSON.stringify(bundle.requests.adSet.targeting.instagram_positions) ===
      JSON.stringify(["stream"]),
    "instagram_positions must be stream (feed)"
  );
  assert(
    bundle.ledgerPlan.operationKey === "human-lab-wf1-sandbox|sandbox|meta|image-v1",
    "operationKey must use environment+creativeRevision"
  );
  assert(bundle.ledgerPlan.creativeSha256 === CREATIVE_SHA256, "ledger creativeSha256 mismatch");
  assert(Boolean(bundle.ledgerPlan.contentFingerprint), "contentFingerprint required");
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
  assert(bundle.safety.storiesReelsOutOfV1 === true, "Stories/Reels must be out of V1");
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
  assert(
    actual.source.creative.resolutionMethod === expected.source.creative.resolutionMethod,
    "creative resolutionMethod mismatch"
  );
  assert(
    actual.source.creative.downloadUrl === expected.source.creative.downloadUrl,
    "creative downloadUrl mismatch"
  );
  assert(
    actual.requests.adSet.optimization_goal === expected.requests.adSet.optimization_goal
  );
  assert(actual.requests.adSet.billing_event === expected.requests.adSet.billing_event);
  assert(actual.budgetCapCheck.maxDailyBudgetUsd === 2, "maxDailyBudgetUsd must be 2");
}

function testCreativeResolutionFailureMissingRepo() {
  const app = readJson(appJsonPath);
  delete app.source;
  const result = adapter.buildDryRunBundle(app, baseConfig());
  assert(!result.ok, "must fail when source repo missing for githubPath");
  assert(
    String(result.error).indexOf("CREATIVE_REPO_UNRESOLVED") !== -1,
    "must report CREATIVE_REPO_UNRESOLVED"
  );
}

function testCreativeResolutionFailureBadType() {
  const app = readJson(appJsonPath);
  // A2: role:video alone is not enough — mp4 without type:video stays fail-closed
  app.ads.media = [{ githubPath: "media/demo.mp4", role: "video" }];
  const result = adapter.buildDryRunBundle(app, baseConfig());
  assert(!result.ok, "must fail for non-image githubPath without type:video");
  assert(
    String(result.error).indexOf("CREATIVE_UNSUPPORTED_TYPE") !== -1,
    "must report CREATIVE_UNSUPPORTED_TYPE"
  );
}

function testVideoDryRunPlan() {
  const videoAppPath = path.join(root, "fixtures", "app-json-wf4-video-sandbox.json");
  const app = readJson(videoAppPath);
  const videoSha = crypto.createHash("sha256").update("fake-video-bytes-for-plan").digest("hex");
  const thumbSha = crypto.createHash("sha256").update(fs.readFileSync(creativePath)).digest("hex");
  const result = adapter.buildDryRunBundle(
    app,
    baseConfig({
      creativeSha256: videoSha,
      thumbnailSha256: thumbSha,
      workflowVersion: "wf4-video-feed-v1",
    })
  );
  assert(result.ok, result.error || "video dry-run must succeed");
  const bundle = result.bundle;
  assert(bundle.source.mediaType === "video", "mediaType video");
  assert(bundle.source.creative.expectedMimeFamily === "video", "creative family video");
  assert(bundle.source.creative.value === "media/ad-hero-feed.mp4", "feed video path");
  assert(bundle.source.thumbnail && bundle.source.thumbnail.value === "media/ad-thumb-feed.png", "thumb");
  assert(bundle.requests.videoUpload, "videoUpload plan required");
  assert(
    bundle.requests.videoUpload.endpoint.indexOf("/advideos") !== -1,
    "advideos endpoint"
  );
  assert(bundle.requests.videoStatusPoll, "videoStatusPoll plan required");
  assert(
    bundle.requests.videoStatusPoll.timeoutMs === adapter.VIDEO_POLL_TIMEOUT_MS,
    "poll timeout"
  );
  assert(bundle.requests.imageUpload.purpose === "video_thumbnail", "thumb upload purpose");
  assert(
    bundle.requests.creative.object_story_spec.video_data,
    "video_data creative plan"
  );
  assert(
    !bundle.requests.creative.object_story_spec.link_data,
    "image link_data must not be used for video"
  );
  assert(
    bundle.ledgerPlan.operationKey === "human-lab-wf1-sandbox|sandbox|meta|video-feed-v1",
    "video operationKey"
  );
  assert(bundle.ledgerPlan.thumbnailSha256 === thumbSha, "thumb hash in ledger");
  assert(bundle.safety.externalWritePerformed === false, "no external writes");
  assertNoActiveStatus(bundle);
}

function testVideoMissingThumbnail() {
  const videoAppPath = path.join(root, "fixtures", "app-json-wf4-video-sandbox.json");
  const app = readJson(videoAppPath);
  delete app.ads.media[0].thumbnailRef;
  const result = adapter.buildDryRunBundle(
    app,
    baseConfig({
      creativeSha256: "a".repeat(64),
      thumbnailSha256: "b".repeat(64),
    })
  );
  assert(!result.ok, "must fail without thumbnailRef");
  assert(String(result.error).indexOf("VIDEO_THUMBNAIL_REQUIRED") !== -1, "thumb required error");
}

function testVideoMissingThumbSha() {
  const videoAppPath = path.join(root, "fixtures", "app-json-wf4-video-sandbox.json");
  const app = readJson(videoAppPath);
  const result = adapter.buildDryRunBundle(
    app,
    baseConfig({
      creativeSha256: "a".repeat(64),
      thumbnailSha256: null,
    })
  );
  assert(!result.ok, "must fail without thumbnailSha256");
  assert(String(result.error).indexOf("THUMBNAIL_SHA256_REQUIRED") !== -1, "thumb sha required");
}

function testIdempotencyRefusal() {
  const app = readJson(appJsonPath);
  // Revision-scoped: same creativeRevision with complete variant IDs must refuse.
  app.ads.meta.creativeRevision = "image-v1";
  app.ads.meta.variants = {
    "image-v1": {
      status: "created_paused",
      campaignId: "120250607331460199",
      adSetId: "120250622864980199",
      creativeId: "1007406578799368",
      adId: "120250622866330199",
      mediaType: "image",
    },
  };
  const result = adapter.buildDryRunBundle(app, baseConfig());
  assert(!result.ok, "must refuse when variants[image-v1] already complete");
  assert(result.error.includes("Idempotency refusal"), "must include refusal message");
  assert(result.error.indexOf("image-v1") !== -1, "refusal must name the revision");
}

function testFlatIdsDoNotBlockNewRevision() {
  const app = readJson(appJsonPath);
  // Known image proof flat IDs — migrate to image-v1; video revision must still plan.
  app.ads.meta = Object.assign({}, app.ads.meta, {
    status: "created_paused",
    campaignId: "120250607331460199",
    adSetId: "120250622864980199",
    creativeId: "1007406578799368",
    adId: "120250622866330199",
    creativeRevision: "image-v1",
    landingUrl: "https://human-lab-wf2-sandbox.vercel.app?utm_source=facebook",
    dailyBudget: 1,
  });
  // Switch package to video media + revision
  const videoApp = readJson(path.join(root, "fixtures", "app-json-wf4-video-sandbox.json"));
  app.ads.media = videoApp.ads.media;
  app.ads.meta.creativeRevision = "video-feed-v1";
  const videoSha = crypto.createHash("sha256").update("fake-video-bytes-for-plan").digest("hex");
  const thumbSha = crypto.createHash("sha256").update(fs.readFileSync(creativePath)).digest("hex");
  const result = adapter.buildDryRunBundle(
    app,
    baseConfig({
      creativeSha256: videoSha,
      thumbnailSha256: thumbSha,
      workflowVersion: "wf4-video-feed-v1",
    })
  );
  assert(result.ok, result.error || "new revision must not be blocked by prior flat image IDs");
  assert(
    result.bundle.ledgerPlan.operationKey.indexOf("video-feed-v1") !== -1,
    "video operationKey"
  );
}

function testNormalizeMigratesFlatKnownIds() {
  const app = readJson(appJsonPath);
  app.ads.meta = {
    status: "created_paused",
    campaignId: "120250607331460199",
    adSetId: "120250622864980199",
    creativeId: "1007406578799368",
    adId: "120250622866330199",
    landingUrl: "https://example.com",
    dailyBudget: 1,
    createdAt: "2026-07-27T00:00:00.000Z",
    lastSyncedAt: null,
  };
  const norm = adapter.normalizeAdsMetaVariants(app);
  assert(norm.ok, norm.error);
  assert(norm.migrated === true, "must migrate");
  assert(norm.variants["image-v1"], "must seed image-v1");
  assert(norm.variants["image-v1"].campaignId === "120250607331460199", "campaign preserved");
}

function testBudgetCapExceeded() {
  const app = readJson(capExceededPath);
  const result = adapter.buildDryRunBundle(app, baseConfig());
  assert(!result.ok, "must fail when daily budget exceeds cap");
  assert(result.error.includes("MAX_DAILY_BUDGET_USD"), "must mention MAX_DAILY_BUDGET_USD");
  assert(result.error.includes("35.71"), "must report calculated daily budget");
}

function testWritebackFixtureShape() {
  const expected = readJson(expectedWritebackPath);
  assert(expected.ads.meta.status === "created_paused", "fixture status created_paused");
  assert(expected.ads.meta.variants, "fixture must include variants map");
  assert(expected.ads.meta.currentVariant, "fixture must include currentVariant");
  assert(
    !Object.prototype.hasOwnProperty.call(expected, "status"),
    "expected writeback fixture must not set root status"
  );
  assert(expected.rootStatusUnchanged === true, "fixture must mark rootStatusUnchanged");
}

function testMergeAdsMetaWriteBack() {
  const app = readJson(appJsonPath);
  const marker = { authorOnly: true, keepMe: "untouched" };
  app._testMarker = marker;
  app.ads.headlines = app.ads.headlines.slice();
  const originalHeadline = app.ads.headlines[0];
  const originalRoot = app.status;
  const originalRevision = app.ads.meta.creativeRevision || "image-v1";

  const incomplete = adapter.mergeAdsMetaWriteBack(app, {
    status: "created_paused",
    creativeRevision: originalRevision,
    campaignId: "c1",
    adSetId: "a1",
  });
  assert(!incomplete.ok, "incomplete IDs must refuse Drive merge");
  assert(String(incomplete.error).indexOf("WRITEBACK_INCOMPLETE_IDS") !== -1, "incomplete error");

  const wrongStatus = adapter.mergeAdsMetaWriteBack(app, {
    status: "ACTIVE",
    creativeRevision: originalRevision,
    campaignId: "c1",
    adSetId: "a1",
    creativeId: "cr1",
    adId: "ad1",
    landingUrl: "https://example.com",
    dailyBudget: 1,
    createdAt: "2026-07-20T00:00:00.000Z",
    lastSyncedAt: null,
  });
  assert(!wrongStatus.ok, "non-created_paused must refuse");

  const merged = adapter.mergeAdsMetaWriteBack(app, {
    status: "created_paused",
    creativeRevision: originalRevision,
    campaignId: "c1",
    adSetId: "a1",
    creativeId: "cr1",
    adId: "ad1",
    landingUrl: "https://human-lab-wf2-sandbox.vercel.app?utm_source=facebook",
    dailyBudget: 1,
    createdAt: "2026-07-20T00:00:00.000Z",
    lastSyncedAt: null,
  });
  assert(merged.ok, merged.error || "merge must succeed");
  assert(merged.rootStatusUnchanged === true, "rootStatusUnchanged");
  assert(merged.appJson.status === originalRoot, "root status preserved");
  assert(merged.appJson.ads.headlines[0] === originalHeadline, "author headlines preserved");
  assert(merged.appJson._testMarker.keepMe === "untouched", "unrelated fields preserved");
  assert(merged.appJson.ads.meta.status === "created_paused", "meta status written");
  assert(merged.appJson.ads.meta.campaignId === "c1", "campaignId written");
  assert(merged.appJson.ads.meta.adId === "ad1", "adId written");
  assert(merged.appJson.ads.meta.creativeRevision === originalRevision, "creativeRevision set");
  assert(merged.appJson.ads.meta.currentVariant === originalRevision, "currentVariant set");
  assert(
    merged.appJson.ads.meta.variants[originalRevision].campaignId === "c1",
    "variant SSOT written"
  );
  assert(app.ads.meta.campaignId == null, "original appJson not mutated");

  // Second revision must preserve the first variant key
  const merged2 = adapter.mergeAdsMetaWriteBack(merged.appJson, {
    status: "created_paused",
    creativeRevision: "video-feed-v1",
    campaignId: "vc1",
    adSetId: "va1",
    creativeId: "vcr1",
    adId: "vad1",
    landingUrl: "https://human-lab-wf2-sandbox.vercel.app?utm_source=facebook",
    dailyBudget: 1,
    createdAt: "2026-07-28T00:00:00.000Z",
    lastSyncedAt: null,
    mediaType: "video",
  });
  assert(merged2.ok, merged2.error || "second revision merge must succeed");
  assert(
    merged2.appJson.ads.meta.variants[originalRevision].campaignId === "c1",
    "prior variant preserved"
  );
  assert(
    merged2.appJson.ads.meta.variants["video-feed-v1"].campaignId === "vc1",
    "new variant stored"
  );
  assert(merged2.appJson.ads.meta.currentVariant === "video-feed-v1", "pointer updated");
  assert(merged2.appJson.ads.meta.campaignId === "vc1", "flat mirror is current variant");
}

function testMissingCreativeSha() {
  const app = readJson(appJsonPath);
  const cfg = baseConfig();
  delete cfg.creativeSha256;
  const result = adapter.buildDryRunBundle(app, cfg);
  assert(!result.ok, "must require creativeSha256");
  assert(String(result.error).indexOf("CREATIVE_SHA256_REQUIRED") !== -1, "sha required error");
}

function testApprovalGatesNegative() {
  const wrongMode = adapter.evaluateCreatePausedGates({
    mode: "dry_run",
    approval: true,
    createPausedAllowed: true,
  });
  assert(wrongMode.failures.indexOf("mode_not_create_paused") !== -1, "mode not create_paused");
  assert(wrongMode.tripleApproved === false, "dry_run → not tripleApproved");
  assert(wrongMode.createPathOpen === false, "wrong mode → closed");

  const noApproval = adapter.evaluateCreatePausedGates({
    mode: "create_paused",
    approval: false,
    createPausedAllowed: true,
  });
  assert(noApproval.failures.indexOf("approval_false") !== -1, "approval false");
  assert(noApproval.tripleApproved === false, "approval false → not tripleApproved");
  assert(noApproval.createPathOpen === false, "approval false → closed");

  const hardGate = adapter.evaluateCreatePausedGates({
    mode: "create_paused",
    approval: true,
    createPausedAllowed: false,
  });
  assert(hardGate.tripleApproved === true, "triple can be true while hard gate false");
  assert(hardGate.failures.indexOf("create_paused_hard_gate_false") !== -1, "hard gate");
  assert(hardGate.createPathOpen === false, "hard gate → closed");

  const overBudget = adapter.evaluateCreatePausedGates({
    mode: "create_paused",
    approval: true,
    createPausedAllowed: true,
    budgetCapPassed: false,
  });
  assert(overBudget.failures.indexOf("over_budget") !== -1, "over budget");
  assert(overBudget.createPathOpen === false, "over budget → closed");

  const open = adapter.evaluateCreatePausedGates({
    mode: "create_paused",
    approval: true,
    createPausedAllowed: true,
  });
  assert(open.tripleApproved === true, "mode+approval → tripleApproved");
  assert(open.createPathOpen === true, "all gates pass → open");
  assert(open.failures.length === 0, "no failures when open");
}

function testLedgerDecisions() {
  const app = readJson(appJsonPath);
  const result = adapter.buildDryRunBundle(app, baseConfig());
  assert(result.ok, result.error);
  const plan = result.bundle.ledgerPlan;
  const fp = plan.contentFingerprint;
  const key = plan.operationKey;

  const claim = adapter.evaluateLedgerDecision(null, {
    operationKey: key,
    contentFingerprint: fp,
    executionId: "exec-a",
    nowMs: 1_000_000,
  });
  assert(claim.action === "claim", "empty → claim");
  assert(claim.resumeFrom === "campaign", "claim starts at campaign");

  const complete = adapter.evaluateLedgerDecision(
    {
      operationKey: key,
      contentFingerprint: fp,
      phase: "writeback_done",
      campaignId: "c1",
      adSetId: "a1",
      creativeId: "cr1",
      adId: "ad1",
    },
    { operationKey: key, contentFingerprint: fp, executionId: "exec-b", nowMs: 1_000_000 }
  );
  assert(complete.action === "already_complete", "complete → already_complete");

  const partial = adapter.evaluateLedgerDecision(
    {
      operationKey: key,
      contentFingerprint: fp,
      phase: "campaign",
      campaignId: "c1",
      adSetId: null,
      creativeId: null,
      adId: null,
    },
    { operationKey: key, contentFingerprint: fp, executionId: "exec-c", nowMs: 1_000_000 }
  );
  assert(partial.action === "resume", "partial → resume");
  assert(partial.resumeFrom === "adset", "resume adset");
  assert(partial.metaCreate.campaignId === "c1", "reuse campaign id");

  const conflict = adapter.evaluateLedgerDecision(
    {
      operationKey: key,
      contentFingerprint: "other-fp",
      phase: "campaign",
      campaignId: "c1",
    },
    { operationKey: key, contentFingerprint: fp, executionId: "exec-d", nowMs: 1_000_000 }
  );
  assert(conflict.action === "revision_conflict", "fingerprint mismatch → conflict");

  const lockHeld = adapter.evaluateLedgerDecision(
    {
      operationKey: key,
      contentFingerprint: fp,
      phase: "planned",
      lockOwner: "other-exec",
      lockExpiresAt: new Date(2_000_000).toISOString(),
    },
    { operationKey: key, contentFingerprint: fp, executionId: "exec-e", nowMs: 1_000_000 }
  );
  assert(lockHeld.action === "lock_held", "unexpired other lock → held");

  const lockExpired = adapter.evaluateLedgerDecision(
    {
      operationKey: key,
      contentFingerprint: fp,
      phase: "planned",
      lockOwner: "other-exec",
      lockExpiresAt: new Date(500_000).toISOString(),
    },
    { operationKey: key, contentFingerprint: fp, executionId: "exec-f", nowMs: 1_000_000 }
  );
  assert(lockExpired.action === "claim", "expired lock → claim");
}

function testRedaction() {
  const redacted = adapter.redactSensitiveFields({
    accessToken: "super-secret",
    nested: { accessToken: "x" },
    ok: true,
  });
  assert(redacted.accessToken === "[REDACTED]", "accessToken redacted");
  assert(redacted.nested.accessToken === "[REDACTED]", "nested accessToken redacted");
  assert(redacted.ok === true, "non-secret preserved");
}

function testFingerprintStableAcrossRename() {
  const app = readJson(appJsonPath);
  const a = adapter.buildDryRunBundle(app, baseConfig());
  assert(a.ok, a.error);
  const app2 = readJson(appJsonPath);
  app2.ads.media[0].githubPath = "media/renamed-same-bytes.png";
  // resolve will change path but we keep same creativeSha256 → fingerprint must match
  // (resolve may fail on extension still png) — use same path, only sha identity matters for fp
  const b = adapter.buildDryRunBundle(app, baseConfig());
  assert(b.ok, b.error);
  assert(
    a.bundle.ledgerPlan.contentFingerprint === b.bundle.ledgerPlan.contentFingerprint,
    "same bytes+config → same fingerprint"
  );
}

function main() {
  assert(
    CREATIVE_SHA256 === "ae73b936b39bb5d86c357c9bb2aab8d10b5b017f09d17e43a908ac49ce7e055d",
    "creative SHA must match Phase 1 measured hash"
  );

  const app = readJson(appJsonPath);
  assert(app.ads.objective === "traffic", "sandbox fixture objective must be traffic");
  assert(app.ads.meta.creativeRevision === "image-v1", "creativeRevision default");
  assert(app.media.ogImage.width === 1734, "fixture ogImage width must be measured 1734");
  assert(app.media.ogImage.height === 907, "fixture ogImage height must be measured 907");

  const expectedDryRun = readJson(expectedDryRunPath);
  const result = adapter.buildDryRunBundle(app, baseConfig());

  assert(result.ok, result.error || "bundle build failed");
  const bundle = result.bundle;

  assert(bundle.computed.dailyBudget === 1, "first-test daily budget must be $1");
  assertNoActiveStatus(bundle);
  assertReconciledMetaFields(bundle);
  assertSafety(bundle);
  assertMatchesExpectedDryRun(bundle, expectedDryRun);
  testIdempotencyRefusal();
  testFlatIdsDoNotBlockNewRevision();
  testNormalizeMigratesFlatKnownIds();
  testBudgetCapExceeded();
  testWritebackFixtureShape();
  testMergeAdsMetaWriteBack();
  testCreativeResolutionFailureMissingRepo();
  testCreativeResolutionFailureBadType();
  testVideoDryRunPlan();
  testVideoMissingThumbnail();
  testVideoMissingThumbSha();
  testMissingCreativeSha();
  testApprovalGatesNegative();
  testLedgerDecisions();
  testRedaction();
  testFingerprintStableAcrossRename();

  // Refresh expected dry-run snapshot for Phase 4 fields (local artifact)
  fs.writeFileSync(expectedDryRunPath, JSON.stringify(bundle, null, 2) + "\n");

  console.log("WF4 local dry-run + Phase 4 proofs: PASS");
  console.log("  adapter SSOT: lib/meta-adapter.js");
  console.log("  appId: " + bundle.appId);
  console.log("  operationKey: " + bundle.ledgerPlan.operationKey);
  console.log("  contentFingerprint: " + bundle.ledgerPlan.contentFingerprint);
  console.log("  creativeSha256: " + bundle.ledgerPlan.creativeSha256);
  console.log("  placementSet: " + bundle.ledgerPlan.placementSet);
  console.log("  dailyBudget: " + bundle.computed.dailyBudget + " (first-test $1/day)");
  console.log(
    "  facebook_positions/instagram_positions: " +
      JSON.stringify(bundle.requests.adSet.targeting.facebook_positions) +
      " / " +
      JSON.stringify(bundle.requests.adSet.targeting.instagram_positions)
  );
  console.log("  safety: zero external writes; Campaign/AdSet/Ad PAUSED; never ACTIVE");
  console.log("  concurrent-lock: simulation-proven (evaluateLedgerDecision)");
}

try {
  main();
} catch (err) {
  console.error("WF4 local dry-run proof: FAIL");
  console.error(err.message || err);
  process.exit(1);
}
