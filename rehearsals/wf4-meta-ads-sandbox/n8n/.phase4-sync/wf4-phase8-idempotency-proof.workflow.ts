/**
 * WF4 Phase 8 — repeated-trigger / already_complete live proof.
 * Ledger evaluate + Meta GET only. Zero Meta POSTs. Optional writeback_done upsert.
 */
import {
  workflow,
  node,
  trigger,
  expr,
  newCredential,
} from '@n8n/workflow-sdk';

const OPERATION_KEY = 'human-lab-wf1-sandbox|sandbox|meta|image-v1';
const CONTENT_FP =
  '114e6616448920563bb41301292dfbddb1c48d32e2ab87df0a9e290b10881f6d';
const EXPECTED = {
  campaignId: '120250607331460199',
  adSetId: '120250622864980199',
  creativeId: '1007406578799368',
  adId: '120250622866330199',
  imageHash: '3dd4a70bea3678c35714a2d06d718c3c',
};
const ORPHAN_CAMPAIGN_ID = '120250622864710199';
const LEDGER_TABLE = {
  __rl: true as const,
  mode: 'id' as const,
  value: 'Yys4vVmQGk8fTxag',
  cachedResultName: 'WF4 Operation Ledger',
};

const evaluateJs = `function isComplete(row) {
  if (!row) return false;
  var phase = String(row.phase || '');
  var ids = ['campaignId','adSetId','creativeId','adId'].filter(function (f) {
    return row[f] != null && String(row[f]).trim() !== '';
  });
  return phase === 'writeback_done' || phase === 'verified' || ids.length === 4;
}
function firstMissingStage(row) {
  row = row || {};
  if (!row.campaignId) return 'campaign';
  if (!row.adSetId) return 'adset';
  if (!row.imageHash) return 'image';
  if (!row.creativeId) return 'creative';
  if (!row.adId) return 'ad';
  var phase = String(row.phase || '');
  if (phase !== 'verified' && phase !== 'writeback_done') return 'verified';
  if (phase !== 'writeback_done') return 'writeback_done';
  return null;
}
function evaluate(ledgerRow, opts) {
  var executionId = opts.executionId;
  var nowMs = opts.nowMs;
  var contentFingerprint = opts.contentFingerprint;
  var operationKey = opts.operationKey;
  if (ledgerRow && ledgerRow.lockOwner && String(ledgerRow.lockOwner) !== String(executionId)) {
    var exp = ledgerRow.lockExpiresAt ? Date.parse(ledgerRow.lockExpiresAt) : NaN;
    if (isNaN(exp) || exp > nowMs) {
      return { action: 'lock_held', error: 'LEDGER_LOCK_HELD: operationKey=' + operationKey };
    }
  }
  if (!ledgerRow) {
    return { action: 'claim', outcome: 'in_progress', resumeFrom: 'campaign' };
  }
  var rowFp = ledgerRow.contentFingerprint || '';
  if (rowFp && contentFingerprint && rowFp !== contentFingerprint && (isComplete(ledgerRow) || firstMissingStage(ledgerRow) !== 'campaign')) {
    return { action: 'revision_conflict', error: 'LEDGER_REVISION_CONFLICT' };
  }
  if (isComplete(ledgerRow) && (!rowFp || rowFp === contentFingerprint)) {
    return {
      action: 'already_complete',
      outcome: 'already_complete',
      metaCreate: {
        campaignId: ledgerRow.campaignId || null,
        adSetId: ledgerRow.adSetId || null,
        imageHash: ledgerRow.imageHash || null,
        creativeId: ledgerRow.creativeId || null,
        adId: ledgerRow.adId || null,
      },
    };
  }
  return { action: 'resume', outcome: 'resumed', resumeFrom: firstMissingStage(ledgerRow) };
}
const expected = ${JSON.stringify(EXPECTED)};
const contentFingerprint = ${JSON.stringify(CONTENT_FP)};
const operationKey = ${JSON.stringify(OPERATION_KEY)};
const rows = $input.all().map(function (i) { return i.json; }).filter(function (r) {
  return r && (r.operationKey || r.phase);
});
const ledgerRow = rows[0] || null;
if (!ledgerRow) throw new Error('PHASE8_LEDGER_MISSING: no row for ' + operationKey);
const decision = evaluate(ledgerRow, {
  operationKey: operationKey,
  contentFingerprint: contentFingerprint,
  executionId: String(($execution && $execution.id) || 'phase8-proof'),
  nowMs: Date.now(),
});
if (decision.action !== 'already_complete') {
  throw new Error('PHASE8_NOT_ALREADY_COMPLETE: action=' + decision.action + ' phase=' + (ledgerRow.phase || '') + ' outcome=' + (ledgerRow.outcome || ''));
}
const mc = decision.metaCreate || {};
const mismatches = [];
['campaignId','adSetId','creativeId','adId'].forEach(function (k) {
  if (String(mc[k] || '') !== String(expected[k])) mismatches.push(k + ':' + mc[k] + '!=' + expected[k]);
});
if (String(ledgerRow.imageHash || '') !== String(expected.imageHash)) {
  mismatches.push('imageHash:' + ledgerRow.imageHash + '!=' + expected.imageHash);
}
if (mismatches.length) throw new Error('PHASE8_ID_MISMATCH: ' + mismatches.join('; '));
return [{
  json: {
    phase8: 'ledger_already_complete',
    ledgerAction: 'already_complete',
    outcome: 'already_complete',
    operationKey: operationKey,
    contentFingerprint: contentFingerprint,
    ledgerPhaseBefore: ledgerRow.phase || null,
    ledgerOutcomeBefore: ledgerRow.outcome || null,
    metaCreate: mc,
    imageHash: ledgerRow.imageHash || null,
    creativeRevision: ledgerRow.creativeRevision || null,
    expected: expected,
    zeroMetaPostsIntended: true,
  }
}];`;

