const input = $input.first().json;
const mode = input.mode || 'dry_run';
const approval = Boolean(input.approval);
const approvalToken = input.approvalToken || '';
const configToken = input.wf4CreatePausedApprovalToken || '';
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
  approvalToken: approvalToken,
  configToken: configToken,
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
