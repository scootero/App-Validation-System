import {
  workflow,
  node,
  trigger,
  ifElse,
  expr,
  newCredential,
} from '@n8n/workflow-sdk';

const SHARED_WEBHOOK_URL =
  'https://scottyo.app.n8n.cloud/webhook/app-validation/events';

const resolveAppJsonCode = `const files = $input.all();
const appJsonFiles = [];
for (let i = 0; i < files.length; i++) {
  const f = files[i].json;
  if (f.name === 'app.json') {
    appJsonFiles.push(f);
  }
}
if (appJsonFiles.length !== 1) {
  throw new Error('APP_JSON_RESOLVE_FAILED: expected exactly 1 app.json, found ' + appJsonFiles.length);
}
const cfg = $('Workflow Config').first().json;
const folder = $('Search App Folder').first().json;
return [{
  json: {
    appId: cfg.appId,
    driveParentFolderId: cfg.driveParentFolderId,
    sharedWebhookUrl: cfg.sharedWebhookUrl,
    fileId: appJsonFiles[0].id,
    folderId: folder.id,
    fileName: appJsonFiles[0].name,
  },
}];`;

const parseValidateCode = `const cfg = $('Workflow Config').first().json;
const fileMeta = $('Download app.json').first().json;
const buf = await this.helpers.getBinaryDataBuffer(0, 'data');
const text = buf.toString('utf8');
let pkg;
try {
  pkg = JSON.parse(text);
} catch (e) {
  throw new Error('PARSE_FAILED: ' + e.message);
}
const errors = [];
if (!pkg.appId) {
  errors.push('missing appId');
} else if (pkg.appId !== cfg.appId) {
  errors.push('appId mismatch: expected ' + cfg.appId + ', got ' + pkg.appId);
}
const statusProvisioning = pkg.status === 'provisioning';
if (!pkg.identity || !pkg.identity.appName || !String(pkg.identity.appName).trim()) {
  errors.push('missing identity.appName');
}
const analytics = pkg.analytics || {};
if (!analytics.projectId) errors.push('missing analytics.projectId');
if (!analytics.experimentId) errors.push('missing analytics.experimentId');
if (!analytics.experimentRunId) errors.push('missing analytics.experimentRunId');
if (pkg.tracking !== undefined) {
  const t = pkg.tracking;
  if (t === null || typeof t !== 'object' || Array.isArray(t)) {
    errors.push('tracking must be an object when present');
  }
}
const url = cfg.sharedWebhookUrl;
if (url !== 'https://scottyo.app.n8n.cloud/webhook/app-validation/events') {
  errors.push('invalid sharedWebhookUrl config');
}
return [{
  json: {
    appId: cfg.appId,
    fileId: fileMeta.id || fileMeta.fileId,
    folderId: $('Search App Folder').first().json.id,
    driveParentFolderId: cfg.driveParentFolderId,
    sharedWebhookUrl: cfg.sharedWebhookUrl,
    statusProvisioning,
    validationPassed: errors.length === 0,
    validationErrors: errors,
    beforeStatus: pkg.status,
    beforeWebhookUrl: pkg.tracking && pkg.tracking.webhookUrl !== undefined ? pkg.tracking.webhookUrl : null,
  },
}];`;

const mergeWriteDiffGuardCode = `const ctx = $('Parse + Validate Provisioning').first().json;
const fileMeta = $('Re-download app.json').first().json;
const buf = await this.helpers.getBinaryDataBuffer(0, 'data');
const text = buf.toString('utf8');
let originalPkg;
try {
  originalPkg = JSON.parse(text);
} catch (e) {
  throw new Error('PARSE_FAILED_ON_WRITEBACK: ' + e.message);
}
if (originalPkg.status !== 'provisioning') {
  throw new Error('STATUS_CHANGED: expected provisioning, got ' + originalPkg.status);
}
if (originalPkg.appId !== ctx.appId) {
  throw new Error('WRITEBACK_APP_ID_MISMATCH');
}
const resolvedFileId = fileMeta.id || fileMeta.fileId;
if (resolvedFileId !== ctx.fileId) {
  throw new Error('WRITEBACK_FILE_MISMATCH: got ' + resolvedFileId + ' expected ' + ctx.fileId);
}
const beforeStatus = originalPkg.status;
const beforeWebhookUrl = originalPkg.tracking && originalPkg.tracking.webhookUrl !== undefined ? originalPkg.tracking.webhookUrl : null;
const mergedPkg = JSON.parse(text);
mergedPkg.tracking = mergedPkg.tracking || {};
mergedPkg.tracking.webhookUrl = ctx.sharedWebhookUrl;
mergedPkg.status = 'ready';
function flatten(obj, prefix) {
  const result = {};
  if (obj === null || typeof obj !== 'object') {
    result[prefix || 'root'] = obj;
    return result;
  }
  if (Array.isArray(obj)) {
    result[prefix || 'root'] = JSON.stringify(obj);
    return result;
  }
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const path = prefix ? prefix + '.' + k : k;
    const v = obj[k];
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const nested = flatten(v, path);
      const nestedKeys = Object.keys(nested);
      for (let j = 0; j < nestedKeys.length; j++) {
        result[nestedKeys[j]] = nested[nestedKeys[j]];
      }
    } else {
      result[path] = Array.isArray(v) ? JSON.stringify(v) : v;
    }
  }
  return result;
}
const flatOrig = flatten(originalPkg, '');
const flatMerged = flatten(mergedPkg, '');
const allowedPaths = { status: true, 'tracking.webhookUrl': true };
const allKeys = {};
const origKeys = Object.keys(flatOrig);
for (let i = 0; i < origKeys.length; i++) allKeys[origKeys[i]] = true;
const mergedKeys = Object.keys(flatMerged);
for (let i = 0; i < mergedKeys.length; i++) allKeys[mergedKeys[i]] = true;
const keyList = Object.keys(allKeys);
for (let i = 0; i < keyList.length; i++) {
  const k = keyList[i];
  if (allowedPaths[k]) continue;
  if (flatOrig[k] !== flatMerged[k]) {
    throw new Error('DIFF_GUARD_FAILED: disallowed change at ' + k);
  }
}
const outText = JSON.stringify(mergedPkg, null, 2);
const binary = await this.helpers.prepareBinaryData(Buffer.from(outText, 'utf8'), 'app.json', 'application/json');
return [{
  json: {
    appId: ctx.appId,
    fileId: ctx.fileId,
    beforeStatus,
    beforeWebhookUrl,
    afterStatus: 'ready',
    afterWebhookUrl: ctx.sharedWebhookUrl,
  },
  binary: { data: binary },
}];`;

