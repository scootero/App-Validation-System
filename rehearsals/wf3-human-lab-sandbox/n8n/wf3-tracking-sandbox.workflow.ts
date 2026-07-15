import {
  workflow,
  node,
  trigger,
  ifElse,
  expr,
  newCredential,
} from '@n8n/workflow-sdk';

const columnSchema = [
  { id: 'timestamp', displayName: 'timestamp', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'eventType', displayName: 'eventType', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'appId', displayName: 'appId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'appName', displayName: 'appName', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'experimentId', displayName: 'experimentId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'experimentRunId', displayName: 'experimentRunId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'projectId', displayName: 'projectId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'deploymentId', displayName: 'deploymentId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'landingVersion', displayName: 'landingVersion', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'landingVariantId', displayName: 'landingVariantId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'mockupVersionId', displayName: 'mockupVersionId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'campaignName', displayName: 'campaignName', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'visitorId', displayName: 'visitorId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'sessionId', displayName: 'sessionId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'email', displayName: 'email', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'price', displayName: 'price', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'pageUrl', displayName: 'pageUrl', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'referrer', displayName: 'referrer', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'utmSource', displayName: 'utmSource', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'utmMedium', displayName: 'utmMedium', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'utmCampaign', displayName: 'utmCampaign', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'utmContent', displayName: 'utmContent', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'utmTerm', displayName: 'utmTerm', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'timeOnPageSeconds', displayName: 'timeOnPageSeconds', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'mockupInteracted', displayName: 'mockupInteracted', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'eventId', displayName: 'eventId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'receivedAt', displayName: 'receivedAt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'fbclid', displayName: 'fbclid', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'consentStatus', displayName: 'consentStatus', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'metaCampaignId', displayName: 'metaCampaignId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'metaAdSetId', displayName: 'metaAdSetId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'metaAdId', displayName: 'metaAdId', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
  { id: 'placement', displayName: 'placement', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
];

const validateAuthCode = "const item = $input.first().json;\nconst secret = item.webhookAuthSecret;\nconst headers = $('Landing Event Webhook').first().json.headers || {};\nconst auth = headers.authorization || headers.Authorization || '';\nif (!secret) {\n  return [{ json: item }];\n}\nif (auth !== ('Bearer ' + secret)) {\n  throw new Error('UNAUTHORIZED');\n}\nreturn [{ json: item }];";

const validatePayloadCode = "const item = $input.first().json;\nconst body = item.body && typeof item.body === 'object' ? item.body : item;\nconst allowed = new Set(['page_view','email_captured','buy_now_clicked','mockup_interacted']);\nconst required = ['eventType','appId','appName','experimentId','experimentRunId','timestamp'];\nconst missing = required.filter((k) => body[k] === undefined || body[k] === null || body[k] === '');\nconst invalidType = !allowed.has(body.eventType);\nreturn [{\n  json: {\n    ...body,\n    googleSheetId: item.googleSheetId,\n    googleSheetTabName: item.googleSheetTabName,\n    webhookAuthSecret: item.webhookAuthSecret,\n    _validationFailed: Boolean(missing.length || invalidType),\n    _validationErrors: [\n      ...(missing.length ? ['missing: ' + missing.join(',')] : []),\n      ...(invalidType ? ['invalid eventType: ' + body.eventType] : []),\n    ],\n  },\n}];";

const mapToSheetRowCode = "const p = $input.first().json;\nconst columns = ['timestamp','eventType','appId','appName','experimentId','experimentRunId','projectId','deploymentId','landingVersion','landingVariantId','mockupVersionId','campaignName','visitorId','sessionId','email','price','pageUrl','referrer','utmSource','utmMedium','utmCampaign','utmContent','utmTerm','timeOnPageSeconds','mockupInteracted','eventId','receivedAt','fbclid','consentStatus','metaCampaignId','metaAdSetId','metaAdId','placement'];\nfunction uuid() {\n  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();\n  return Date.now() + '-' + Math.random().toString(36).slice(2, 11);\n}\nconst receivedAt = new Date().toISOString();\nconst row = {};\nfor (const c of columns) {\n  if (c === 'receivedAt') { row[c] = receivedAt; continue; }\n  if (c === 'eventId') { row[c] = p.eventId ? p.eventId : uuid(); continue; }\n  if (c === 'consentStatus') { row[c] = p.consentStatus ? p.consentStatus : 'unknown'; continue; }\n  if (c === 'metaCampaignId' || c === 'metaAdSetId' || c === 'metaAdId' || c === 'placement') { row[c] = p[c] == null ? '' : p[c]; continue; }\n  if (p[c] === undefined || p[c] === null) {\n    row[c] = c === 'timeOnPageSeconds' ? 0 : c === 'mockupInteracted' ? false : '';\n  } else {\n    row[c] = p[c];\n  }\n}\nif (p._validationFailed) {\n  return [{ json: Object.assign({}, row, {\n    _skipAppend: true,\n    _validationErrors: p._validationErrors || [],\n  }) }];\n}\nreturn [{ json: Object.assign({}, row, { _skipAppend: false }) }];";

const landingEventWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Landing Event Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'app-validation/events',
      authentication: 'none',
      responseMode: 'responseNode',
    },
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
            id: 'googleSheetId',
            name: 'googleSheetId',
            value: '1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0',
            type: 'string',
          },
          {
            id: 'googleSheetTabName',
            name: 'googleSheetTabName',
            value: 'Sheet1',
            type: 'string',
          },
          {
            id: 'webhookAuthSecret',
            name: 'webhookAuthSecret',
            value: '',
            type: 'string',
          },
        ],
      },
    },
  },
});

