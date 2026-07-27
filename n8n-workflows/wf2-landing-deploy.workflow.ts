import {
  workflow,
  node,
  trigger,
  ifElse,
  splitInBatches,
  nextBatch,
  expr,
  newCredential,
} from '@n8n/workflow-sdk';

const parseAndGateCode = `const cfg = $('Workflow Config').first().json;
const fileMeta = $('Download app.json').first().json;
const buf = await this.helpers.getBinaryDataBuffer(0, 'data');
const text = buf.toString('utf8');
let pkg;
try {
  pkg = JSON.parse(text);
} catch (e) {
  throw new Error('PARSE_FAILED: ' + e.message);
}
if (!pkg.appId) {
  throw new Error('MISSING_APP_ID');
}
if (pkg.appId !== cfg.appId) {
  throw new Error('APP_ID_MISMATCH: expected ' + cfg.appId + ', got ' + pkg.appId);
}
const statusReady = pkg.status === 'ready';
return [{
  json: {
    appId: pkg.appId,
    status: pkg.status,
    statusReady,
    fileId: fileMeta.id,
    folderId: $('Search App Folder').first().json.id,
    driveParentFolderId: cfg.driveParentFolderId,
    vercelTeamId: cfg.vercelTeamId,
    githubOrgOrUser: cfg.githubOrgOrUser,
    landingTemplateRepo: cfg.landingTemplateRepo,
    landingTemplateBranch: cfg.landingTemplateBranch,
    vercelPollIntervalSeconds: cfg.vercelPollIntervalSeconds,
    vercelPollMaxMinutes: cfg.vercelPollMaxMinutes,
    landingTargetsJson: cfg.landingTargetsJson || '{}',
    pkg,
  },
}];`;

const validateMockupAndResolveCode = `const item = $input.first().json;
const pkg = item.pkg;
const mockupUrl =
  pkg.deployment?.mockup?.url ||
  pkg.deployment?.mockupUrl ||
  pkg.mockup?.previewUrl ||
  '';
function stripGithubPrefix(value) {
  let v = String(value || '').trim();
  const lower = v.toLowerCase();
  if (lower.startsWith('https://github.com/')) v = v.slice('https://github.com/'.length);
  else if (lower.startsWith('http://github.com/')) v = v.slice('http://github.com/'.length);
  if (v.toLowerCase().endsWith('.git')) v = v.slice(0, -4);
  while (v.endsWith('/')) v = v.slice(0, -1);
  return v;
}
function stripProtocolHost(url) {
  let v = String(url || '');
  const lower = v.toLowerCase();
  if (lower.startsWith('https://')) v = v.slice(8);
  else if (lower.startsWith('http://')) v = v.slice(7);
  return v.split('/')[0];
}
function trimSlashes(value) {
  let v = String(value || '');
  while (v.startsWith('/')) v = v.slice(1);
  while (v.endsWith('/')) v = v.slice(0, -1);
  return v;
}
if (!mockupUrl || !String(mockupUrl).toLowerCase().startsWith('https://')) {
  throw new Error('Run WF1 first - mockup URL required');
}
const host = stripProtocolHost(mockupUrl);
if (/-[a-z0-9]{5,}-/.test(host) || host.endsWith('-scooteros-projects.vercel.app')) {
  throw new Error('INVALID_MOCKUP_URL: use public alias, not deploymentUrl (' + mockupUrl + ')');
}

let landingTargets = {};
try {
  landingTargets = JSON.parse(item.landingTargetsJson || '{}');
} catch (e) {
  throw new Error('LANDING_TARGETS_JSON_INVALID: ' + e.message);
}
const override = landingTargets[item.appId] || {};
const landingGithubRepoRaw =
  override.landingGithubRepo ||
  (item.githubOrgOrUser + '/' + item.appId + '-landing');
const landingGithubRepo = stripGithubPrefix(landingGithubRepoRaw);
const parts = landingGithubRepo.split('/').filter(Boolean);
if (parts.length < 2) {
  throw new Error('LANDING_REPO_INVALID: ' + landingGithubRepo);
}
const landingOwner = parts[0];
const landingRepo = parts[1];
const vercelLandingProjectName =
  override.vercelLandingProjectName ||
  pkg.deployment?.landing?.vercelProjectName ||
  (item.appId + '-landing');
const vercelLandingProjectId =
  override.vercelLandingProjectId ||
  pkg.deployment?.landing?.vercelProjectId ||
  null;
if (!vercelLandingProjectId && !vercelLandingProjectName) {
  throw new Error(
    'LANDING_PROJECT_MISSING: create Vercel landing project and set landingTargets for ' + item.appId
  );
}

const source = pkg.source || {};
const assetsRepoRaw = source.assetsGithubRepo || source.mockupGithubRepo || '';
const assetsRepo = stripGithubPrefix(assetsRepoRaw);
const assetsBranch = source.assetsBranch || source.mockupBranch || 'main';
const assetsRoot = trimSlashes(source.assetsRootDirectory || '');

return [{
  json: {
    ...item,
    mockupUrl,
    landingGithubRepo,
    landingOwner,
    landingRepo,
    vercelLandingProjectName,
    vercelLandingProjectId,
    assetsRepo,
    assetsBranch,
    assetsRoot,
    githubRepoUrl: 'https://github.com/' + landingGithubRepo,
  },
}];`;

