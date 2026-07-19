const item = $input.first().json;
function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  var clone = Array.isArray(obj) ? obj.slice() : Object.assign({}, obj);
  Object.keys(clone).forEach(function (k) {
    var lower = k.toLowerCase();
    if (lower.indexOf('approvaltoken') !== -1 || lower === 'wf4createpausedapprovaltoken' || lower.indexOf('accesstoken') !== -1) {
      clone[k] = clone[k] ? '[REDACTED]' : '';
    } else if (clone[k] && typeof clone[k] === 'object') {
      clone[k] = redact(clone[k]);
    }
  });
  return clone;
}
const redacted = redact(item);
return [{ json: {
  ok: true,
  mode: 'dry_run',
  bundle: redacted.bundle,
  safety: redacted.bundle && redacted.bundle.safety,
  runKey: redacted.bundle && redacted.bundle.runKey,
  operationKey: redacted.bundle && redacted.bundle.ledgerPlan && redacted.bundle.ledgerPlan.operationKey,
  approvalGate: redacted.approvalGate || null,
  externalWritePerformed: false,
  metaHttpCalls: 0,
  driveWrites: 0,
  _createPausedAllowed: false
} }];