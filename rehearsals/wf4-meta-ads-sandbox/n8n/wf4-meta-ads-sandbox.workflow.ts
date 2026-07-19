import {
  workflow,
  node,
  trigger,
  ifElse,
  expr,
  newCredential,
} from '@n8n/workflow-sdk';

/** Live n8n Data Table — WF4 Operation Ledger (created 2026-07-16). */
const WF4_OPERATION_LEDGER_TABLE_ID = 'Yys4vVmQGk8fTxag';
const META_AD_ACCOUNT_ID = 'act_979257825150251';
const META_GRAPH_BASE = `https://graph.facebook.com/v25.0/${META_AD_ACCOUNT_ID}`;
const metaCredential = newCredential('Meta Marketing API - Orro');

const ledgerTableRl = {
  __rl: true as const,
  mode: 'id' as const,
  value: WF4_OPERATION_LEDGER_TABLE_ID,
  cachedResultName: 'WF4 Operation Ledger',
};

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
  "  var DEFAULT_MAX_DAILY_BUDGET_USD = 2;\n" +
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
  "  /** V1 image creative extensions only (no video). */\n" +
  "  var IMAGE_EXTENSIONS = {\n" +
  "    png: \"image/png\",\n" +
  "    jpg: \"image/jpeg\",\n" +
  "    jpeg: \"image/jpeg\",\n" +
  "    gif: \"image/gif\",\n" +
  "    webp: \"image/webp\",\n" +
  "  };\n" +
  "\n" +
  "  function roundBudget(value) {\n" +
  "    return Math.round(value * 100) / 100;\n" +
  "  }\n" +
  "\n" +
  "  function normalizeGithubRepo(raw) {\n" +
  "    if (!raw || typeof raw !== \"string\") return null;\n" +
  "    var s = raw.trim();\n" +
  "    s = s.replace(/^https?:\\/\\/github\\.com\\//i, \"\");\n" +
  "    s = s.replace(/\\.git$/i, \"\");\n" +
  "    s = s.replace(/\\/+$/, \"\");\n" +
  "    var parts = s.split(\"/\");\n" +
  "    if (parts.length < 2 || !parts[0] || !parts[1]) return null;\n" +
  "    return parts[0] + \"/\" + parts[1];\n" +
  "  }\n" +
  "\n" +
  "  function filenameFromPath(p) {\n" +
  "    var parts = String(p || \"\").split(\"/\");\n" +
  "    return parts[parts.length - 1] || \"\";\n" +
  "  }\n" +
  "\n" +
  "  function extensionOf(filename) {\n" +
  "    var m = String(filename || \"\")\n" +
  "      .toLowerCase()\n" +
  "      .match(/\\.([a-z0-9]+)$/);\n" +
  "    return m ? m[1] : \"\";\n" +
  "  }\n" +
  "\n" +
  "  /**\n" +
  "   * Generic creative binary resolution for any app package.\n" +
  "   * Reads ads.media[] / media.ogImage + source.assetsGithubRepo ?? source.mockupGithubRepo.\n" +
  "   * Does not hardcode app ids, repos, or filenames.\n" +
  "   */\n" +
  "  function resolveCreativeSource(app, creative) {\n" +
  "    if (!creative || !creative.kind || !creative.value) {\n" +
  "      return { ok: false, error: \"CREATIVE_PATH_MISSING: no usable creative value\" };\n" +
  "    }\n" +
  "\n" +
  "    if (creative.kind === \"url\") {\n" +
  "      var urlValue = String(creative.value).trim();\n" +
  "      if (!/^https:\\/\\//i.test(urlValue)) {\n" +
  "        return { ok: false, error: \"CREATIVE_DOWNLOAD_FAILED: creative url must be HTTPS\" };\n" +
  "      }\n" +
  "      var urlFilename = filenameFromPath(urlValue.split(\"?\")[0]);\n" +
  "      var urlExt = extensionOf(urlFilename);\n" +
  "      if (!IMAGE_EXTENSIONS[urlExt]) {\n" +
  "        return {\n" +
  "          ok: false,\n" +
  "          error:\n" +
  "            \"CREATIVE_UNSUPPORTED_TYPE: expected image extension (png/jpg/jpeg/gif/webp), got \" +\n" +
  "            (urlExt || \"none\"),\n" +
  "        };\n" +
  "      }\n" +
  "      return {\n" +
  "        ok: true,\n" +
  "        resolved: {\n" +
  "          kind: \"url\",\n" +
  "          value: urlValue,\n" +
  "          role: creative.role || \"primary\",\n" +
  "          resolvedFrom: creative.source,\n" +
  "          repo: null,\n" +
  "          branch: null,\n" +
  "          githubPath: null,\n" +
  "          url: urlValue,\n" +
  "          downloadUrl: urlValue,\n" +
  "          filename: urlFilename,\n" +
  "          expectedMime: IMAGE_EXTENSIONS[urlExt],\n" +
  "          expectedMimeFamily: \"image\",\n" +
  "          resolutionMethod: \"direct_url\",\n" +
  "        },\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    if (creative.kind !== \"githubPath\") {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error: \"CREATIVE_UNSUPPORTED_TYPE: unsupported creative kind \" + creative.kind,\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var githubPath = String(creative.value).trim().replace(/^\\/+/, \"\");\n" +
  "    if (!githubPath) {\n" +
  "      return { ok: false, error: \"CREATIVE_PATH_MISSING: githubPath is empty\" };\n" +
  "    }\n" +
  "\n" +
  "    var filename = filenameFromPath(githubPath);\n" +
  "    var ext = extensionOf(filename);\n" +
  "    if (!IMAGE_EXTENSIONS[ext]) {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error:\n" +
  "          \"CREATIVE_UNSUPPORTED_TYPE: expected image extension (png/jpg/jpeg/gif/webp), got \" +\n" +
  "          (ext || \"none\"),\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var source = (app && app.source) || {};\n" +
  "    var repoRaw = source.assetsGithubRepo || source.mockupGithubRepo;\n" +
  "    if (!repoRaw) {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error:\n" +
  "          \"CREATIVE_REPO_UNRESOLVED: set source.assetsGithubRepo or source.mockupGithubRepo for githubPath creatives\",\n" +
  "      };\n" +
  "    }\n" +
  "    var repo = normalizeGithubRepo(repoRaw);\n" +
  "    if (!repo) {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error: \"CREATIVE_REPO_INVALID: expected owner/repo, got \" + String(repoRaw),\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var branch = String(source.assetsBranch || source.mockupBranch || \"main\").trim() || \"main\";\n" +
  "    var downloadUrl =\n" +
  "      \"https://raw.githubusercontent.com/\" +\n" +
  "      repo +\n" +
  "      \"/\" +\n" +
  "      encodeURIComponent(branch).replace(/%2F/gi, \"/\") +\n" +
  "      \"/\" +\n" +
  "      githubPath\n" +
  "        .split(\"/\")\n" +
  "        .map(function (seg) {\n" +
  "          return encodeURIComponent(seg);\n" +
  "        })\n" +
  "        .join(\"/\");\n" +
  "\n" +
  "    return {\n" +
  "      ok: true,\n" +
  "      resolved: {\n" +
  "        kind: \"githubPath\",\n" +
  "        value: githubPath,\n" +
  "        role: creative.role || \"primary\",\n" +
  "        resolvedFrom: creative.source,\n" +
  "        repo: repo,\n" +
  "        branch: branch,\n" +
  "        githubPath: githubPath,\n" +
  "        url: null,\n" +
  "        downloadUrl: downloadUrl,\n" +
  "        filename: filename,\n" +
  "        expectedMime: IMAGE_EXTENSIONS[ext],\n" +
  "        expectedMimeFamily: \"image\",\n" +
  "        resolutionMethod: \"github_raw\",\n" +
  "      },\n" +
  "    };\n" +
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
  "    var creativeResolved = resolveCreativeSource(app, creative);\n" +
  "    if (!creativeResolved.ok) {\n" +
  "      return { ok: false, error: creativeResolved.error };\n" +
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
  "        creativeResolved: creativeResolved.resolved,\n" +
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
  "    var adAccountId = config.adAccountId || \"act_{META_AD_ACCOUNT_ID}\";\n" +
  "    var instagramUserId = config.instagramUserId || null;\n" +
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
  "    var objectStorySpec = {\n" +
  "      page_id: pageId,\n" +
  "      link_data: {\n" +
  "        link: adPlan.destinationUrl,\n" +
  "        message: primaryText,\n" +
  "        name: headline,\n" +
  "        description: description,\n" +
  "        call_to_action: {\n" +
  "          type: adPlan.callToAction,\n" +
  "          value: { link: adPlan.destinationUrl },\n" +
  "        },\n" +
  "        image_hash: \"VERIFY_AFTER_IMAGE_UPLOAD\",\n" +
  "      },\n" +
  "    };\n" +
  "    if (\n" +
  "      instagramUserId &&\n" +
  "      adPlan.platforms &&\n" +
  "      adPlan.platforms.indexOf(\"instagram\") !== -1\n" +
  "    ) {\n" +
  "      objectStorySpec.instagram_user_id = instagramUserId;\n" +
  "    }\n" +
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
  "          endpoint: \"POST /\" + adAccountId + \"/adimages\",\n" +
  "          source: \"ads.media githubPath or media.ogImage\",\n" +
  "          image_hash: \"VERIFY_AFTER_IMAGE_UPLOAD\",\n" +
  "          resolutionMethod: adPlan.creativeResolved\n" +
  "            ? adPlan.creativeResolved.resolutionMethod\n" +
  "            : null,\n" +
  "          downloadUrl: adPlan.creativeResolved\n" +
  "            ? adPlan.creativeResolved.downloadUrl\n" +
  "            : null,\n" +
  "          filename: adPlan.creativeResolved ? adPlan.creativeResolved.filename : null,\n" +
  "          repo: adPlan.creativeResolved ? adPlan.creativeResolved.repo : null,\n" +
  "          branch: adPlan.creativeResolved ? adPlan.creativeResolved.branch : null,\n" +
  "          githubPath: adPlan.creativeResolved\n" +
  "            ? adPlan.creativeResolved.githubPath\n" +
  "            : null,\n" +
  "          expectedMime: adPlan.creativeResolved\n" +
  "            ? adPlan.creativeResolved.expectedMime\n" +
  "            : null,\n" +
  "          expectedMimeFamily: \"image\",\n" +
  "        },\n" +
  "        creative: {\n" +
  "          name: adPlan.campaignName + \"-creative-a\",\n" +
  "          object_story_spec: objectStorySpec,\n" +
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
  "        metaAccountConfig: {\n" +
  "          META_BUSINESS_PORTFOLIO_ID: config.businessPortfolioId || null,\n" +
  "          META_AD_ACCOUNT_ID: config.adAccountId || null,\n" +
  "          META_PAGE_ID: config.pageId || null,\n" +
  "          META_INSTAGRAM_USER_ID: config.instagramUserId || null,\n" +
  "        },\n" +
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
  "            kind: adPlan.creativeResolved.kind,\n" +
  "            value: adPlan.creativeResolved.value,\n" +
  "            role: adPlan.creativeResolved.role,\n" +
  "            resolvedFrom: adPlan.creativeResolved.resolvedFrom,\n" +
  "            repo: adPlan.creativeResolved.repo,\n" +
  "            branch: adPlan.creativeResolved.branch,\n" +
  "            githubPath: adPlan.creativeResolved.githubPath,\n" +
  "            url: adPlan.creativeResolved.url,\n" +
  "            downloadUrl: adPlan.creativeResolved.downloadUrl,\n" +
  "            filename: adPlan.creativeResolved.filename,\n" +
  "            expectedMime: adPlan.creativeResolved.expectedMime,\n" +
  "            expectedMimeFamily: adPlan.creativeResolved.expectedMimeFamily,\n" +
  "            resolutionMethod: adPlan.creativeResolved.resolutionMethod,\n" +
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
  "  exports.resolveCreativeSource = resolveCreativeSource;\n" +
  "  exports.checkIdempotency = checkIdempotency;\n" +
  "  exports.IMAGE_EXTENSIONS = IMAGE_EXTENSIONS;\n" +
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
  "const tripleApproved = mode === 'create_paused' && approval === true && approvalToken && configToken && approvalToken === configToken;\n" +
  "return [{ json: Object.assign({}, input, { bundle: result.bundle, tripleApproved: tripleApproved, _createPausedAllowed: false }) }];\n" +
  "";

