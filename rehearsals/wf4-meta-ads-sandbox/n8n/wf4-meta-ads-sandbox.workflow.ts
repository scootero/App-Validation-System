import {
  workflow,
  node,
  trigger,
  ifElse,
  expr,
} from '@n8n/workflow-sdk';

const processWf4Code =
  "/**\n" +
  " * WF4 Meta Adapter — single source of truth for Ad Plan + Meta request mapping.\n" +
  " * Consumed by scripts/wf4-rehearse.js and inlined into n8n Process Code via\n" +
  " * scripts/sync-wf4-adapter-into-workflow.js. Do not duplicate mappings elsewhere.\n" +
  " *\n" +
  " * V1 Meta pairing (architecture revision):\n" +
  " *   objective: OUTCOME_TRAFFIC\n" +
  " *   optimization_goal: LINK_CLICKS\n" +
  " *   billing_event: IMPRESSIONS\n" +
  " * LANDING_PAGE_VIEWS is an alternative pending account validation — not locked for V1.\n" +
  " */\n" +
  "var __wf4Exports =\n" +
  "  typeof module !== \"undefined\" && module.exports ? module.exports : {};\n" +
  "if (typeof globalThis !== \"undefined\") {\n" +
  "  globalThis.WF4MetaAdapter = __wf4Exports;\n" +
  "}\n" +
  "\n" +
  "(function (exports) {\n" +
  "  \"use strict\";\n" +
  "\n" +
  "  var PROVIDER = \"meta\";\n" +
  "  var DEFAULT_META_API_VERSION = \"v25.0\";\n" +
  "  var DEFAULT_MAX_DAILY_BUDGET_USD = 10;\n" +
  "\n" +
  "  var OBJECTIVE_MAPPING = {\n" +
  "    traffic: \"OUTCOME_TRAFFIC\",\n" +
  "    conversions: \"OUTCOME_SALES\",\n" +
  "    awareness: \"OUTCOME_AWARENESS\",\n" +
  "    leads: \"OUTCOME_LEADS\",\n" +
  "    \"app-installs\": \"OUTCOME_APP_PROMOTION\",\n" +
  "  };\n" +
  "\n" +
  "  var V1_OPTIMIZATION_GOAL = \"LINK_CLICKS\";\n" +
  "  var V1_BILLING_EVENT = \"IMPRESSIONS\";\n" +
  "  /** Alternative (not V1 default): LANDING_PAGE_VIEWS + IMPRESSIONS — account-validate first. */\n" +
  "  var ALT_OPTIMIZATION_GOAL = \"LANDING_PAGE_VIEWS\";\n" +
  "\n" +
  "  var SPECIAL_AD_CATEGORIES = [];\n" +
  "  var META_ID_FIELDS = [\"campaignId\", \"adSetId\", \"creativeId\", \"adId\"];\n" +
  "\n" +
  "  var LOCATION_TO_COUNTRY = {\n" +
  "    \"united states\": \"US\",\n" +
  "    us: \"US\",\n" +
  "  };\n" +
  "\n" +
  "  function roundBudget(value) {\n" +
  "    return Math.round(value * 100) / 100;\n" +
  "  }\n" +
  "\n" +
  "  function buildUtmQuery(utmTemplate) {\n" +
  "    var u = utmTemplate || {};\n" +
  "    var parts = [];\n" +
  "    if (u.source) parts.push(\"utm_source=\" + encodeURIComponent(u.source));\n" +
  "    if (u.medium) parts.push(\"utm_medium=\" + encodeURIComponent(u.medium));\n" +
  "    if (u.campaign) parts.push(\"utm_campaign=\" + encodeURIComponent(u.campaign));\n" +
  "    if (u.content) parts.push(\"utm_content=\" + encodeURIComponent(u.content));\n" +
  "    if (u.term) parts.push(\"utm_term=\" + encodeURIComponent(u.term));\n" +
  "    return parts.join(\"&\");\n" +
  "  }\n" +
  "\n" +
  "  function mapCountries(locations) {\n" +
  "    var countries = [];\n" +
  "    for (var i = 0; i < (locations || []).length; i++) {\n" +
  "      var key = String(locations[i]).trim().toLowerCase();\n" +
  "      countries.push(LOCATION_TO_COUNTRY[key] || \"VERIFY_COUNTRY_CODE\");\n" +
  "    }\n" +
  "    return countries.length ? countries : [\"VERIFY_COUNTRY_CODE\"];\n" +
  "  }\n" +
  "\n" +
  "  function selectCreative(app) {\n" +
  "    var adsMedia = (app.ads && app.ads.media) || [];\n" +
  "    for (var i = 0; i < adsMedia.length; i++) {\n" +
  "      var item = adsMedia[i];\n" +
  "      if (item.url || item.githubPath) {\n" +
  "        return {\n" +
  "          kind: item.url ? \"url\" : \"githubPath\",\n" +
  "          value: item.url || item.githubPath,\n" +
  "          role: item.role || \"primary\",\n" +
  "          source: \"ads.media\",\n" +
  "        };\n" +
  "      }\n" +
  "    }\n" +
  "    var og = app.media && app.media.ogImage;\n" +
  "    if (og && (og.url || og.githubPath)) {\n" +
  "      return {\n" +
  "        kind: og.url ? \"url\" : \"githubPath\",\n" +
  "        value: og.url || og.githubPath,\n" +
  "        role: \"fallback\",\n" +
  "        source: \"media.ogImage\",\n" +
  "      };\n" +
  "    }\n" +
  "    return null;\n" +
  "  }\n" +
  "\n" +
  "  function checkIdempotency(app, provider) {\n" +
  "    var meta = (app.ads && app.ads.meta) || {};\n" +
  "    var runKey = {\n" +
  "      appId: app.appId,\n" +
  "      experimentRunId: app.analytics && app.analytics.experimentRunId,\n" +
  "      provider: provider || PROVIDER,\n" +
  "    };\n" +
  "    var existing = META_ID_FIELDS.filter(function (field) {\n" +
  "      return meta[field] != null && meta[field] !== \"\";\n" +
  "    });\n" +
  "    return {\n" +
  "      runKey: runKey,\n" +
  "      refused: existing.length > 0,\n" +
  "      existingFields: existing,\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function mapAuthorObjective(authorObjective) {\n" +
  "    var key = String(authorObjective || \"traffic\").toLowerCase();\n" +
  "    return OBJECTIVE_MAPPING[key] || OBJECTIVE_MAPPING.traffic;\n" +
  "  }\n" +
  "\n" +
  "  function buildAdPlan(app, config) {\n" +
  "    config = config || {};\n" +
  "    var maxDailyBudgetUsd =\n" +
  "      config.maxDailyBudgetUsd != null\n" +
  "        ? Number(config.maxDailyBudgetUsd)\n" +
  "        : DEFAULT_MAX_DAILY_BUDGET_USD;\n" +
  "    var provider = config.provider || PROVIDER;\n" +
  "    var mode = config.mode || \"dry_run\";\n" +
  "\n" +
  "    if (!app || !app.appId) {\n" +
  "      return { ok: false, error: \"Missing appId\" };\n" +
  "    }\n" +
  "    if (!app.ads) {\n" +
  "      return { ok: false, error: \"Missing ads section\" };\n" +
  "    }\n" +
  "    if (!app.experiment || !app.experiment.testBudget) {\n" +
  "      return { ok: false, error: \"Missing experiment.testBudget\" };\n" +
  "    }\n" +
  "    if (!app.deployment || !app.deployment.landing || !app.deployment.landing.url) {\n" +
  "      return { ok: false, error: \"Missing deployment.landing.url\" };\n" +
  "    }\n" +
  "    if (!/^https:\\/\\//i.test(app.deployment.landing.url)) {\n" +
  "      return { ok: false, error: \"deployment.landing.url must be HTTPS\" };\n" +
  "    }\n" +
  "\n" +
  "    var targeting = app.ads.targeting || {};\n" +
  "    if (!targeting.locations || !targeting.locations.length) {\n" +
  "      return { ok: false, error: \"ads.targeting.locations required\" };\n" +
  "    }\n" +
  "    if (targeting.ageMin == null || targeting.ageMax == null) {\n" +
  "      return { ok: false, error: \"ads.targeting.ageMin and ageMax required\" };\n" +
  "    }\n" +
  "    var platforms = app.ads.platforms || [];\n" +
  "    if (platforms.indexOf(\"facebook\") === -1 && platforms.indexOf(\"instagram\") === -1) {\n" +
  "      return { ok: false, error: \"ads.platforms must include facebook and/or instagram\" };\n" +
  "    }\n" +
  "\n" +
  "    var creative = selectCreative(app);\n" +
  "    if (!creative) {\n" +
  "      return { ok: false, error: \"No usable creative (ads.media[] or media.ogImage)\" };\n" +
  "    }\n" +
  "\n" +
  "    var budget = app.experiment.testBudget;\n" +
  "    if (!budget.durationDays || budget.durationDays <= 0) {\n" +
  "      return { ok: false, error: \"experiment.testBudget.durationDays must be > 0\" };\n" +
  "    }\n" +
  "    if (budget.currency && budget.currency !== \"USD\") {\n" +
  "      return { ok: false, error: \"experiment.testBudget.currency must be USD for V1 cap check\" };\n" +
  "    }\n" +
  "    var dailyBudgetUsd = roundBudget(Number(budget.amount) / Number(budget.durationDays));\n" +
  "    if (dailyBudgetUsd > maxDailyBudgetUsd) {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error:\n" +
  "          \"Daily budget \" +\n" +
  "          dailyBudgetUsd +\n" +
  "          \" USD exceeds MAX_DAILY_BUDGET_USD=\" +\n" +
  "          maxDailyBudgetUsd +\n" +
  "          \" (fail-closed; never clamp)\",\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var idem = checkIdempotency(app, provider);\n" +
  "    if (idem.refused) {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error:\n" +
  "          \"Idempotency refusal: ads.meta already has \" +\n" +
  "          idem.existingFields.join(\", \") +\n" +
  "          \" for runKey \" +\n" +
  "          JSON.stringify(idem.runKey),\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var landingUrl = app.deployment.landing.url;\n" +
  "    var utmQuery = buildUtmQuery(app.ads.utmTemplate);\n" +
  "    var destinationUrl = utmQuery ? landingUrl + \"?\" + utmQuery : landingUrl;\n" +
  "\n" +
  "    return {\n" +
  "      ok: true,\n" +
  "      adPlan: {\n" +
  "        mode: mode,\n" +
  "        provider: provider,\n" +
  "        appId: app.appId,\n" +
  "        experimentRunId: app.analytics && app.analytics.experimentRunId,\n" +
  "        runKey: idem.runKey,\n" +
  "        authorObjective: app.ads.objective || \"traffic\",\n" +
  "        campaignName: app.ads.campaignName,\n" +
  "        callToAction: app.ads.callToAction,\n" +
  "        headlines: app.ads.headlines || [],\n" +
  "        primaryTexts: app.ads.primaryTexts || [],\n" +
  "        descriptions: app.ads.descriptions || [],\n" +
  "        platforms: platforms,\n" +
  "        targeting: {\n" +
  "          locations: targeting.locations,\n" +
  "          ageMin: targeting.ageMin,\n" +
  "          ageMax: targeting.ageMax,\n" +
  "          interests: targeting.interests || null,\n" +
  "        },\n" +
  "        creative: creative,\n" +
  "        landingUrl: landingUrl,\n" +
  "        destinationUrl: destinationUrl,\n" +
  "        budget: {\n" +
  "          currency: budget.currency,\n" +
  "          totalAmount: budget.amount,\n" +
  "          durationDays: budget.durationDays,\n" +
  "          dailyBudgetUsd: dailyBudgetUsd,\n" +
  "        },\n" +
  "        budgetCapCheck: {\n" +
  "          maxDailyBudgetUsd: maxDailyBudgetUsd,\n" +
  "          passed: true,\n" +
  "        },\n" +
  "        wf3Gate: {\n" +
  "          required: true,\n" +
  "          status: config.wf3GateStatus || \"proven\",\n" +
  "          requiredEvents: [\n" +
  "            \"page_view\",\n" +
  "            \"email_captured\",\n" +
  "            \"buy_now_clicked\",\n" +
  "            \"mockup_interacted\",\n" +
  "          ],\n" +
  "        },\n" +
  "        rootStatusPreserved: app.status || null,\n" +
  "      },\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function buildMetaRequests(adPlan, config) {\n" +
  "    config = config || {};\n" +
  "    var metaApiVersion = config.metaApiVersion || DEFAULT_META_API_VERSION;\n" +
  "    var pageId = config.pageId || \"CONFIG_META_PAGE_ID\";\n" +
  "    var dailyBudgetMinor = Math.round(adPlan.budget.dailyBudgetUsd * 100);\n" +
  "    var metaObjective = mapAuthorObjective(adPlan.authorObjective);\n" +
  "\n" +
  "    var adSetTargeting = {\n" +
  "      geo_locations: { countries: mapCountries(adPlan.targeting.locations) },\n" +
  "      age_min: adPlan.targeting.ageMin,\n" +
  "      age_max: adPlan.targeting.ageMax,\n" +
  "      publisher_platforms: adPlan.platforms,\n" +
  "    };\n" +
  "    if (adPlan.targeting.interests && adPlan.targeting.interests.length) {\n" +
  "      adSetTargeting.interests = adPlan.targeting.interests.map(function () {\n" +
  "        return \"VERIFY_INTEREST_ID\";\n" +
  "      });\n" +
  "    }\n" +
  "\n" +
  "    var headline = adPlan.headlines[0];\n" +
  "    var primaryText = adPlan.primaryTexts[0];\n" +
  "    var description = (adPlan.descriptions && adPlan.descriptions[0]) || \"\";\n" +
  "\n" +
  "    return {\n" +
  "      metaApiVersion: metaApiVersion,\n" +
  "      v1Pairing: {\n" +
  "        objective: metaObjective,\n" +
  "        optimization_goal: V1_OPTIMIZATION_GOAL,\n" +
  "        billing_event: V1_BILLING_EVENT,\n" +
  "        note:\n" +
  "          \"LANDING_PAGE_VIEWS is an alternative pending account validation; not V1 default.\",\n" +
  "        alternativeOptimizationGoal: ALT_OPTIMIZATION_GOAL,\n" +
  "      },\n" +
  "      pausedStatuses: {\n" +
  "        campaign: \"PAUSED\",\n" +
  "        adSet: \"PAUSED\",\n" +
  "        creative: \"N/A_ASSET\",\n" +
  "        ad: \"PAUSED\",\n" +
  "      },\n" +
  "      statusForDeliveryEntities: \"PAUSED\",\n" +
  "      neverSendActive: true,\n" +
  "      requests: {\n" +
  "        campaign: {\n" +
  "          name: adPlan.campaignName,\n" +
  "          objective: metaObjective,\n" +
  "          status: \"PAUSED\",\n" +
  "          special_ad_categories: SPECIAL_AD_CATEGORIES.slice(),\n" +
  "        },\n" +
  "        adSet: {\n" +
  "          name: adPlan.campaignName + \"-adset-v1\",\n" +
  "          status: \"PAUSED\",\n" +
  "          daily_budget: dailyBudgetMinor,\n" +
  "          billing_event: V1_BILLING_EVENT,\n" +
  "          optimization_goal: V1_OPTIMIZATION_GOAL,\n" +
  "          targeting: adSetTargeting,\n" +
  "        },\n" +
  "        imageUpload: {\n" +
  "          endpoint: \"POST /act_{META_AD_ACCOUNT_ID}/adimages\",\n" +
  "          source: \"ads.media githubPath or media.ogImage\",\n" +
  "          image_hash: \"VERIFY_AFTER_IMAGE_UPLOAD\",\n" +
  "        },\n" +
  "        creative: {\n" +
  "          name: adPlan.campaignName + \"-creative-a\",\n" +
  "          object_story_spec: {\n" +
  "            page_id: pageId,\n" +
  "            link_data: {\n" +
  "              link: adPlan.destinationUrl,\n" +
  "              message: primaryText,\n" +
  "              name: headline,\n" +
  "              description: description,\n" +
  "              call_to_action: {\n" +
  "                type: adPlan.callToAction,\n" +
  "                value: { link: adPlan.destinationUrl },\n" +
  "              },\n" +
  "              image_hash: \"VERIFY_AFTER_IMAGE_UPLOAD\",\n" +
  "            },\n" +
  "          },\n" +
  "        },\n" +
  "        ad: {\n" +
  "          name: adPlan.campaignName + \"-ad-a\",\n" +
  "          status: \"PAUSED\",\n" +
  "          creative: { creative_id: \"CREATIVE_ID_FROM_CREATE_CREATIVE\" },\n" +
  "        },\n" +
  "      },\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function buildLedgerPlan(adPlan) {\n" +
  "    var operationKey = [adPlan.appId, adPlan.experimentRunId, adPlan.provider].join(\"|\");\n" +
  "    return {\n" +
  "      operationKey: operationKey,\n" +
  "      appId: adPlan.appId,\n" +
  "      experimentRunId: adPlan.experimentRunId,\n" +
  "      provider: adPlan.provider,\n" +
  "      phase: \"planned\",\n" +
  "      campaignId: null,\n" +
  "      adSetId: null,\n" +
  "      imageHash: null,\n" +
  "      creativeId: null,\n" +
  "      adId: null,\n" +
  "      lastError: null,\n" +
  "      reconciliation:\n" +
  "        \"V1: detect existing op → resume if safe → else manual_review_required; no auto-delete\",\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function buildWriteBackPreview(adPlan, ids) {\n" +
  "    ids = ids || {};\n" +
  "    return {\n" +
  "      ads: {\n" +
  "        meta: {\n" +
  "          status: \"created_paused\",\n" +
  "          campaignId: ids.campaignId || \"<campaign-id>\",\n" +
  "          adSetId: ids.adSetId || \"<ad-set-id>\",\n" +
  "          creativeId: ids.creativeId || \"<creative-id>\",\n" +
  "          adId: ids.adId || \"<ad-id>\",\n" +
  "          landingUrl: adPlan.destinationUrl,\n" +
  "          dailyBudget: adPlan.budget.dailyBudgetUsd,\n" +
  "          createdAt: ids.createdAt || \"<iso8601>\",\n" +
  "          lastSyncedAt: null,\n" +
  "        },\n" +
  "      },\n" +
  "      rootStatusUnchanged: true,\n" +
  "      rootStatusNote:\n" +
  "        \"Preserve existing root status (e.g. ready). Set validating only after human-approved activation.\",\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function buildDryRunBundle(app, config) {\n" +
  "    config = config || {};\n" +
  "    var planResult = buildAdPlan(app, config);\n" +
  "    if (!planResult.ok) {\n" +
  "      return planResult;\n" +
  "    }\n" +
  "    var adPlan = planResult.adPlan;\n" +
  "    var meta = buildMetaRequests(adPlan, config);\n" +
  "    var ledgerPlan = buildLedgerPlan(adPlan);\n" +
  "    var writeBackPreview = buildWriteBackPreview(adPlan);\n" +
  "\n" +
  "    return {\n" +
  "      ok: true,\n" +
  "      bundle: {\n" +
  "        mode: adPlan.mode,\n" +
  "        appId: adPlan.appId,\n" +
  "        provider: adPlan.provider,\n" +
  "        runKey: adPlan.runKey,\n" +
  "        metaApiVersion: meta.metaApiVersion,\n" +
  "        adAccountIdRef: \"n8n.config.META_AD_ACCOUNT_ID\",\n" +
  "        pageIdRef: \"n8n.config.META_PAGE_ID\",\n" +
  "        wf3Gate: adPlan.wf3Gate,\n" +
  "        adPlan: {\n" +
  "          authorObjective: adPlan.authorObjective,\n" +
  "          campaignName: adPlan.campaignName,\n" +
  "          platforms: adPlan.platforms,\n" +
  "          targeting: adPlan.targeting,\n" +
  "          budget: adPlan.budget,\n" +
  "          destinationUrl: adPlan.destinationUrl,\n" +
  "          rootStatusPreserved: adPlan.rootStatusPreserved,\n" +
  "        },\n" +
  "        source: {\n" +
  "          landingUrl: adPlan.landingUrl,\n" +
  "          creative: {\n" +
  "            kind: adPlan.creative.kind,\n" +
  "            value: adPlan.creative.value,\n" +
  "            role: adPlan.creative.role,\n" +
  "            resolvedFrom: adPlan.creative.source,\n" +
  "          },\n" +
  "        },\n" +
  "        computed: {\n" +
  "          destinationUrl: adPlan.destinationUrl,\n" +
  "          dailyBudget: adPlan.budget.dailyBudgetUsd,\n" +
  "          currency: adPlan.budget.currency,\n" +
  "          totalBudget: adPlan.budget.totalAmount,\n" +
  "          durationDays: adPlan.budget.durationDays,\n" +
  "          pausedStatuses: meta.pausedStatuses,\n" +
  "          statusForDeliveryEntities: meta.statusForDeliveryEntities,\n" +
  "        },\n" +
  "        budgetCapCheck: adPlan.budgetCapCheck,\n" +
  "        v1Pairing: meta.v1Pairing,\n" +
  "        requests: meta.requests,\n" +
  "        ledgerPlan: ledgerPlan,\n" +
  "        writeBackAfterCreatePausedOnly: writeBackPreview,\n" +
  "        safety: {\n" +
  "          externalWritePerformed: false,\n" +
  "          liveAdsCreated: false,\n" +
  "          spendPossible: false,\n" +
  "          requiresExplicitApprovalBeforeCreatePaused: true,\n" +
  "          neverSendActive: true,\n" +
  "          tripleApprovalRequired: {\n" +
  "            mode: \"create_paused\",\n" +
  "            approval: true,\n" +
  "            approvalToken: \"WF4_CREATE_PAUSED_APPROVAL_TOKEN\",\n" +
  "          },\n" +
  "        },\n" +
  "      },\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  exports.PROVIDER = PROVIDER;\n" +
  "  exports.DEFAULT_META_API_VERSION = DEFAULT_META_API_VERSION;\n" +
  "  exports.DEFAULT_MAX_DAILY_BUDGET_USD = DEFAULT_MAX_DAILY_BUDGET_USD;\n" +
  "  exports.OBJECTIVE_MAPPING = OBJECTIVE_MAPPING;\n" +
  "  exports.V1_OPTIMIZATION_GOAL = V1_OPTIMIZATION_GOAL;\n" +
  "  exports.V1_BILLING_EVENT = V1_BILLING_EVENT;\n" +
  "  exports.ALT_OPTIMIZATION_GOAL = ALT_OPTIMIZATION_GOAL;\n" +
  "  exports.SPECIAL_AD_CATEGORIES = SPECIAL_AD_CATEGORIES;\n" +
  "  exports.buildAdPlan = buildAdPlan;\n" +
  "  exports.buildMetaRequests = buildMetaRequests;\n" +
  "  exports.buildLedgerPlan = buildLedgerPlan;\n" +
  "  exports.buildWriteBackPreview = buildWriteBackPreview;\n" +
  "  exports.buildDryRunBundle = buildDryRunBundle;\n" +
  "  exports.mapAuthorObjective = mapAuthorObjective;\n" +
  "  exports.selectCreative = selectCreative;\n" +
  "  exports.checkIdempotency = checkIdempotency;\n" +
  "})(__wf4Exports);\n" +
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
  "return [{ json: Object.assign({}, input, { bundle: result.bundle, tripleApproved: tripleApproved, _createPausedAllowed: false }) }];\n" +
  "";