const validateAuth = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validate Auth',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: validateAuthCode,
    },
  },
});

const validatePayload = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validate Payload',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: validatePayloadCode,
    },
  },
});

const mapToSheetRow = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Map To Sheet Row',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mapToSheetRowCode,
    },
  },
});

const routeValidEvents = ifElse({
  version: 2.3,
  config: {
    name: 'Route Valid Events',
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
            id: 'skip-check',
            leftValue: expr('{{ !$json._skipAppend }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true' },
          },
        ],
      },
      looseTypeValidation: true,
    },
  },
});

const appendRow = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Append Row',
    retryOnFail: true,
    maxTries: 3,
    parameters: {
      resource: 'sheet',
      operation: 'append',
      authentication: 'serviceAccount',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1KWB1EL79vwZ6YUiolXDoCXWb2bWw5fiZp1fGPNC7px0',
        cachedResultName: 'App Validation - WF3 Sandbox',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: 'gid=0',
        cachedResultName: 'Sheet1',
      },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          timestamp: '={{ $json.timestamp }}',
          eventType: '={{ $json.eventType }}',
          appId: '={{ $json.appId }}',
          appName: '={{ $json.appName }}',
          experimentId: '={{ $json.experimentId }}',
          experimentRunId: '={{ $json.experimentRunId }}',
          projectId: '={{ $json.projectId }}',
          deploymentId: '={{ $json.deploymentId }}',
          landingVersion: '={{ $json.landingVersion }}',
          landingVariantId: '={{ $json.landingVariantId }}',
          mockupVersionId: '={{ $json.mockupVersionId }}',
          campaignName: '={{ $json.campaignName }}',
          visitorId: '={{ $json.visitorId }}',
          sessionId: '={{ $json.sessionId }}',
          email: '={{ $json.email }}',
          price: '={{ $json.price }}',
          pageUrl: '={{ $json.pageUrl }}',
          referrer: '={{ $json.referrer }}',
          utmSource: '={{ $json.utmSource }}',
          utmMedium: '={{ $json.utmMedium }}',
          utmCampaign: '={{ $json.utmCampaign }}',
          utmContent: '={{ $json.utmContent }}',
          utmTerm: '={{ $json.utmTerm }}',
          timeOnPageSeconds: '={{ $json.timeOnPageSeconds }}',
          mockupInteracted: '={{ $json.mockupInteracted }}',
          eventId: '={{ $json.eventId }}',
          receivedAt: '={{ $json.receivedAt }}',
          fbclid: '={{ $json.fbclid }}',
          consentStatus: '={{ $json.consentStatus }}',
          metaCampaignId: '={{ $json.metaCampaignId }}',
          metaAdSetId: '={{ $json.metaAdSetId }}',
          metaAdId: '={{ $json.metaAdId }}',
          placement: '={{ $json.placement }}',
        },
        schema: columnSchema,
      },
      options: {
        cellFormat: 'USER_ENTERED',
        handlingExtraData: 'ignoreIt',
        useAppend: true,
      },
    },
  },
  credentials: {
    googleApi: newCredential('Google Service Account account'),
  },
});

const respond200 = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond 200',
    parameters: {
      respondWith: 'json',
      responseBody:
        '={{ JSON.stringify($json._skipAppend ? { ok: false, skipped: true, errors: $json._validationErrors || [] } : { ok: true }) }}',
      options: {
        responseCode: 200,
      },
    },
  },
});

export default workflow('wf3-tracking-sandbox', 'WF3 - Tracking Sandbox')
  .add(landingEventWebhook)
  .to(workflowConfig)
  .to(validateAuth)
  .to(validatePayload)
  .to(mapToSheetRow)
  .to(
    routeValidEvents
      .onTrue(appendRow.to(respond200))
      .onFalse(respond200)
  );
