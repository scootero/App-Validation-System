# WF4 Production Promotion Checklist

## A. Preconditions

- [x] WF3 sandbox proven (Sheet rows + live n8n)
- [x] WF4 dry-run local proof (`wf4-rehearse.js`)
- [x] WF4 dry-run n8n proof (execution 30)
- [ ] Meta API VERIFY_* values confirmed by operator/Web AI
- [ ] Operator explicit approval for create-paused testing
- [ ] Meta credential + approval token in n8n

## B. Sandbox Export Locations

- SDK: `rehearsals/wf4-meta-ads-sandbox/n8n/wf4-meta-ads-sandbox.workflow.ts`
- Canonical meta: `rehearsals/wf4-meta-ads-sandbox/n8n/WF4-meta-ads-sandbox.canonical-meta.json`
- Contract: `rehearsals/wf4-meta-ads-sandbox/meta-ads-contract.md`
- Dry-run payload: `rehearsals/wf4-meta-ads-sandbox/dry-run-payloads/human-lab-wf4-dry-run.json`

## C. Promote Logic, Not Hardcodes

- Idempotency run key pattern
- Triple approval gate
- Creative selection + UTM expansion
- VERIFY_* → confirmed value mapping table
- PAUSED-by-default create sequence
- Four-ID verify-before-write-back

## D. Do Not Promote

- Sandbox workflow ID `YIc53GBq4upelYp6`
- Embedded fixture `app.json`
- `_createPausedAllowed: false` hardcode (replace with config flag after approval process defined)
- Sandbox Sheet/Meta account IDs without parameterization

## E. Reusability

Extract shared Meta dry-run bundle builder, idempotency checker, triple approval gate, and HTTP retry helpers per `REUSABLE_COMPONENTS.md`.
