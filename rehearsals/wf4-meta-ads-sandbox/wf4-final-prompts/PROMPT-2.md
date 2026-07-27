# WF4 Meta Ads — Image Create-Paused V1 Completion

# Secure the real-write path, prevent duplicate objects, create one PAUSED image ad, inspect feed previews, document, then stop

You are continuing App Validation System / WF4 Meta Ads after Prompt 1 completed verification and safe reconciliation.

Workspace:

`/Users/scott/Desktop/App-Validation/App-Validation-System`

Paste the Prompt 1 PASS handoff immediately below this line:

```text
[PASTE PROMPT 1 HANDOFF HERE]
```

This chat finishes the complete static-image WF4 V1 path.

This is WF4 / WF-Ads, not WF5.

---

## Progress tracker (mandatory)

Before doing anything else, read and keep updated:

- `rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-2-PROGRESS.md`

On resume in a fresh chat: read `PROMPT-2-PROGRESS.md` first, then this file.

After every completed approved phase:

1. Check off completed items in `PROMPT-2-PROGRESS.md`
2. Write/overwrite the **Latest compact handoff** section
3. List open blockers / wait-for-Scott items
4. **Stop** and wait for Scott to approve Phase N+1

Do not automatically continue to the next phase.

If chat context becomes large, produce a mini-handoff designed for a fresh continuation chat (paste into `PROMPT-2-PROGRESS.md` and tell Scott to start a new chat).

---

## Sub-session / phase rules

- Work **one phase at a time**.
- After every approved phase: compact handoff + update progress file + **stop**.
- Require Scott’s explicit approval before Phase N+1.
- Do not proceed across external-write boundaries based on “go ahead” or other ambiguous language.
- Inherit Prompt 1 **repair guardrail**: if a change needs more than workflow JSON / import-ready alignment, fixture alignment, or narrowly scoped proof-doc changes → **stop and ask Scott**.

---

## Definition of success for this chat (minimum Image V1)

Image WF4 V1 is complete when it can safely and repeatably:

1. Read package-defined ad configuration.
2. Resolve and validate an image asset.
3. Require secure operator approval for external writes.
4. Upload the image to Meta.
5. Create Campaign, Ad Set, Creative, and Ad in **PAUSED** state.
6. Avoid duplicates when triggered or retried multiple times.
7. Resume safely after a partial failure (documented/proven).
8. Record returned IDs and operation state (ledger + intended write-back).
9. Validate Facebook desktop Feed, Facebook mobile Feed, and Instagram Feed previews for the enabled placements.
10. Remain unable to spend until a human explicitly activates the ad.

Automatic activation is **not** required and must **not** be added in this chat.

### Minimum shippable for “Image V1 PASS”

Must include:

- secure approval gate
- idempotency / repeated-trigger protection
- negative safety tests
- one real PAUSED image-ad creation
- no duplicate objects when the same request runs again
- correct ledger and ID write-back
- all objects PAUSED
- zero spend
- human activation remains manual

Creative-spec research and Stories/Reels perfection must **not** block the first PAUSED proof. Phase 7 feed previews may be **PARTIAL** if documented with clear placement restrictions (Stories/Reels disabled for V1).

---

## Scope

### In scope

- Consume and validate Prompt 1 handoff.
- Determine exact remaining blockers.
- Living creative-spec notes (do not block create-paused).
- Secure approval-token mechanism.
- Idempotency and repeated-trigger protection.
- Partial-failure recovery.
- Negative safety tests.
- One explicitly approved PAUSED image-ad creation.
- Meta object verification.
- Facebook/Instagram **Feed** placement previews for enabled placements.
- Sandbox ID write-back and operation ledger.
- Canonical image-path documentation.
- Prompt 3 handoff + progress file updates.

### Out of scope

- Video upload or `/advideos`.
- Video schema implementation.
- Automatic ad activation.
- Real delivery or spending.
- Production Human Lab 500 / 14 budget.
- WF-Decision.
- Broad Spec/starter promotion.
- Unrelated WF0–WF3 work (unless a hard blocker for create-paused itself).

---

## Initial files

Read initially:

