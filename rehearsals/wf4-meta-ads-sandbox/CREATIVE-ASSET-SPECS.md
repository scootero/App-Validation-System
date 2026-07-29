# WF4 Creative Asset Specs (Living)

**Status:** Living SSOT — Image V1 **PASS**; Track C **PASS**; Track A **A1 approved**; **A2 design drafted** — awaiting Scott A2 approval before A3 code  
**Last updated:** 2026-07-27  
**Prompt 2:** Complete (Image V1). **Prompt 3 Track A:** A1 approved; A2 media model design ready for approval; no upload/create code yet.

This is the **only** canonical creative-asset / media-requirements document for WF4. Do not create a competing parallel spec.

---

## How to read this document

| Label | Meaning |
|-------|---------|
| **Current / proven** | Measured or locked Image V1 behavior in this sandbox |
| **Approved architecture** | Decisions already locked for Image V1 / create-paused (Feed-first, PAUSED, destination pattern) |
| **Proposed future design** | Prompt 3 prep research — **not implemented**; needs Scott approval before schema/workflow work |
| **Official Meta requirement** | Hard limit or API/Ads Guide technical requirement from Meta docs |
| **Official Meta recommendation** | Meta design guidance (ratio, resolution, captions, etc.) — not always a hard fail |
| **Our recommendation** | Platform preference consistent with Meta docs and validation goals |

Nothing in **Proposed future design** is shipped. Do not treat proposed `ads.media[]` fields or Track C attribution joins as done.

---

## Re-verification requirement

Before any create-paused enablement, video upload implementation, or new placement enablement:

