import { workflow, node, trigger, expr, newCredential } from '@n8n/workflow-sdk';

const googleDriveCredential = newCredential('Google Service Account account');

const FILE_ID = '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn';

const seedCode = `return [{
  json: {
    sandboxDriveAppJsonFileId: '${FILE_ID}',
    writeBackMeta: {
      status: 'created_paused',
      campaignId: '120250607331460199',
      adSetId: '120250622864980199',
      creativeId: '1007406578799368',
      adId: '120250622866330199',
      landingUrl: 'https://human-lab-wf2-sandbox.vercel.app?utm_source=facebook&utm_medium=paid_social&utm_campaign=human-lab-validation',
      dailyBudget: 1,
      createdAt: '2026-07-27T06:18:11.710Z',
      lastSyncedAt: null,
      creativeRevision: 'image-v1',
    },
    writeBackProofOnly: true,
    metaCreate: {
      campaignId: '120250607331460199',
      adSetId: '120250622864980199',
      creativeId: '1007406578799368',
      adId: '120250622866330199',
      imageHash: '3dd4a70bea3678c35714a2d06d718c3c',
    },
    bundle: {
      ledgerPlan: {
        operationKey: 'human-lab-wf1-sandbox|sandbox|meta|image-v1',
        appId: 'human-lab-wf1-sandbox',
        experimentRunId: '',
        provider: 'meta',
        environment: 'sandbox',
        creativeRevision: 'image-v1',
        contentFingerprint: '',
        creativeSha256: '',
      },
    },
  },
}];`;

const mergeCode = `const prev = $('Seed Write-Back Meta').first().json;
let appJson = null;
try {
  const buf = await this.helpers.getBinaryDataBuffer(0, 'data');
  appJson = JSON.parse(buf.toString('utf8'));
} catch (e) {
  throw new Error('WRITEBACK_APPJSON_REQUIRED: Drive download did not yield app.json (' + e.message + ')');
}
if (!appJson || typeof appJson !== 'object') {
  throw new Error('WRITEBACK_APPJSON_REQUIRED: Drive download did not yield app.json');
}
const rootBefore = appJson.status;
const metaIn = prev.writeBackMeta || {};
const clone = JSON.parse(JSON.stringify(appJson));
if (!clone.ads) clone.ads = {};
if (!clone.ads.meta) clone.ads.meta = {};
['status','campaignId','adSetId','creativeId','adId','landingUrl','dailyBudget','createdAt','lastSyncedAt','creativeRevision'].forEach(function (k) {
  if (Object.prototype.hasOwnProperty.call(metaIn, k) && metaIn[k] != null) clone.ads.meta[k] = metaIn[k];
});
clone.ads.meta.lastSyncedAt = new Date().toISOString();
clone.status = rootBefore;
const outText = JSON.stringify(clone, null, 2);
const binary = await this.helpers.prepareBinaryData(Buffer.from(outText, 'utf8'), 'app.json', 'application/json');
return [{
  json: {
    fileId: prev.sandboxDriveAppJsonFileId,
    rootStatusUnchanged: clone.status === rootBefore,
    adsMeta: clone.ads.meta,
    appId: clone.appId,
    status: clone.status,
  },
  binary: { data: binary },
}];`;

const manualRun = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Run', parameters: {} },
});

const seed = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Seed Write-Back Meta',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: seedCode,
    },
  },
});

const download = node({
  type: 'n8n-nodes-base.googleDrive',
  version: 3,
  config: {
    name: 'Download Sandbox app.json',
    parameters: {
      resource: 'file',
      operation: 'download',
      authentication: 'serviceAccount',
      fileId: {
        __rl: true,
        mode: 'id',
        value: expr('{{ $json.sandboxDriveAppJsonFileId }}'),
      },
      options: {
        binaryPropertyName: 'data',
      },
    },
    credentials: {
      googleApi: googleDriveCredential,
    },
  },
});

const mergeWriteBack = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge ads.meta Write-Back',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergeCode,
    },
  },
});

const update = node({
  type: 'n8n-nodes-base.googleDrive',
  version: 3,
  config: {
    name: 'Update Sandbox app.json',
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
      googleApi: googleDriveCredential,
    },
  },
});

export default workflow('wf4-writeback-repair-exec74', 'WF4 Writeback Repair Exec74')
  .add(manualRun)
  .to(seed)
  .to(download)
  .to(mergeWriteBack)
  .to(update);
