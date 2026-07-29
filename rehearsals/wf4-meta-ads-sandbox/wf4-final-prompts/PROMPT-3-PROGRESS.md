# Prompt 3 Progress — Platform Completion After Image V1

**Status:** Track A — **A1/A2 approved**; **A3–A5 local PASS**. **Safety graph + `ads.meta.variants` storage** in `workflow.ts` / import-ready (2026-07-28) — create path still DISABLED. Need Scott video assets (A6) before live video create.

**On resume:** Read this file + `CREATIVE-ASSET-SPECS.md`. Next: import updated import-ready into live WF4; A6 Scott supplies mp4+thumb; then A7 phrase `APPROVE WF4 VIDEO CREATE-PAUSED V1`.

**Related:**

- Prompt: [`PROMPT-3.md`](PROMPT-3.md)
- Prompt 2 progress: [`PROMPT-2-PROGRESS.md`](PROMPT-2-PROGRESS.md)
- Track C proof: [`TRACK-C-PROOF.md`](TRACK-C-PROOF.md)
- Proof SSOT: [`../external-proof-status.md`](../external-proof-status.md)
- Dependency graph: [`../../DEPENDENCY_GRAPH.md`](../../DEPENDENCY_GRAPH.md)
- Backlog: [`../../SANDBOX-MASTER-BACKLOG.md`](../../SANDBOX-MASTER-BACKLOG.md)
- Creative specs: [`../CREATIVE-ASSET-SPECS.md`](../CREATIVE-ASSET-SPECS.md)

---

## Prerequisites (from Prompt 2)

- [x] Prompt 2 Image V1 verdict PASS or PARTIAL with explicit remaining gaps
- [x] Prompt 2 handoff pasted into the Prompt 3 chat
- [x] Planning-only first response completed

Image V1 verdict: `PASS`

Prompt 2 handoff summary: Campaign `120250607331460199` | AdSet `120250622864980199` | Creative `1007406578799368` | Ad `120250622866330199` | hash `3dd4a70bea3678c35714a2d06d718c3c` | orphan `120250622864710199` leave PAUSED | ledger `writeback_done`/`already_complete` (exec 95) | Drive ads.meta (exec 94) | Feed previews OK | WF4 create path DISABLED.

---

## Planning outcome (first response)

- [x] Maturity scorecard completed
- [x] Definitions A–D confirmed against evidence
- [x] Ordered backlog (P0/P1/P2) written
- [x] Manual vs automated restated
- [x] P0 decision rule applied
- [x] Recommended next track recorded
- [x] Scott selected/approved a track

**Recommended track:** `C-first` (then A for Def B)

**Scott-selected track:** `C` (complete) → **`A`** (active)

**Rationale:** BL-005/006 were verified P0 blockers for measuring paid traffic. Image V1 write-back/ledger already Done. Per PROMPT-3 P0 decision rule → Track C before mandatory video (Track A). Track C now PASS — measurement P0s cleared. Scott approved starting Track A.

---

## Track A — Mandatory reusable Meta video ads

- [x] A1 Research and design (official Meta docs; placement matrix) — **approved** 2026-07-27
- [x] A2 Generic media model designed + Scott approved *(approved via “stuff will do” / continue)*
- [x] A3 Resolver + upload + polling **planned** in adapter + synced into workflow Process *(create nodes still disabled; zero Meta POSTs)*
- [x] A4 Video idempotency (video hash + thumb hash) implemented *(fingerprint includes both for video; image-v1 fingerprint unchanged)*
- [x] A5 Local + dry_run proofs PASS (zero Meta writes in dry_run) *(wf4-rehearse.js incl. video plan tests)*
- [x] Safety: Already Complete IF + skip campaign/adset when IDs exist + Meta GET PAUSED assert before write-back *(source + import-ready 2026-07-28; create nodes still disabled)*
- [x] `ads.meta.variants[creativeRevision]` SSOT + revision-scoped idempotency + migrate-on-write-back *(local rehearse PASS; create still disabled)*
- [ ] A6 Sandbox video/thumb assets validated (Scott-supplied)
- [ ] A7 Preflight + exact phrase `APPROVE WF4 VIDEO CREATE-PAUSED V1` + one PAUSED video ad
- [ ] A8 Feed / Stories / Reels previews for enabled placements
- [ ] A9 Video definition of done met; docs updated

Video Meta IDs:

- Campaign: `_pending_`
- Ad Set: `_pending_`
- Creative: `_pending_`
- Ad: `_pending_`
- video_id: `_pending_`

Track A verdict: `_pending_` (A3–A5 local PASS; safety IF/verify in repo; wait A6 assets + A7 phrase)

**A3 notes:** Adapter plans `/advideos` upload, status poll (`ready` / 10 min), thumb `adimages`, `video_data` creative. Fixture `app-json-wf4-video-sandbox.json`. Live create chain not enabled. Video HTTP upload/poll nodes still deferred until A6 binaries exist (image create chain remains the wired path).

---

## Track B — Meta operational integration

- [x] `ads.meta.*` write-back complete *(Image V1 — exec 94; not a Prompt 3 leftover)*
- [ ] Root-status policy reconciled
- [ ] Sheet Meta ID / placement attribution *(design in TRACK-C-PROOF; implement later)*
- [ ] UTM + landing URL consistency
- [ ] Ledger completeness
- [ ] Partial-failure recovery proven
- [ ] Pause/kill runbook
- [ ] Manual Ads Manager activation documented
- [ ] New-revision behavior documented
- [ ] Production-package repeated-trigger safety confirmed

**Before any future create re-enable:** Import updated `WF4-meta-ads-sandbox.import-ready.json` (Already Complete IF + skip + PAUSED verify) into live, keep create disabled until video/image approval phrase.

