import {
  workflow,
  node,
  trigger,
  ifElse,
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
    vercelPollIntervalSeconds: cfg.vercelPollIntervalSeconds,
    vercelPollMaxMinutes: cfg.vercelPollMaxMinutes,
    source: pkg.source || {},
    pkg,
  },
}];`;

const validateSourceCode = `const item = $input.first().json;
const source = item.source || {};
const missing = [];
if (!source.mockupGithubRepo) missing.push('source.mockupGithubRepo');
if (!source.mockupBranch) missing.push('source.mockupBranch');
if (!source.mockupRootDirectory) missing.push('source.mockupRootDirectory');
if (!source.vercelMockupProjectId && !source.vercelMockupProjectName) {
  missing.push('source.vercelMockupProjectId|vercelMockupProjectName');
}
if (missing.length) {
  throw new Error('SOURCE_INVALID: ' + missing.join(', '));
}
let repo = String(source.mockupGithubRepo).trim();
repo = repo.replace(/^https?:\\/\\/github\\.com\\//i, '').replace(/\\.git$/i, '');
const parts = repo.split('/').filter(Boolean);
if (parts.length < 2) {
  throw new Error('SOURCE_INVALID: mockupGithubRepo must be org/repo');
}
const org = parts[0];
const repoName = parts[1];
const body = {
  target: 'production',
  gitSource: {
    type: 'github',
    org,
    repo: repoName,
    ref: source.mockupBranch,
  },
};
if (source.vercelMockupProjectId) {
  body.project = source.vercelMockupProjectId;
  body.name = source.vercelMockupProjectName || source.vercelMockupProjectId;
} else {
  body.name = source.vercelMockupProjectName;
}
return [{
  json: {
    ...item,
    org,
    repo: repoName,
    deployBody: body,
    projectIdHint: source.vercelMockupProjectId || null,
    projectNameHint: source.vercelMockupProjectName || null,
  },
}];`;

const preparePollContextCode = `const prev = $('Validate Source Metadata').first().json;
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
    deployment: dep,
  },
}];`;

const extractUrlsCode = `const item = $input.first().json;
const teamSlug = 'scooteros-projects';
function isProtectedHost(host) {
  return /-[a-z0-9]{5,}-/.test(host) || host.endsWith('-' + teamSlug + '.vercel.app');
}
function pickPublicAlias(aliases) {
  const hosts = (aliases || [])
    .map((a) => (typeof a === 'string' ? a : a.domain || a))
    .filter(Boolean)
    .map((h) => String(h).replace(/^https?:\\/\\//, ''));
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
    ' publicUrl=' + urls.publicUrl +
    ' deploymentUrl=' + urls.deploymentUrl +
    ' deploymentId=' + urls.deploymentId
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
  throw new Error('WRITEBACK_APP_ID_MISMATCH');
}
const fileMeta = $('Re-download app.json').first().json;
const resolvedFileId = fileMeta.id || fileMeta.fileId;
if (resolvedFileId !== urls.fileId) {
  throw new Error('WRITEBACK_FILE_MISMATCH: got ' + resolvedFileId + ' expected ' + urls.fileId);
}
const deployedAt = new Date().toISOString();
pkg.mockup = pkg.mockup || {};
pkg.mockup.previewUrl = urls.publicUrl;
pkg.deployment = pkg.deployment || {};
pkg.deployment.mockup = pkg.deployment.mockup || {};
pkg.deployment.mockup.vercelProjectId = urls.projectId;
pkg.deployment.mockup.url = urls.publicUrl;
pkg.deployment.mockup.deploymentUrl = urls.deploymentUrl;
pkg.deployment.mockup.lastDeployedAt = deployedAt;
const outText = JSON.stringify(pkg, null, 2);
const binary = await this.helpers.prepareBinaryData(Buffer.from(outText, 'utf8'), 'app.json', 'application/json');
return [{
  json: {
    appId: pkg.appId,
    fileId: urls.fileId,
    publicUrl: urls.publicUrl,
    deploymentUrl: urls.deploymentUrl,
    vercelProjectId: urls.projectId,
    lastDeployedAt: deployedAt,
    status: pkg.status,
  },
  binary: { data: binary },
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
          vercelTeamId: 'team_CvzW7iL13TaNbaIiaCHfjafe',
          source: {
            mockupGithubRepo: 'scootero/Human-Lab-WF1-Sandbox',
            mockupBranch: 'main',
            mockupRootDirectory: 'mockup',
            vercelMockupProjectId: 'prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM',
            vercelMockupProjectName: 'human-lab-wf1-sandbox',
          },
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

const validateSource = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validate Source Metadata',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: validateSourceCode,
    },
    output: [
      {
        json: {
          appId: 'human-lab-wf1-sandbox',
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          vercelTeamId: 'team_CvzW7iL13TaNbaIiaCHfjafe',
          projectIdHint: 'prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM',
          deployBody: {
            name: 'human-lab-wf1-sandbox',
            project: 'prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM',
            target: 'production',
            gitSource: {
              type: 'github',
              org: 'scootero',
              repo: 'Human-Lab-WF1-Sandbox',
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
      options: {
        response: {
          response: {
            neverError: false,
          },
        },
      },
    },
    credentials: {
      httpHeaderAuth: newCredential('Header Auth account'),
    },
    output: [
      {
        json: {
          id: 'dpl_example',
          readyState: 'INITIALIZING',
          url: 'human-lab-wf1-sandbox-hash-scooteros-projects.vercel.app',
          projectId: 'prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM',
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
          vercelPollMaxMinutes: 10,
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          appId: 'human-lab-wf1-sandbox',
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

const pollVercelDeploy = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Poll Vercel Deploy',
    parameters: {
      method: 'GET',
      url: expr('{{ "https://api.vercel.com/v13/deployments/" + $json.deploymentId + "?teamId=" + $json.vercelTeamId }}'),
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
          alias: ['human-lab-wf1-sandbox.vercel.app'],
          url: 'human-lab-wf1-sandbox-hash-scooteros-projects.vercel.app',
          projectId: 'prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM',
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
    output: [
      {
        json: {
          isReady: true,
          readyState: 'READY',
          deploymentId: 'dpl_example',
          alias: ['human-lab-wf1-sandbox.vercel.app'],
          url: 'human-lab-wf1-sandbox-hash-scooteros-projects.vercel.app',
          projectId: 'prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM',
          appId: 'human-lab-wf1-sandbox',
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          vercelTeamId: 'team_CvzW7iL13TaNbaIiaCHfjafe',
        },
      },
    ],
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
          publicUrl: 'https://human-lab-wf1-sandbox.vercel.app',
          deploymentUrl: 'https://human-lab-wf1-sandbox-hash-scooteros-projects.vercel.app',
          needsDomainsFallback: false,
          projectId: 'prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM',
          deploymentId: 'dpl_example',
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          appId: 'human-lab-wf1-sandbox',
          vercelTeamId: 'team_CvzW7iL13TaNbaIiaCHfjafe',
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
      url: expr('{{ "https://api.vercel.com/v9/projects/" + $json.projectId + "/domains?production=true&target=production&teamId=" + $json.vercelTeamId }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
    },
    credentials: {
      httpHeaderAuth: newCredential('Header Auth account'),
    },
    output: [
      {
        json: {
          domains: [{ name: 'human-lab-wf1-sandbox.vercel.app', verified: true }],
        },
      },
    ],
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
    output: [
      {
        json: {
          publicUrl: 'https://human-lab-wf1-sandbox.vercel.app',
          deploymentUrl: 'https://human-lab-wf1-sandbox-hash-scooteros-projects.vercel.app',
          projectId: 'prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM',
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          appId: 'human-lab-wf1-sandbox',
        },
      },
    ],
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
    output: [
      {
        json: {
          publicUrl: 'https://human-lab-wf1-sandbox.vercel.app',
          deploymentUrl: 'https://human-lab-wf1-sandbox-hash-scooteros-projects.vercel.app',
          projectId: 'prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM',
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          appId: 'human-lab-wf1-sandbox',
        },
      },
    ],
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
    output: [
      {
        json: {
          publicUrl: 'https://human-lab-wf1-sandbox.vercel.app',
          deploymentUrl: 'https://human-lab-wf1-sandbox-hash-scooteros-projects.vercel.app',
          projectId: 'prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM',
          deploymentId: 'dpl_example',
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          appId: 'human-lab-wf1-sandbox',
        },
      },
    ],
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
    output: [
      {
        json: {
          statusCode: 200,
          headers: { 'content-type': 'text/html' },
          body: 'ok',
        },
      },
    ],
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
    output: [
      {
        json: {
          verifyOk: true,
          publicUrl: 'https://human-lab-wf1-sandbox.vercel.app',
          deploymentUrl: 'https://human-lab-wf1-sandbox-hash-scooteros-projects.vercel.app',
          projectId: 'prj_6Ip7DfE186vPbDnR1VXrgmR8rsTM',
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          appId: 'human-lab-wf1-sandbox',
        },
      },
    ],
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
          fileId: '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn',
          publicUrl: 'https://human-lab-wf1-sandbox.vercel.app',
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

export default workflow('wf1-mockup-deploy', 'WF1 Mockup Deploy')
  .add(manualRun)
  .to(workflowConfig)
  .to(searchAppFolder)
  .to(searchAppJson)
  .to(downloadAppJson)
  .to(parseAndGate)
  .to(
    statusReadyGate
      .onTrue(
        validateSource
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
      .onFalse(skipNotReady)
  );