const respondDryRunCode =
  "const item = $input.first().json;\n" +
  "return [{ json: { ok: true, mode: 'dry_run', bundle: item.bundle, safety: item.bundle.safety, runKey: item.bundle.runKey, externalWritePerformed: false, metaHttpCalls: 0, driveWrites: 0 } }];";

const createPausedBlockedCode =
  "const item = $input.first().json;\n" +
  "if (item._createPausedAllowed !== true) {\n" +
  "  throw new Error('CREATE_PAUSED_DISABLED: Meta mutations are not enabled. Keep create nodes disabled until explicit operator approval.');\n" +
  "}\n" +
  "return [{ json: item }];";

const ledgerIdempotencyCode =
  "const item = $('Create Paused Blocked').first().json;\n" +
  "const rows = $input.all().map(function (i) { return i.json; }).filter(function (r) {\n" +
  "  return r && (r.operationKey || r.phase);\n" +
  "});\n" +
  "const ledgerRow = rows[0] || null;\n" +
  "const hasLedger = Boolean(ledgerRow);\n" +
  "if (hasLedger) {\n" +
  "  const phase = String(ledgerRow.phase || '');\n" +
  "  const ids = ['campaignId','adSetId','creativeId','adId'].filter(function (f) {\n" +
  "    return ledgerRow[f] != null && String(ledgerRow[f]).trim() !== '';\n" +
  "  });\n" +
  "  if (phase === 'verified' || phase === 'writeback_done' || ids.length === 4) {\n" +
  "    throw new Error('LEDGER_IDEMPOTENCY_REFUSE: operation already verified for ' + (item.bundle && item.bundle.ledgerPlan && item.bundle.ledgerPlan.operationKey));\n" +
  "  }\n" +
  "  if (ids.length > 0 || (phase && phase !== 'planned')) {\n" +
  "    throw new Error('LEDGER_MANUAL_REVIEW_REQUIRED: partial ledger row phase=' + phase + ' ids=' + ids.join(','));\n" +
  "  }\n" +
  "}\n" +
  "return [{ json: Object.assign({}, item, { ledgerExisting: hasLedger ? ledgerRow : null, ledgerAction: 'upsert_planned' }) }];";