const transformAppConfigCode = `const item = $input.first().json;
const pkg = item.pkg;
const ACCENT_HEX_TO_NAME = {
  '#06d6a0': 'emerald',
  '#059669': 'emerald',
  '#3b82f6': 'blue',
  '#2563eb': 'blue',
  '#7c3aed': 'violet',
};
function getSection(app, id) {
  return (app.landingPage?.sections || []).find((s) => s.id === id);
}
function formatPrice(pricing) {
  if (!pricing?.amount) return '';
  const symbol = pricing.currency === 'USD' ? '$' : pricing.currency + ' ';
  return symbol + pricing.amount;
}
function formatBuyNowCta(cta, price) {
  const base = cta?.buyNowText || 'Buy Now on the App Store';
  if (!price) return base;
  if (base.includes('{price}')) return base.split('{price}').join(price);
  if (cta?.buyNowIncludePrice) {
    if (/\\bfor\\b/i.test(base)) return base;
    return base + ' for ' + price;
  }
  return base;
}
function mapAccentColor(app) {
  const accentName = app.branding?.theme?.accentName;
  if (accentName) return String(accentName).toLowerCase();
  const hex = app.branding?.theme?.accentColor;
  if (!hex) return 'violet';
  return ACCENT_HEX_TO_NAME[String(hex).toLowerCase()] || 'violet';
}
function mapLandingStyle(app) {
  const landingStyle = app.branding?.theme?.landingStyle;
  if (landingStyle) return landingStyle;
  return app.branding?.theme?.mode === 'dark' ? 'midnight' : 'liquid-glass';
}
function mapBadgeText(app) {
  if (app.identity?.badgeText) return app.identity.badgeText;
  return app.identity?.platform === 'ios' ? 'Coming soon to the App Store' : 'Coming soon';
}
function resolveGithubAssetUrl(githubPath) {
  if (!item.assetsRepo || !githubPath) return '';
  let rel = String(githubPath || '');
  while (rel.startsWith('/')) rel = rel.slice(1);
  const joined = [item.assetsRoot, rel].filter(Boolean).join('/');
  return 'https://raw.githubusercontent.com/' + item.assetsRepo + '/' + item.assetsBranch + '/' + joined;
}
function basename(p) {
  const s = String(p || 'file.png');
  const parts = s.split('/');
  return parts[parts.length - 1] || 'file.png';
}
function assetLocator(asset) {
  if (!asset) return null;
  if (asset.url) return { kind: 'url', value: asset.url };
  if (asset.githubPath) return { kind: 'githubPath', value: asset.githubPath };
  return null;
}
function resolvePublicImageRef(asset, defaultPublicName) {
  const loc = assetLocator(asset);
  if (!loc) return { image: '', fetchUrl: '', publicName: defaultPublicName || '', missing: true };
  if (loc.kind === 'url') {
    return {
      image: loc.value,
      fetchUrl: loc.value,
      publicName: defaultPublicName || basename(loc.value),
      missing: false,
    };
  }
  const fetchUrl = resolveGithubAssetUrl(loc.value);
  const publicName = defaultPublicName || basename(loc.value);
  return {
    image: '/app-data/images/' + publicName,
    fetchUrl,
    publicName,
    missing: !fetchUrl,
  };
}

const heroSection = getSection(pkg, 'hero');
const pricingSection = getSection(pkg, 'pricing');
const ctaSection = getSection(pkg, 'cta');
const faqSection = getSection(pkg, 'faq');
const socialSection = getSection(pkg, 'socialProof');
const screenshotsSection = getSection(pkg, 'screenshots');
const screenshotsEnabled = screenshotsSection?.enabled !== false;
const hero = heroSection?.source === 'inline' && heroSection.inline
  ? {
      headline: heroSection.inline.headline || '',
      subheadline: heroSection.inline.subheadline || '',
      body: heroSection.inline.body || '',
    }
  : { headline: '', subheadline: '', body: '' };
const benefits = Array.isArray(pkg.landingPage?.content?.benefits)
  ? pkg.landingPage.content.benefits.map((b) => ({
      title: b.title || '',
      description: b.description || '',
      icon: b.icon || 'check',
    }))
  : [];
const features = Array.isArray(pkg.landingPage?.content?.features)
  ? pkg.landingPage.content.features.map((f) => ({
      title: f.title || '',
      description: f.description || '',
    }))
  : [];
const faqItems = Array.isArray(pkg.landingPage?.content?.faq)
  ? pkg.landingPage.content.faq.map((f) => ({
      question: f.question || '',
      answer: f.answer || '',
    }))
  : [];
const testimonials = Array.isArray(pkg.landingPage?.content?.testimonials)
  ? pkg.landingPage.content.testimonials.map((t) => ({
      quote: t.quote || '',
      author: t.name || t.author || '',
      role: t.role || '',
    }))
  : [];
const screenshots = screenshotsEnabled
  ? (pkg.media?.screenshots || []).map((shot) => {
      const resolved = resolvePublicImageRef(shot);
      return {
        title: shot.title || '',
        description: shot.description || '',
        image: resolved.image,
        sourcePath: assetLocator(shot)?.value || '',
        missing: resolved.missing,
        fetchUrl: resolved.fetchUrl,
        publicName: resolved.publicName,
      };
    })
  : [];
const logoResolved = resolvePublicImageRef(pkg.media?.logo, 'logo.png');
const iconResolved = resolvePublicImageRef(pkg.media?.icon, 'icon.png');
const ogResolved = resolvePublicImageRef(pkg.media?.ogImage, 'og-image.png');
const heroSubheadline =
  hero.subheadline || (pkg.identity?.description || '').slice(0, 120) || '';
const price = formatPrice(pkg.commerce?.pricing);
const landing = pkg.deployment?.landing || {};

const appConfig = {
  appId: pkg.appId,
  appName: pkg.identity?.appName || pkg.appId,
  tagline: pkg.identity?.tagline || '',
  contactEmail:
    typeof pkg.identity?.contactEmail === 'string'
      ? pkg.identity.contactEmail.trim()
      : '',
  privacyEffectiveDate:
    typeof pkg.identity?.privacyEffectiveDate === 'string'
      ? pkg.identity.privacyEffectiveDate.trim()
      : '',
  heroHeadline: hero.headline || pkg.identity?.tagline || '',
  heroSubheadline,
  heroBody: hero.body || '',
  badgeText: mapBadgeText(pkg),
  primaryCtaText: pkg.commerce?.cta?.primaryText || 'Buy Now',
  secondaryCtaText: pkg.commerce?.cta?.secondaryText || 'Learn More',
  theme: {
    style: mapLandingStyle(pkg),
    accentColor: mapAccentColor(pkg),
    mode: pkg.branding?.theme?.mode || 'light',
    fontFamily: pkg.branding?.theme?.fontFamily || '',
  },
  logo: {
    text: (pkg.identity?.appName || 'A').charAt(0),
    imageUrl: logoResolved.missing ? '' : logoResolved.image,
  },
  icon: {
    imageUrl: iconResolved.missing ? '' : iconResolved.image,
  },
  mockup: {
    embedUrl: item.mockupUrl,
    baseWidth: pkg.mockup?.baseWidth || 375,
    baseHeight: pkg.mockup?.baseHeight || 820,
    useOuterDeviceFrame: pkg.mockup?.useOuterDeviceFrame || false,
    clipBottomPx: pkg.mockup?.clipBottomPx || 0,
  },
  problem: pkg.audience?.painPoints?.[0] || '',
  solution: pkg.identity?.description || '',
  targetAudience: pkg.audience?.landingPhrase || pkg.audience?.primary || '',
  benefits,
  features,
  screenshots: screenshots.map((s) => ({
    title: s.title,
    description: s.description,
    image: s.image,
    sourcePath: s.sourcePath,
    missing: s.missing,
  })),
  howItWorks: { enabled: false, steps: [] },
  pricing: {
    enabled: pricingSection?.enabled !== false,
    headlineLabel:
      pkg.commerce?.pricing?.headlineLabel ||
      pricingSection?.inline?.headlineLabel ||
      'Get for',
    price,
    billingLabel: (pkg.commerce?.pricing?.period || 'monthly').replace('ly', ''),
    ctaText: formatBuyNowCta(pkg.commerce?.cta, price),
    finePrint:
      pricingSection?.inline?.subheadline ||
      (price + '/' + (pkg.commerce?.pricing?.period || 'month')),
  },
  emailCapture: {
    enabled: ctaSection?.enabled !== false,
    headline: ctaSection?.inline?.headline || 'Want launch updates?',
    subheadline: ctaSection?.inline?.subheadline || 'Get launch updates.',
    placeholder:
      ctaSection?.inline?.placeholder ||
      pkg.commerce?.cta?.emailPlaceholder ||
      'Enter your email',
    buttonText: pkg.commerce?.cta?.waitlistText || 'Keep Me Updated',
  },
  faq: {
    enabled: faqSection?.enabled !== false,
    items: faqItems,
  },
  testimonials: {
    enabled: socialSection?.enabled === true && testimonials.length > 0,
    headline: socialSection?.inline?.headline || '',
    items: testimonials,
  },
  seo: {
    title: pkg.landingPage?.seo?.title || '',
    description: pkg.landingPage?.seo?.description || '',
    keywords: pkg.landingPage?.seo?.keywords || [],
    metadataBaseUrl: landing.url || '',
    ogImageUrl: ogResolved.missing
      ? ''
      : (ogResolved.image.startsWith('http') ? ogResolved.image : ogResolved.image),
  },
  footer: {
    text: getSection(pkg, 'footer')?.inline?.body || '',
  },
  tracking: {
    webhookUrl: pkg.tracking?.webhookUrl || '',
    buyNowWebhookUrl: pkg.tracking?.webhooks?.buyNowClicked || '',
    emailWebhookUrl: pkg.tracking?.webhooks?.emailCaptured || '',
    experimentId: pkg.analytics?.experimentId || '',
    experimentRunId: pkg.analytics?.experimentRunId || '',
    projectId: pkg.analytics?.projectId || '',
    landingVariantId: pkg.analytics?.landingVariantId || '',
    mockupVersionId: pkg.analytics?.mockupVersionId || '',
    landingVersion: landing.lastDeployedAt || '',
    deploymentId: landing.vercelProjectId || landing.deploymentUrl || '',
    campaignName: pkg.ads?.campaignName || '',
  },
};

const mediaAssets = [];
const pushAsset = (resolved) => {
  if (!resolved || resolved.missing || !resolved.fetchUrl || !resolved.publicName) return;
  if (resolved.image.startsWith('http')) return;
  mediaAssets.push({
    fetchUrl: resolved.fetchUrl,
    filePath: 'app-data/images/' + resolved.publicName,
    publicName: resolved.publicName,
  });
};
for (const shot of screenshots) pushAsset(shot);
pushAsset(logoResolved);
pushAsset(iconResolved);
pushAsset(ogResolved);

const appConfigContent = JSON.stringify(appConfig, null, 2);
const commitMessage = 'WF2 deploy ' + item.appId + ' ' + new Date().toISOString();

return [{
  json: {
    appId: item.appId,
    fileId: item.fileId,
    folderId: item.folderId,
    vercelTeamId: item.vercelTeamId,
    vercelPollIntervalSeconds: item.vercelPollIntervalSeconds,
    vercelPollMaxMinutes: item.vercelPollMaxMinutes,
    mockupUrl: item.mockupUrl,
    landingOwner: item.landingOwner,
    landingRepo: item.landingRepo,
    landingGithubRepo: item.landingGithubRepo,
    githubRepoUrl: item.githubRepoUrl,
    vercelLandingProjectName: item.vercelLandingProjectName,
    vercelLandingProjectId: item.vercelLandingProjectId,
    appConfigContent,
    commitMessage,
    mediaAssets,
    hasMediaAssets: mediaAssets.length > 0,
  },
}];`;