Track B verdict: `_pending_` (Image write-back Done; remaining ops deferred)

---

## Track C — WF0–WF3 paid-traffic dependencies

- [x] WF0 webhook provisioning proven *(WF0 exec 27; live embed re-verified 2026-07-27)*
- [x] WF2 tracking embed proven *(GH + live app-config shared webhook)*
- [x] WF3 browser event E2E proven *(live Safari/Chrome page_view → Sheet; e.g. execs 91, 84)*
- [x] Attribution / eventId / Sheet writes proven *(eventId + UTMs/fbclid + Append Row)*
- [x] Paid-click-to-event proof (when applicable) *(facebook paid_social + fbclid → Sheet; Meta ID cols still blank)*
- [x] Meta ID/placement joins designed or proven *(designed in TRACK-C-PROOF — URL dynamic params preferred; not implemented)*

Track C verdict: `PASS`

**Canonical shared webhook:** `https://scottyo.app.n8n.cloud/webhook/app-validation/events`  
**Proof:** [`TRACK-C-PROOF.md`](TRACK-C-PROOF.md)

---

## Track D — Spec / starter / production promotion

- [ ] Architecture docs synced
- [ ] Schema media type/revision/placement fields
- [ ] app-package-starter START_HERE checklist
- [ ] Asset naming + safe budget defaults
- [ ] Sandbox vs production separation
- [ ] Parameterized workflow exports
- [ ] Production Human Lab cleanup (budget/media)

Track D verdict: `_pending_`

---

## Track E — WF-Decision

- [ ] Ingest landing events
- [ ] Join Meta metrics
- [ ] Evaluate package criteria
- [ ] Write validation results / terminal status
- [ ] Advisory vs automatic policy defined
- [ ] Human override retained where required
- [ ] Idempotent/repeatable decisions

Track E verdict: `_pending_`

---

## Track F — Operator productization

- [ ] End-to-end operator runbook written
- [ ] Credential inventory (no secrets in Git)
- [ ] Recovery procedures
- [ ] Acceptance checklist
- [ ] “System done” definition recorded

Track F verdict: `_pending_`

---

## Definitions snapshot

| Definition | Status |
|------------|--------|
| A. WF4 image V1 | `Done` (PASS) |
| B. WF4 full creative (incl. video) | `Missing` (Track A next) |
| C. Meta ads automation (manual activation) | `Partial` |
| D. Full App Validation System | `Partial` (measurement loop closed; Decision/video/prod remain) |

---

## Open blockers / wait for Scott

1. **A6:** Supply real `media/ad-hero-feed.mp4` + `media/ad-thumb-feed.png` (Human Lab sandbox repo).
2. Before any create re-enable: **Already Complete IF** + live Process paste from synced workflow if not already.
3. A7 exact phrase later: `APPROVE WF4 VIDEO CREATE-PAUSED V1`
4. Meta Standard Access + business verify — public delivery only.
5. No WF4 auto-activate.

---

## Latest compact handoff

```text
Status: Track A A3–A5 local PASS — video dry_run plan in adapter/workflow; create DISABLED
Last completed: video select/resolve/plan + thumb required + fingerprint; wf4-rehearse PASS; Process synced in workflow.ts
Selected track: A
WF4: inactive dry_run create DISABLED — zero Meta POSTs
Next: Scott supplies feed mp4 + thumb (A6); then disabled HTTP nodes / live dry_run; Already Complete IF before create
Exact next action: Wait for video assets OR approve adding disabled video upload/poll nodes on live canvas
```

---

## Handoff history (append-only)

<!-- Agent: append dated mini-handoffs below; keep Latest compact handoff above current. -->

### 2026-07-27 — A2 approved; A3–A5 local implementation

- Video media select (`type:video` + required thumbnailRef)
- Plan `/advideos` + status poll + thumb upload + `video_data` creative
- Fingerprint: video + thumb hashes; image-v1 fingerprint unchanged (`114e6616…`)
- Fixture `app-json-wf4-video-sandbox.json`; rehearse PASS; adapter synced into `workflow.ts` Process
- Create path still disabled; no Meta POSTs
- STOP for Scott A6 assets

### 2026-07-27 — A1 approved; A2 design drafted

- Scott approved A1 defaults
- Wrote A2 additive media model + 5 examples
- No adapter or n8n code yet; WF4 create still disabled
- STOP for approve A2

### 2026-07-27 — Track A A1 research complete

- Re-verified Ads Guide Feed / IG Reels / IG Stories + `/advideos` + video_data + Video Status (`v25.0`)
- Wrote Video V1 placement matrix + upload/poll/thumb policy into CREATIVE-ASSET-SPECS.md
- WF4 safety re-checked: inactive, dry_run, create disabled
- STOP for Scott A1 approval (7-row decision table) before A2

### 2026-07-27 — Track C PASS

- Verified live landing + GH embed shared webhook
- Synced local Drive fixtures `webhookUrl` → shared URL
- Documented live browser E2E from WF3 execs (Safari/Chrome/iPhone; paid_social+fbclid)
- Meta ID/placement join design recorded (URL dynamic params preferred)
- Updated SANDBOX-MASTER-BACKLOG BL-005/006 + readiness; DEPENDENCY_GRAPH blocker cleared
- WF4 safety re-checked: inactive, dry_run, create disabled
- STOP for Scott next-track approval (recommend Track A)

### 2026-07-27 — Planning complete; Track C selected

- Image V1 PASS prerequisites checked
- Maturity scorecard / Defs A–D / P0–P2 backlog recorded
- Recommended C-first; Scott selected Track C (plan implement)
- WF4 create path stays disabled