const mergeAfterCampaignCode =
  "const prev = $('Ledger Idempotency Check').first().json;\n" +
  "const created = $input.first().json;\n" +
  "const campaignId = created.id || created.campaign_id;\n" +
  "if (!campaignId) throw new Error('Create Campaign PAUSED returned no id');\n" +
  "return [{ json: Object.assign({}, prev, { metaCreate: Object.assign({}, prev.metaCreate || {}, { campaignId: String(campaignId) }) }) }];";

const mergeAfterAdSetCode =
  "const prev = $('Merge Campaign Id').first().json;\n" +
  "const created = $input.first().json;\n" +
  "const adSetId = created.id || created.adset_id;\n" +
  "if (!adSetId) throw new Error('Create Ad Set PAUSED returned no id');\n" +
  "return [{ json: Object.assign({}, prev, { metaCreate: Object.assign({}, prev.metaCreate || {}, { adSetId: String(adSetId) }) }) }];";

const resolveCreativeDownloadPlanCode =
  "const prev = $('Merge AdSet Id').first().json;\n" +
  "const creative = prev.bundle && prev.bundle.source && prev.bundle.source.creative;\n" +
  "const imageUpload = prev.bundle && prev.bundle.requests && prev.bundle.requests.imageUpload;\n" +
  "if (!creative || !creative.downloadUrl) {\n" +
  "  throw new Error('CREATIVE_REPO_UNRESOLVED: bundle.source.creative.downloadUrl missing');\n" +
  "}\n" +
  "if (!creative.filename) {\n" +
  "  throw new Error('CREATIVE_PATH_MISSING: bundle.source.creative.filename missing');\n" +
  "}\n" +
  "if (creative.expectedMimeFamily !== 'image') {\n" +
  "  throw new Error('CREATIVE_UNSUPPORTED_TYPE: expectedMimeFamily must be image');\n" +
  "}\n" +
  "if (creative.kind === 'githubPath' && !creative.repo) {\n" +
  "  throw new Error('CREATIVE_REPO_UNRESOLVED: githubPath creative missing repo');\n" +
  "}\n" +
  "const plan = {\n" +
  "  downloadUrl: creative.downloadUrl,\n" +
  "  filename: creative.filename,\n" +
  "  expectedMime: creative.expectedMime || (imageUpload && imageUpload.expectedMime) || null,\n" +
  "  expectedMimeFamily: 'image',\n" +
  "  resolutionMethod: creative.resolutionMethod,\n" +
  "  repo: creative.repo || null,\n" +
  "  branch: creative.branch || null,\n" +
  "  githubPath: creative.githubPath || null,\n" +
  "  kind: creative.kind,\n" +
  "};\n" +
  "return [{ json: Object.assign({}, prev, { creativeDownloadPlan: plan }) }];";