1. `rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-2-PROGRESS.md`
2. `rehearsals/wf4-meta-ads-sandbox/external-proof-status.md`
3. `rehearsals/wf4-meta-ads-sandbox/CANONICAL-WF4.md`
4. `rehearsals/wf4-meta-ads-sandbox/meta-ads-contract.md`
5. `rehearsals/wf4-meta-ads-sandbox/VALUE-LOCATION-OWNERSHIP.md`
6. `rehearsals/wf4-meta-ads-sandbox/CONFIG-DRIVEN-VS-HARDCODED.md`
7. `rehearsals/wf4-meta-ads-sandbox/lib/meta-adapter.js`
8. `rehearsals/wf4-meta-ads-sandbox/n8n/wf4-meta-ads-sandbox.workflow.ts`
9. `rehearsals/wf4-meta-ads-sandbox/fixtures/app-json-wf4-sandbox.json`
10. `rehearsals/wf4-meta-ads-sandbox/architecture/OPERATION-LEDGER.md`
11. `rehearsals/wf4-meta-ads-sandbox/MANUAL-META-ACCOUNT-SETUP-CHECKLIST.md`

Open other files only when needed for the current phase.

Do not repeat Prompt 1’s full audit unless its evidence is missing or contradictory.

---

## Expected sandbox values

- appId: `human-lab-wf1-sandbox`
- image: `media/og-image.png` (actual size ~1734 × 907 landscape; report measured values)
- repository: `scootero/Human-Lab-WF1-Sandbox`
- branch: `main`
- landing URL: `https://human-lab-wf2-sandbox.vercel.app`
- total budget: 14 USD
- duration: 14 days
- daily budget: $1
- maximum daily budget: $2
- objective: `OUTCOME_TRAFFIC`
- optimization: `LINK_CLICKS`
- billing: `IMPRESSIONS`
- ad account: `act_979257825150251`
- Facebook Page: `1237104852815793`
- Instagram identity: `17841440875992246`
- n8n credential name: `Meta Marketing API - Orro`

Never use the production Human Lab 500 / 14 budget.

Never expose the credential value.

---

## Global rules

- Validate inherited claims.
- Stop at every approval boundary.
- Never print or commit secrets.
- Never silently increase budget.
- Workflow remains inactive unless a later, separately approved operating model requires activation.
- Every Meta object created in this chat must be PAUSED.
- No delivery or spend is permitted.
- Do not create duplicates.
- Do not use a “force create” option without explicit operator approval.
- Commit only after reporting the exact proposed commit and Scott agrees (unless Scott already authorized a specific commit in-chat).

---

# Phase 1 — Current blockers and living creative specs (plan only)

Start with an audit and plan only. **Do not implement yet.**

Validate:

1. Approval-token mechanism.
2. Meta credential validity and required permissions.
3. Billing/payment method readiness.
4. Page and Instagram permissions.
5. Operation ledger readiness.
6. Image binary-upload path.
7. Campaign/ad set/creative/ad request shapes.
8. Current Meta API version.
9. Write-back destinations.
10. Preview endpoint or Ads Manager preview capability.
11. Idempotency and repeated-trigger protection.
12. Partial-failure recovery.
13. Placement selection for Image V1.
14. Current creative suitability for Feed.

### Creative specs (living doc — do not block create-paused)

Create or update as a **living** document:

`rehearsals/wf4-meta-ads-sandbox/CREATIVE-ASSET-SPECS.md`

Requirements:

- Use **current official Meta documentation** only (record document names + verification date).
- Do not rely solely on remembered dimensions.
- Do not pretend one landscape asset is correct for every placement.

**Image V1 placement policy (locked default):**

- Default to **feed-focused** placements where the current landscape image previews correctly.
- **Stories and Reels remain disabled / out of V1** unless Scott approves vertical variants.
- Validate at least: Facebook desktop Feed, Facebook mobile Feed, Instagram Feed (in Phase 7, after create).
- Propose whether V1 restricts placements now (preferred) vs waiting for placement-specific assets.

Inspect `og-image.png` and report actual dimensions (~1734 × 907 expected).

Do **not** create new creative variants until Scott approves.

Do **not** let broad creative-spec research block Phase 2+ or the first PAUSED proof. A useful stub matrix in `CREATIVE-ASSET-SPECS.md` is enough to proceed.

Return:

- blocker table
- creative-spec matrix (stub OK)
- proposed V1 placements (Feed-first)
- missing assets
- smallest next implementation
- exact operator actions

Then: update `PROMPT-2-PROGRESS.md` and **stop** for Scott’s approval.

---

# Phase 2 — Repeated-trigger and idempotency contract (design only)

Before enabling any real writes, design and approve what happens when WF4 is triggered more than once.

### Required default behavior

#### Exact same operation repeated

The same app, creative revision, destination, targeting, objective, and budget must not create another campaign/ad set/creative/ad.

It should return or reconcile the existing operation and Meta IDs.

