# App Validation Platform Completion — After WF4 Image V1

# Plan first, then execute one approved track at a time (mandatory video + remaining system work)

You are continuing the App Validation System after WF4 static-image create-paused V1 has been completed or has a precise remaining-gap report.

Workspace:

`/Users/scott/Desktop/App-Validation/App-Validation-System`

Paste the Prompt 2 handoff immediately below this line:

```text
[PASTE PROMPT 2 HANDOFF HERE]
```

This chat covers everything after the image V1 proof.

**The first response must be planning/audit only.**

Do not implement until Scott selects or approves the next track.

This is WF4 / WF-Ads, not WF5.

---

## Progress tracker (mandatory)

Before doing anything else, read and keep updated:

- `rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-3-PROGRESS.md`

On resume in a fresh chat: read `PROMPT-3-PROGRESS.md` first, then this file.

After every substantial phase within a selected track:

1. Check off completed items in `PROMPT-3-PROGRESS.md`
2. Write/overwrite the **Latest compact handoff** section
3. List open blockers / wait-for-Scott items
4. **Stop** and wait for Scott before the next substantial phase or track switch

Do not mix several tracks into one uncontrolled implementation.

Work **one selected track at a time**, with a compact handoff after each substantial phase.

If chat context becomes large, produce a mini-handoff for a fresh continuation chat.

---

## Inherited repair guardrail

If reaching an expected verified state would require more than:

- workflow JSON / import-ready alignment,
- fixture alignment, or
- narrowly scoped proof-document changes,

**stop and ask Scott** rather than treating the change as a simple structural repair.

---

## North-star system goal

A reusable validation pipeline for a new app idea:

1. Duplicate `app-package-starter`.
2. Fill `app.json`, copy, experiment rules, screenshots, images, and videos.
3. WF0 provisions required resources.
4. WF1 builds/publishes the app mockup.
5. WF2 builds/deploys the landing page.
6. WF3 captures attributed events.
7. WF4 creates safe **PAUSED** Meta image or video ads.
8. Human reviews previews and decides whether to activate/spend.
9. Tracking and Meta performance data are joined.
10. WF-Decision applies experiment rules and records the outcome.

**Automatic ad activation is not required** for WF4 or the platform to be considered successful.

The intended safe operating model is:

```text
WF4 creates PAUSED ads
→ human reviews creative, destination, targeting, and budget
→ human activates or rejects the ad
```

A future automatic-activation capability would require a separate product and safety decision.

---

## Definitions of done (distinguish clearly)

### A. WF4 image V1

Completed in Prompt 2: secure create-paused image path, idempotency, one PAUSED image ad, feed previews (or restricted placements), ledger/write-back, human activation manual.

### B. WF4 full creative support

Image V1 **plus** mandatory reusable video support (Track A), including feed and vertical variants, thumbnails, async processing, idempotency, PAUSED video proof, and placement previews.

### C. Meta Ads automation with manual activation

WF4 can create correct PAUSED image and video ads from packages; IDs written back; duplicates prevented; human reviews and activates in Ads Manager; pause/kill documented. Auto-ACTIVE not required.

### D. Full App Validation System

WF0→WF4 (+ WF-Decision) work for a new package with only intentional manual steps left: idea, package authoring, creative production/approval, landing/ad review, activation/spend permission, and human judgment overrides where policy requires.

---

## Intentionally manual vs should be automated

### Intentionally manual (default)

- Inventing an app idea
- Authoring package inputs (`app.json`, copy, experiment rules)
- Producing or approving final creative (images/videos/screenshots)
- Reviewing the landing page
- Reviewing ad previews
- Activating the ad
- Permitting spend
- Overriding kill/scale decisions where policy requires human judgment

### Should be automated

- Provisioning (WF0)
- Deployment (WF1/WF2)
- Event capture (WF3)
- Package-driven PAUSED ad creation (WF4)
- Asset validation
- Approval gates
- Duplicate prevention
- Partial-failure recovery
- ID write-back
- Metric collection
- Experiment evaluation (WF-Decision)
- Status updates

