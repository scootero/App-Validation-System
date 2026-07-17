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

  var LOCATION_TO_COUNTRY = {
    "united states": "US",
    us: "US",
  };

  function roundBudget(value) {
    return Math.round(value * 100) / 100;
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

    return {
      ok: true,
      adPlan: {
        mode: mode,
        provider: provider,
        appId: app.appId,
        experimentRunId: app.analytics && app.analytics.experimentRunId,
        runKey: idem.runKey,
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
      },
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
        },
        adSet: {
          name: adPlan.campaignName + "-adset-v1",
          status: "PAUSED",
          daily_budget: dailyBudgetMinor,
          billing_event: V1_BILLING_EVENT,
          optimization_goal: V1_OPTIMIZATION_GOAL,
          targeting: adSetTargeting,
        },
        imageUpload: {
          endpoint: "POST /" + adAccountId + "/adimages",
          source: "ads.media githubPath or media.ogImage",
          image_hash: "VERIFY_AFTER_IMAGE_UPLOAD",
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
    var operationKey = [adPlan.appId, adPlan.experimentRunId, adPlan.provider].join("|");
    return {
      operationKey: operationKey,
      appId: adPlan.appId,
      experimentRunId: adPlan.experimentRunId,
      provider: adPlan.provider,
      phase: "planned",
      campaignId: null,
      adSetId: null,
      imageHash: null,
      creativeId: null,
      adId: null,
      lastError: null,
      reconciliation:
        "V1: detect existing op → resume if safe → else manual_review_required; no auto-delete",
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
            kind: adPlan.creative.kind,
            value: adPlan.creative.value,
            role: adPlan.creative.role,
            resolvedFrom: adPlan.creative.source,
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
            approvalToken: "WF4_CREATE_PAUSED_APPROVAL_TOKEN",
          },
        },
      },
    };
  }

  exports.PROVIDER = PROVIDER;
  exports.DEFAULT_META_API_VERSION = DEFAULT_META_API_VERSION;
  exports.DEFAULT_MAX_DAILY_BUDGET_USD = DEFAULT_MAX_DAILY_BUDGET_USD;
  exports.OBJECTIVE_MAPPING = OBJECTIVE_MAPPING;
  exports.V1_OPTIMIZATION_GOAL = V1_OPTIMIZATION_GOAL;
  exports.V1_BILLING_EVENT = V1_BILLING_EVENT;
  exports.ALT_OPTIMIZATION_GOAL = ALT_OPTIMIZATION_GOAL;
  exports.SPECIAL_AD_CATEGORIES = SPECIAL_AD_CATEGORIES;
  exports.buildAdPlan = buildAdPlan;
  exports.buildMetaRequests = buildMetaRequests;
  exports.buildLedgerPlan = buildLedgerPlan;
  exports.buildWriteBackPreview = buildWriteBackPreview;
  exports.buildDryRunBundle = buildDryRunBundle;
  exports.mapAuthorObjective = mapAuthorObjective;
  exports.selectCreative = selectCreative;
  exports.checkIdempotency = checkIdempotency;
})(__wf4Exports);