1. Re-open the official Meta Ads Guide pages for the exact placement + format.
2. Re-check Marketing API version in use (sandbox SSOT: `v25.0` in `CANONICAL-WF4.md` — confirm at implement time).
3. Re-check `/advideos`, creative `video_data`, and URL dynamic-parameter Help Center pages if touching those surfaces.
4. Record new verification date in [Provenance](#provenance-official-meta-docs) and the change log.

Meta can change recommendations and limits without notice. Do not rely on remembered limits.

---

## Default click architecture

**Approved architecture (default for Image V1 and intended for video):**

```text
Meta image/video ad (PAUSED until human activates)
  → CTA opens deployed landing page (deployment.landing.url + tracking tags)
  → landing may embed or link the interactive app mockup
  → WF3 records source/campaign/session/interactions/conversions
```

Meta-native interactive destinations (Instant Experience, Collection, Playable) are **optional future experiments**, not the default validation path. See [Interactive formats](#interactive-formats-optional-future-experiments).

---

## Provenance (official Meta docs)

### Image V1 stub (verified 2026-07-19)

| Document | URL | Notes captured | Classification |
|----------|-----|----------------|----------------|
| Facebook Ads Guide — Image (Facebook Feed) | https://www.facebook.com/business/ads-guide/update/image | JPG/PNG; design rec **4:5** @ 1440×1800; max **30 MB**; min width **600 px**; primary text 50–150 chars; headline ~27 chars | Official recommendation + technical requirements |
| Same guide — placement picker | (same page) | Distinct placements: Facebook Feed, Facebook stories, Ads on Facebook Reels, Instagram feed, Instagram Stories, Instagram Reels, etc. | Official |

**Important (unchanged):** Current Meta Feed *recommendations* skew vertical (4:5). Landscape **1.91:1** assets are still usable for Feed but may letterbox/crop differently than 4:5. Image V1 accepts landscape for Feed-first PAUSED proof and validates visually in Phase 7.

### Prompt 3 prep expansion (verified 2026-07-20; **re-verified 2026-07-27 for Track A A1**)

| Document | URL | Supporting note (2026-07-27 re-check) | Classification |
|----------|-----|----------------------------------------|----------------|
| Awareness Video — Facebook Feed | https://www.facebook.com/business/ads-guide/update/video | MP4/MOV/GIF; **4:5** @ **1440×1800**; H.264 + AAC stereo **128kbps+**; duration **1 s–241 min**; max **4 GB**; min **120×120** | Official recommendation / technical requirements |
| Awareness Video — Instagram Reels | https://www.facebook.com/business/ads-guide/update/video/instagram-reels | MP4/MOV; **9:16** @ **1440×2560**; safe zone ~**14% top / 35% bottom / 6% sides**; duration **0 s–15 min**; max **4 GB**; min width **250** (&lt;30 s) / **500** (≥30 s); sound strongly recommended; no licensed music / face effects / GIF / product tags | Official recommendation / technical requirements |
| Awareness Video — Instagram Stories | https://www.facebook.com/business/ads-guide/update/video/instagram-story | MP4/MOV/GIF; **9:16** @ **1440×2560**; duration **1 s–60 min**; **&lt;16 s** plays full; longer may split cards; max **4 GB**; min width **250**; aspect tolerance **1%**; same safe-zone family | Official recommendation / technical requirements |
| Ad Account Advideos | https://developers.facebook.com/docs/marketing-api/reference/ad-account/advideos/ | `POST /act_{ad-account-id}/advideos`; chunked `upload_phase` ∈ `{start, transfer, finish, cancel}` + `upload_session_id` / `start_offset` / `video_file_chunk`; also `source` for non-chunked | Official API requirement (doc updated Feb 24, 2026) |
| Video and Carousel Ads | https://developers.facebook.com/docs/marketing-api/guides/videoads/ | Creative example uses Graph **`v25.0`**; `object_story_spec.video_data` with `video_id` + `image_url` thumb | Official API requirement |
| Ad Creative Video Data | https://developers.facebook.com/docs/marketing-api/reference/ad-creative-video-data/ | Thumb via `image_url` (host on own servers — not FB CDN) or `image_hash` | Official API requirement |
| Video Status | https://developers.facebook.com/docs/graph-api/reference/video-status/ | `video_status`: `ready` \| `processing` \| `error`; `processing_progress` 0–100 | Official API requirement |
| URL dynamic parameters | https://www.facebook.com/business/help/2360940870872492 | `{{ad.id}}`, `{{adset.id}}`, `{{campaign.id}}`, `{{placement}}`, `{{site_source_name}}`; Traffic supported | Official capability |
| Collection / Playable / Instant Experience | (prior URLs) | Unchanged — not Video V1 default | Official (out of default path) |

**Sandbox Marketing API version SSOT:** `v25.0` ([`CANONICAL-WF4.md`](CANONICAL-WF4.md)) — matches videoads guide examples as of A1 re-check.

---

## Current V1 asset inventory

**Label: Current / proven**

| Field | Value |
|-------|--------|
| Repo | `scootero/Human-Lab-WF1-Sandbox` @ `main` |
| Local proof path | `rehearsals/github/Human-Lab-WF1-Sandbox/media/og-image.png` |
| Package path (`ads.media[].githubPath`) | `media/og-image.png` |
| MIME / format | `image/png` (PNG, 8-bit RGB, non-interlaced) |
| Measured dimensions | **1734 × 907** |
| Aspect | ~**1.91:1** landscape |
| File size | **2,077,914** bytes (~1.98 MB) — under 30 MB |
| SHA-256 | `ae73b936b39bb5d86c357c9bb2aab8d10b5b017f09d17e43a908ac49ce7e055d` |
| Fixture drift | **Resolved 2026-07-20** — fixture `media.ogImage` now **1734×907** (was stale 1200×630) |

Do **not** create new creative variants until Scott approves.

---

## Image V1 placement policy (locked default)

**Label: Approved architecture (Image V1)**

| Placement | V1 enabled? | Rationale |
|-----------|-------------|-----------|
| Facebook desktop Feed | **Yes** (target) | Landscape asset; Phase 7 preview required |
| Facebook mobile Feed | **Yes** (target) | Same |
| Instagram Feed | **Yes** (target) | Same; IG identity configured |
| Facebook Stories | **No — out of V1** | Needs vertical ~9:16; no asset |
| Instagram Stories | **No — out of V1** | Same |
| Facebook Reels / IG Reels | **No — out of V1** | Same |
| Other (Marketplace, Explore, AN, etc.) | **No — out of V1** | Not in Feed-first scope |

**Feed-only position restriction (approved architecture for create-paused):**

- Keep `publisher_platforms: ["facebook", "instagram"]`
- Prefer Feed-only position lists so Advantage+/default delivery does not include Stories/Reels without a vertical asset:
  - `facebook_positions`: feed-only (exclude `story`, `reels`, …)
  - `instagram_positions`: feed/stream-only (exclude Stories/Reels)
- Exact enum values must match Marketing API targeting docs at the time of create-paused enablement.
- Prompt 2 Phase 4+ dry_run encoded Feed-first positions (`facebook_positions:[feed]`, `instagram_positions:[stream]`); **re-verify live create payload** before treating positions as proven on a real PAUSED ad.

---

## Image V1 placement matrix

**Label: Current / proven inventory + approved V1 policy**

| Placement | Enabled V1 | Asset fit (1734×907) | Preview status | Action |
|-----------|------------|----------------------|----------------|--------|
| FB desktop Feed | Yes | Acceptable landscape; may not fill 4:5 rec | Pending Phase 7 | Keep; inspect crop |
| FB mobile Feed | Yes | Same | Pending Phase 7 | Keep; inspect crop |
| IG Feed | Yes | Same | Pending Phase 7 | Keep; inspect crop |
| FB/IG Stories | No | Poor (landscape vs 9:16) | N/A | Disabled / out of V1 |
| FB/IG Reels | No | Poor | N/A | Disabled / out of V1 |

Phase 7 may be **PARTIAL** if Feed previews pass and Stories/Reels remain explicitly disabled.

---

## Copy / CTA (fixture — re-verify at create)

**Label: Current / proven fixture values**

From `fixtures/app-json-wf4-sandbox.json` (adapter uses first headline):

| Field | Value | Guide note (Feed image) |
|-------|--------|-------------------------|
| Primary text | Discover what actually works for your stress, sleep, and habits. | Rec 50–150 chars — check truncation in preview |
| Headline | Stop guessing. Start testing. | Rec ~27 chars — may truncate |
| Description | Human Lab turns self-improvement into structured experiments. | Preview cutoff TBD |
| CTA | `SIGN_UP` | Supported in Ads Guide CTA list |
| Landing | `https://human-lab-wf2-sandbox.vercel.app` | Required for traffic |

---

## Missing assets (Image V1 — not blocking PAUSED proof)

**Label: Current / proven gap list (Prompt 2 scope unchanged)**

- No vertical **9:16** Stories/Reels variant
- No **1:1** or **4:5** Feed-optimized variant
- No placement-specific crops
- No video / thumbnail assets

Creating these requires Scott approval. Prompt 2 does **not** invent variants or implement video.

---

## Feed image requirements

**Labels: Official Meta + our recommendation for full Feed image quality**

| Item | Guidance | Classification |
|------|----------|----------------|
| File type | JPG or PNG | Official requirement (Ads Guide) |
| Recommended ratio | **4:5** | Official recommendation |
| Recommended resolution | **1440 × 1800** | Official recommendation |
| Max file size | **30 MB** | Official requirement |
| Min width | **600 px** | Official requirement |
| Aspect ratio tolerance | **3%** (Feed image guide) | Official requirement |
| Image V1 accepted asset | Landscape ~1.91:1 (1734×907) for Feed-first proof | Approved architecture (V1) |
| Our recommendation after V1 | Prefer a dedicated **4:5** Feed image for full image coverage | Our recommendation |

Primary text 50–150 characters; headline ~27 characters — official Feed image recommendations.

---

## Full image placement coverage

**Label: Proposed future design (not Image V1 scope)**

| Bundle | Required | Recommended | Optional |
|--------|----------|-------------|---------|
| Image V1 (current) | `media/og-image.png` + Feed-only positions | — | — |
| Feed image (optimized) | One Feed-eligible image | **4:5** @ ≥1080×1350 (prefer 1440×1800) | **1:1** alternate |
| Full image placement coverage | Feed image + **9:16** vertical image for Stories/Reels if those placements are enabled | Per-placement crops; safe-zone-aware vertical | Marketplace / Explore / AN / etc. |

Do not enable Stories/Reels on image ads until a vertical asset exists and Scott approves placement expansion.

---

## Video requirements

**Label: Official Meta (re-verified 2026-07-27) + Track A A1 proposed architecture (not implemented)**

Reusable Meta video support is required for Prompt 3 Def B — **not implemented yet**. Wait for Scott A1/A2 approval before A3 code.

### Feed video (Facebook Feed Ads Guide — re-verified 2026-07-27)

| Item | Value | Classification |
|------|-------|----------------|
| File type | MP4, MOV, or GIF | Official recommendation |
| Ratio | **4:5** | Official recommendation |
| Resolution | **1440 × 1800** | Official recommendation |
| Video settings | H.264; square pixels; fixed frame rate; progressive scan; stereo AAC **128 kbps+** | Official recommendation |
| Captions | Optional, recommended | Official recommendation |
| Sound | Optional, recommended | Official recommendation |
| Duration | **1 second – 241 minutes** | Official requirement |
| Max file size | **4 GB** | Official requirement |
| Min width / height | **120 × 120** | Official requirement |
| Container note | No edit lists or special boxes in file containers | Official recommendation |
| Primary text / headline | ~50–150 chars / ~27 chars (Feed guide) | Official recommendation |

### Vertical video (IG Reels / IG Stories — re-verified 2026-07-27)

| Item | Instagram Reels | Instagram Stories | Classification |
|------|-----------------|-------------------|----------------|
| File type | MP4, MOV | MP4, MOV, or GIF | Official recommendation |
| Ratio | **9:16** | **9:16** | Official recommendation |
| Resolution | **1440 × 2560** | **1440 × 2560** | Official recommendation |
| Video settings | H.264; square pixels; fixed FPS; progressive; AAC stereo 128 kbps+ | Same family | Official recommendation |
| Captions | Optional, recommended | Optional, recommended | Official recommendation |
| Sound | Optional, **strongly** recommended | Optional, recommended | Official recommendation |
| Duration | **0 seconds – 15 minutes** | **1 second – 60 minutes**; **&lt;16 s** plays full; longer may split cards | Official requirement / behavior |
| Max file size | **4 GB** | **4 GB** | Official requirement |
| Min width | **250** (&lt;30 s) / **500** (≥30 s) | **250** | Official requirement |
| Safe zone | ~**14% top, 35% bottom, 6% each side** | Same family | Official recommendation |
| Reels exclusions | No licensed music; no face/camera effects; no GIF; no product tags; no pre-2021-10-15 Reels | — | Official recommendation |

Facebook Stories / Facebook Reels: treat as same **9:16** vertical family; re-verify the specific Ads Guide page immediately before enabling those placements in create-paused.

### Upload, processing, and creative attachment (Marketing API — A1 design)

| Item | Guidance | Classification |
|------|----------|----------------|
| API version | **`v25.0`** (sandbox SSOT + videoads examples) | Official / current sandbox |
| Upload edge | `POST /act_{ad-account-id}/advideos` | Official API requirement |
| Host | Prefer **`graph-video.facebook.com`** for video binary upload (Meta upload docs); Graph for status/creative | Official API requirement |
| Small files | Non-chunked `source` upload acceptable for modest binaries | Official API capability |
| Large files | Chunked: `upload_phase=start` → `transfer` (offsets + `video_file_chunk`) → `finish` (or `cancel`) | Official API requirement |
| Processing poll | `GET /{video-id}?fields=status` until `status.video_status === "ready"`; fail on `error`; retry/backoff while `processing` | Official API requirement + our recommendation |
| Timeout | Proposed default: poll ≤ **10 min** with exponential backoff (5s→30s); then fail closed — no creative create | Our recommendation (needs Scott OK) |
| Creative | `object_story_spec.video_data`: required `video_id`; thumb via package `image_hash` (preferred) or hosted `image_url` (not FB CDN) | Official API requirement |
| Gate | **Never** create creative/ad until `video_status=ready` and thumb resolved | Our recommendation / A3 hard rule |

---

## Video V1 placement matrix (A1 proposed architecture)

**Label: Proposed future design — awaiting Scott approval (not enabled)**

| Placement | Video V1 enable? | Required asset | Official ratio / res (rec) | Preview required if enabled |
|-----------|------------------|----------------|----------------------------|-------------------------------|
| Facebook desktop Feed | **Yes (V1 target)** | Feed video + feed thumb | 4:5 / 1440×1800 | Yes |
| Facebook mobile Feed | **Yes (V1 target)** | Same | Same | Yes |
| Instagram Feed | **Yes (V1 target)** | Same | Feed family (prefer 4:5) | Yes |
| Facebook Stories | **No until vertical asset** | Vertical video + vertical thumb | 9:16 / 1440×2560 | Yes if enabled |
| Instagram Stories | **No until vertical asset** | Same | 9:16 / 1440×2560; prefer **&lt;16 s** | Yes if enabled |
| Facebook Reels / Ads on FB Reels | **No until vertical asset** | Same | 9:16 family | Yes if enabled |
| Instagram Reels | **No until vertical asset** | Same | 9:16 / 1440×2560; sound-on | Yes if enabled |
| Other (Marketplace, Explore, AN, …) | **No** | — | — | N/A |

**Proposed Video V1 create-paused proof (A7):** Feed-only positions (mirror Image V1) — one PAUSED video ad using `ad-hero-feed.mp4` + `ad-thumb-feed.png`. Stories/Reels stay disabled until Scott supplies/approves vertical binaries and explicitly expands placements.

**Proposed full Def B (before A9):** Feed variant **and** vertical variant + matching thumbs; then enable Stories/Reels positions and preview them (A8).

**Practical export targets (our recommendation — under official maxima):**

| Variant | Export | Duration | Size target |
|---------|--------|----------|-------------|
| Feed | **1080×1350 (4:5)** MP4 H.264 + AAC ≥128 kbps; captions burned or sidecar policy TBD | **15–30 s** | Prefer **&lt;100 MB** (chunk if larger) |
| Vertical | **1080×1920 (9:16)**; safe-zone aware; sound-on + captions | **15–30 s** (Stories prefer **&lt;16 s** for single-card) | Prefer **&lt;100 MB** |
| Thumbs | PNG/JPG matching aspect; readable under chrome | n/a | Under image 30 MB |

Critical message visible in first **3 s**; readable with sound off; CTA visible near end.

---

## Feed versus vertical video variants

**Label: Proposed future design (A1)**

Do **not** assume one video file is ideal for every placement. Package **separate** Feed and vertical binaries with eligibility flags.

| Variant | Typical use | Practical export (our recommendation) |
|---------|-------------|----------------------------------------|
| Feed video | FB/IG Feed | **1080×1350 (4:5)**; 15–30 s; MP4 H.264 + AAC; prefer **&lt;100 MB** |
| Vertical video | Stories / Reels | **1080×1920 (9:16)**; 15–30 s (&lt;16 s preferred for Stories); safe zones; sound-on + captions |
| Full coverage | Both + matching posters | Separate binaries; optional image fallback |

**A1 proposed decision (default unless Scott overrides):** separate creative revisions / placement eligibility — **not** Advantage+ asset customization in Video V1. One operation fingerprint per selected variant set (`video-feed-v1`, later `video-vertical-v1` or combined when both enabled).

---

## Thumbnails / posters

**Label: Official API capability + A1 proposed policy**

| Item | Guidance | Classification |
|------|----------|----------------|
| API | Attach poster with `video_data.image_hash` (preferred) or `image_url` (own host, not FB CDN) | Official API requirement for custom thumb |
| Package | **Required** explicit package poster per video variant for Video V1 | Our recommendation / proposed design |
| Auto-thumb | Meta may generate thumbs — **reject for Video V1** (fail if thumb missing/invalid) | Proposed policy (needs Scott OK) |
| Framing | Poster matches video aspect; readable under Feed/Stories chrome | Our recommendation |

---

## Safe zones, cropping, and recomposition

| Surface | Guidance | Classification |
|---------|----------|----------------|
| Stories / Reels | Keep critical text/logos out of ~**14% top, 35% bottom, 6% left/right** | Official recommendation (IG Reels/Stories guides) |
| Feed 4:5 vs landscape | Landscape Image V1 may letterbox/crop vs 4:5 recommendation — inspect in Phase 7 | Official recommendation + approved V1 acceptance |
| Recomposition | Do not auto-recompose binaries in WF4 without an explicit approved pipeline | Our recommendation |
| Validation | Automated safe-zone checks vs human preview only — open Prompt 3 decision | Proposed future design |

---

## Formats, codecs, frame rate, audio, duration, file size

**Summary for authors (re-verify before implement):**

| Concern | Images | Video |
|---------|--------|-------|
| Containers / types | JPG, PNG | MP4 / MOV (GIF allowed on some placements) |
| Codec | n/a | H.264 video; AAC audio ≥128 kbps stereo |
| Frame rate | n/a | Fixed frame rate; progressive scan; square pixels |
| Duration | n/a | Placement-specific (see matrices); prefer 15–30 s for paid Feed/Reels |
| Max size | 30 MB | 4 GB (prefer much smaller for upload/processing) |
| Captions | n/a | Optional but recommended (sound-off comprehension) |
| Audio | n/a | Optional; strongly recommended for Reels |

---

## Minimum asset bundles by scenario

**Label: Proposed future design (except Image V1 row = current)**

| Scenario | Required | Recommended | Optional |
|----------|----------|-------------|---------|
| **Existing Image V1** | `media/og-image.png`; Feed-only positions | — | — |
| **Feed image ads** | One Feed-eligible image | 4:5 @ ≥1080×1350 | 1:1 alternate |
| **Full image placement coverage** | Feed image + 9:16 vertical image | Per-placement crops | Non-Feed surfaces |
| **Feed video ads** | Feed video + thumbnail/poster | Captions; sound | Image fallback |
| **Stories/Reels vertical video** | 9:16 video + vertical thumb; safe-zone-aware | Sound-on + captions | Separate FB vs IG cuts |
| **Full Feed + Stories/Reels video** | Feed video + vertical video + matching thumbs | Image fallback; eligibility flags | Asset customization |
| **Video thumbs** | One thumb per video variant (or explicit auto-thumb policy) | Match aspect | Multiple thumb A/B |
| **Image fallbacks** | Declared fallback image when video is primary | Same Feed rules as Image V1 | — |

---

## Canonical filenames under `media/`

**Label: Current / proven + proposed future names (files not created by this doc)**

| Path | Status | Role |
|------|--------|------|
| `media/og-image.png` | **Current / proven** | Social/OG + Image V1 primary creative |
| `media/ad-hero-feed.png` | Proposed | Optional 4:5 Feed image upgrade |
| `media/ad-hero-vertical.png` | Proposed | Optional 9:16 image |
| `media/ad-hero-feed.mp4` | Proposed | Feed video |
| `media/ad-hero-vertical.mp4` | Proposed | Stories/Reels video |
| `media/ad-thumb-feed.png` | Proposed | Poster for feed video |
| `media/ad-thumb-vertical.png` | Proposed | Poster for vertical video |

Scott supplies or approves real binaries. Do not invent fake final creative.

---

## Backward-compatible future `ads.media[]` considerations

**Label: A2 proposed design (A1 defaults Scott-approved 2026-07-27) — NOT implemented in schema/code yet**

### Current schema (do not treat as video-ready)

Today `mediaAsset` supports `url` | `githubPath` | `path`, optional dimensions/alt, and optional `role: primary | carousel | video`. There is **no** authoritative `type`, thumbnail reference, placement eligibility, MIME, or duration field in the shipped schema.

Selection priority remains: `ads.media[]` → `media.ogImage` → fail.

### A2 additive model (design freeze candidate)

New fields are **additive** and optional for existing image packages. Human Lab is **not** hardcoded — any app package can use the same shape.

| Field | Required when | Notes |
|-------|---------------|-------|
| `githubPath` / `url` / `path` | Always (one of) | Existing |
| `type` | Recommended for new assets | `image` \| `video` — authoritative when set |
| `role` | Optional | `primary` \| `carousel` \| `video` \| `thumbnail` \| `fallback` — legacy `role: video` alone is **not** enough |
| `mimeType` | Video V1 | e.g. `video/mp4`, `image/png` |
| `width` / `height` | Recommended | Validated against placement matrix |
| `durationSeconds` | Video | Validated vs placement limits |
| `placementRoles` | Recommended | e.g. `facebook_feed`, `instagram_stream`, `facebook_stories`, `instagram_stories`, `facebook_reels`, `instagram_reels` |
| `eligibility` | Optional shorthand | `{ feed, stories, reels }` booleans |
| `thumbnailRef` | **Required for video** (A1 policy) | Path/ref to a separate **image** asset in `ads.media[]` or same-repo path |
| `fallbackRef` | Optional | Image used if video path fails / policy allows |
| `creativeRevision` | Operation ledger | e.g. `image-v1`, `video-feed-v1` — usually on `ads` / operation key, not every media row |
| `branch` / repo | Via `source.*` | Existing package source fields |

**Compatibility rules (A2):**

1. `{ "githubPath": "media/og-image.png", "role": "primary" }` remains valid → infer `type: "image"`.
2. When present, `type` wins over `role: "video"`.
3. Thumbnails are separate image entries (or path refs); Video V1 **rejects** missing/invalid thumb.
4. Fingerprints: image ops keep current image-hash fingerprint; video ops add **video binary hash + thumb hash**.
5. Image `image-v1` and video `video-feed-v1` are **different** operation keys — no collision with existing PAUSED image ads.

### A2 examples (illustrative — not live fixtures yet)

**1. One image (today’s Image V1 — still valid)**

```json
{
  "githubPath": "media/og-image.png",
  "role": "primary"
}
```

**2. One feed video + thumbnail**

```json
[
  {
    "githubPath": "media/ad-hero-feed.mp4",
    "type": "video",
    "role": "primary",
    "mimeType": "video/mp4",
    "width": 1080,
    "height": 1350,
    "durationSeconds": 20,
    "placementRoles": ["facebook_feed", "instagram_stream"],
    "eligibility": { "feed": true, "stories": false, "reels": false },
    "thumbnailRef": "media/ad-thumb-feed.png"
  },
  {
    "githubPath": "media/ad-thumb-feed.png",
    "type": "image",
    "role": "thumbnail",
    "mimeType": "image/png",
    "width": 1080,
    "height": 1350
  }
]
```

**3. One vertical video + thumbnail**

```json
[
  {
    "githubPath": "media/ad-hero-vertical.mp4",
    "type": "video",
    "role": "primary",
    "mimeType": "video/mp4",
    "width": 1080,
    "height": 1920,
    "durationSeconds": 15,
    "placementRoles": ["facebook_stories", "instagram_stories", "facebook_reels", "instagram_reels"],
    "eligibility": { "feed": false, "stories": true, "reels": true },
    "thumbnailRef": "media/ad-thumb-vertical.png"
  },
  {
    "githubPath": "media/ad-thumb-vertical.png",
    "type": "image",
    "role": "thumbnail",
    "mimeType": "image/png",
    "width": 1080,
    "height": 1920
  }
]
```

**4. Feed + vertical variants (full Def B package)**

```json
[
  {
    "githubPath": "media/ad-hero-feed.mp4",
    "type": "video",
    "role": "primary",
    "mimeType": "video/mp4",
    "placementRoles": ["facebook_feed", "instagram_stream"],
    "eligibility": { "feed": true, "stories": false, "reels": false },
    "thumbnailRef": "media/ad-thumb-feed.png"
  },
  {
    "githubPath": "media/ad-thumb-feed.png",
    "type": "image",
    "role": "thumbnail"
  },
  {
    "githubPath": "media/ad-hero-vertical.mp4",
    "type": "video",
    "role": "primary",
    "mimeType": "video/mp4",
    "placementRoles": ["facebook_stories", "instagram_stories", "facebook_reels", "instagram_reels"],
    "eligibility": { "feed": false, "stories": true, "reels": true },
    "thumbnailRef": "media/ad-thumb-vertical.png"
  },
  {
    "githubPath": "media/ad-thumb-vertical.png",
    "type": "image",
    "role": "thumbnail"
  }
]
```

WF4 selects which variant(s) via operation revision / config (Video V1 create = feed variant only).

**5. Image fallback + video**

```json
[
  {
    "githubPath": "media/ad-hero-feed.mp4",
    "type": "video",
    "role": "primary",
    "thumbnailRef": "media/ad-thumb-feed.png",
    "fallbackRef": "media/og-image.png",
    "eligibility": { "feed": true, "stories": false, "reels": false }
  },
  { "githubPath": "media/ad-thumb-feed.png", "type": "image", "role": "thumbnail" },
  { "githubPath": "media/og-image.png", "type": "image", "role": "fallback" }
]
```

Video V1 still requires a valid video+thumb; fallback is for later recovery/policy — not a substitute for missing video on the video create path.

### A2 open items before code

- Confirm field names above (or prefer shorter aliases).
- Sandbox fixture may use additive fields in rehearsal only until Spec 1.5.0 coordinated pass (Track D) updates production schema.
- No workflow/adapter code until Scott says **approve A2**.

These fields are **not** in production schema until Prompt 3 Track A2/D is approved and implemented.

---

## Click destination and attribution expectations

**Label: Approved architecture (destination) + open Track C gaps (not completed)**

### Current Image V1 destination pattern (approved architecture)

- Base URL: `deployment.landing.url` (sandbox: `https://human-lab-wf2-sandbox.vercel.app`)
- WF4 expands `ads.utmTemplate` into a query string and sets creative `link_data.link` (and CTA link) to that destination.
- Example shape:  
  `https://human-lab-wf2-sandbox.vercel.app?utm_source=facebook&utm_medium=paid_social&utm_campaign=human-lab-validation`
- Dynamic Meta macros (`{{ad.id}}`, `{{campaign.id}}`, `{{placement}}`, etc.) are **not** wired in the current create-paused path.

### Official Meta capability (URL parameters)

Meta supports static and dynamic URL parameters such as `ad_id={{ad.id}}`, `campaign_id={{campaign.id}}`, `placement={{placement}}`, `site_source_name={{site_source_name}}` (Help Center — see Provenance). Traffic objective is supported. Name-based macros freeze to first-published names.

### WF2 / WF3 expectations (current vs gap)

| Concern | Current state | Classification |
|---------|---------------|----------------|
| Sandbox landing persists `utm_*` + `fbclid` | Yes — browser E2E proven 2026-07-27 (Track C) | Current / proven (sandbox) |
| Production `landing-template` attribution/`eventId` parity | Backlog — not assumed done | Open gap (Spec pass) |
| WF3 Sheet columns for `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement` | Reserved; values still blank on live rows | Schema ready; join **not** live |
| WF2 capture of Meta dynamic URL keys | Not in sandbox attribution capture today | Open (Track B / Decision) |
| WF4 emission of Meta dynamic URL parameters | Not implemented | Open (Track B; design in TRACK-C-PROOF) |
| Paid-click-to-event (UTM/`fbclid`) | Proven 2026-07-27 (Track C) | Current / proven |
| Paid-click Meta ID columns | Still blank | Open design → implement later |

Track C measurement loop is **PASS**. Meta ID column population remains a later join/implement item.

---

## Interactive formats (optional future experiments)

**Label: Proposed future design — default remains ad → landing**

| Option | Role in this platform | Notes |
|--------|----------------------|-------|
| Standard Meta image/video ad → our landing | **Default** | Full WF2/WF3 control |
| Landing with embedded/linked interactive mockup | Preferred enhancement of default | `mockup_interacted` already in WF3 event set |
| Instant Experience | Optional experiment | Native in-app destination; weakens LP/WF3 unless exit to our URL |
| Collection ads | Optional experiment | Hero + Instant Experience / catalog-oriented |
| Playable ads | Out of Traffic V1 scope | Official: App Installs objective only |
| Embed arbitrary webpage inside a normal Meta ad | Do not pursue | Not a supported standard creative pattern |

---

## Prompt 2 / Prompt 3 next steps

**Prompt 2:** Complete — Image V1 PASS.

**Prompt 3 Track A — current:**

1. ~~Scott approves A1 defaults~~ **Done** 2026-07-27.
2. **A2 design drafted** — Scott approves media model before A3 code.
3. A3+: implement resolver/upload/poll/creative **disabled** until dry_run proofs; Already Complete IF before any create re-enable.
4. A6: Scott supplies `ad-hero-feed.mp4` (+ thumb); vertical optional until Stories/Reels expansion.
5. A7: exact phrase `APPROVE WF4 VIDEO CREATE-PAUSED V1` only — Feed-first PAUSED video ad.
6. No auto-activate; Image V1 objects remain PAUSED / untouched unless deliberate new revision.

---

## A1 decisions (approved)

| # | Default | Status |
|---|---------|--------|
| 1 | Video V1 create proof = Feed-only | **Approved** 2026-07-27 |
| 2 | Required package thumbnail | **Approved** 2026-07-27 |
| 3 | Separate Feed vs vertical binaries | **Approved** 2026-07-27 |
| 4 | `source` if &lt;100 MB else chunked; poll `ready` | **Approved** 2026-07-27 |
| 5 | Poll timeout 10 min fail-closed | **Approved** 2026-07-27 |
| 6 | Paths `ad-hero-feed.mp4` + `ad-thumb-feed.png` | **Approved** 2026-07-27 |
| 7 | Revision `video-feed-v1` | **Approved** 2026-07-27 |

**STOP for A2:** reply **approve A2** (or field-name overrides) before any adapter/workflow implementation.

---

## Change log

| Date | Change |
|------|--------|
| 2026-07-19 | Initial living stub: measured og-image, Feed-first policy, Stories/Reels out of V1, official Ads Guide provenance |
| 2026-07-20 | Feed positions confirmed implemented in adapter; fixture dims aligned to 1734×907 |
| 2026-07-20 | Expanded to living SSOT from Prompt 3 prep research |
| 2026-07-27 | Image V1 PASS notes; Track C attribution status updated |
| 2026-07-27 | **Track A A1:** Official video re-verify + Video V1 matrix/upload design |
| 2026-07-27 | **A1 approved**; **A2** additive `ads.media[]` model + 5 examples (design only) |