---

## Initial files

Read initially:

1. `rehearsals/wf4-meta-ads-sandbox/wf4-final-prompts/PROMPT-3-PROGRESS.md`
2. `rehearsals/wf4-meta-ads-sandbox/external-proof-status.md`
3. `rehearsals/wf4-meta-ads-sandbox/CANONICAL-WF4.md`
4. `rehearsals/wf4-meta-ads-sandbox/CREATIVE-ASSET-SPECS.md` (if created)
5. `rehearsals/DEPENDENCY_GRAPH.md`
6. `rehearsals/SANDBOX-MASTER-BACKLOG.md`
7. `rehearsals/wf3-human-lab-sandbox/CANONICAL-WF3.md`

Open other files only for the selected track or to resolve a concrete contradiction.

Do not preload every historical document.

---

## Official documentation requirement

For all Meta API and creative-spec work:

- use current official Meta documentation
- verify the current Marketing API version
- verify endpoints and payload structures
- verify processing/polling behavior
- verify placement specifications
- record source document names and verification dates
- do not rely on remembered limits
- do not use third-party blog specifications as authoritative

Maintain:

`rehearsals/wf4-meta-ads-sandbox/CREATIVE-ASSET-SPECS.md`

The document must cover images and videos by placement.

---

## Mandatory video requirement (with P0 decision rule)

Reusable Meta video-ad support is **required** before declaring WF4’s **full creative capability** complete.

The static-image V1 proof establishes that the campaign/ad-set/creative/ad safety architecture works.

Video support must **not** be treated as an optional stretch for full WF4 creative completion.

### Decision rule for what to recommend first

Use this rule in the planning response:

- If **WF0 webhook provisioning**, **WF2 tracking embed**, and **WF3 browser event capture** are proven end to end → recommend **Track A — Mandatory Video Support** next.
- If one of those is a **verified P0 blocker** preventing paid traffic from being measured → recommend fixing that P0 via **Track C** first, then return to mandatory video support.

Do **not** automatically select video first when a verified validation-loop P0 exists.

---

# First required response — planning only

Return:

## 1. Current maturity scorecard

Rate each as Done / Partial / Missing:

- WF0
- WF1
- WF2
- WF3
- WF4 image planning
- WF4 image create-paused
- WF4 repeated-trigger/idempotency
- WF4 image previews
- WF4 video
- Meta activation/manual review process
- Meta attribution/write-back
- operation ledger
- Spec/starter production readiness
- WF-Decision
- operator runbook

## 2. Definition of done

Confirm A–D above against current evidence (Image V1 complete or remaining gaps).

## 3. Ordered backlog

Produce P0 / P1 / P2 items mapped to Tracks A–F below.

## 4. Manual versus automated

Restate intentional manual vs automated lists against current reality.

## 5. Recommended next track

Apply the P0 decision rule.

Default to Track A (video) **only if** no verified P0 validation-loop blocker exists; otherwise recommend Track C first, then Track A.

Explain the dependency.

## 6. Stop

Wait for Scott to select or approve the next track.

Update `PROMPT-3-PROGRESS.md` with the planning outcome.

**No implementation in the first response.**

---

# Track A — Mandatory reusable Meta video ads

This track is required before full WF4 creative completion.

Exact approval phrase for real video Meta creation (later):

```text
APPROVE WF4 VIDEO CREATE-PAUSED V1
```

No other wording authorizes real video Meta object creation.

## A1. Research and design

Verify current official Meta requirements for:

- video-upload endpoint
- regular versus resumable upload
- supported file formats/codecs
- file-size limits
- duration limits by selected placement
- video dimensions and aspect ratios
- frame-rate and audio requirements
- video processing states
- polling
- timeout/retry behavior
- returned `video_id`
- thumbnail/poster handling
- `object_story_spec` video_data
- ad-preview support
- placement asset customization

