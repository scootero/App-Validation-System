# WF4 Production Implementation Checklist

## WF3 Gate

- [x] WF3 local rehearsal passed.
- [x] WF3 external sandbox rehearsal passed.
- [x] Google Sheets contains one row for each required event.
- [x] WF-Decision can filter signup-intent events.

## WF4 Dry-Run

- [x] Local `wf4-rehearse.js` passed ($1/day + cap-exceed fixture).
- [x] n8n dry-run execution succeeded (execution 35).
- [x] Zero Meta HTTP calls observed.
- [x] Zero Drive writes observed.
- [x] Create-paused branch disabled.
- [x] `MAX_DAILY_BUDGET_USD = 10` fail-closed (never clamp).
- [x] Broad targeting only (locations + age + FB/IG; interests optional).
- [x] Claude Context Package + Prompt A/B ready.

## Meta Readiness

- [ ] Current Meta Marketing API version verified.
- [ ] Objective names verified.
- [ ] Billing event and optimization goal mapping verified.
- [ ] Daily budget minimums and units verified.
- [ ] Meta token permissions verified.
- [ ] Ad account ownership and billing verified.
- [ ] Facebook Page actor verified.
- [ ] Instagram actor verified if Instagram placements are used.
- [ ] Special ad category decision documented.
- [ ] Creative asset can be resolved and uploaded.

## Workflow Safety

- [x] Default mode is `dry_run`.
- [ ] Create-paused mode requires explicit human approval.
- [ ] Campaign status is `PAUSED`.
- [ ] Ad set status is `PAUSED`.
- [ ] Ad status is `PAUSED`.
- [ ] No `status: validating` write-back occurs until all Meta IDs exist.
- [ ] Partial-create failure alerts operator and does not corrupt `app.json`.
- [ ] `ads` author copy is never overwritten.
- [ ] `deployment.*` is never modified by WF4.
- [ ] No spend-bearing resource is activated by automation.

## Write-Back

- [ ] Merge-write only `ads.meta.*`.
- [ ] Set root `status: validating` only after successful paused creation.
- [ ] Preserve `appId` and `specVersion`.
- [ ] Preserve all author-owned fields.

## External Evidence

- [x] Dry-run bundle reviewed.
- [ ] Paused campaign visible in Meta Ads Manager, if create-paused mode is approved later.
- [ ] Destination URL includes UTM params.
- [ ] Landing URL points to `deployment.landing.url`.
- [ ] Human confirms no campaign was activated by automation.