const respondDryRunCode =
  "const item = $input.first().json;\n" +
  "return [{ json: { ok: true, mode: 'dry_run', bundle: item.bundle, safety: item.bundle.safety, runKey: item.bundle.runKey, externalWritePerformed: false, metaHttpCalls: 0, driveWrites: 0 } }];";

const createPausedBlockedCode =
  "throw new Error('CREATE_PAUSED_DISABLED: Meta mutations are not enabled in this sandbox pass. Configure credentials, replace VERIFY_* values, and obtain explicit operator approval.');";

const fixtureAppJson = JSON.stringify({
  specVersion: '1.5.0',
  appId: 'human-lab-wf1-sandbox',
  status: 'ready',
  ads: {
    campaignName: 'human-lab-validation',
    objective: 'traffic',
    platforms: ['facebook', 'instagram'],
    headlines: ['Stop guessing. Start testing.'],
    primaryTexts: ['Discover what actually works for your stress, sleep, and habits.'],
    descriptions: ['Human Lab turns self-improvement into structured experiments.'],
    callToAction: 'SIGN_UP',
    utmTemplate: { source: 'facebook', medium: 'paid_social', campaign: 'human-lab-validation' },
    targeting: { locations: ['United States'], ageMin: 25, ageMax: 55 },
    meta: { status: null, campaignId: null, adSetId: null, creativeId: null, adId: null, landingUrl: null, dailyBudget: null, createdAt: null, lastSyncedAt: null },
    media: [{ githubPath: 'media/og-image.png', role: 'primary' }],
  },
  media: { ogImage: { githubPath: 'media/og-image.png' } },
  analytics: { experimentRunId: 'run_human-lab_2026q2_001' },
  experiment: { testBudget: { currency: 'USD', amount: 14, durationDays: 14 } },
  deployment: { landing: { url: 'https://human-lab-wf2-sandbox.vercel.app' } },
});