const prepareDeployBodyCode = `const ctx = $('Transform To App Config').first().json;
const body = {
  name: ctx.vercelLandingProjectName,
  target: 'production',
  gitSource: {
    type: 'github',
    org: ctx.landingOwner,
    repo: ctx.landingRepo,
    ref: 'main',
  },
};
if (ctx.vercelLandingProjectId) {
  body.project = ctx.vercelLandingProjectId;
}
return [{
  json: {
    appId: ctx.appId,
    fileId: ctx.fileId,
    folderId: ctx.folderId,
    vercelTeamId: ctx.vercelTeamId,
    vercelPollIntervalSeconds: ctx.vercelPollIntervalSeconds,
    vercelPollMaxMinutes: ctx.vercelPollMaxMinutes,
    githubRepoUrl: ctx.githubRepoUrl,
    projectIdHint: ctx.vercelLandingProjectId || null,
    projectNameHint: ctx.vercelLandingProjectName,
    deployBody: body,
  },
}];`;

const preparePollContextCode = `const prev = $('Prepare Deploy Body').first().json;
const dep = $input.first().json;
const deploymentId = dep.id || dep.uid;
if (!deploymentId) {
  throw new Error('DEPLOY_FAILED: missing deployment id');
}
return [{
  json: {
    appId: prev.appId,
    fileId: prev.fileId,
    folderId: prev.folderId,
    vercelTeamId: prev.vercelTeamId,
    vercelPollIntervalSeconds: prev.vercelPollIntervalSeconds,
    vercelPollMaxMinutes: prev.vercelPollMaxMinutes,
    githubRepoUrl: prev.githubRepoUrl,
    projectIdHint: prev.projectIdHint,
    projectNameHint: prev.projectNameHint,
    deploymentId,
    pollStartedAt: new Date().toISOString(),
    initialReadyState: dep.readyState || null,
  },
}];`;

