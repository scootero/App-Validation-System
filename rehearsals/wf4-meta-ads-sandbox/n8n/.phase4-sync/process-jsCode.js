/**
 * WF4 Meta Adapter — single source of truth for Ad Plan + Meta request mapping.
 * Consumed by scripts/wf4-rehearse.js and inlined into n8n Process Code via
 * scripts/sync-wf4-adapter-into-workflow.js. Do not duplicate mappings elsewhere.
 *
 * V1 Meta pairing (architecture revision):
 *   objective: OUTCOME_TRAFFIC
 *   optimization_goal: LINK_CLICKS
 *   billing_event: IMPRESSIONS
 * LANDING_PAGE_VIEWS is an alternative pending account validation — not locked for V1.
 */
var __wf4Exports =
  typeof module !== "undefined" && module.exports ? module.exports : {};
if (typeof globalThis !== "undefined") {
  globalThis.WF4MetaAdapter = __wf4Exports;
}

(function (exports) {
  "use strict";

  var PROVIDER = "meta";
  var DEFAULT_META_API_VERSION = "v25.0";
  var DEFAULT_MAX_DAILY_BUDGET_USD = 2;

  var OBJECTIVE_MAPPING = {
    traffic: "OUTCOME_TRAFFIC",
    conversions: "OUTCOME_SALES",
    awareness: "OUTCOME_AWARENESS",
    leads: "OUTCOME_LEADS",
    "app-installs": "OUTCOME_APP_PROMOTION",
  };

  var V1_OPTIMIZATION_GOAL = "LINK_CLICKS";
  var V1_BILLING_EVENT = "IMPRESSIONS";
  /** Alternative (not V1 default): LANDING_PAGE_VIEWS + IMPRESSIONS — account-validate first. */
  var ALT_OPTIMIZATION_GOAL = "LANDING_PAGE_VIEWS";

  var SPECIAL_AD_CATEGORIES = [];
  var META_ID_FIELDS = ["campaignId", "adSetId", "creativeId", "adId"];
  var DEFAULT_ENVIRONMENT = "sandbox";
  var DEFAULT_CREATIVE_REVISION = "image-v1";
  var DEFAULT_WORKFLOW_VERSION = "wf4-image-v1";
  var LOCK_TTL_MS = 5 * 60 * 1000;
  /** Feed-first V1 — Stories/Reels excluded. */
  var V1_FACEBOOK_POSITIONS = ["feed"];
  var V1_INSTAGRAM_POSITIONS = ["stream"];
  var V1_PLACEMENT_SET = "facebook:feed|instagram:stream";
  var STAGE_ORDER = [
    "campaign",
    "adset",
    "image",
    "creative",
    "ad",
    "verified",
    "writeback_done",
  ];

  var LOCATION_TO_COUNTRY = {
    "united states": "US",
    us: "US",
  };

  /** V1 image creative extensions only (no video). */
  var IMAGE_EXTENSIONS = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
  };

  function roundBudget(value) {
    return Math.round(value * 100) / 100;
  }

  function getCrypto() {
    try {
      if (typeof require === "function") return require("crypto");
    } catch (e) {
      /* n8n / browser */
    }
    return null;
  }

  function sha256Hex(value) {
    var crypto = getCrypto();
    if (!crypto || !crypto.createHash) {
      throw new Error("SHA256_UNAVAILABLE: crypto.createHash required");
    }
    return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
  }

  function sha256BytesHex(buf) {
    var crypto = getCrypto();
    if (!crypto || !crypto.createHash) {
      throw new Error("SHA256_UNAVAILABLE: crypto.createHash required");
    }
    return crypto.createHash("sha256").update(buf).digest("hex");
  }

  function stableStringify(value) {
    if (value === null || typeof value !== "object") {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return "[" + value.map(stableStringify).join(",") + "]";
    }
    var keys = Object.keys(value).sort();
    return (
      "{" +
      keys
        .map(function (k) {
          return JSON.stringify(k) + ":" + stableStringify(value[k]);
        })
        .join(",") +
      "}"
    );
  }

  function buildOperationKey(parts) {
    return [parts.appId, parts.environment, parts.provider, parts.creativeRevision].join("|");
  }

  function buildPlacementSet(platforms) {
    var parts = [];
    if (!platforms || platforms.indexOf("facebook") !== -1) parts.push("facebook:feed");
    if (platforms && platforms.indexOf("instagram") !== -1) parts.push("instagram:stream");
    return parts.join("|") || V1_PLACEMENT_SET;
  }

  function buildCopyFingerprint(adPlan) {
    return sha256Hex(
      stableStringify({
        headlines: adPlan.headlines || [],
        primaryTexts: adPlan.primaryTexts || [],
        descriptions: adPlan.descriptions || [],
        callToAction: adPlan.callToAction || "",
      })
    );
  }

  function buildTargetingFingerprint(adPlan) {
    return sha256Hex(
      stableStringify({
        locations: adPlan.targeting.locations,
        ageMin: adPlan.targeting.ageMin,
        ageMax: adPlan.targeting.ageMax,
        platforms: adPlan.platforms,
        facebook_positions: V1_FACEBOOK_POSITIONS,
        instagram_positions: V1_INSTAGRAM_POSITIONS,
      })
    );
  }

  function buildBudgetFingerprint(adPlan) {
    return sha256Hex(
      stableStringify({
        dailyBudgetUsd: adPlan.budget.dailyBudgetUsd,
        currency: adPlan.budget.currency,
        durationDays: adPlan.budget.durationDays,
        totalAmount: adPlan.budget.totalAmount,
      })
    );
  }

  function buildContentFingerprint(adPlan, identity) {
    var payload = {
      appId: adPlan.appId,
      environment: identity.environment,
      workflowVersion: identity.workflowVersion,
      objective: mapAuthorObjective(adPlan.authorObjective),
      optimization: V1_OPTIMIZATION_GOAL,
      billing: V1_BILLING_EVENT,
      landingUrl: adPlan.landingUrl,
      targetingFingerprint: buildTargetingFingerprint(adPlan),
      budgetFingerprint: buildBudgetFingerprint(adPlan),
      creativeSha256: identity.creativeSha256,
      copyFingerprint: buildCopyFingerprint(adPlan),
      creativeRevision: identity.creativeRevision,
      placementSet: identity.placementSet,
    };
    return sha256Hex(stableStringify(payload));
  }

  function firstMissingStage(row) {
    row = row || {};
    if (!row.campaignId) return "campaign";
    if (!row.adSetId) return "adset";
    if (!row.imageHash) return "image";
    if (!row.creativeId) return "creative";
    if (!row.adId) return "ad";
    var phase = String(row.phase || "");
    if (phase !== "verified" && phase !== "writeback_done") return "verified";
    if (phase !== "writeback_done") return "writeback_done";
    return null;
  }

  function isCompleteLedgerRow(row) {
    if (!row) return false;
    var phase = String(row.phase || "");
    var ids = META_ID_FIELDS.filter(function (f) {
      return row[f] != null && String(row[f]).trim() !== "";
    });
    return phase === "writeback_done" || phase === "verified" || ids.length === 4;
  }

  function lockIsHeld(row, executionId, nowMs) {
    if (!row || !row.lockOwner) return false;
    if (String(row.lockOwner) === String(executionId)) return false;
    if (!row.lockExpiresAt) return true;
    var exp = Date.parse(row.lockExpiresAt);
    if (isNaN(exp)) return true;
    return exp > nowMs;
  }

  /**
   * Pure ledger decision for claim / resume / already_complete / conflicts.
   * Does not perform I/O — caller runs Lookup → decide → Upsert → re-Lookup confirm.
   */
  function evaluateLedgerDecision(ledgerRow, opts) {
    opts = opts || {};
    var executionId = opts.executionId || "local";
    var nowMs = opts.nowMs != null ? opts.nowMs : Date.now();
    var contentFingerprint = opts.contentFingerprint;
    var operationKey = opts.operationKey;

    if (ledgerRow && lockIsHeld(ledgerRow, executionId, nowMs)) {
      return {
        action: "lock_held",
        outcome: "failed",
        error: "LEDGER_LOCK_HELD: operationKey=" + operationKey,
        resumeFrom: null,
        metaCreate: null,
      };
    }

    if (!ledgerRow) {
      return {
        action: "claim",
        outcome: "in_progress",
        resumeFrom: "campaign",
        metaCreate: {},
        lockOwner: executionId,
        lockExpiresAt: new Date(nowMs + LOCK_TTL_MS).toISOString(),
      };
    }

    var rowFp = ledgerRow.contentFingerprint || "";
    if (rowFp && contentFingerprint && rowFp !== contentFingerprint) {
      if (isCompleteLedgerRow(ledgerRow) || firstMissingStage(ledgerRow) !== "campaign") {
        return {
          action: "revision_conflict",
          outcome: "manual_review_required",
          error:
            "LEDGER_REVISION_CONFLICT: fingerprint mismatch for " +
            operationKey +
            " — bump ads.meta.creativeRevision for a deliberate new variant",
          resumeFrom: null,
          metaCreate: null,
        };
      }
    }

    if (isCompleteLedgerRow(ledgerRow) && (!rowFp || rowFp === contentFingerprint)) {
      return {
        action: "already_complete",
        outcome: "already_complete",
        resumeFrom: null,
        metaCreate: {
          campaignId: ledgerRow.campaignId || null,
          adSetId: ledgerRow.adSetId || null,
          imageHash: ledgerRow.imageHash || null,
          creativeId: ledgerRow.creativeId || null,
          adId: ledgerRow.adId || null,
        },
        error: null,
      };
    }

    var resumeFrom = firstMissingStage(ledgerRow);
    if (resumeFrom && resumeFrom !== "campaign") {
      return {
        action: "resume",
        outcome: "resumed",
        resumeFrom: resumeFrom,
        metaCreate: {
          campaignId: ledgerRow.campaignId || null,
          adSetId: ledgerRow.adSetId || null,
          imageHash: ledgerRow.imageHash || null,
          creativeId: ledgerRow.creativeId || null,
          adId: ledgerRow.adId || null,
        },
        lockOwner: executionId,
        lockExpiresAt: new Date(nowMs + LOCK_TTL_MS).toISOString(),
      };
    }

    return {
      action: "claim",
      outcome: "in_progress",
      resumeFrom: "campaign",
      metaCreate: {
        campaignId: ledgerRow.campaignId || null,
        adSetId: ledgerRow.adSetId || null,
        imageHash: ledgerRow.imageHash || null,
        creativeId: ledgerRow.creativeId || null,
        adId: ledgerRow.adId || null,
      },
      lockOwner: executionId,
      lockExpiresAt: new Date(nowMs + LOCK_TTL_MS).toISOString(),
    };
  }

  /**
   * Approval + safety gates for create_paused (mode + approval + hard gate + caps).
   * No approval-token / Header Auth compare — those were removed from V1.
   */
  function evaluateCreatePausedGates(input) {
    input = input || {};
    var mode = input.mode || "dry_run";
    var approval = Boolean(input.approval);
    var createPausedAllowed = input.createPausedAllowed === true;
    var tripleApproved = mode === "create_paused" && approval === true;
    var failures = [];

    if (mode !== "create_paused") failures.push("mode_not_create_paused");
    if (!approval) failures.push("approval_false");
    if (!createPausedAllowed) failures.push("create_paused_hard_gate_false");
    if (input.budgetCapPassed === false) failures.push("over_budget");
    if (input.ledgerDecisionAction === "lock_held") failures.push("ledger_lock_held");
    if (input.ledgerDecisionAction === "revision_conflict") failures.push("ledger_revision_conflict");
    if (input.ledgerDecisionAction === "already_complete") failures.push("already_complete");
    if (input.requiredMetaIdsPresent === false) failures.push("missing_meta_ids");
    if (input.landingUrlValid === false) failures.push("invalid_landing_url");
    if (input.creativeValid === false) failures.push("invalid_creative");

    return {
      mode: mode,
      approval: approval,
      tripleApproved: tripleApproved,
      createPausedAllowed: createPausedAllowed,
      createPathOpen: tripleApproved && createPausedAllowed && failures.length === 0,
      failures: failures,
      redacted: true,
    };
  }

  function redactSensitiveFields(obj) {
    if (!obj || typeof obj !== "object") return obj;
    var clone = Array.isArray(obj) ? obj.slice() : Object.assign({}, obj);
    var keys = Object.keys(clone);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var lower = k.toLowerCase();
      if (
        lower.indexOf("approvaltoken") !== -1 ||
        lower === "wf4createpausedapprovaltoken" ||
        lower.indexOf("accesstoken") !== -1
      ) {
        clone[k] = clone[k] ? "[REDACTED]" : "";
      } else if (clone[k] && typeof clone[k] === "object") {
        clone[k] = redactSensitiveFields(clone[k]);
      }
    }
    return clone;
  }

  function buildLedgerStageUpsert(plan, metaCreate, phase, lock) {
    metaCreate = metaCreate || {};
    lock = lock || {};
    return {
      operationKey: plan.operationKey,
      appId: plan.appId,
      experimentRunId: plan.experimentRunId || "",
      provider: plan.provider || PROVIDER,
      environment: plan.environment,
      creativeRevision: plan.creativeRevision,
      contentFingerprint: plan.contentFingerprint,
      creativeSha256: plan.creativeSha256,
      phase: phase,
      campaignId: metaCreate.campaignId || "",
      adSetId: metaCreate.adSetId || "",
      imageHash: metaCreate.imageHash || "",
      creativeId: metaCreate.creativeId || "",
      adId: metaCreate.adId || "",
      lockOwner: lock.lockOwner != null ? lock.lockOwner : "",
      lockExpiresAt: lock.lockExpiresAt != null ? lock.lockExpiresAt : "",
      resumeFrom: lock.resumeFrom || "",
      outcome: lock.outcome || "in_progress",
      lastError: lock.lastError || "",
    };
  }

  function normalizeGithubRepo(raw) {
    if (!raw || typeof raw !== "string") return null;
    var s = raw.trim();
    s = s.replace(/^https?:\/\/github\.com\//i, "");
    s = s.replace(/\.git$/i, "");
    s = s.replace(/\/+$/, "");
    var parts = s.split("/");
    if (parts.length < 2 || !parts[0] || !parts[1]) return null;
    return parts[0] + "/" + parts[1];
  }

  function filenameFromPath(p) {
    var parts = String(p || "").split("/");
    return parts[parts.length - 1] || "";
  }

  function extensionOf(filename) {
    var m = String(filename || "")
      .toLowerCase()
      .match(/\.([a-z0-9]+)$/);
    return m ? m[1] : "";
  }

  /**
   * Generic creative binary resolution for any app package.
   * Reads ads.media[] / media.ogImage + source.assetsGithubRepo ?? source.mockupGithubRepo.
   * Does not hardcode app ids, repos, or filenames.
   */
  function resolveCreativeSource(app, creative) {
    if (!creative || !creative.kind || !creative.value) {
      return { ok: false, error: "CREATIVE_PATH_MISSING: no usable creative value" };
    }

    if (creative.kind === "url") {
      var urlValue = String(creative.value).trim();
      if (!/^https:\/\//i.test(urlValue)) {
        return { ok: false, error: "CREATIVE_DOWNLOAD_FAILED: creative url must be HTTPS" };
      }
      var urlFilename = filenameFromPath(urlValue.split("?")[0]);
      var urlExt = extensionOf(urlFilename);
      if (!IMAGE_EXTENSIONS[urlExt]) {
        return {
          ok: false,
          error:
            "CREATIVE_UNSUPPORTED_TYPE: expected image extension (png/jpg/jpeg/gif/webp), got " +
            (urlExt || "none"),
        };
      }
      return {
        ok: true,
        resolved: {
          kind: "url",
          value: urlValue,
          role: creative.role || "primary",
          resolvedFrom: creative.source,
          repo: null,
          branch: null,
          githubPath: null,
          url: urlValue,
          downloadUrl: urlValue,
          filename: urlFilename,
          expectedMime: IMAGE_EXTENSIONS[urlExt],
          expectedMimeFamily: "image",
          resolutionMethod: "direct_url",
        },
      };
    }

    if (creative.kind !== "githubPath") {
      return {
        ok: false,
        error: "CREATIVE_UNSUPPORTED_TYPE: unsupported creative kind " + creative.kind,
      };
    }

    var githubPath = String(creative.value).trim().replace(/^\/+/, "");
    if (!githubPath) {
      return { ok: false, error: "CREATIVE_PATH_MISSING: githubPath is empty" };
    }

    var filename = filenameFromPath(githubPath);
    var ext = extensionOf(filename);
    if (!IMAGE_EXTENSIONS[ext]) {
      return {
        ok: false,
        error:
          "CREATIVE_UNSUPPORTED_TYPE: expected image extension (png/jpg/jpeg/gif/webp), got " +
          (ext || "none"),
      };
    }

    var source = (app && app.source) || {};
    var repoRaw = source.assetsGithubRepo || source.mockupGithubRepo;
    if (!repoRaw) {
      return {
        ok: false,
        error:
          "CREATIVE_REPO_UNRESOLVED: set source.assetsGithubRepo or source.mockupGithubRepo for githubPath creatives",
      };
    }
    var repo = normalizeGithubRepo(repoRaw);
    if (!repo) {
      return {
        ok: false,
        error: "CREATIVE_REPO_INVALID: expected owner/repo, got " + String(repoRaw),
      };
    }

    var branch = String(source.assetsBranch || source.mockupBranch || "main").trim() || "main";
    var downloadUrl =
      "https://raw.githubusercontent.com/" +
      repo +
      "/" +
      encodeURIComponent(branch).replace(/%2F/gi, "/") +
      "/" +
      githubPath
        .split("/")
        .map(function (seg) {
          return encodeURIComponent(seg);
        })
        .join("/");

    return {
      ok: true,
      resolved: {
        kind: "githubPath",
        value: githubPath,
        role: creative.role || "primary",
        resolvedFrom: creative.source,
        repo: repo,
        branch: branch,
        githubPath: githubPath,
        url: null,
        downloadUrl: downloadUrl,
        filename: filename,
        expectedMime: IMAGE_EXTENSIONS[ext],
        expectedMimeFamily: "image",
        resolutionMethod: "github_raw",
      },
    };
  }

  function buildUtmQuery(utmTemplate) {
    var u = utmTemplate || {};
    var parts = [];
    if (u.source) parts.push("utm_source=" + encodeURIComponent(u.source));
    if (u.medium) parts.push("utm_medium=" + encodeURIComponent(u.medium));
    if (u.campaign) parts.push("utm_campaign=" + encodeURIComponent(u.campaign));
    if (u.content) parts.push("utm_content=" + encodeURIComponent(u.content));
    if (u.term) parts.push("utm_term=" + encodeURIComponent(u.term));
    return parts.join("&");
  }

  function mapCountries(locations) {
    var countries = [];
    for (var i = 0; i < (locations || []).length; i++) {
      var key = String(locations[i]).trim().toLowerCase();
      countries.push(LOCATION_TO_COUNTRY[key] || "VERIFY_COUNTRY_CODE");
    }
    return countries.length ? countries : ["VERIFY_COUNTRY_CODE"];
  }

  function selectCreative(app) {
    var adsMedia = (app.ads && app.ads.media) || [];
    for (var i = 0; i < adsMedia.length; i++) {
      var item = adsMedia[i];
      if (item.url || item.githubPath) {
        return {
          kind: item.url ? "url" : "githubPath",
          value: item.url || item.githubPath,
          role: item.role || "primary",
          source: "ads.media",
        };
      }
    }
    var og = app.media && app.media.ogImage;
    if (og && (og.url || og.githubPath)) {
      return {
        kind: og.url ? "url" : "githubPath",
        value: og.url || og.githubPath,
        role: "fallback",
        source: "media.ogImage",
      };
    }
    return null;
  }

  function checkIdempotency(app, provider) {
    var meta = (app.ads && app.ads.meta) || {};
    var runKey = {
      appId: app.appId,
      experimentRunId: app.analytics && app.analytics.experimentRunId,
      provider: provider || PROVIDER,
    };
    var existing = META_ID_FIELDS.filter(function (field) {
      return meta[field] != null && meta[field] !== "";
    });
    return {
      runKey: runKey,
      refused: existing.length > 0,
      existingFields: existing,
    };
  }

  function mapAuthorObjective(authorObjective) {
    var key = String(authorObjective || "traffic").toLowerCase();
    return OBJECTIVE_MAPPING[key] || OBJECTIVE_MAPPING.traffic;
  }

  function buildAdPlan(app, config) {
    config = config || {};
    var maxDailyBudgetUsd =
      config.maxDailyBudgetUsd != null
        ? Number(config.maxDailyBudgetUsd)
        : DEFAULT_MAX_DAILY_BUDGET_USD;
    var provider = config.provider || PROVIDER;
    var mode = config.mode || "dry_run";

    if (!app || !app.appId) {
      return { ok: false, error: "Missing appId" };
    }
    if (!app.ads) {
      return { ok: false, error: "Missing ads section" };
    }
    if (!app.experiment || !app.experiment.testBudget) {
      return { ok: false, error: "Missing experiment.testBudget" };
    }
    if (!app.deployment || !app.deployment.landing || !app.deployment.landing.url) {
      return { ok: false, error: "Missing deployment.landing.url" };
    }
    if (!/^https:\/\//i.test(app.deployment.landing.url)) {
      return { ok: false, error: "deployment.landing.url must be HTTPS" };
    }

    var targeting = app.ads.targeting || {};
    if (!targeting.locations || !targeting.locations.length) {
      return { ok: false, error: "ads.targeting.locations required" };
    }
    if (targeting.ageMin == null || targeting.ageMax == null) {
      return { ok: false, error: "ads.targeting.ageMin and ageMax required" };
    }
    var platforms = app.ads.platforms || [];
    if (platforms.indexOf("facebook") === -1 && platforms.indexOf("instagram") === -1) {
      return { ok: false, error: "ads.platforms must include facebook and/or instagram" };
    }

    var creative = selectCreative(app);
    if (!creative) {
      return { ok: false, error: "No usable creative (ads.media[] or media.ogImage)" };
    }

    var creativeResolved = resolveCreativeSource(app, creative);
    if (!creativeResolved.ok) {
      return { ok: false, error: creativeResolved.error };
    }

    var budget = app.experiment.testBudget;
    if (!budget.durationDays || budget.durationDays <= 0) {
      return { ok: false, error: "experiment.testBudget.durationDays must be > 0" };
    }
    if (budget.currency && budget.currency !== "USD") {
      return { ok: false, error: "experiment.testBudget.currency must be USD for V1 cap check" };
    }
    var dailyBudgetUsd = roundBudget(Number(budget.amount) / Number(budget.durationDays));
    if (dailyBudgetUsd > maxDailyBudgetUsd) {
      return {
        ok: false,
        error:
          "Daily budget " +
          dailyBudgetUsd +
          " USD exceeds MAX_DAILY_BUDGET_USD=" +
          maxDailyBudgetUsd +
          " (fail-closed; never clamp)",
      };
    }

    var idem = checkIdempotency(app, provider);
    if (idem.refused) {
      return {
        ok: false,
        error:
          "Idempotency refusal: ads.meta already has " +
          idem.existingFields.join(", ") +
          " for runKey " +
          JSON.stringify(idem.runKey),
      };
    }

    var landingUrl = app.deployment.landing.url;
    var utmQuery = buildUtmQuery(app.ads.utmTemplate);
    var destinationUrl = utmQuery ? landingUrl + "?" + utmQuery : landingUrl;
    var environment = config.environment || DEFAULT_ENVIRONMENT;
    var creativeRevision =
      (app.ads.meta && app.ads.meta.creativeRevision) ||
      config.creativeRevision ||
      DEFAULT_CREATIVE_REVISION;
    var workflowVersion = config.workflowVersion || DEFAULT_WORKFLOW_VERSION;
    var creativeSha256 = config.creativeSha256 || null;
    if (!creativeSha256) {
      return {
        ok: false,
        error:
          "CREATIVE_SHA256_REQUIRED: pass config.creativeSha256 (binary hash) for operation fingerprint",
      };
    }
    var placementSet = buildPlacementSet(platforms);
    var operationKey = buildOperationKey({
      appId: app.appId,
      environment: environment,
      provider: provider,
      creativeRevision: creativeRevision,
    });

    var adPlan = {
      mode: mode,
      provider: provider,
      appId: app.appId,
      experimentRunId: app.analytics && app.analytics.experimentRunId,
      runKey: idem.runKey,
      environment: environment,
      creativeRevision: creativeRevision,
      workflowVersion: workflowVersion,
      creativeSha256: creativeSha256,
      operationKey: operationKey,
      placementSet: placementSet,
      authorObjective: app.ads.objective || "traffic",
      campaignName: app.ads.campaignName,
      callToAction: app.ads.callToAction,
      headlines: app.ads.headlines || [],
      primaryTexts: app.ads.primaryTexts || [],
      descriptions: app.ads.descriptions || [],
      platforms: platforms,
      targeting: {
        locations: targeting.locations,
        ageMin: targeting.ageMin,
        ageMax: targeting.ageMax,
        interests: targeting.interests || null,
      },
      creative: creative,
      creativeResolved: creativeResolved.resolved,
      landingUrl: landingUrl,
      destinationUrl: destinationUrl,
      budget: {
        currency: budget.currency,
        totalAmount: budget.amount,
        durationDays: budget.durationDays,
        dailyBudgetUsd: dailyBudgetUsd,
      },
      budgetCapCheck: {
        maxDailyBudgetUsd: maxDailyBudgetUsd,
        passed: true,
      },
      wf3Gate: {
        required: true,
        status: config.wf3GateStatus || "proven",
        requiredEvents: [
          "page_view",
          "email_captured",
          "buy_now_clicked",
          "mockup_interacted",
        ],
      },
      rootStatusPreserved: app.status || null,
    };

    adPlan.contentFingerprint = buildContentFingerprint(adPlan, {
      environment: environment,
      workflowVersion: workflowVersion,
      creativeSha256: creativeSha256,
      creativeRevision: creativeRevision,
      placementSet: placementSet,
    });

    return {
      ok: true,
      adPlan: adPlan,
    };
  }

  function buildMetaRequests(adPlan, config) {
    config = config || {};
    var metaApiVersion = config.metaApiVersion || DEFAULT_META_API_VERSION;
    var pageId = config.pageId || "CONFIG_META_PAGE_ID";
    var adAccountId = config.adAccountId || "act_{META_AD_ACCOUNT_ID}";
    var instagramUserId = config.instagramUserId || null;
    var dailyBudgetMinor = Math.round(adPlan.budget.dailyBudgetUsd * 100);
    var metaObjective = mapAuthorObjective(adPlan.authorObjective);

    var adSetTargeting = {
      geo_locations: { countries: mapCountries(adPlan.targeting.locations) },
      age_min: adPlan.targeting.ageMin,
      age_max: adPlan.targeting.ageMax,
      publisher_platforms: adPlan.platforms,
      facebook_positions: V1_FACEBOOK_POSITIONS.slice(),
      instagram_positions: V1_INSTAGRAM_POSITIONS.slice(),
      // Required by current Marketing API (subcode 1870227). 0 = keep explicit ages.
      targeting_automation: { advantage_audience: 0 },
    };
    if (adPlan.targeting.interests && adPlan.targeting.interests.length) {
      adSetTargeting.interests = adPlan.targeting.interests.map(function () {
        return "VERIFY_INTEREST_ID";
      });
    }

    var headline = adPlan.headlines[0];
    var primaryText = adPlan.primaryTexts[0];
    var description = (adPlan.descriptions && adPlan.descriptions[0]) || "";

    var objectStorySpec = {
      page_id: pageId,
      link_data: {
        link: adPlan.destinationUrl,
        message: primaryText,
        name: headline,
        description: description,
        call_to_action: {
          type: adPlan.callToAction,
          value: { link: adPlan.destinationUrl },
        },
        image_hash: "VERIFY_AFTER_IMAGE_UPLOAD",
      },
    };
    if (
      instagramUserId &&
      adPlan.platforms &&
      adPlan.platforms.indexOf("instagram") !== -1
    ) {
      objectStorySpec.instagram_user_id = instagramUserId;
    }

    return {
      metaApiVersion: metaApiVersion,
      v1Pairing: {
        objective: metaObjective,
        optimization_goal: V1_OPTIMIZATION_GOAL,
        billing_event: V1_BILLING_EVENT,
        note:
          "LANDING_PAGE_VIEWS is an alternative pending account validation; not V1 default.",
        alternativeOptimizationGoal: ALT_OPTIMIZATION_GOAL,
      },
      pausedStatuses: {
        campaign: "PAUSED",
        adSet: "PAUSED",
        creative: "N/A_ASSET",
        ad: "PAUSED",
      },
      statusForDeliveryEntities: "PAUSED",
      neverSendActive: true,
      requests: {
        campaign: {
          name: adPlan.campaignName,
          objective: metaObjective,
          status: "PAUSED",
          special_ad_categories: SPECIAL_AD_CATEGORIES.slice(),
          // Required when using ad-set budgets (not CBO). Probe-proven 2026-07-26.
          is_adset_budget_sharing_enabled: false,
        },
        adSet: {
          name: adPlan.campaignName + "-adset-v1",
          status: "PAUSED",
          daily_budget: dailyBudgetMinor,
          billing_event: V1_BILLING_EVENT,
          optimization_goal: V1_OPTIMIZATION_GOAL,
          // Account requires explicit strategy; omitting triggers subcode 2490487.
          bid_strategy: "LOWEST_COST_WITHOUT_CAP",
          targeting: adSetTargeting,
          promoted_object: { page_id: pageId },
        },
        imageUpload: {
          endpoint: "POST /" + adAccountId + "/adimages",
          source: "ads.media githubPath or media.ogImage",
          image_hash: "VERIFY_AFTER_IMAGE_UPLOAD",
          resolutionMethod: adPlan.creativeResolved
            ? adPlan.creativeResolved.resolutionMethod
            : null,
          downloadUrl: adPlan.creativeResolved
            ? adPlan.creativeResolved.downloadUrl
            : null,
          filename: adPlan.creativeResolved ? adPlan.creativeResolved.filename : null,
          repo: adPlan.creativeResolved ? adPlan.creativeResolved.repo : null,
          branch: adPlan.creativeResolved ? adPlan.creativeResolved.branch : null,
          githubPath: adPlan.creativeResolved
            ? adPlan.creativeResolved.githubPath
            : null,
          expectedMime: adPlan.creativeResolved
            ? adPlan.creativeResolved.expectedMime
            : null,
          expectedMimeFamily: "image",
        },
        creative: {
          name: adPlan.campaignName + "-creative-a",
          object_story_spec: objectStorySpec,
        },
        ad: {
          name: adPlan.campaignName + "-ad-a",
          status: "PAUSED",
          creative: { creative_id: "CREATIVE_ID_FROM_CREATE_CREATIVE" },
        },
      },
    };
  }

  function buildLedgerPlan(adPlan) {
    return {
      operationKey: adPlan.operationKey,
      appId: adPlan.appId,
      experimentRunId: adPlan.experimentRunId,
      provider: adPlan.provider,
      environment: adPlan.environment,
      creativeRevision: adPlan.creativeRevision,
      contentFingerprint: adPlan.contentFingerprint,
      creativeSha256: adPlan.creativeSha256,
      placementSet: adPlan.placementSet,
      phase: "planned",
      campaignId: null,
      adSetId: null,
      imageHash: null,
      creativeId: null,
      adId: null,
      lockOwner: null,
      lockExpiresAt: null,
      resumeFrom: null,
      outcome: null,
      lastError: null,
      reconciliation:
        "V1: claim-lock → already_complete | resume same fingerprint | revision_conflict | lock_held; no auto-delete",
    };
  }

  function buildWriteBackPreview(adPlan, ids) {
    ids = ids || {};
    return {
      ads: {
        meta: {
          status: "created_paused",
          campaignId: ids.campaignId || "<campaign-id>",
          adSetId: ids.adSetId || "<ad-set-id>",
          creativeId: ids.creativeId || "<creative-id>",
          adId: ids.adId || "<ad-id>",
          landingUrl: adPlan.destinationUrl,
          dailyBudget: adPlan.budget.dailyBudgetUsd,
          createdAt: ids.createdAt || "<iso8601>",
          lastSyncedAt: null,
        },
      },
      rootStatusUnchanged: true,
      rootStatusNote:
        "Preserve existing root status (e.g. ready). Set validating only after human-approved activation.",
      writeBackTiming:
        "verified_complete_only: merge ads.meta into app.json only after Campaign/AdSet/Creative/Ad are created and verified PAUSED; partial IDs stay in the ledger",
    };
  }

  /**
   * Merge verified-complete ads.meta into an existing app.json without touching
   * root status or author fields. Partial-step IDs must not call this — ledger only.
   */
  function mergeAdsMetaWriteBack(appJson, writeBackMeta, options) {
    options = options || {};
    if (!appJson || typeof appJson !== "object") {
      return { ok: false, error: "WRITEBACK_APPJSON_REQUIRED" };
    }
    var metaIn = writeBackMeta || {};
    if (metaIn.ads && metaIn.ads.meta) {
      metaIn = metaIn.ads.meta;
    }
    var requiredIds = ["campaignId", "adSetId", "creativeId", "adId"];
    var missing = requiredIds.filter(function (k) {
      return metaIn[k] == null || String(metaIn[k]).trim() === "" || String(metaIn[k]).indexOf("<") === 0;
    });
    if (options.requireCompleteIds !== false && missing.length) {
      return {
        ok: false,
        error: "WRITEBACK_INCOMPLETE_IDS: " + missing.join(","),
        missingIds: missing,
      };
    }
    if (options.requireVerifiedStatus !== false && metaIn.status !== "created_paused") {
      return {
        ok: false,
        error: "WRITEBACK_STATUS_REQUIRED: status must be created_paused before Drive merge",
      };
    }

    var clone = JSON.parse(JSON.stringify(appJson));
    var rootBefore = clone.status;
    if (!clone.ads || typeof clone.ads !== "object") clone.ads = {};
    if (!clone.ads.meta || typeof clone.ads.meta !== "object") clone.ads.meta = {};

    var keys = [
      "status",
      "campaignId",
      "adSetId",
      "creativeId",
      "adId",
      "landingUrl",
      "dailyBudget",
      "createdAt",
      "lastSyncedAt",
    ];
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (Object.prototype.hasOwnProperty.call(metaIn, key)) {
        clone.ads.meta[key] = metaIn[key];
      }
    }
    // Preserve creativeRevision if already present and not supplied
    if (
      metaIn.creativeRevision != null &&
      String(metaIn.creativeRevision).trim() !== ""
    ) {
      clone.ads.meta.creativeRevision = metaIn.creativeRevision;
    }

    clone.status = rootBefore;
    return {
      ok: true,
      appJson: clone,
      rootStatusUnchanged: clone.status === rootBefore,
      rootStatus: clone.status,
      adsMeta: clone.ads.meta,
    };
  }

  function buildDryRunBundle(app, config) {
    config = config || {};
    var planResult = buildAdPlan(app, config);
    if (!planResult.ok) {
      return planResult;
    }
    var adPlan = planResult.adPlan;
    var meta = buildMetaRequests(adPlan, config);
    var ledgerPlan = buildLedgerPlan(adPlan);
    var writeBackPreview = buildWriteBackPreview(adPlan);

    return {
      ok: true,
      bundle: {
        mode: adPlan.mode,
        appId: adPlan.appId,
        provider: adPlan.provider,
        runKey: adPlan.runKey,
        metaApiVersion: meta.metaApiVersion,
        adAccountIdRef: "n8n.config.META_AD_ACCOUNT_ID",
        pageIdRef: "n8n.config.META_PAGE_ID",
        metaAccountConfig: {
          META_BUSINESS_PORTFOLIO_ID: config.businessPortfolioId || null,
          META_AD_ACCOUNT_ID: config.adAccountId || null,
          META_PAGE_ID: config.pageId || null,
          META_INSTAGRAM_USER_ID: config.instagramUserId || null,
        },
        wf3Gate: adPlan.wf3Gate,
        adPlan: {
          authorObjective: adPlan.authorObjective,
          campaignName: adPlan.campaignName,
          platforms: adPlan.platforms,
          targeting: adPlan.targeting,
          budget: adPlan.budget,
          destinationUrl: adPlan.destinationUrl,
          rootStatusPreserved: adPlan.rootStatusPreserved,
        },
        source: {
          landingUrl: adPlan.landingUrl,
          creative: {
            kind: adPlan.creativeResolved.kind,
            value: adPlan.creativeResolved.value,
            role: adPlan.creativeResolved.role,
            resolvedFrom: adPlan.creativeResolved.resolvedFrom,
            repo: adPlan.creativeResolved.repo,
            branch: adPlan.creativeResolved.branch,
            githubPath: adPlan.creativeResolved.githubPath,
            url: adPlan.creativeResolved.url,
            downloadUrl: adPlan.creativeResolved.downloadUrl,
            filename: adPlan.creativeResolved.filename,
            expectedMime: adPlan.creativeResolved.expectedMime,
            expectedMimeFamily: adPlan.creativeResolved.expectedMimeFamily,
            resolutionMethod: adPlan.creativeResolved.resolutionMethod,
          },
        },
        computed: {
          destinationUrl: adPlan.destinationUrl,
          dailyBudget: adPlan.budget.dailyBudgetUsd,
          currency: adPlan.budget.currency,
          totalBudget: adPlan.budget.totalAmount,
          durationDays: adPlan.budget.durationDays,
          pausedStatuses: meta.pausedStatuses,
          statusForDeliveryEntities: meta.statusForDeliveryEntities,
        },
        budgetCapCheck: adPlan.budgetCapCheck,
        v1Pairing: meta.v1Pairing,
        requests: meta.requests,
        ledgerPlan: ledgerPlan,
        operationIdentity: {
          operationKey: adPlan.operationKey,
          contentFingerprint: adPlan.contentFingerprint,
          creativeSha256: adPlan.creativeSha256,
          creativeRevision: adPlan.creativeRevision,
          environment: adPlan.environment,
          placementSet: adPlan.placementSet,
          workflowVersion: adPlan.workflowVersion,
        },
        writeBackAfterCreatePausedOnly: writeBackPreview,
        safety: {
          externalWritePerformed: false,
          liveAdsCreated: false,
          spendPossible: false,
          requiresExplicitApprovalBeforeCreatePaused: true,
          neverSendActive: true,
          tripleApprovalRequired: {
            mode: "create_paused",
            approval: true,
            createPausedAllowed: true,
          },
          feedFirstPlacements: true,
          storiesReelsOutOfV1: true,
        },
      },
    };
  }

  exports.PROVIDER = PROVIDER;
  exports.DEFAULT_META_API_VERSION = DEFAULT_META_API_VERSION;
  exports.DEFAULT_MAX_DAILY_BUDGET_USD = DEFAULT_MAX_DAILY_BUDGET_USD;
  exports.DEFAULT_ENVIRONMENT = DEFAULT_ENVIRONMENT;
  exports.DEFAULT_CREATIVE_REVISION = DEFAULT_CREATIVE_REVISION;
  exports.DEFAULT_WORKFLOW_VERSION = DEFAULT_WORKFLOW_VERSION;
  exports.V1_FACEBOOK_POSITIONS = V1_FACEBOOK_POSITIONS;
  exports.V1_INSTAGRAM_POSITIONS = V1_INSTAGRAM_POSITIONS;
  exports.V1_PLACEMENT_SET = V1_PLACEMENT_SET;
  exports.STAGE_ORDER = STAGE_ORDER;
  exports.OBJECTIVE_MAPPING = OBJECTIVE_MAPPING;
  exports.V1_OPTIMIZATION_GOAL = V1_OPTIMIZATION_GOAL;
  exports.V1_BILLING_EVENT = V1_BILLING_EVENT;
  exports.ALT_OPTIMIZATION_GOAL = ALT_OPTIMIZATION_GOAL;
  exports.SPECIAL_AD_CATEGORIES = SPECIAL_AD_CATEGORIES;
  exports.buildAdPlan = buildAdPlan;
  exports.buildMetaRequests = buildMetaRequests;
  exports.buildLedgerPlan = buildLedgerPlan;
  exports.buildWriteBackPreview = buildWriteBackPreview;
  exports.mergeAdsMetaWriteBack = mergeAdsMetaWriteBack;
  exports.buildDryRunBundle = buildDryRunBundle;
  exports.buildOperationKey = buildOperationKey;
  exports.buildContentFingerprint = buildContentFingerprint;
  exports.evaluateLedgerDecision = evaluateLedgerDecision;
  exports.evaluateCreatePausedGates = evaluateCreatePausedGates;
  exports.redactSensitiveFields = redactSensitiveFields;
  exports.buildLedgerStageUpsert = buildLedgerStageUpsert;
  exports.sha256Hex = sha256Hex;
  exports.sha256BytesHex = sha256BytesHex;
  exports.firstMissingStage = firstMissingStage;
  exports.mapAuthorObjective = mapAuthorObjective;
  exports.selectCreative = selectCreative;
  exports.resolveCreativeSource = resolveCreativeSource;
  exports.checkIdempotency = checkIdempotency;
  exports.IMAGE_EXTENSIONS = IMAGE_EXTENSIONS;
})(__wf4Exports);