const validateCreativeBinaryCode =
  "const prev = $('Resolve Creative Download Plan').first().json;\n" +
  "const item = $input.first();\n" +
  "const plan = prev.creativeDownloadPlan;\n" +
  "const binary = item.binary && (item.binary.data || item.binary[Object.keys(item.binary)[0]]);\n" +
  "if (!binary) {\n" +
  "  throw new Error('CREATIVE_BINARY_EMPTY: download returned no binary');\n" +
  "}\n" +
  "const mime = String(binary.mimeType || binary.fileType || '').toLowerCase();\n" +
  "const fileName = binary.fileName || plan.filename;\n" +
  "const allowed = ['image/png','image/jpeg','image/jpg','image/gif','image/webp'];\n" +
  "const looksImage = mime.indexOf('image/') === 0 || allowed.indexOf(mime) !== -1;\n" +
  "if (mime && !looksImage) {\n" +
  "  throw new Error('CREATIVE_NOT_IMAGE: content-type=' + mime);\n" +
  "}\n" +
  "if (plan.expectedMime && mime && mime !== 'image/jpg' && mime !== plan.expectedMime && !(plan.expectedMime === 'image/jpeg' && mime === 'image/jpg')) {\n" +
  "  // Soft mismatch: still require image/*; exact MIME may vary by CDN.\n" +
  "  if (mime.indexOf('image/') !== 0) {\n" +
  "    throw new Error('CREATIVE_NOT_IMAGE: expected ' + plan.expectedMime + ' got ' + mime);\n" +
  "  }\n" +
  "}\n" +
  "let byteSize = 0;\n" +
  "if (typeof binary.fileSize === 'number') byteSize = binary.fileSize;\n" +
  "else if (binary.data && typeof binary.data === 'string' && binary.data.length > 0) {\n" +
  "  byteSize = binary.data.length;\n" +
  "}\n" +
  "if (!(byteSize > 0)) {\n" +
  "  throw new Error('CREATIVE_BINARY_EMPTY: downloaded image has zero bytes');\n" +
  "}\n" +
  "const meta = {\n" +
  "  filename: fileName || plan.filename,\n" +
  "  mimeType: mime || plan.expectedMime || 'image/png',\n" +
  "  byteSize: byteSize || null,\n" +
  "  downloadUrl: plan.downloadUrl,\n" +
  "  resolutionMethod: plan.resolutionMethod,\n" +
  "};\n" +
  "return [{\n" +
  "  json: Object.assign({}, prev, {\n" +
  "    metaCreate: Object.assign({}, prev.metaCreate || {}, { creativeBinaryMeta: meta }),\n" +
  "  }),\n" +
  "  binary: item.binary,\n" +
  "}];";

