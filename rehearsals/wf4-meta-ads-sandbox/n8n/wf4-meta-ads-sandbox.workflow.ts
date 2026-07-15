import {
  workflow,
  node,
  trigger,
  ifElse,
  expr,
} from '@n8n/workflow-sdk';

const processWf4Code =
  "const input = $input.first().json;\n" +
  "const mode = input.mode || 'dry_run';\n" +
  "const approval = Boolean(input.approval);\n" +
  "const approvalToken = input.approvalToken || '';\n" +
  "const configToken = input.wf4CreatePausedApprovalToken || '';\n" +
  "const provider = input.provider || 'meta';\n" +
  "let app = null;\n" +
  "if (input.appJson && typeof input.appJson === 'object') {\n" +
  "  app = input.appJson;\n" +
  "} else if (input.useFixtureAppJson) {\n" +
  "  app = JSON.parse(input.fixtureAppJson || '{}');\n" +
  "} else {\n" +
  "  throw new Error('No appJson provided and fixture disabled');\n" +
  "}\n" +
  "const meta = (app.ads && app.ads.meta) || {};\n" +
  "const idFields = ['campaignId','adSetId','creativeId','adId'];\n" +
  "const existing = idFields.filter((f) => meta[f] !== null && meta[f] !== undefined && String(meta[f]).trim() !== '');\n" +
  "if (existing.length) {\n" +
  "  throw new Error('Idempotency refusal: existing ads.meta IDs (' + existing.join(', ') + ')');\n" +
  "}\n" +
  "const landingUrl = app.deployment && app.deployment.landing && app.deployment.landing.url;\n" +
  "if (!landingUrl || !String(landingUrl).startsWith('https://')) {\n" +
  "  throw new Error('deployment.landing.url must be non-empty HTTPS');\n" +
  "}\n" +
  "if (!app.ads || !app.ads.campaignName || !app.ads.headlines || !app.ads.headlines.length || !app.ads.primaryTexts || !app.ads.primaryTexts.length) {\n" +
  "  throw new Error('Incomplete ads section');\n" +
  "}\n" +
  "const platforms = app.ads.platforms || [];\n" +
  "if (!platforms.includes('facebook') && !platforms.includes('instagram')) {\n" +
  "  throw new Error('ads.platforms must include facebook and/or instagram');\n" +
  "}\n" +
  "const budget = app.experiment && app.experiment.testBudget;\n" +
  "if (!budget || !(budget.amount > 0) || !(budget.durationDays > 0)) {\n" +
  "  throw new Error('experiment.testBudget invalid');\n" +
  "}\n" +
  "function selectCreative(a) {\n" +
  "  const adsMedia = (a.ads && a.ads.media) || [];\n" +
  "  for (const item of adsMedia) {\n" +
  "    if (item.url || item.githubPath) {\n" +
  "      return { kind: item.url ? 'url' : 'githubPath', value: item.url || item.githubPath, role: item.role || 'primary', resolvedFrom: 'ads.media' };\n" +
  "    }\n" +
  "  }\n" +
  "  const og = a.media && a.media.ogImage;\n" +
  "  if (og && (og.url || og.githubPath)) {\n" +
  "    return { kind: og.url ? 'url' : 'githubPath', value: og.url || og.githubPath, role: 'fallback', resolvedFrom: 'media.ogImage' };\n" +
  "  }\n" +
  "  return null;\n" +
  "}\n" +
  "const creative = selectCreative(app);\n" +
  "if (!creative) throw new Error('No creative asset: set ads.media[] or media.ogImage');\n" +
  "const utm = app.ads.utmTemplate || {};\n" +
  "function buildUtmQuery(u) {\n" +
  "  const parts = [];\n" +
  "  if (u.source) parts.push('utm_source=' + encodeURIComponent(u.source));\n" +
  "  if (u.medium) parts.push('utm_medium=' + encodeURIComponent(u.medium));\n" +
  "  if (u.campaign) parts.push('utm_campaign=' + encodeURIComponent(u.campaign));\n" +
  "  if (u.content) parts.push('utm_content=' + encodeURIComponent(u.content));\n" +
  "  if (u.term) parts.push('utm_term=' + encodeURIComponent(u.term));\n" +
  "  return parts.join('&');\n" +
  "}\n" +
  "const destinationUrl = landingUrl + '?' + buildUtmQuery(utm);\n" +
  "const dailyBudget = Math.round((budget.amount / budget.durationDays) * 100) / 100;\n" +
  "const targeting = app.ads.targeting || {};\n" +
  "const countries = (targeting.locations || []).map(() => 'US');\n" +
  "if (!countries.length) countries.push('VERIFY_COUNTRY_CODE');\n" +
  "const interests = (targeting.interests || []).map(() => 'VERIFY_INTEREST_ID');\n" +
  "const runKey = {\n" +
  "  appId: app.appId,\n" +
  "  experimentRunId: app.analytics && app.analytics.experimentRunId,\n" +
  "  provider,\n" +
  "};\n" +
  "const bundle = {\n" +
  "  mode,\n" +
  "  appId: app.appId,\n" +
  "  provider,\n" +
  "  runKey,\n" +
  "  metaApiVersion: input.metaApiVersion || 'VERIFY_CURRENT_VERSION_BEFORE_LIVE_USE',\n" +
  "  adAccountIdRef: 'n8n.credentials.META_AD_ACCOUNT_ID',\n" +
  "  pageIdRef: 'n8n.config.META_PAGE_ID',\n" +
  "  wf3Gate: { required: true, status: input.wf3GateStatus || 'proven', requiredEvents: ['page_view','email_captured','buy_now_clicked','mockup_interacted'] },\n" +
  "  source: { landingUrl, creative },\n" +
  "  computed: { destinationUrl, dailyBudget, currency: budget.currency, totalBudget: budget.amount, durationDays: budget.durationDays, statusForAllCreatedEntities: 'PAUSED' },\n" +
  "  requests: {\n" +
  "    campaign: { name: app.ads.campaignName, objective: 'VERIFY_META_OBJECTIVE_MAPPING', status: 'PAUSED', special_ad_categories: 'VERIFY_BEFORE_LIVE_USE' },\n" +
  "    adSet: { name: app.ads.campaignName + '-adset-v1', status: 'PAUSED', daily_budget: 'VERIFY_MINOR_UNITS_BEFORE_LIVE_USE', billing_event: 'VERIFY_FOR_OBJECTIVE', optimization_goal: 'VERIFY_FOR_OBJECTIVE', targeting: { geo_locations: { countries }, age_min: targeting.ageMin, age_max: targeting.ageMax, interests, publisher_platforms: platforms } },\n" +
  "    creative: { name: app.ads.campaignName + '-creative-a', object_story_spec: { page_id: 'CONFIG_META_PAGE_ID', link_data: { link: destinationUrl, message: app.ads.primaryTexts[0], name: app.ads.headlines[0], description: (app.ads.descriptions && app.ads.descriptions[0]) || '', call_to_action: { type: app.ads.callToAction, value: { link: destinationUrl } }, image_hash: 'VERIFY_AFTER_IMAGE_UPLOAD' } } },\n" +
  "    ad: { name: app.ads.campaignName + '-ad-a', status: 'PAUSED', creative: { creative_id: 'CREATIVE_ID_FROM_CREATE_CREATIVE' } },\n" +
  "  },\n" +
  "  safety: { externalWritePerformed: false, liveAdsCreated: false, spendPossible: false, requiresExplicitApprovalBeforeCreatePaused: true, tripleApprovalRequired: { mode: 'create_paused', approval: true, approvalToken: 'WF4_CREATE_PAUSED_APPROVAL_TOKEN' } },\n" +
  "};\n" +
  "const tripleApproved = mode === 'create_paused' && approval === true && approvalToken && configToken && approvalToken === configToken;\n" +
  "return [{ json: Object.assign({}, input, { bundle, tripleApproved, _createPausedAllowed: false }) }];";

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
    objective: 'conversions',
    platforms: ['facebook', 'instagram'],
    headlines: ['Stop guessing. Start testing.'],
    primaryTexts: ['Discover what actually works for your stress, sleep, and habits.'],
    descriptions: ['Human Lab turns self-improvement into structured experiments.'],
    callToAction: 'SIGN_UP',
    utmTemplate: { source: 'facebook', medium: 'paid_social', campaign: 'human-lab-validation' },
    targeting: { locations: ['United States'], ageMin: 25, ageMax: 55, interests: ['fitness', 'productivity', 'self-improvement'] },
    meta: { status: null, campaignId: null, adSetId: null, creativeId: null, adId: null, landingUrl: null, dailyBudget: null, createdAt: null, lastSyncedAt: null },
    media: [{ githubPath: 'media/og-image.png', role: 'primary' }],
  },
  media: { ogImage: { githubPath: 'media/og-image.png' } },
  analytics: { experimentRunId: 'run_human-lab_2026q2_001' },
  experiment: { testBudget: { currency: 'USD', amount: 500, durationDays: 14 } },
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
          { id: 'metaApiVersion', name: 'metaApiVersion', value: 'VERIFY_CURRENT_VERSION_BEFORE_LIVE_USE', type: 'string' },
          { id: 'defaultDailyBudgetCap', name: 'defaultDailyBudgetCap', value: 50, type: 'number' },
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
      url: 'https://graph.facebook.com/VERIFY_CURRENT_VERSION_BEFORE_LIVE_USE/act_VERIFY/META_AD_ACCOUNT_ID/campaigns',
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