#### Concurrent duplicate runs

Two executions started close together must not both create objects.

Use an operation lock, atomic ledger claim, or another reliable single-writer mechanism.

#### Retry after partial failure

Example: campaign created → execution fails before ad set → operator retries.

The retry must detect and reuse the existing campaign, then continue from the first incomplete stage.

It must not create a second campaign.

#### Failure after Meta creation but before ledger/write-back

Reconciliation must use:

- deterministic names/external identifiers where possible
- stored operation key
- Meta lookup
- app.json IDs
- ledger state

It must not assume no object exists merely because local write-back failed.

#### Material creative/configuration change

A changed image, copy, landing URL, targeting, objective, or budget must not silently overwrite or duplicate the previous version.

Define an explicit revision/version model.

Creating a deliberate new ad variant should require:

- new creative/config revision
- a distinct deterministic operation key
- explicit operator intent

### Suggested operation identity inputs

Validate the correct final design, likely including:

- appId
- environment
- workflow version
- objective/optimization/billing
- landing URL
- targeting fingerprint
- budget fingerprint
- **creative binary SHA-256**
- copy fingerprint
- creative revision
- placement set

Do **not** use timestamps as the only identity key.

Renaming the same binary must not create a new operation; changing media bytes must change the fingerprint.

### Required proof (later phases)

Required:

- same logical request twice → no new Meta objects
- retry from simulated or real partial state → resume, do not duplicate
- changed creative/copy/budget → requires explicit new revision
- no blind reruns after errors (reconcile first)

Concurrent-lock:

- design and implement reliable concurrency protection
- test live only when safe
- if a true concurrent live test cannot be performed safely, mark it **design-proven** or **simulation-proven** rather than pretending it was fully live-proven

Return the proposed idempotency contract, ledger changes, and recovery behavior.

Update progress file and **stop** for approval before implementing.

---

# Phase 3 — Approval-token design (design only)

Propose the smallest secure mechanism fitting the architecture.

Requirements:

- secret stored only in n8n credentials, secure environment variables, or another approved secret store
- never in Git
- never in normal execution output
- never copied into proof documentation
- comparison performed without logging the supplied or expected value

A create-paused execution must require all of:

- `mode=create_paused`
- `approval=true`
- `_createPausedAllowed=true` (code hard-gate)
- budget under cap
- required Meta IDs
- valid landing URL
- valid and supported image creative
- successful operation-lock/idempotency claim
- no conflicting existing operation
- all required write destinations available

Any failure must produce zero new external writes.

Report:

- secret storage location
- operator setup steps
- runtime comparison
- redacted logging behavior
- rotation procedure
- rollback procedure

Update progress file and **stop** for Scott approval.

---

# Phase 4 — Implement gates, idempotency, and recovery

After Scott approves Phases 2 and 3:

Implement:

- secure approval check
- deterministic operation key
- duplicate detection
- single-writer/concurrency protection
- operation ledger phases
- reusable existing-ID behavior
- resume-from-partial-stage behavior
- explicit revision handling
- safe reconciliation
- redacted logs

Preserve:

- dry_run default
- $2/day cap
- sandbox $1/day value
- PAUSED object status
- zero writes for missing/bad approval
- no automatic activation

Run:

1. local rehearsal
2. live dry_run
3. missing-token test
4. wrong-token test
5. `approval=false` test
6. over-budget test
7. duplicate-operation dry test
8. partial-failure simulations where possible
9. concurrent-lock test where possible (else design/simulation-proven)

Prove zero Meta, Drive, or ledger mutation for every rejected case except an intentionally designed non-spend safety/audit record that has been explicitly approved.

Update progress file and **stop** before any real Meta creation.

---

# Phase 5 — Final image create-paused preflight

Before any real Meta write, provide a final table containing:

- appId
- operation key
- creative revision
- duplicate-check result
- mode
- approval state
- budget
- cap
- objective
- optimization
- billing
- landing URL
- selected placements (Feed-first; Stories/Reels off unless approved)
- Facebook Page
- Instagram identity
- image path
- repository and branch
- image dimensions
- MIME type
- file size
- binary hash (SHA-256)
- copy/headline/description/CTA
- Campaign status
- Ad Set status
- Ad status
- expected API calls
- expected ledger phases
- expected app.json write-back
- rollback/pause plan
- billing readiness
- credential/permission check

Require Scott to respond with this **exact** phrase:

```text
APPROVE WF4 IMAGE CREATE-PAUSED V1
```

**No other wording authorizes real Meta object creation.**