const input = $input.first().json;
const mode = input.mode || 'dry_run';
const approval = Boolean(input.approval);
let app = null;
if (input.appJson && typeof input.appJson === 'object') {
  app = input.appJson;
} else if (input.useFixtureAppJson) {
  app = JSON.parse(input.fixtureAppJson || '{}');
} else {
  throw new Error('No appJson provided and fixture disabled');
}
const creativeSha256 = input.WF4_CREATIVE_SHA256 || input.creativeSha256 || '';
if (!creativeSha256) {
  throw new Error('CREATIVE_SHA256_REQUIRED: set WF4_CREATIVE_SHA256 in Workflow Config (sandbox planning hash)');
}
const result = WF4MetaAdapter.buildDryRunBundle(app, {
  mode: mode,
  provider: input.provider || 'meta',
  environment: input.environment || 'sandbox',
  workflowVersion: input.workflowVersion || 'wf4-image-v1',
  creativeSha256: creativeSha256,
  maxDailyBudgetUsd: input.MAX_DAILY_BUDGET_USD != null ? Number(input.MAX_DAILY_BUDGET_USD) : 2,
  metaApiVersion: input.metaApiVersion || input.META_API_VERSION || 'v25.0',
  wf3GateStatus: input.wf3GateStatus || 'proven',
  pageId: input.META_PAGE_ID || 'CONFIG_META_PAGE_ID',
  adAccountId: input.META_AD_ACCOUNT_ID || null,
  instagramUserId: input.META_INSTAGRAM_USER_ID || null,
  businessPortfolioId: input.META_BUSINESS_PORTFOLIO_ID || null,
});
if (!result.ok) {
  throw new Error(result.error || 'WF4 dry-run bundle failed');
}
const gate = WF4MetaAdapter.evaluateCreatePausedGates({
  mode: mode,
  approval: approval,
  createPausedAllowed: false,
  budgetCapPassed: result.bundle.budgetCapCheck && result.bundle.budgetCapCheck.passed !== false,
  requiredMetaIdsPresent: Boolean(input.META_AD_ACCOUNT_ID && input.META_PAGE_ID),
  landingUrlValid: Boolean(result.bundle.computed && result.bundle.computed.destinationUrl),
  creativeValid: Boolean(result.bundle.source && result.bundle.source.creative),
});
const safeOut = WF4MetaAdapter.redactSensitiveFields({
  bundle: result.bundle,
  tripleApproved: gate.tripleApproved,
  approvalGate: gate,
  _createPausedAllowed: false,
});
return [{ json: Object.assign({}, WF4MetaAdapter.redactSensitiveFields(input), safeOut) }];