const manualRun = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Run' },
});

const workflowConfig = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Workflow Config',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          { id: 'mode', name: 'mode', value: 'dry_run', type: 'string' },
          { id: 'approval', name: 'approval', value: false, type: 'boolean' },
          { id: 'approvalToken', name: 'approvalToken', value: '', type: 'string' },
          { id: 'provider', name: 'provider', value: 'meta', type: 'string' },
          { id: 'metaApiVersion', name: 'metaApiVersion', value: 'v25.0', type: 'string' },
          { id: 'MAX_DAILY_BUDGET_USD', name: 'MAX_DAILY_BUDGET_USD', value: 10, type: 'number' },
          { id: 'wf3GateStatus', name: 'wf3GateStatus', value: 'proven', type: 'string' },
          { id: 'useFixtureAppJson', name: 'useFixtureAppJson', value: true, type: 'boolean' },
          { id: 'fixtureAppJson', name: 'fixtureAppJson', value: fixtureAppJson, type: 'string' },
          { id: 'wf4CreatePausedApprovalToken', name: 'wf4CreatePausedApprovalToken', value: '', type: 'string' },
          { id: 'appId', name: 'appId', value: 'human-lab-wf1-sandbox', type: 'string' },
        ],
      },
    },
  },
});

const processWf4 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Process WF4 Dry Run',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: processWf4Code,
    },
  },
});

const tripleApprovalGate = ifElse({
  version: 2.3,
  config: {
    name: 'Triple Approval Gate',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          {
            id: 'triple-approved',
            leftValue: expr('{{ $json.tripleApproved === true && $json._createPausedAllowed === true }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true' },
          },
        ],
      },
      looseTypeValidation: true,
    },
  },
});

const respondDryRun = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Respond Dry Run',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: respondDryRunCode,
    },
  },
});

const createPausedBlocked = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Create Paused Blocked',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: createPausedBlockedCode,
    },
  },
});

const createCampaignPaused = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Create Campaign PAUSED',
    disabled: true,
    parameters: {
      method: 'POST',
      url: 'https://graph.facebook.com/v25.0/act_VERIFY/META_AD_ACCOUNT_ID/campaigns',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.bundle.requests.campaign) }}',
    },
  },
});

export default workflow('wf4-meta-ads-sandbox', 'WF4 - Meta Ads Sandbox')
  .add(manualRun)
  .to(workflowConfig)
  .to(processWf4)
  .to(
    tripleApprovalGate
      .onTrue(createPausedBlocked.to(createCampaignPaused))
      .onFalse(respondDryRun)
  );
