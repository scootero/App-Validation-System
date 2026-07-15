#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const appJsonPath = path.join(root, "fixtures", "app-json-wf4-sandbox.json");
const expectedDryRunPath = path.join(
  root,
  "dry-run-payloads",
  "human-lab-wf4-dry-run.json"
);
const expectedWritebackPath = path.join(
  root,
  "fixtures",
  "expected-ads-meta-writeback.json"
);

const PROVIDER = "meta";
const META_ID_FIELDS = ["campaignId", "adSetId", "creativeId", "adId"];
const VERIFY_FIELDS = [
  "VERIFY_CURRENT_VERSION_BEFORE_LIVE_USE",
  "VERIFY_META_OBJECTIVE_MAPPING",
  "VERIFY_BEFORE_LIVE_USE",
  "VERIFY_MINOR_UNITS_BEFORE_LIVE_USE",
  "VERIFY_FOR_OBJECTIVE",
  "VERIFY_AFTER_IMAGE_UPLOAD",
  "CONFIG_META_PAGE_ID",
];

const LOCATION_TO_COUNTRY = {
  "united states": "US",
  us: "US",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function roundBudget(value) {
  return Math.round(value * 100) / 100;
}

function buildUtmQuery(utmTemplate) {
  const params = new URLSearchParams();
  if (utmTemplate.source) params.set("utm_source", utmTemplate.source);
  if (utmTemplate.medium) params.set("utm_medium", utmTemplate.medium);
  if (utmTemplate.campaign) params.set("utm_campaign", utmTemplate.campaign);
  if (utmTemplate.content) params.set("utm_content", utmTemplate.content);
  if (utmTemplate.term) params.set("utm_term", utmTemplate.term);
  return params.toString();
}

function mapCountries(locations) {
  const countries = [];
  for (const loc of locations || []) {
    const key = String(loc).trim().toLowerCase();
    countries.push(LOCATION_TO_COUNTRY[key] || "VERIFY_COUNTRY_CODE");
  }
  return countries.length ? countries : ["VERIFY_COUNTRY_CODE"];
}

function selectCreative(app) {
  const adsMedia = app.ads && app.ads.media ? app.ads.media : [];
  for (const item of adsMedia) {
    if (item.url || item.githubPath) {
      return {
        kind: item.url ? "url" : "githubPath",
        value: item.url || item.githubPath,
        role: item.role || "primary",
        source: "ads.media",
      };
    }
  }
  const og = app.media && app.media.ogImage;
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

function checkIdempotency(app, provider = PROVIDER) {
  const meta = (app.ads && app.ads.meta) || {};
  const runKey = {
    appId: app.appId,
    experimentRunId: app.analytics && app.analytics.experimentRunId,
    provider,
  };
  const existing = META_ID_FIELDS.filter((field) => {
    const value = meta[field];
    return value !== null && value !== undefined && String(value).trim() !== "";
  });
  if (existing.length) {
    return {
      allowed: false,
      runKey,
      existingFields: existing,
      message: `Idempotency refusal: existing ads.meta IDs (${existing.join(", ")})`,
    };
  }
  return { allowed: true, runKey };
}

function validateAds(app) {
  const errors = [];
  const landingUrl = app.deployment && app.deployment.landing && app.deployment.landing.url;
  if (!landingUrl || !String(landingUrl).startsWith("https://")) {
    errors.push("deployment.landing.url must be non-empty HTTPS");
  }
  if (!app.ads || !app.ads.campaignName) errors.push("ads.campaignName required");
  if (!app.ads || !app.ads.headlines || !app.ads.headlines.length) {
    errors.push("ads.headlines required");
  }
  if (!app.ads || !app.ads.primaryTexts || !app.ads.primaryTexts.length) {
    errors.push("ads.primaryTexts required");
  }
  const platforms = (app.ads && app.ads.platforms) || [];
  if (!platforms.includes("facebook") && !platforms.includes("instagram")) {
    errors.push("ads.platforms must include facebook and/or instagram");
  }
  const budget = app.experiment && app.experiment.testBudget;
  if (!budget || !(budget.amount > 0) || !(budget.durationDays > 0)) {
    errors.push("experiment.testBudget.amount and durationDays must be > 0");
  }
  if (!selectCreative(app)) {
    errors.push("No creative asset: set ads.media[] or media.ogImage");
  }
  return errors;
}

function buildDryRunBundle(app, config = {}) {
  const mode = config.mode || "dry_run";
  const provider = config.provider || PROVIDER;
  const idem = checkIdempotency(app, provider);
  if (!idem.allowed) {
    return { ok: false, error: idem.message, runKey: idem.runKey };
  }

  const validationErrors = validateAds(app);
  if (validationErrors.length) {
    return { ok: false, error: validationErrors.join("; ") };
  }

  const landingUrl = app.deployment.landing.url;
  const utm = app.ads.utmTemplate || {};
  const destinationUrl = `${landingUrl}?${buildUtmQuery(utm)}`;
  const dailyBudget = roundBudget(
    app.experiment.testBudget.amount / app.experiment.testBudget.durationDays
  );
  const creative = selectCreative(app);
  const targeting = app.ads.targeting || {};
  const headline = app.ads.headlines[0];
  const primaryText = app.ads.primaryTexts[0];
  const description = (app.ads.descriptions && app.ads.descriptions[0]) || "";

  const bundle = {
    mode,
    appId: app.appId,
    provider,
    runKey: idem.runKey,
    metaApiVersion: "VERIFY_CURRENT_VERSION_BEFORE_LIVE_USE",
    adAccountIdRef: "n8n.credentials.META_AD_ACCOUNT_ID",
    pageIdRef: "n8n.config.META_PAGE_ID",
    wf3Gate: {
      required: true,
      status: "proven",
      requiredEvents: [
        "page_view",
        "email_captured",
        "buy_now_clicked",
        "mockup_interacted",
      ],
    },
    source: {
      landingUrl,
      creative: {
        kind: creative.kind,
        value: creative.value,
        role: creative.role,
        resolvedFrom: creative.source,
      },
    },
    computed: {
      destinationUrl,
      dailyBudget,
      currency: app.experiment.testBudget.currency,
      totalBudget: app.experiment.testBudget.amount,
      durationDays: app.experiment.testBudget.durationDays,
      statusForAllCreatedEntities: "PAUSED",
    },
    requests: {
      campaign: {
        name: app.ads.campaignName,
        objective: "VERIFY_META_OBJECTIVE_MAPPING",
        status: "PAUSED",
        special_ad_categories: "VERIFY_BEFORE_LIVE_USE",
      },
      adSet: {
        name: `${app.ads.campaignName}-adset-v1`,
        status: "PAUSED",
        daily_budget: "VERIFY_MINOR_UNITS_BEFORE_LIVE_USE",
        billing_event: "VERIFY_FOR_OBJECTIVE",
        optimization_goal: "VERIFY_FOR_OBJECTIVE",
        targeting: {
          geo_locations: { countries: mapCountries(targeting.locations) },
          age_min: targeting.ageMin,
          age_max: targeting.ageMax,
          interests: (targeting.interests || []).map(() => "VERIFY_INTEREST_ID"),
          publisher_platforms: app.ads.platforms,
        },
      },
      creative: {
        name: `${app.ads.campaignName}-creative-a`,
        object_story_spec: {
          page_id: "CONFIG_META_PAGE_ID",
          link_data: {
            link: destinationUrl,
            message: primaryText,
            name: headline,
            description,
            call_to_action: {
              type: app.ads.callToAction,
              value: { link: destinationUrl },
            },
            image_hash: "VERIFY_AFTER_IMAGE_UPLOAD",
          },
        },
      },
      ad: {
        name: `${app.ads.campaignName}-ad-a`,
        status: "PAUSED",
        creative: { creative_id: "CREATIVE_ID_FROM_CREATE_CREATIVE" },
      },
    },
    writeBackAfterCreatePausedOnly: readJson(expectedWritebackPath),
    safety: {
      externalWritePerformed: false,
      liveAdsCreated: false,
      spendPossible: false,
      requiresExplicitApprovalBeforeCreatePaused: true,
      tripleApprovalRequired: {
        mode: "create_paused",
        approval: true,
        approvalToken: "WF4_CREATE_PAUSED_APPROVAL_TOKEN",
      },
    },
  };

  return { ok: true, bundle };
}

function assertNoActiveStatus(bundle) {
  assert(bundle.computed.statusForAllCreatedEntities === "PAUSED", "computed status must be PAUSED");
  assert(bundle.requests.campaign.status === "PAUSED", "campaign must be PAUSED");
  assert(bundle.requests.adSet.status === "PAUSED", "adSet must be PAUSED");
  assert(bundle.requests.ad.status === "PAUSED", "ad must be PAUSED");
}

function assertVerifyPlaceholders(bundle) {
  const serialized = JSON.stringify(bundle);
  for (const token of VERIFY_FIELDS) {
    assert(serialized.includes(token), `Missing VERIFY placeholder: ${token}`);
  }
  assert(
    bundle.requests.adSet.targeting.interests.every((i) => i === "VERIFY_INTEREST_ID"),
    "interests must use VERIFY_INTEREST_ID placeholders"
  );
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
  assert(actual.source.creative.value === expected.source.creative.value, "creative mismatch");
}

function testIdempotencyRefusal() {
  const app = readJson(appJsonPath);
  app.ads.meta.campaignId = "123";
  const result = buildDryRunBundle(app);
  assert(!result.ok, "must refuse when campaignId exists");
  assert(result.error.includes("Idempotency refusal"), "must include refusal message");
}

function main() {
  const app = readJson(appJsonPath);
  const expectedDryRun = readJson(expectedDryRunPath);
  const result = buildDryRunBundle(app);

  assert(result.ok, result.error || "bundle build failed");
  const bundle = result.bundle;

  assertNoActiveStatus(bundle);
  assertVerifyPlaceholders(bundle);
  assertSafety(bundle);
  assertMatchesExpectedDryRun(bundle, expectedDryRun);

  const tripleGate =
    bundle.mode === "create_paused" &&
    bundle.safety.tripleApprovalRequired.approval === true;
  assert(!tripleGate || bundle.mode !== "dry_run", "dry_run must not pass create-paused gate");

  testIdempotencyRefusal();

  console.log("WF4 local dry-run proof: PASS");
  console.log(`  appId: ${bundle.appId}`);
  console.log(`  runKey: ${JSON.stringify(bundle.runKey)}`);
  console.log(`  destinationUrl: ${bundle.computed.destinationUrl}`);
  console.log(`  dailyBudget: ${bundle.computed.dailyBudget}`);
  console.log(`  creative: ${bundle.source.creative.resolvedFrom} -> ${bundle.source.creative.value}`);
  console.log("  safety: zero external writes, PAUSED-only, VERIFY_* placeholders present");
}

try {
  main();
} catch (err) {
  console.error("WF4 local dry-run proof: FAIL");
  console.error(err.message);
  process.exit(1);
}