const mergeAfterImageCode =
  "const prev = $('Validate Creative Binary').first().json;\n" +
  "const created = $input.first().json;\n" +
  "let imageHash = null;\n" +
  "if (created.images) {\n" +
  "  const keys = Object.keys(created.images);\n" +
  "  if (keys.length) imageHash = created.images[keys[0]].hash || null;\n" +
  "}\n" +
  "imageHash = imageHash || created.hash || created.image_hash;\n" +
  "if (!imageHash) throw new Error('Upload Ad Image returned no image_hash');\n" +
  "return [{ json: Object.assign({}, prev, { metaCreate: Object.assign({}, prev.metaCreate || {}, { imageHash: String(imageHash) }) }) }];";

const mergeAfterCreativeCode =
  "const prev = $('Merge Image Hash').first().json;\n" +
  "const created = $input.first().json;\n" +
  "const creativeId = created.id || created.creative_id;\n" +
  "if (!creativeId) throw new Error('Create Creative returned no id');\n" +
  "return [{ json: Object.assign({}, prev, { metaCreate: Object.assign({}, prev.metaCreate || {}, { creativeId: String(creativeId) }) }) }];";

const prepareLedgerVerifiedCode =
  "const prev = $('Merge Creative Id').first().json;\n" +
  "const created = $input.first().json;\n" +
  "const adId = created.id || created.ad_id;\n" +
  "if (!adId) throw new Error('Create Ad PAUSED returned no id');\n" +
  "const mc = Object.assign({}, prev.metaCreate || {}, { adId: String(adId) });\n" +
  "const plan = (prev.bundle && prev.bundle.ledgerPlan) || {};\n" +
  "return [{ json: Object.assign({}, prev, {\n" +
  "  metaCreate: mc,\n" +
  "  ledgerUpsert: {\n" +
  "    operationKey: plan.operationKey,\n" +
  "    appId: plan.appId,\n" +
  "    experimentRunId: plan.experimentRunId,\n" +
  "    provider: plan.provider || 'meta',\n" +
  "    phase: 'verified',\n" +
  "    campaignId: mc.campaignId || '',\n" +
  "    adSetId: mc.adSetId || '',\n" +
  "    imageHash: mc.imageHash || '',\n" +
  "    creativeId: mc.creativeId || '',\n" +
  "    adId: mc.adId || '',\n" +
  "    lastError: '',\n" +
  "  }\n" +
  "}) }];";

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
  source: {
    mockupGithubRepo: 'scootero/Human-Lab-WF1-Sandbox',
    mockupBranch: 'main',
  },
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
          { id: 'META_API_VERSION', name: 'META_API_VERSION', value: 'v25.0', type: 'string' },
          { id: 'MAX_DAILY_BUDGET_USD', name: 'MAX_DAILY_BUDGET_USD', value: 2, type: 'number' },
          { id: 'META_BUSINESS_PORTFOLIO_ID', name: 'META_BUSINESS_PORTFOLIO_ID', value: '1074341285117707', type: 'string' },
          { id: 'META_AD_ACCOUNT_ID', name: 'META_AD_ACCOUNT_ID', value: 'act_979257825150251', type: 'string' },
          { id: 'META_PAGE_ID', name: 'META_PAGE_ID', value: '1237104852815793', type: 'string' },
          { id: 'META_INSTAGRAM_USER_ID', name: 'META_INSTAGRAM_USER_ID', value: '17841440875992246', type: 'string' },
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