const mergePollResultCode = `const ctx = $('Prepare Poll Context').first().json;
const dep = $input.first().json;
const maxMs = (Number(ctx.vercelPollMaxMinutes) || 10) * 60 * 1000;
const started = new Date(ctx.pollStartedAt).getTime();
const readyState = dep.readyState;
if (readyState === 'ERROR' || readyState === 'CANCELED') {
  throw new Error('DEPLOY_FAILED: readyState=' + readyState + ' id=' + ctx.deploymentId);
}
if (readyState !== 'READY' && Date.now() - started > maxMs) {
  throw new Error('POLL_TIMEOUT: deployment ' + ctx.deploymentId + ' not READY within ' + ctx.vercelPollMaxMinutes + 'm');
}
return [{
  json: {
    ...ctx,
    readyState,
    isReady: readyState === 'READY',
    alias: dep.alias || [],
    url: dep.url || null,
    projectId: dep.projectId || ctx.projectIdHint,
    createdAt: dep.createdAt || null,
  },
}];`;

const extractUrlsCode = `const item = $input.first().json;
const teamSlug = 'scooteros-projects';
function isProtectedHost(host) {
  return /-[a-z0-9]{5,}-/.test(host) || host.endsWith('-' + teamSlug + '.vercel.app');
}
function stripProtocol(value) {
  let v = String(value || '');
  const lower = v.toLowerCase();
  if (lower.startsWith('https://')) return v.slice(8);
  if (lower.startsWith('http://')) return v.slice(7);
  return v;
}
function pickPublicAlias(aliases) {
  const hosts = (aliases || [])
    .map((a) => (typeof a === 'string' ? a : a.domain || a))
    .filter(Boolean)
    .map((h) => stripProtocol(h));
  return hosts.find((h) => h.endsWith('.vercel.app') && !isProtectedHost(h)) || null;
}
let publicHost = pickPublicAlias(item.alias);
const deploymentUrl = item.url
  ? (String(item.url).startsWith('http') ? String(item.url) : 'https://' + item.url)
  : null;
const publicUrl = publicHost
  ? (publicHost.startsWith('http') ? publicHost : 'https://' + publicHost)
  : null;
return [{
  json: {
    appId: item.appId,
    fileId: item.fileId,
    folderId: item.folderId,
    vercelTeamId: item.vercelTeamId,
    githubRepoUrl: item.githubRepoUrl,
    deploymentId: item.deploymentId,
    projectId: item.projectId,
    publicUrl,
    deploymentUrl,
    needsDomainsFallback: !publicUrl,
    createdAt: item.createdAt,
  },
}];`;

const resolveDomainsCode = `const urls = $('Extract Public Alias').first().json;
const domainsResp = $input.first().json;
const list = Array.isArray(domainsResp) ? domainsResp : (domainsResp.domains || domainsResp.data || []);
const verified = list.find((d) => {
  const name = d.name || d.domain || d;
  const ok = d.verified !== false;
  return ok && name && String(name).endsWith('.vercel.app');
}) || list[0];
const host = verified ? (verified.name || verified.domain || verified) : null;
if (!host) {
  throw new Error('ALIAS_RESOLVE_FAILED: no public domain for project ' + urls.projectId);
}
const publicUrl = String(host).startsWith('http') ? String(host) : 'https://' + host;
return [{
  json: {
    ...urls,
    publicUrl,
    needsDomainsFallback: false,
  },
}];`;

const passThroughUrlsCode = `const urls = $input.first().json;
if (!urls.publicUrl) {
  throw new Error('ALIAS_RESOLVE_FAILED: publicUrl missing');
}
return [{ json: urls }];`;

const verifyPublicUrlCode = `const urls = $('Resolve Final Public Url').first().json;
const resp = $input.first().json;
const statusCode = resp.statusCode || resp.status || 0;
const headers = resp.headers || {};
const location = headers.location || headers.Location || '';
const xfo = headers['x-frame-options'] || headers['X-Frame-Options'] || '';
const sso = String(location).includes('vercel.com/sso-api');
const deny = String(xfo).toUpperCase() === 'DENY';
const ok = Number(statusCode) === 200 && !sso && !deny;
if (!ok) {
  throw new Error(
    'PUBLIC_URL_VERIFY_FAILED: status=' + statusCode +
    ' sso=' + sso +
    ' xfo=' + xfo +
    ' publicUrl=' + urls.publicUrl
  );
}
return [{
  json: {
    ...urls,
    verifyOk: true,
    verifyStatusCode: statusCode,
  },
}];`;