Create a placement matrix for:

- Facebook desktop Feed
- Facebook mobile Feed
- Instagram Feed
- Facebook Stories
- Instagram Stories
- Facebook Reels
- Instagram Reels

Do not assume one video file is ideal for every placement.

At minimum, design for:

- Feed-appropriate video
- 9:16 vertical Stories/Reels video
- thumbnail/poster image
- safe-zone validation
- readable text with sound off
- useful audio with sound on
- critical message visible early in the video

Document practical export dimensions only after validating current official guidance.

Update progress; stop for design approval where needed.

## A2. Generic package media model

Design a backward-compatible model distinguishing:

- media type: image or video (explicit; not `role: video` alone)
- placement role
- thumbnail/poster
- MIME type
- repository/path
- branch
- creative revision
- placement eligibility
- optional fallback

Provide examples for:

1. one image
2. one feed video plus thumbnail
3. one vertical video plus thumbnail
4. feed and vertical video variants
5. image fallback plus video

The model must not hardcode Human Lab.

Wait for schema/design approval before implementation.

## A3. Video resolver and upload implementation

Implement generically:

```text
ads.media[]
→ identify selected video variant
→ resolve repo and branch
→ download binary
→ validate MIME, dimensions, duration, codec, size
→ compute binary fingerprint
→ claim idempotent operation
→ upload to Meta video endpoint
→ poll processing status
→ receive usable video_id
→ attach thumbnail/poster
→ create video creative
→ create PAUSED ad
```

Add failure handling for:

- missing file
- unsupported MIME
- invalid codec
- excessive file size
- unsupported dimensions
- upload interruption
- processing rejection
- processing timeout
- missing thumbnail
- invalid thumbnail
- no `video_id`
- duplicate operation
- partial success

Never proceed to creative creation until video processing is usable.

## A4. Video repeated-trigger behavior

Extend the image idempotency contract.

The operation fingerprint must include:

- video binary hash
- thumbnail hash
- copy fingerprint
- landing URL
- targeting
- budget
- objective
- placements
- creative revision

Exact reruns must reuse existing video/ad IDs.

A changed video must create a new revision only through explicit intent.

Retries during asynchronous processing must resume/poll the existing upload rather than uploading duplicates.

Concurrent executions must not create duplicate videos or ads.

## A5. Local and dry-run proof

Add:

- video package fixture
- download resolver test
- metadata validation test
- invalid-format test
- missing-thumbnail test
- processing-state simulation
- timeout test
- repeated-trigger test
- partial-failure test
- dry_run plan proof
- live n8n dry_run proof

Prove zero Meta writes in dry_run.

## A6. Human Lab sandbox assets

Validate final canonical locations, likely:

```text
rehearsals/github/Human-Lab-WF1-Sandbox/media/ad-hero-feed.mp4
rehearsals/github/Human-Lab-WF1-Sandbox/media/ad-hero-vertical.mp4
rehearsals/github/Human-Lab-WF1-Sandbox/media/ad-thumb-feed.png
rehearsals/github/Human-Lab-WF1-Sandbox/media/ad-thumb-vertical.png
```

Do not create fake final media.

Scott will supply or approve the actual videos and thumbnails.

Validate duration, dimensions, ratio, codec, frame rate, audio, file size, safe zones, text readability, first-frame behavior, final CTA visibility.

## A7. Video create-paused approval

Before real video creation, present a complete preflight.

Require exact phrase:

```text
APPROVE WF4 VIDEO CREATE-PAUSED V1
```

Then create one PAUSED video ad.

Verify:

- existing image operation is not duplicated
- video upload succeeds
- processing completes
- correct `video_id` used
- correct thumbnail
- correct Page/Instagram identity
- correct destination
- correct copy/CTA
- correct budget
- all objects PAUSED
- zero delivery
- zero spend
- ledger correct
- write-back correct