const ledgerLookup = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Ledger Lookup',
    disabled: true,
    alwaysOutputData: true,
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: ledgerTableRl,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: expr('{{ $json.bundle.ledgerPlan.operationKey }}'),
          },
        ],
      },
      returnAll: true,
    },
  },
});

const ledgerIdempotencyCheck = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Ledger Idempotency Check',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: ledgerIdempotencyCode,
    },
  },
});

const ledgerUpsertPlanned = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Ledger Upsert Planned',
    disabled: true,
    parameters: {
      resource: 'row',
      operation: 'upsert',
      dataTableId: ledgerTableRl,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: expr('{{ $json.bundle.ledgerPlan.operationKey }}'),
          },
        ],
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['operationKey'],
        value: {
          operationKey: expr('{{ $json.bundle.ledgerPlan.operationKey }}'),
          appId: expr('{{ $json.bundle.ledgerPlan.appId }}'),
          experimentRunId: expr('{{ $json.bundle.ledgerPlan.experimentRunId }}'),
          provider: expr('{{ $json.bundle.ledgerPlan.provider }}'),
          phase: 'planned',
          campaignId: '',
          adSetId: '',
          imageHash: '',
          creativeId: '',
          adId: '',
          lastError: '',
        },
      },
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
      url: `${META_GRAPH_BASE}/campaigns`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($(\'Ledger Idempotency Check\').item.json.bundle.requests.campaign) }}'),
    },
    credentials: {
      facebookGraphApi: metaCredential,
    },
  },
});