const mergeWriteCode = `const urls = $('Verify Public URL Gate').first().json;
const buf = await this.helpers.getBinaryDataBuffer(0, 'data');
const text = buf.toString('utf8');
let pkg;
try {
  pkg = JSON.parse(text);
} catch (e) {
  throw new Error('PARSE_FAILED_ON_WRITEBACK: ' + e.message);
}
if (pkg.appId !== urls.appId) {
  throw new Error('WRITEBACK_APP_ID_MISMATCH: package appId=' + pkg.appId + ' expected=' + urls.appId);
}
// Prefer the fileId we used for Re-download (threaded through the run). Drive download
 // metadata id can differ in shape after Wait/poll, so do not hard-fail on mismatch.
const fileMeta = $('Re-download app.json').first().json || {};
const fileId = urls.fileId || fileMeta.id || fileMeta.fileId;
if (!fileId) {
  throw new Error('WRITEBACK_MISSING_FILE_ID: no Drive fileId for app.json');
}
if (fileMeta.id && urls.fileId && String(fileMeta.id) !== String(urls.fileId)) {
  // Log-only style signal in output; still write to urls.fileId (the ID used to download).
  console.log('WRITEBACK_FILE_ID_NOTE: redownload id=' + fileMeta.id + ' run fileId=' + urls.fileId + '; using run fileId');
}
const deployedAt = new Date().toISOString();
pkg.deployment = pkg.deployment || {};
pkg.deployment.landing = pkg.deployment.landing || {};
pkg.deployment.landing.vercelProjectId = urls.projectId;
pkg.deployment.landing.url = urls.publicUrl;
pkg.deployment.landing.deploymentUrl = urls.deploymentUrl;
pkg.deployment.landing.lastDeployedAt = deployedAt;
if (!pkg.deployment.githubRepoUrl) {
  pkg.deployment.githubRepoUrl = urls.githubRepoUrl;
}
const outText = JSON.stringify(pkg, null, 2);
const binary = await this.helpers.prepareBinaryData(Buffer.from(outText, 'utf8'), 'app.json', 'application/json');
return [{
  json: {
    appId: pkg.appId,
    fileId,
    publicUrl: urls.publicUrl,
    deploymentUrl: urls.deploymentUrl,
    vercelProjectId: urls.projectId,
    githubRepoUrl: pkg.deployment.githubRepoUrl,
    lastDeployedAt: deployedAt,
    status: pkg.status,
  },
  binary: { data: binary },
}];`;

const expandMediaCode = `const ctx = $('Push App Config').first().json;
const base = $('Transform To App Config').first().json;
const assets = base.mediaAssets || [];
if (!assets.length) {
  return [{
    json: {
      ...base,
      skipMedia: true,
      fetchUrl: '',
      filePath: '',
    },
  }];
}
return assets.map((a) => ({
  json: {
    appId: base.appId,
    landingOwner: base.landingOwner,
    landingRepo: base.landingRepo,
    commitMessage: base.commitMessage,
    fetchUrl: a.fetchUrl,
    filePath: a.filePath,
    publicName: a.publicName,
    skipMedia: false,
  },
}));`;

const afterMediaLoopCode = `const ctx = $('Transform To App Config').first().json;
return [{
  json: {
    appId: ctx.appId,
    fileId: ctx.fileId,
    folderId: ctx.folderId,
    vercelTeamId: ctx.vercelTeamId,
    vercelPollIntervalSeconds: ctx.vercelPollIntervalSeconds,
    vercelPollMaxMinutes: ctx.vercelPollMaxMinutes,
    githubRepoUrl: ctx.githubRepoUrl,
    landingOwner: ctx.landingOwner,
    landingRepo: ctx.landingRepo,
    vercelLandingProjectName: ctx.vercelLandingProjectName,
    vercelLandingProjectId: ctx.vercelLandingProjectId,
    mediaPushDone: true,
  },
}];`;

const manualRun = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {
    name: 'Manual Run',
    output: [{ json: {} }],
  },
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
          {
            id: 'appId',
            name: 'appId',
            value: 'human-lab-wf1-sandbox',
            type: 'string',
          },
          {
            id: 'driveParentFolderId',
            name: 'driveParentFolderId',
            value: '1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A',
            type: 'string',
          },
          {
            id: 'vercelTeamId',
            name: 'vercelTeamId',
            value: 'team_CvzW7iL13TaNbaIiaCHfjafe',
            type: 'string',
          },
          {
            id: 'githubOrgOrUser',
            name: 'githubOrgOrUser',
            value: 'scootero',
            type: 'string',
          },
          {
            id: 'landingTemplateRepo',
            name: 'landingTemplateRepo',
            value: 'scootero/Landing-Page-Template',
            type: 'string',
          },
          {
            id: 'landingTemplateBranch',
            name: 'landingTemplateBranch',
            value: 'main',
            type: 'string',
          },
          {
            id: 'landingTargetsJson',
            name: 'landingTargetsJson',
            value:
              '{"human-lab-wf1-sandbox":{"landingGithubRepo":"scootero/Human-Lab-WF2-Sandbox","vercelLandingProjectName":"human-lab-wf2-sandbox","vercelLandingProjectId":"prj_9gbSkYZTlRMF3iLVxOIM40OswVMU"}}',
            type: 'string',
          },
          {
            id: 'vercelPollIntervalSeconds',
            name: 'vercelPollIntervalSeconds',
            value: 15,
            type: 'number',
          },
          {
            id: 'vercelPollMaxMinutes',
            name: 'vercelPollMaxMinutes',
            value: 10,
            type: 'number',
          },
        ],
      },
    },
    output: [
      {
        json: {
          appId: 'human-lab-wf1-sandbox',
          driveParentFolderId: '1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A',
          vercelTeamId: 'team_CvzW7iL13TaNbaIiaCHfjafe',
          githubOrgOrUser: 'scootero',
          landingTemplateRepo: 'scootero/Landing-Page-Template',
          landingTemplateBranch: 'main',
          landingTargetsJson:
            '{"human-lab-wf1-sandbox":{"landingGithubRepo":"scootero/Human-Lab-WF2-Sandbox","vercelLandingProjectName":"human-lab-wf2-sandbox","vercelLandingProjectId":"prj_9gbSkYZTlRMF3iLVxOIM40OswVMU"}}',
          vercelPollIntervalSeconds: 15,
          vercelPollMaxMinutes: 10,
        },
      },
    ],
  },
});

const searchAppFolder = node({
  type: 'n8n-nodes-base.googleDrive',
  version: 3,
  config: {
    name: 'Search App Folder',
    parameters: {
      resource: 'fileFolder',
      operation: 'search',
      authentication: 'serviceAccount',
      searchMethod: 'name',
      queryString: expr('{{ $json.appId }}'),
      returnAll: false,
      limit: 5,
      filter: {
        folderId: {
          __rl: true,
          mode: 'id',
          value: expr('{{ $json.driveParentFolderId }}'),
        },
        whatToSearch: 'folders',
      },
    },
    credentials: {
      googleApi: newCredential('Google Service Account account'),
    },
    output: [{ json: { id: '16A8D5u2wDYlrlnqd-Sv0O0IPARwV-jF8', name: 'human-lab-wf1-sandbox' } }],
  },
});