## A8. Video previews

Preview every enabled placement (Feed, Stories, Reels as enabled).

Check crop, safe zones, text/UI overlays, thumbnail, first frame, sound-off comprehension, sound-on audio, CTA/captions, identity, destination, quality.

Disable unsuitable placements or provide approved variants.

Do not activate.

## A9. Video definition of done

Full WF4 creative support is complete when:

- image and video are package-driven
- image and video dry-runs are safe
- image and video create-paused paths work
- repeated triggers create no duplicates
- processing/retries are idempotent
- placement variants work
- previews are validated
- ledger and write-back work
- all ads remain PAUSED
- human activation remains manual
- documentation is complete
- `PROMPT-3-PROGRESS.md` reflects Track A completion

---

# Track B — Finish Meta operational integration

After or alongside video where dependencies permit:

1. Complete `ads.meta.*` write-back.
2. Reconcile root-status policy.
3. Populate Meta IDs/placement attribution (Sheet columns as designed).
4. Ensure UTM and landing URLs match.
5. Validate operation-ledger completeness.
6. Prove partial-failure recovery.
7. Add pause/kill runbook.
8. Document manual Ads Manager activation.
9. Define deliberate new-creative revision behavior.
10. Confirm repeated triggers are safe in production packages.

Automatic activation remains out of scope unless separately approved later.

---

# Track C — Close WF0–WF3 paid-traffic dependencies

Validate / implement as needed:

- WF0 webhook provisioning
- WF2 landing embed
- WF3 browser event E2E
- attribution parameters
- `eventId` behavior
- Google Sheet writes
- paid-click-to-event proof
- Meta ID/placement joins

Meta ads existing alone does not complete the validation loop.

Prefer this track **before** Track A when it is a verified P0 blocker per the decision rule.

---

# Track D — Spec, starter, and production promotion

Coordinate:

- production architecture documentation
- app-package schema
- media type/revision/placement fields
- `app-package-starter` START_HERE
- exact required image/video checklist
- asset naming conventions
- safe budget defaults
- sandbox/production separation
- parameterized workflow exports
- production Human Lab cleanup

Avoid broad uncontrolled rewrites.

---

# Track E — WF-Decision

After ads and events are available:

- ingest landing events
- ingest/join Meta metrics
- evaluate package-defined criteria
- write validation results
- update terminal status
- define advisory versus automatic decisions
- retain human override where required
- make decisions idempotent and repeatable

---

# Track F — Operator productization

Create one clear runbook:

1. Duplicate starter.
2. Fill required app fields.
3. Add required image/video assets.
4. Validate assets automatically.
5. Run WF0–WF4.
6. Review landing page.
7. Review PAUSED ads.
8. Activate manually.
9. Monitor events and metrics.
10. Run or review WF-Decision.
11. Pause/kill/scale as appropriate.

Include:

- credential inventory
- no secrets in Git
- sandbox versus production
- recovery procedures
- acceptance checklist
- definition of “system done”

---

# Rules for this chat

- Work one approved track at a time.
- Do not create Meta objects without exact approval phrases.
- Do not activate ads.
- Do not permit spend.
- Do not mix video implementation, production promotion, and WF-Decision into one uncontrolled change.
- Validate current official Meta behavior.
- Never print secrets.
- Do not create duplicate Meta objects.
- Reconcile before retrying.
- Commit only after reporting exact changes (and Scott agrees, unless already authorized).
- Human activation remains the default final gate.

---

# Immediate task

Planning only:

1. Consume Prompt 2 handoff.
2. Produce maturity scorecard.
3. Confirm image V1 completion or remaining gaps.
4. Validate the ordered backlog.
5. Apply the P0 decision rule; recommend the next track.
6. Update `PROMPT-3-PROGRESS.md`.
7. Stop for Scott’s selection/approval.

No implementation in the first response.