const mergeCampaignId = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge Campaign Id',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergeAfterCampaignCode,
    },
  },
});

const createAdSetPaused = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Create Ad Set PAUSED',
    disabled: true,
    parameters: {
      method: 'POST',
      url: `${META_GRAPH_BASE}/adsets`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr(
        "{{ JSON.stringify(Object.assign({}, $('Merge Campaign Id').item.json.bundle.requests.adSet, { campaign_id: $('Merge Campaign Id').item.json.metaCreate.campaignId })) }}"
      ),
    },
    credentials: {
      facebookGraphApi: metaCredential,
    },
  },
});

const mergeAdSetId = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge AdSet Id',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergeAfterAdSetCode,
    },
  },
});

const resolveCreativeDownloadPlan = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resolve Creative Download Plan',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: resolveCreativeDownloadPlanCode,
    },
  },
});

const downloadCreativeBinary = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Download Creative Binary',
    disabled: true,
    parameters: {
      method: 'GET',
      url: expr(
        "{{ $('Resolve Creative Download Plan').item.json.creativeDownloadPlan.downloadUrl }}"
      ),
      authentication: 'none',
      options: {
        response: {
          response: {
            responseFormat: 'file',
            outputPropertyName: 'data',
          },
        },
      },
    },
  },
});

const validateCreativeBinary = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validate Creative Binary',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: validateCreativeBinaryCode,
    },
  },
});

const uploadAdImage = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Upload Ad Image',
    disabled: true,
    parameters: {
      method: 'POST',
      url: `${META_GRAPH_BASE}/adimages`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      // Binary from Download Creative Binary → Validate Creative Binary (not a creative URL pass-through).
      sendBody: true,
      contentType: 'multipart-form-data',
      bodyParameters: {
        parameters: [
          {
            parameterType: 'formBinaryData',
            name: 'filename',
            inputDataFieldName: 'data',
          },
        ],
      },
    },
    credentials: {
      facebookGraphApi: metaCredential,
    },
  },
});

