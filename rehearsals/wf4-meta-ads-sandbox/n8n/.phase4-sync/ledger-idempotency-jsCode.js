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
function isComplete(row) {
  if (!row) return false;
  var phase = String(row.phase || '');
  var ids = ['campaignId','adSetId','creativeId','adId'].filter(function (f) {
    return row[f] != null && String(row[f]).trim() !== '';
  });
  return phase === 'writeback_done' || phase === 'verified' || ids.length === 4;
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
    return { action: 'claim', outcome: 'in_progress', resumeFrom: 'campaign', metaCreate: {}, lockOwner: executionId, lockExpiresAt: new Date(nowMs + 300000).toISOString() };
  }
  var rowFp = ledgerRow.contentFingerprint || '';
  if (rowFp && contentFingerprint && rowFp !== contentFingerprint && (isComplete(ledgerRow) || firstMissingStage(ledgerRow) !== 'campaign')) {
    return { action: 'revision_conflict', error: 'LEDGER_REVISION_CONFLICT: fingerprint mismatch for ' + operationKey };
  }
  if (isComplete(ledgerRow) && (!rowFp || rowFp === contentFingerprint)) {
    return { action: 'already_complete', outcome: 'already_complete', metaCreate: { campaignId: ledgerRow.campaignId || null, adSetId: ledgerRow.adSetId || null, imageHash: ledgerRow.imageHash || null, creativeId: ledgerRow.creativeId || null, adId: ledgerRow.adId || null } };
  }
  var resumeFrom = firstMissingStage(ledgerRow);
  var metaCreate = { campaignId: ledgerRow.campaignId || null, adSetId: ledgerRow.adSetId || null, imageHash: ledgerRow.imageHash || null, creativeId: ledgerRow.creativeId || null, adId: ledgerRow.adId || null };
  if (resumeFrom && resumeFrom !== 'campaign') {
    return { action: 'resume', outcome: 'resumed', resumeFrom: resumeFrom, metaCreate: metaCreate, lockOwner: executionId, lockExpiresAt: new Date(nowMs + 300000).toISOString() };
  }
  return { action: 'claim', outcome: 'in_progress', resumeFrom: 'campaign', metaCreate: metaCreate, lockOwner: executionId, lockExpiresAt: new Date(nowMs + 300000).toISOString() };
}
const item = $('Create Paused Blocked').first().json;
const rows = $input.all().map(function (i) { return i.json; }).filter(function (r) {
  return r && (r.operationKey || r.phase);
});
const ledgerRow = rows[0] || null;
const plan = (item.bundle && item.bundle.ledgerPlan) || {};
const executionId = String(($execution && $execution.id) || ('local-' + Date.now()));
const decision = evaluate(ledgerRow, {
  operationKey: plan.operationKey,
  contentFingerprint: plan.contentFingerprint,
  executionId: executionId,
  nowMs: Date.now(),
});
if (decision.action === 'lock_held') throw new Error(decision.error || 'LEDGER_LOCK_HELD');
if (decision.action === 'revision_conflict') throw new Error(decision.error || 'LEDGER_REVISION_CONFLICT');
if (decision.action === 'already_complete') {
  return [{ json: Object.assign({}, item, { ledgerExisting: ledgerRow, ledgerAction: 'already_complete', ledgerDecision: decision, metaCreate: decision.metaCreate || {}, outcome: 'already_complete' }) }];
}
const ledgerAction = decision.action === 'resume' ? 'resume' : 'upsert_planned';
return [{ json: Object.assign({}, item, { ledgerExisting: ledgerRow, ledgerAction: ledgerAction, ledgerDecision: decision, metaCreate: decision.metaCreate || {}, resumeFrom: decision.resumeFrom || 'campaign', ledgerClaim: { lockOwner: decision.lockOwner, lockExpiresAt: decision.lockExpiresAt, outcome: decision.outcome } }) }];