const searchAppJson = node({
  type: 'n8n-nodes-base.googleDrive',
  version: 3,
  config: {
    name: 'Search app.json',
    parameters: {
      resource: 'fileFolder',
      operation: 'search',
      authentication: 'serviceAccount',
      searchMethod: 'name',
      queryString: 'app.json',
      returnAll: false,
      limit: 5,
      filter: {
        folderId: {
          __rl: true,
          mode: 'id',
          value: expr('{{ $json.id }}'),
        },
        whatToSearch: 'files',
      },
    },
    credentials: {
      googleApi: newCredential('Google Service Account account'),
    },
    output: [{ json: { id: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn', name: 'app.json' } }],
  },
});

const downloadAppJson = node({
  type: 'n8n-nodes-base.googleDrive',
  version: 3,
  config: {
    name: 'Download app.json',
    parameters: {
      resource: 'file',
      operation: 'download',
      authentication: 'serviceAccount',
      fileId: {
        __rl: true,
        mode: 'id',
        value: expr('{{ $json.id }}'),
      },
      options: {
        binaryPropertyName: 'data',
      },
    },
    credentials: {
      googleApi: newCredential('Google Service Account account'),
    },
    output: [
      {
        json: { id: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn', name: 'app.json' },
        binary: { data: { mimeType: 'application/json', fileName: 'app.json' } },
      },
    ],
  },
});

const parseAndGate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Parse And Gate Status',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: parseAndGateCode,
    },
    output: [
      {
        json: {
          appId: 'human-lab-wf1-sandbox',
          status: 'ready',
          statusReady: true,
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
        },
      },
    ],
  },
});

const statusReadyGate = ifElse({
  version: 2.3,
  config: {
    name: 'Status Ready?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: {
          caseSensitive: true,
          leftValue: '',
          typeValidation: 'loose',
          version: 2,
        },
        conditions: [
          {
            id: 'status-ready',
            leftValue: expr('{{ $json.statusReady }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
      looseTypeValidation: true,
    },
  },
});

const validateMockupAndResolve = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validate Mockup And Resolve Targets',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: validateMockupAndResolveCode,
    },
    output: [
      {
        json: {
          appId: 'human-lab-wf1-sandbox',
          mockupUrl: 'https://human-lab-wf1-sandbox.vercel.app',
          landingOwner: 'scootero',
          landingRepo: 'Human-Lab-WF2-Sandbox',
          vercelLandingProjectId: 'prj_9gbSkYZTlRMF3iLVxOIM40OswVMU',
        },
      },
    ],
  },
});

const verifyLandingRepo = node({
  type: 'n8n-nodes-base.github',
  version: 1.1,
  config: {
    name: 'Verify Landing Repo',
    parameters: {
      resource: 'repository',
      operation: 'get',
      owner: {
        __rl: true,
        mode: 'name',
        value: expr('{{ $json.landingOwner }}'),
      },
      repository: {
        __rl: true,
        mode: 'name',
        value: expr('{{ $json.landingRepo }}'),
      },
    },
    credentials: {
      githubApi: newCredential('GitHub account'),
    },
    output: [
      {
        json: {
          full_name: 'scootero/Human-Lab-WF2-Sandbox',
          default_branch: 'main',
        },
      },
    ],
  },
});

const transformAppConfig = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Transform To App Config',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: transformAppConfigCode,
    },
    output: [
      {
        json: {
          appId: 'human-lab-wf1-sandbox',
          appConfigContent: '{}',
          mediaAssets: [],
          landingOwner: 'scootero',
          landingRepo: 'Human-Lab-WF2-Sandbox',
        },
      },
    ],
  },
});

const pushAppConfig = node({
  type: 'n8n-nodes-base.github',
  version: 1.1,
  config: {
    name: 'Push App Config',
    parameters: {
      resource: 'file',
      operation: 'edit',
      owner: {
        __rl: true,
        mode: 'name',
        value: expr('{{ $json.landingOwner }}'),
      },
      repository: {
        __rl: true,
        mode: 'name',
        value: expr('{{ $json.landingRepo }}'),
      },
      filePath: 'app-data/app-config.json',
      binaryData: false,
      fileContent: expr('{{ $json.appConfigContent }}'),
      commitMessage: expr('{{ $json.commitMessage }}'),
      additionalParameters: {
        branch: {
          branch: 'main',
        },
      },
    },
    credentials: {
      githubApi: newCredential('GitHub account'),
    },
    output: [{ json: { content: { path: 'app-data/app-config.json' } } }],
  },
});

const expandMediaAssets = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Expand Media Assets',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: expandMediaCode,
    },
    output: [
      {
        json: {
          fetchUrl: 'https://raw.githubusercontent.com/scootero/Human-Lab-WF1-Sandbox/main/media/icon.png',
          filePath: 'app-data/images/icon.png',
          landingOwner: 'scootero',
          landingRepo: 'Human-Lab-WF2-Sandbox',
        },
      },
    ],
  },
});

const mediaLoop = splitInBatches({
  version: 3,
  config: {
    name: 'Media Upload Loop',
    parameters: {
      batchSize: 1,
    },
  },
});

const skipEmptyMedia = ifElse({
  version: 2.3,
  config: {
    name: 'Has Media Fetch Url?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: {
          caseSensitive: true,
          leftValue: '',
          typeValidation: 'loose',
          version: 2,
        },
        conditions: [
          {
            id: 'has-fetch',
            leftValue: expr('{{ $json.fetchUrl }}'),
            rightValue: '',
            operator: { type: 'string', operation: 'notEmpty', singleValue: true },
          },
        ],
      },
      looseTypeValidation: true,
    },
  },
});

const downloadMediaAsset = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Download Media Asset',
    parameters: {
      method: 'GET',
      url: expr('{{ $json.fetchUrl }}'),
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
    output: [
      {
        json: { filePath: 'app-data/images/icon.png' },
        binary: { data: { mimeType: 'image/png', fileName: 'icon.png' } },
      },
    ],
  },
});