const finalizeJs = `const evalOut = $('Evaluate Already Complete').first().json;
const metaBody = $input.first().json;
const expected = evalOut.expected;
const objs = metaBody.body || metaBody;
const checks = [];
function check(id, label) {
  const o = objs[id];
  if (!o || !o.id) {
    checks.push({ id: id, label: label, ok: false, error: 'missing' });
    return;
  }
  const status = o.status || o.effective_status || null;
  const paused = String(status).toUpperCase() === 'PAUSED';
  checks.push({ id: id, label: label, ok: paused, status: status, effective_status: o.effective_status || null, name: o.name || null });
}
check(expected.campaignId, 'campaign');
check(expected.adSetId, 'adset');
check(expected.adId, 'ad');
check(${JSON.stringify(ORPHAN_CAMPAIGN_ID)}, 'orphan_campaign_leave_paused');
const failed = checks.filter(function (c) { return !c.ok; });
if (failed.length) {
  throw new Error('PHASE8_META_STATUS_FAIL: ' + JSON.stringify(failed));
}
return [{
  json: Object.assign({}, evalOut, {
    phase8: 'PASS',
    metaVerify: checks,
    metaHttpMethod: 'GET',
    metaPosts: 0,
    note: 'WF4 create path left disabled; proof uses ledger evaluate + Meta GET only (Create Campaign always POSTs without already_complete IF)',
  })
}];`;

const manual = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Run' },
});

const ledgerLookup = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Ledger Lookup Image V1',
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: LEDGER_TABLE,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: OPERATION_KEY,
          },
        ],
      },
      returnAll: true,
    },
    alwaysOutputData: true,
  },
});

const evaluate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Evaluate Already Complete',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: evaluateJs,
    },
  },
});

const metaGet = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'GET Existing Meta Objects',
    parameters: {
      method: 'GET',
      url: `https://graph.facebook.com/v25.0/?ids=${EXPECTED.campaignId},${EXPECTED.adSetId},${EXPECTED.adId},${ORPHAN_CAMPAIGN_ID}&fields=id,name,status,effective_status,configured_status`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: {
            fullResponse: true,
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
    credentials: {
      // @ts-expect-error facebookGraphApi is valid for Graph HTTP via predefinedCredentialType
      facebookGraphApi: newCredential('Meta Marketing API - Orro'),
    },
  },
});

const finalize = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Assert Phase8 PASS',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: finalizeJs,
    },
  },
});

const ledgerWritebackDone = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Ledger Upsert Writeback Done',
    parameters: {
      resource: 'row',
      operation: 'upsert',
      dataTableId: LEDGER_TABLE,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: OPERATION_KEY,
          },
        ],
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['operationKey'],
        value: {
          operationKey: OPERATION_KEY,
          appId: 'human-lab-wf1-sandbox',
          experimentRunId: 'run_human-lab_2026q2_001',
          provider: 'meta',
          environment: 'sandbox',
          creativeRevision: 'image-v1',
          contentFingerprint: CONTENT_FP,
          creativeSha256:
            'ae73b936b39bb5d86c357c9bb2aab8d10b5b017f09d17e43a908ac49ce7e055d',
          phase: 'writeback_done',
          campaignId: EXPECTED.campaignId,
          adSetId: EXPECTED.adSetId,
          imageHash: EXPECTED.imageHash,
          creativeId: EXPECTED.creativeId,
          adId: EXPECTED.adId,
          lockOwner: '',
          lockExpiresAt: '',
          resumeFrom: '',
          outcome: 'already_complete',
          lastError: '',
        },
      },
    },
  },
});

const verifyLedger = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Verify Ledger Writeback Done',
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: LEDGER_TABLE,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: OPERATION_KEY,
          },
        ],
      },
      returnAll: true,
    },
    alwaysOutputData: true,
  },
});

const summary = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Phase8 Summary',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const proof = $('Assert Phase8 PASS').first().json;
const row = $input.first().json;
if (String(row.phase) !== 'writeback_done') throw new Error('PHASE8_LEDGER_PHASE: ' + row.phase);
if (String(row.outcome) !== 'already_complete') throw new Error('PHASE8_LEDGER_OUTCOME: ' + row.outcome);
return [{
  json: {
    phase8Verdict: 'PASS',
    ledgerAction: 'already_complete',
    ledgerPhase: row.phase,
    ledgerOutcome: row.outcome,
    metaPosts: 0,
    metaCreate: proof.metaCreate,
    metaVerify: proof.metaVerify,
    deliberateNewRevision: {
      steps: [
        'Change creative bytes and/or copy/budget/URL/targeting/placements',
        'Set ads.meta.creativeRevision to a NEW string',
        'Obtain fresh create-paused approval (exact phrase when required)',
        'New operationKey → new ledger row → new Meta objects',
        'Do not overwrite or delete previous revision objects in V1',
      ],
      executedInThisChat: false,
    },
  }
}];`,
    },
  },
});

export default workflow(
  'wf4-phase8-idempotency-proof',
  'WF4 Phase8 Idempotency Proof'
)
  .add(manual)
  .to(ledgerLookup)
  .to(evaluate)
  .to(metaGet)
  .to(finalize)
  .to(ledgerWritebackDone)
  .to(verifyLedger)
  .to(summary);