const summarizeResultCode = `const mergeItem = $('Merge Write + Diff Guard').first().json;
return [{
  json: {
    ok: true,
    appId: mergeItem.appId,
    fileId: mergeItem.fileId,
    diff: {
      status: { before: mergeItem.beforeStatus, after: mergeItem.afterStatus },
      'tracking.webhookUrl': { before: mergeItem.beforeWebhookUrl, after: mergeItem.afterWebhookUrl },
    },
    summary: 'WF0 provisioning complete — only status and tracking.webhookUrl changed',
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
            id: 'sharedWebhookUrl',
            name: 'sharedWebhookUrl',
            value: SHARED_WEBHOOK_URL,
            type: 'string',
          },
        ],
      },
    },
    output: [
      {
        json: {
          appId: 'human-lab-wf1-sandbox',
          driveParentFolderId: '1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A',
          sharedWebhookUrl: SHARED_WEBHOOK_URL,
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

const listFolderFiles = node({
  type: 'n8n-nodes-base.googleDrive',
  version: 3,
  config: {
    name: 'List Folder Files',
    parameters: {
      resource: 'fileFolder',
      operation: 'search',
      authentication: 'serviceAccount',
      searchMethod: 'query',
      queryString: 'trashed = false',
      returnAll: true,
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
    output: [
      { json: { id: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn', name: 'app.json' } },
      { json: { id: 'other-file-id', name: 'readme.md' } },
    ],
  },
});

const resolveAppJson = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resolve app.json',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: resolveAppJsonCode,
    },
    output: [
      {
        json: {
          appId: 'human-lab-wf1-sandbox',
          driveParentFolderId: '1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A',
          sharedWebhookUrl: SHARED_WEBHOOK_URL,
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          folderId: '16A8D5u2wDYlrlnqd-Sv0O0IPARwV-jF8',
          fileName: 'app.json',
        },
      },
    ],
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

const parseValidateProvisioning = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Parse + Validate Provisioning',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: parseValidateCode,
    },
    output: [
      {
        json: {
          appId: 'human-lab-wf1-sandbox',
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          folderId: '16A8D5u2wDYlrlnqd-Sv0O0IPARwV-jF8',
          driveParentFolderId: '1O3RHwYFhJlPRBygNKxc7HGHmWtfiaB5A',
          sharedWebhookUrl: SHARED_WEBHOOK_URL,
          statusProvisioning: true,
          validationPassed: true,
          validationErrors: [],
          beforeStatus: 'provisioning',
          beforeWebhookUrl: null,
        },
      },
    ],
  },
});

const statusProvisioningGate = ifElse({
  version: 2.3,
  config: {
    name: 'Status Provisioning?',
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
            id: 'status-provisioning',
            leftValue: expr('{{ $json.statusProvisioning }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
      looseTypeValidation: true,
    },
  },
});

const validationPassedGate = ifElse({
  version: 2.3,
  config: {
    name: 'Validation Passed?',
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
            id: 'validation-passed',
            leftValue: expr('{{ $json.validationPassed }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
      looseTypeValidation: true,
    },
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

const mergeWriteDiffGuard = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge Write + Diff Guard',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergeWriteDiffGuardCode,
    },
    output: [
      {
        json: {
          appId: 'human-lab-wf1-sandbox',
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          beforeStatus: 'provisioning',
          beforeWebhookUrl: null,
          afterStatus: 'ready',
          afterWebhookUrl: SHARED_WEBHOOK_URL,
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

const summarizeResult = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Summarize Result',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: summarizeResultCode,
    },
    output: [
      {
        json: {
          ok: true,
          appId: 'human-lab-wf1-sandbox',
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          diff: {
            status: { before: 'provisioning', after: 'ready' },
            'tracking.webhookUrl': { before: null, after: SHARED_WEBHOOK_URL },
          },
          summary: 'WF0 provisioning complete — only status and tracking.webhookUrl changed',
        },
      },
    ],
  },
});

export default workflow('wf0-provisioning', 'WF0 Provisioning')
  .add(manualRun)
  .to(workflowConfig)
  .to(searchAppFolder)
  .to(listFolderFiles)
  .to(resolveAppJson)
  .to(downloadAppJson)
  .to(parseValidateProvisioning)
  .to(
    statusProvisioningGate
      .onTrue(
        validationPassedGate
          .onTrue(
            redownloadAppJson
              .to(mergeWriteDiffGuard)
              .to(updateDriveAppJson)
              .to(summarizeResult)
          )
      )
  );