const restoreMediaMeta = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Restore Media Meta',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const meta = $('Media Upload Loop').first().json;
const item = $input.first();
return [{
  json: {
    ...meta,
    landingOwner: meta.landingOwner,
    landingRepo: meta.landingRepo,
    filePath: meta.filePath,
    commitMessage: meta.commitMessage,
    publicName: meta.publicName,
  },
  binary: item.binary,
}];`,
    },
    output: [
      {
        json: {
          landingOwner: 'scootero',
          landingRepo: 'Human-Lab-WF2-Sandbox',
          filePath: 'app-data/images/icon.png',
          commitMessage: 'WF2 deploy',
        },
        binary: { data: { mimeType: 'image/png', fileName: 'icon.png' } },
      },
    ],
  },
});

const pushMediaAsset = node({
  type: 'n8n-nodes-base.github',
  version: 1.1,
  config: {
    name: 'Push Media Asset',
    parameters: {
      resource: 'file',
      operation: 'edit',
      owner: {
        __rl: true,
        mode: 'name',
        value: expr('{{ $json.landingOwner }}'),
      },
      repository: {
        __rl: true,
        mode: 'name',
        value: expr('{{ $json.landingRepo }}'),
      },
      filePath: expr('{{ $json.filePath }}'),
      binaryData: true,
      binaryPropertyName: 'data',
      commitMessage: expr('{{ $json.commitMessage }}'),
      additionalParameters: {
        branch: {
          branch: 'main',
        },
      },
    },
    credentials: {
      githubApi: newCredential('GitHub account'),
    },
    output: [{ json: { content: { path: 'app-data/images/icon.png' } } }],
  },
});
const afterMediaLoop = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'After Media Loop',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: afterMediaLoopCode,
    },
    output: [
      {
        json: {
          appId: 'human-lab-wf1-sandbox',
          mediaPushDone: true,
          vercelLandingProjectId: 'prj_9gbSkYZTlRMF3iLVxOIM40OswVMU',
        },
      },
    ],
  },
});

const prepareDeployBody = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Deploy Body',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: prepareDeployBodyCode,
    },
    output: [
      {
        json: {
          deployBody: {
            name: 'human-lab-wf2-sandbox',
            project: 'prj_9gbSkYZTlRMF3iLVxOIM40OswVMU',
            target: 'production',
            gitSource: {
              type: 'github',
              org: 'scootero',
              repo: 'Human-Lab-WF2-Sandbox',
              ref: 'main',
            },
          },
        },
      },
    ],
  },
});

const triggerVercelDeploy = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Trigger Vercel Deploy',
    retryOnFail: true,
    maxTries: 3,
    parameters: {
      method: 'POST',
      url: expr('{{ "https://api.vercel.com/v13/deployments?teamId=" + $json.vercelTeamId }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ $json.deployBody }}'),
    },
    credentials: {
      httpHeaderAuth: newCredential('Header Auth account'),
    },
    output: [
      {
        json: {
          id: 'dpl_example',
          readyState: 'INITIALIZING',
          projectId: 'prj_9gbSkYZTlRMF3iLVxOIM40OswVMU',
        },
      },
    ],
  },
});

const preparePollContext = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Poll Context',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: preparePollContextCode,
    },
    output: [
      {
        json: {
          deploymentId: 'dpl_example',
          pollStartedAt: '2026-07-10T20:00:00.000Z',
          vercelTeamId: 'team_CvzW7iL13TaNbaIiaCHfjafe',
        },
      },
    ],
  },
});

const waitBeforePoll = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Wait Before Poll',
    parameters: {
      resume: 'timeInterval',
      amount: 15,
      unit: 'seconds',
    },
    output: [{ json: { deploymentId: 'dpl_example' } }],
  },
});

const pollVercelDeploy = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Poll Vercel Deploy',
    parameters: {
      method: 'GET',
      url: expr(
        '{{ "https://api.vercel.com/v13/deployments/" + $json.deploymentId + "?teamId=" + $json.vercelTeamId }}'
      ),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
    },
    credentials: {
      httpHeaderAuth: newCredential('Header Auth account'),
    },
    output: [
      {
        json: {
          id: 'dpl_example',
          readyState: 'READY',
          alias: ['human-lab-wf2-sandbox.vercel.app'],
          url: 'human-lab-wf2-sandbox-hash-scooteros-projects.vercel.app',
          projectId: 'prj_9gbSkYZTlRMF3iLVxOIM40OswVMU',
        },
      },
    ],
  },
});

const mergePollResult = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge Poll Result',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergePollResultCode,
    },
    output: [{ json: { isReady: true, readyState: 'READY' } }],
  },
});

const deployReadyGate = ifElse({
  version: 2.3,
  config: {
    name: 'Deploy Ready?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: {
          caseSensitive: true,
          leftValue: '',
          typeValidation: 'loose',
          version: 2,
        },
        conditions: [
          {
            id: 'deploy-ready',
            leftValue: expr('{{ $json.isReady }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
      looseTypeValidation: true,
    },
  },
});

const extractPublicAlias = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Extract Public Alias',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: extractUrlsCode,
    },
    output: [
      {
        json: {
          publicUrl: 'https://human-lab-wf2-sandbox.vercel.app',
          needsDomainsFallback: false,
        },
      },
    ],
  },
});

const needsDomainsFallback = ifElse({
  version: 2.3,
  config: {
    name: 'Needs Domains Fallback?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: {
          caseSensitive: true,
          leftValue: '',
          typeValidation: 'loose',
          version: 2,
        },
        conditions: [
          {
            id: 'needs-domains',
            leftValue: expr('{{ $json.needsDomainsFallback }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
      looseTypeValidation: true,
    },
  },
});

const getProjectDomains = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Get Project Domains',
    parameters: {
      method: 'GET',
      url: expr(
        '{{ "https://api.vercel.com/v9/projects/" + $json.projectId + "/domains?production=true&target=production&teamId=" + $json.vercelTeamId }}'
      ),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
    },
    credentials: {
      httpHeaderAuth: newCredential('Header Auth account'),
    },
    output: [{ json: { domains: [{ name: 'human-lab-wf2-sandbox.vercel.app', verified: true }] } }],
  },
});

const resolveFromDomains = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resolve From Domains',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: resolveDomainsCode,
    },
    output: [{ json: { publicUrl: 'https://human-lab-wf2-sandbox.vercel.app' } }],
  },
});

const passThroughUrls = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pass Through Public Url',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: passThroughUrlsCode,
    },
    output: [{ json: { publicUrl: 'https://human-lab-wf2-sandbox.vercel.app' } }],
  },
});

const resolveFinalPublicUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resolve Final Public Url',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const item = $input.first().json;
if (!item.publicUrl) {
  throw new Error('ALIAS_RESOLVE_FAILED: publicUrl missing after alias/domains resolution');
}
return [{ json: item }];`,
    },
    output: [{ json: { publicUrl: 'https://human-lab-wf2-sandbox.vercel.app' } }],
  },
});