Update progress file and **stop** until that exact phrase is received.

---

# Phase 6 — One real PAUSED image-ad proof

After exact approval:

Execute once:

1. Claim operation lock.
2. Reconcile any existing IDs before creating.
3. Download and validate image.
4. Upload image.
5. Capture `image_hash`.
6. Create Campaign as PAUSED.
7. Create Ad Set as PAUSED.
8. Create Creative.
9. Create Ad as PAUSED.
10. Verify all returned objects.
11. Write sandbox IDs to intended fields.
12. Record ledger phases.
13. Release/finalize operation lock.

Immediately verify:

- correct ad account
- correct Page
- correct Instagram identity
- correct destination
- correct objective
- correct budget
- correct creative
- Campaign PAUSED
- Ad Set PAUSED
- Ad PAUSED
- zero delivery
- zero spend
- no duplicate objects
- ledger complete
- write-back complete

If any object is ACTIVE:

- pause it immediately
- stop
- report the incident

Do not rerun blindly after an error. Reconcile first.

Update progress file and **stop**.

---

# Phase 7 — Feed placement and visual validation

Use official Meta preview functionality or Ads Manager.

Inspect every **enabled** placement. For Image V1, at minimum:

- Facebook desktop Feed
- Facebook mobile Feed
- Instagram Feed

Stories / Reels: only if enabled; otherwise document as **out of V1 / disabled**.

Validate:

- image crop
- important content visibility
- readable text
- logo visibility
- CTA
- Page identity
- Instagram identity
- destination URL
- headline cutoff
- primary-text cutoff
- quality/sharpness
- mobile-safe areas
- whether Meta performs expansion or automatic cropping
- whether the creative still communicates the intended message

Do not assume a landscape image is suitable for Stories/Reels.

When a placement looks poor:

- disable that placement for image V1, or
- require an approved placement-specific asset

Do not activate the ad.

Capture preview evidence without exposing account secrets.

Phase 7 may be marked **PARTIAL** in the Image V1 verdict if Feed previews are done and Stories/Reels are explicitly disabled with rationale.

Update progress file and **stop**.

---

# Phase 8 — Repeated-trigger live proof

After the first PAUSED ad is safely created, test the idempotency contract without intentionally creating another ad.

Run the same approved logical operation again in the safest supported verification mode.

Expected:

- existing operation detected
- existing IDs returned/reconciled
- zero new Campaigns
- zero new Ad Sets
- zero new Creatives
- zero new Ads
- no budget duplication
- ledger reports `already_complete` or equivalent
- no inconsistent write-back

Also prove how a deliberate new creative revision would be requested, but do not create the new revision in this chat.

Update progress file and **stop**.

---

# Phase 9 — Image V1 documentation

Document:

- supported image fields
- asset locations
- creative-spec matrix (living doc)
- selected V1 placements
- dry_run behavior
- approval procedure
- exact create-paused procedure
- idempotency contract
- repeated-trigger behavior
- partial-failure recovery
- operation ledger
- ID write-back
- preview procedure
- pause/kill procedure
- manual activation procedure
- deliberate new-revision procedure
- what remains manual
- what is deferred to video support (Prompt 3)

Update canonical metadata and proof logs.

Update `PROMPT-2-PROGRESS.md` to Image V1 PASS/PARTIAL.

Return a compact Prompt 3 handoff (also paste into progress file).

---

# Image V1 definition of done

Image V1 is complete only when:

- dry_run is safe
- approval is secure
- budget cap works
- one PAUSED image ad exists
- zero spend occurred
- intended Feed placements were previewed (or restricted with docs)
- unacceptable placements were disabled or given correct assets
- repeated execution creates no duplicate
- partial-failure behavior is documented/proven
- ledger and write-back work
- human activation remains manual
- docs are current
- `PROMPT-2-PROGRESS.md` reflects completion

Automatic activation is not required.

---

# Required final response

1. Image V1 verdict: PASS / PARTIAL / FAIL
2. Meta object IDs and PAUSED states
3. Spend/delivery confirmation
4. Placement-preview result
5. Idempotency/repeated-trigger result
6. Partial-failure/recovery readiness
7. Ledger and write-back result
8. Files changed
9. Commit/push status
10. Remaining risks
11. Prompt 3 readiness
12. Paste-ready Prompt 3 handoff

---

# Stop point

Stop after image V1 is complete and documented (or after any single phase when waiting for Scott).

Do not:

- activate the ad
- permit spend
- implement video
- alter production Human Lab budget
- begin WF-Decision
- mass-update platform specifications
