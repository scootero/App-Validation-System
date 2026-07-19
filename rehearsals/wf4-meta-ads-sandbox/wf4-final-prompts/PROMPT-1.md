# WF4 Meta Ads — Verification and Safe Reconciliation

# Validate the repository and live n8n workflow, safely correct expected structural mismatches, prove dry_run, document, then stop

You are continuing the App Validation System / WF4 Meta Ads work in a fresh Cursor agent chat.

Workspace:

`/Users/scott/Desktop/App-Validation/App-Validation-System`

This chat is limited to:

1. Independently verifying the repository and live n8n WF4 state
2. Safely correcting structural/configuration mismatches needed to reach the expected dry-run state
3. Running one live dry_run with zero external writes
4. Updating canonical proof documentation
5. Producing a compact handoff for Prompt 2

Do not continue into approval-token setup, create-paused, real Meta object creation, video support, or ad activation.

This workflow is WF4 / WF-Ads, not WF5.

Progress / companion docs (optional for Prompt 1; required later):

- `rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/README.md`
- After PASS, operator will use `PROMPT-2.md` + `PROMPT-2-PROGRESS.md`

---

## Claimed current state

The previous agent claims:

- WF4 was cleaned and re-imported into live n8n.
- Duplicate `...1` nodes were removed.
- Live WF4 should contain one clean graph.
- Generic image resolution exists:

  `ads.media[].githubPath`
  → resolve source repository and branch
  → download binary
  → validate binary
  → prepare Meta `/adimages` upload
  → receive `image_hash`
  → create image creative

- The V1 sandbox image exists at:

  `rehearsals/github/Human-Lab-WF1-Sandbox/media/og-image.png`

- The local rehearsal passed.
- The local creative resolver passed.
- Create-paused remains unavailable or disabled.
- No Meta objects have been created through this revised workflow.

Verify these claims rather than inheriting them as facts.

---

## Initial files to read

Read only these initially:

1. `rehearsals/wf4-meta-ads-sandbox/external-proof-status.md`
2. `rehearsals/wf4-meta-ads-sandbox/CANONICAL-WF4.md`
3. `rehearsals/wf4-meta-ads-sandbox/lib/meta-adapter.js`
4. `rehearsals/wf4-meta-ads-sandbox/n8n/wf4-meta-ads-sandbox.workflow.ts`
5. `rehearsals/wf4-meta-ads-sandbox/n8n/WF4-meta-ads-sandbox.import-ready.json`
6. `rehearsals/wf4-meta-ads-sandbox/n8n/WF4-meta-ads-sandbox.canonical-meta.json`
7. `rehearsals/wf4-meta-ads-sandbox/fixtures/app-json-wf4-sandbox.json`
8. `rehearsals/wf4-meta-ads-sandbox/scripts/wf4-rehearse.js`
9. `rehearsals/wf4-meta-ads-sandbox/scripts/wf4-resolve-creative.js`

Open another file only when:

- one of these files directly references a required contract,
- a contradiction appears,
- live n8n materially differs from the repository,
- or the additional file is needed to validate a specific safety claim.

Do not preload broad historical documentation.

---

## Canonical values to verify

- n8n instance: `https://scottyo.app.n8n.cloud`
- n8n MCP server: `user-n8n`
- WF4 ID: `YIc53GBq4upelYp6`
- WF4 name: `WF4 - Meta Ads Sandbox`
- Expected workflow state: inactive
- Sandbox appId: `human-lab-wf1-sandbox`
- Sandbox budget: 14 USD / 14 days = $1/day
- Maximum daily budget: $2
- Campaign pairing:
  - `OUTCOME_TRAFFIC`
  - `LINK_CLICKS`
  - `IMPRESSIONS`
- Creative path: `media/og-image.png`
- Creative repository: `scootero/Human-Lab-WF1-Sandbox`
- Creative branch: `main`
- Landing URL: `https://human-lab-wf2-sandbox.vercel.app`
- Production Human Lab 500 / 14 budget must not be used

Note: the V1 image is approximately **1734 × 907** (≈1.91:1 landscape). Report actual dimensions; do not assume 1200 × 628.

---

## Hard safety rules

Throughout this chat:

- Do not activate WF4.
- Do not enable or execute Meta image-upload or object-creation actions.
- Do not create a campaign, ad set, creative, image, or ad.
- Assert zero Drive writes and zero ledger writes; if any write occurs, **FAIL**.
- Do not alter any Meta object.
- Keep `_createPausedAllowed=false`.
- Keep `mode=dry_run`.
- Keep `approval=false`.
- Keep the approval token empty or unset.
- Never print, expose, store, or commit secrets.
- Never silently alter budget, targeting, landing URL, Page, or Instagram identity.
- Back up/export the live workflow before any workflow-definition repair.
- All repairs must leave the workflow inactive.
- All repairs must preserve zero-write dry_run behavior.