const verifyPublicHttp = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Verify Public URL HTTP',
    parameters: {
      method: 'GET',
      url: expr('{{ $json.publicUrl }}'),
      authentication: 'none',
      options: {
        redirect: {
          redirect: {
            followRedirects: false,
          },
        },
        response: {
          response: {
            fullResponse: true,
            neverError: true,
            responseFormat: 'text',
          },
        },
      },
    },
    output: [{ json: { statusCode: 200, headers: { 'content-type': 'text/html' }, body: 'ok' } }],
  },
});

const verifyPublicUrlGate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Verify Public URL Gate',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: verifyPublicUrlCode,
    },
    output: [{ json: { verifyOk: true, publicUrl: 'https://human-lab-wf2-sandbox.vercel.app' } }],
  },
});

const redownloadAppJson = node({
  type: 'n8n-nodes-base.googleDrive',
  version: 3,
  config: {
    name: 'Re-download app.json',
    parameters: {
      resource: 'file',
      operation: 'download',
      authentication: 'serviceAccount',
      fileId: {
        __rl: true,
        mode: 'id',
        value: expr('{{ $json.fileId }}'),
      },
      options: {
        binaryPropertyName: 'data',
      },
    },
    credentials: {
      googleApi: newCredential('Google Service Account account'),
    },
    output: [
      {
        json: { id: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn', name: 'app.json' },
        binary: { data: { mimeType: 'application/json', fileName: 'app.json' } },
      },
    ],
  },
});

const mergeWriteAppJson = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge Write app.json',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergeWriteCode,
    },
    output: [
      {
        json: {
          appId: 'human-lab-wf1-sandbox',
          publicUrl: 'https://human-lab-wf2-sandbox.vercel.app',
          status: 'ready',
        },
        binary: { data: { mimeType: 'application/json', fileName: 'app.json' } },
      },
    ],
  },
});

const updateDriveAppJson = node({
  type: 'n8n-nodes-base.googleDrive',
  version: 3,
  config: {
    name: 'Update Drive app.json',
    parameters: {
      resource: 'file',
      operation: 'update',
      authentication: 'serviceAccount',
      fileId: {
        __rl: true,
        mode: 'id',
        value: expr('{{ $json.fileId }}'),
      },
      changeFileContent: true,
      inputDataFieldName: 'data',
    },
    credentials: {
      googleApi: newCredential('Google Service Account account'),
    },
    output: [{ json: { id: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn', name: 'app.json' } }],
  },
});

const skipNotReady = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Skip Not Ready',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          {
            id: 'skipped',
            name: 'skipped',
            value: true,
            type: 'boolean',
          },
          {
            id: 'reason',
            name: 'reason',
            value: 'status_not_ready',
            type: 'string',
          },
        ],
      },
    },
    output: [{ json: { skipped: true, reason: 'status_not_ready' } }],
  },
});

const restoreContextAfterRepo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Restore Context After Repo',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const prev = $('Validate Mockup And Resolve Targets').first().json;
return [{ json: prev }];`,
    },
    output: [
      {
        json: {
          appId: 'human-lab-wf1-sandbox',
          mockupUrl: 'https://human-lab-wf1-sandbox.vercel.app',
          landingOwner: 'scootero',
          landingRepo: 'Human-Lab-WF2-Sandbox',
        },
      },
    ],
  },
});

const passMediaContext = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pass Media Context',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const item = $input.first().json;
return [{ json: item }];`,
    },
    output: [{ json: { fetchUrl: '', filePath: '' } }],
  },
});

export default workflow('wf2-landing-deploy', 'WF2 Landing Deploy')
  .add(manualRun)
  .to(workflowConfig)
  .to(searchAppFolder)
  .to(searchAppJson)
  .to(downloadAppJson)
  .to(parseAndGate)
  .to(
    statusReadyGate
      .onTrue(
        validateMockupAndResolve
          .to(verifyLandingRepo)
          .to(restoreContextAfterRepo)
          .to(transformAppConfig)
          .to(pushAppConfig)
          .to(expandMediaAssets)
          .to(
            mediaLoop
              .onEachBatch(
                skipEmptyMedia
                  .onTrue(
                    downloadMediaAsset
                      .to(restoreMediaMeta)
                      .to(pushMediaAsset)
                      .to(nextBatch(mediaLoop))
                  )
                  .onFalse(passMediaContext.to(nextBatch(mediaLoop)))
              )
              .onDone(
                afterMediaLoop
                  .to(prepareDeployBody)
                  .to(triggerVercelDeploy)
                  .to(preparePollContext)
                  .to(waitBeforePoll)
                  .to(pollVercelDeploy)
                  .to(mergePollResult)
                  .to(
                    deployReadyGate
                      .onTrue(
                        extractPublicAlias.to(
                          needsDomainsFallback
                            .onTrue(
                              getProjectDomains
                                .to(resolveFromDomains)
                                .to(resolveFinalPublicUrl)
                                .to(verifyPublicHttp)
                                .to(verifyPublicUrlGate)
                                .to(redownloadAppJson)
                                .to(mergeWriteAppJson)
                                .to(updateDriveAppJson)
                            )
                            .onFalse(
                              passThroughUrls
                                .to(resolveFinalPublicUrl)
                                .to(verifyPublicHttp)
                                .to(verifyPublicUrlGate)
                                .to(redownloadAppJson)
                                .to(mergeWriteAppJson)
                                .to(updateDriveAppJson)
                            )
                        )
                      )
                      .onFalse(waitBeforePoll)
                  )
              )
          )
      )
      .onFalse(skipNotReady)
  );