const mergeImageHash = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge Image Hash',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergeAfterImageCode,
    },
  },
});

const createCreative = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Create Creative',
    disabled: true,
    parameters: {
      method: 'POST',
      url: `${META_GRAPH_BASE}/adcreatives`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr(
        "{{ JSON.stringify((function () { var c = JSON.parse(JSON.stringify($('Merge Image Hash').item.json.bundle.requests.creative)); c.object_story_spec.link_data.image_hash = $('Merge Image Hash').item.json.metaCreate.imageHash; return c; })()) }}"
      ),
    },
    credentials: {
      facebookGraphApi: metaCredential,
    },
  },
});

const mergeCreativeId = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge Creative Id',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergeAfterCreativeCode,
    },
  },
});

const createAdPaused = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Create Ad PAUSED',
    disabled: true,
    parameters: {
      method: 'POST',
      url: `${META_GRAPH_BASE}/ads`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr(
        "{{ JSON.stringify({ name: $('Merge Creative Id').item.json.bundle.requests.ad.name, status: 'PAUSED', adset_id: $('Merge Creative Id').item.json.metaCreate.adSetId, creative: { creative_id: $('Merge Creative Id').item.json.metaCreate.creativeId } }) }}"
      ),
    },
    credentials: {
      facebookGraphApi: metaCredential,
    },
  },
});

const prepareLedgerVerified = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Ledger Verified',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: prepareLedgerVerifiedCode,
    },
  },
});

const ledgerMarkVerified = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Ledger Mark Verified',
    disabled: true,
    parameters: {
      resource: 'row',
      operation: 'upsert',
      dataTableId: ledgerTableRl,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: expr('{{ $json.ledgerUpsert.operationKey }}'),
          },
        ],
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['operationKey'],
        value: {
          operationKey: expr('{{ $json.ledgerUpsert.operationKey }}'),
          appId: expr('{{ $json.ledgerUpsert.appId }}'),
          experimentRunId: expr('{{ $json.ledgerUpsert.experimentRunId }}'),
          provider: expr('{{ $json.ledgerUpsert.provider }}'),
          phase: expr('{{ $json.ledgerUpsert.phase }}'),
          campaignId: expr('{{ $json.ledgerUpsert.campaignId }}'),
          adSetId: expr('{{ $json.ledgerUpsert.adSetId }}'),
          imageHash: expr('{{ $json.ledgerUpsert.imageHash }}'),
          creativeId: expr('{{ $json.ledgerUpsert.creativeId }}'),
          adId: expr('{{ $json.ledgerUpsert.adId }}'),
          lastError: expr('{{ $json.ledgerUpsert.lastError }}'),
        },
      },
    },
  },
});

const createPausedChain = createPausedBlocked
  .to(ledgerLookup)
  .to(ledgerIdempotencyCheck)
  .to(ledgerUpsertPlanned)
  .to(createCampaignPaused)
  .to(mergeCampaignId)
  .to(createAdSetPaused)
  .to(mergeAdSetId)
  .to(resolveCreativeDownloadPlan)
  .to(downloadCreativeBinary)
  .to(validateCreativeBinary)
  .to(uploadAdImage)
  .to(mergeImageHash)
  .to(createCreative)
  .to(mergeCreativeId)
  .to(createAdPaused)
  .to(prepareLedgerVerified)
  .to(ledgerMarkVerified);

export default workflow('wf4-meta-ads-sandbox', 'WF4 - Meta Ads Sandbox')
  .add(manualRun)
  .to(workflowConfig)
  .to(processWf4)
  .to(tripleApprovalGate.onTrue(createPausedChain).onFalse(respondDryRun));