### Repair guardrail (critical)

The only live n8n mutation permitted in this chat is a workflow-definition correction needed to make live WF4 match the verified clean repository workflow. No external service mutation is allowed.

**If reaching the expected verified state would require more than:**

- workflow JSON / import-ready alignment,
- fixture alignment, or
- narrowly scoped proof-document changes,

**then stop and ask Scott** rather than treating the change as a simple structural repair. Do not expand into architecture, secrets, approval policy, budget model, or Meta write-path enablement under the guise of “reconciliation.”

---

# Phase 1 — Repository validation

Verify:

1. Parent and relevant nested repositories exist.
2. Relevant branches and remotes are correct.
3. Report dirty files separately for every repository.
4. The V1 image exists at:

   `rehearsals/github/Human-Lab-WF1-Sandbox/media/og-image.png`

5. Report its actual:
   - dimensions
   - MIME type
   - file size
   - repository status
   - pushed/remote status

6. The fixture selects:

   `ads.media[].githubPath = media/og-image.png`

7. Creative source resolution uses:

   `source.assetsGithubRepo ?? source.mockupGithubRepo`

8. The fixture resolves to:

   `scootero/Human-Lab-WF1-Sandbox` @ `main`

9. Sandbox budget is 14 / 14.
10. Production Human Lab 500 / 14 is not used.
11. Resolver and adapter behavior are generic and do not hardcode:
    - Human Lab
    - `scootero/Human-Lab-WF1-Sandbox`
    - `og-image.png`
12. The generated request plan remains package-driven.

If a safe local configuration or generated-file mismatch prevents the expected proof, correct it using the current canonical architecture, rerun validation, and document the change — subject to the repair guardrail above.

Do not make speculative architecture changes.

---

# Phase 2 — Local proof

Run:

```bash
node rehearsals/wf4-meta-ads-sandbox/scripts/wf4-rehearse.js
node rehearsals/wf4-meta-ads-sandbox/scripts/wf4-resolve-creative.js
```

Prove:

- both pass
- selected creative path is `media/og-image.png`
- repository is `scootero/Human-Lab-WF1-Sandbox`
- branch is `main`
- MIME type is `image/png`
- binary is non-empty
- dimensions and size are reported accurately
- `metaHttpCalls=0`
- `driveWrites=0`
- `externalWritePerformed=false`
- no ledger write occurs

If local proof fails:

1. Identify the exact root cause.
2. Correct only a safe repository/local workflow-generation issue when the intended canonical behavior is unambiguous (repair guardrail applies).
3. Rerun both proofs.
4. Stop if fixing it would require changing the Meta architecture, secrets, approval policy, or budget.

---

# Phase 3 — Inspect live n8n

Use `user-n8n` MCP.

Authenticate through `mcp_auth` if needed.

Inspect:

- Workflow ID: `YIc53GBq4upelYp6`
- Workflow name: `WF4 - Meta Ads Sandbox`

Verify:

1. Workflow exists.
2. Name matches.
3. Workflow is inactive.
4. It contains one clean graph.
5. No duplicate nodes ending in `1` or other duplicate copies exist.
6. The actual node count is reasonable for the canonical workflow; do not rely on node count alone.
7. These nodes exist:
   - Resolve Creative Download Plan
   - Download Creative Binary
   - Validate Creative Binary
   - Upload Ad Image
   - Merge Image Hash
8. Meta write-path nodes remain disabled or otherwise unreachable through the current dry-run gate.
9. Process logic includes `resolveCreativeSource`.
10. `_createPausedAllowed=false`.
11. Workflow Config uses:
    - `mode=dry_run`
    - `approval=false`
    - approval token empty/unset
    - budget 14 / 14
    - `media/og-image.png`
    - `scootero/Human-Lab-WF1-Sandbox`
    - `main`
12. Live safety-critical and execution-critical behavior matches the clean import-ready repository workflow.

---

# Phase 4 — Safe reconciliation when live n8n differs

Classify any mismatch:

## A. Safe structural mismatch

Examples:

- duplicate imported nodes
- old Process Code
- missing new creative-resolution nodes
- stale fixture
- incorrect connection caused by the prior import
- live workflow does not match the clean import-ready JSON

When the correct target is clear from the repository:

1. Export/back up the current live workflow.
2. Record the pre-repair state.
3. Repair or replace the live workflow definition using the verified clean repository version.
4. Preserve the existing workflow ID where supported.
5. Keep it inactive.
6. Keep all external-write gates closed.
7. Reinspect the resulting workflow.
8. Verify no credentials were removed or exposed.
9. Run no external Meta or Drive action.

If the repair would exceed the repair guardrail (more than workflow JSON / import-ready / fixture / narrow proof docs), **stop and ask Scott**.

## B. Unsafe or ambiguous mismatch

Examples:

- missing/invalid credentials
- unclear approval logic
- budget conflict
- conflicting canonical contracts
- a repair would require enabling Meta writes
- live Meta IDs differ from documented values without explanation

Report the mismatch and stop before changing it.

The objective of Prompt 1 is to leave WF4 in the expected clean dry-run state when that can be done safely and deterministically.

---

# Phase 5 — Run one live dry_run

Proceed only after:

- local proof passes,
- live workflow is clean,
- live and repository behavior match,
- workflow remains inactive,
- all write gates are closed.

Run one manual dry_run.

The dry_run should execute planning and gate logic only.

Do not enable the disabled image-download or Meta-upload branch merely to test it. The separate local resolver proves binary retrieval.

Prove:

- execution success
- `ok=true`
- `mode=dry_run`
- `approval=false`
- approval token empty/unset
- `metaHttpCalls=0`
- `driveWrites=0`
- `externalWritePerformed=false`
- `_createPausedAllowed=false`
- selected creative=`media/og-image.png`
- source repository=`scootero/Human-Lab-WF1-Sandbox`
- branch=`main`
- budget=`$1/day`
- maximum=`$2/day`
- no image uploaded to Meta
- no campaign created
- no ad set created
- no creative created
- no ad created
- no ledger write
- workflow remains inactive

Capture the execution ID and output evidence.

Any external write makes this phase **FAIL**.

---

# Phase 6 — Documentation and Git

After a successful live dry-run, update:

1. `rehearsals/wf4-meta-ads-sandbox/external-proof-status.md`
2. `rehearsals/wf4-meta-ads-sandbox/n8n/WF4-meta-ads-sandbox.canonical-meta.json`

Record:

- current date
- workflow ID
- execution ID
- inactive state
- clean graph status
- duplicate-node status
- whether reconciliation was necessary
- files/workflow definition changed
- exact proof fields
- creative path/repo/branch
- actual creative dimensions, MIME, and file size
- zero Meta/Drive/ledger writes
- create-paused unavailable
- approval token unset
- exact next phase

Show:

- exact files changed
- parent repository status
- all nested repository statuses
- whether a parent commit is appropriate

Commit and push the parent App-Validation-System repository only when:

- proof passed,
- documentation is accurate,
- no unrelated changes are included.

Suggested commit:

```text
docs(wf4): record verified live dry-run state
```

Do not commit nested repositories unless a separately justified nested-repository change was required and explicitly reported.

---

# Required final response

Return:

## 1. Verdict

PASS / PARTIAL / FAIL

## 2. Independently verified facts

Only verified facts.

## 3. Reconciliation performed

Include:

- whether live n8n initially differed
- backup/export created
- exact changes made
- final live/repository match

## 4. Live workflow state

Include:

- workflow ID
- name
- inactive state
- node count
- duplicate status
- create-path status

## 5. Dry-run proof

Include:

- execution ID
- success
- ok
- mode
- metaHttpCalls
- driveWrites
- externalWritePerformed
- `_createPausedAllowed`
- selected creative
- source repository
- budget
- confirmation of zero external objects/writes

## 6. Files and commits

Include:

- files changed
- commit hash
- push result
- repositories affected

## 7. Remaining blockers for Prompt 2

Validate, do not assume:

- approval-token mechanism
- Meta credential validity/permissions
- billing readiness
- Page/Instagram permissions
- operation ledger
- image-upload/create chain
- idempotency/repeated-trigger protection
- preview capability
- anything else

## 8. Prompt 2 readiness

State yes or no.

## 9. Compact Prompt 2 handoff

Produce a paste-ready handoff containing:

- verified current state
- execution IDs
- reconciliations made
- exact remaining blockers
- current Git state
- current live workflow state

---

# Stop point

Stop after:

- safe reconciliation if required,
- successful live dry_run,
- proof documentation,
- optional parent commit,
- Prompt 2 handoff.

Do not:

- configure approval tokens
- enable create-paused
- create Meta objects
- implement video
- activate an ad
- spend money
