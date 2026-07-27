# WF4 Creative Asset Specs (Living)

**Status:** Living SSOT — Image V1 proven inventory + Prompt 3 prep research  
**Last updated:** 2026-07-20  
**Prompt 2:** Deep Stories/Reels perfection and video implementation do **not** block Image V1 PAUSED create-paused. Video and richer package media remain Prompt 3 (after Image V1 PASS/PARTIAL and Scott approval).

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

### Prompt 3 prep expansion (verified 2026-07-20)

| Document | URL | Supporting note | Classification |
|----------|-----|-----------------|----------------|
| Awareness Image ad specs on Facebook Feed | https://www.facebook.com/business/ads-guide/update/image | “Ratio: 4:5 … Resolution: 1440 x 1800 … Maximum file size: 30 MB … Minimum width: 600 px” | Official recommendation / technical requirements |
| Awareness Video ad specs on Facebook Feed | https://www.facebook.com/business/ads-guide/update/video | “MP4, MOV or GIF … Ratio: 4:5 … H.264 … AAC … 128kbps+ … 1440 x 1800 … Duration: 1 second to 241 minutes … Maximum File Size: 4GB” | Official recommendation / technical requirements |
| Awareness Video ad specs on Instagram Reels | https://www.facebook.com/business/ads-guide/update/video/instagram-reels | “Ratio: 9:16 … 1440 x 2560 … ~14% top / 35% bottom / 6% sides safe zone … Duration: 0 seconds to 15 minutes … Maximum File Size: 4GB” | Official recommendation / technical requirements |
| Awareness Video Ad Specs on Instagram Stories | https://www.facebook.com/business/ads-guide/update/video/instagram-story | “Ratio: 9:16 … 1440 x 2560 … &lt;16 s plays full; longer may split cards … Maximum File Size: 4GB” | Official recommendation / technical requirements |
| Specifications for URL dynamic parameters | https://www.facebook.com/business/help/2360940870872492 | Dynamic params include `{{ad.id}}`, `{{adset.id}}`, `{{campaign.id}}`, `{{placement}}`, `{{site_source_name}}`; Traffic objective supported | Official capability |
| Ad Account Advideos | https://developers.facebook.com/docs/marketing-api/reference/ad-account/advideos/ | Upload via `source` / chunked `upload_phase` (`start`, `transfer`, `finish`, `cancel`) | Official API requirement |
| Video and Carousel Ads | https://developers.facebook.com/docs/marketing-api/guides/videoads/ | Creative uses `object_story_spec.video_data` with `video_id` + thumbnail `image_url` | Official API requirement |
| Ad Creative Video Data | https://developers.facebook.com/docs/marketing-api/reference/ad-creative-video-data/ | Fields include `video_id`, `image_url`, `image_hash` | Official API requirement |
| Collection Ads | https://developers.facebook.com/docs/marketing-api/guides/collection/ | Collection pairs hero with Instant Experience | Official format docs |
| Playable Ads for Mobile Apps | https://developers.facebook.com/docs/app-ads/formats/playable-ad/ | “Playable ads are only available with the App Installs objective.” | Official requirement (excludes Traffic V1) |
| Instant Experiences | https://developers.facebook.com/docs/marketing-api/guides/instant-experiences/ | Full-screen in-app post-click destination | Official format docs |

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

**Label: Official Meta (placement guides) + proposed future design for Prompt 3 Track A**

Video is **out of Prompt 2 scope**. Reusable Meta video support is required for Prompt 3 “full creative” DoD — **not implemented yet**.

### Feed video (Facebook Feed Ads Guide)

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

### Vertical video (Instagram Reels / Stories Ads Guide)

| Item | Instagram Reels | Instagram Stories | Classification |
|------|-----------------|-------------------|----------------|
| File type | MP4, MOV | MP4, MOV, or GIF | Official recommendation |
| Ratio | **9:16** | **9:16** | Official recommendation |
| Resolution | **1440 × 2560** | **1440 × 2560** | Official recommendation |
| Video settings | H.264; square pixels; fixed FPS; progressive; AAC stereo 128 kbps+ | Same family | Official recommendation |
| Captions | Optional, recommended | Optional, recommended | Official recommendation |
| Sound | Optional, **strongly** recommended (Reels) | Optional, recommended | Official recommendation |
| Duration | **0 seconds – 15 minutes** | **1 second – 60 minutes**; &lt;16 s plays full; longer may split into Stories cards | Official requirement / behavior |
| Max file size | **4 GB** | **4 GB** | Official requirement |
| Safe zone | ~**14% top, 35% bottom, 6% each side** free of critical text/logos | Same family | Official recommendation |

Facebook Stories / Facebook Reels follow the same **9:16** vertical family; re-verify the specific Ads Guide page before enabling each placement.

### Upload and creative attachment (Marketing API)

| Item | Guidance | Classification |
|------|----------|----------------|
| Upload edge | `POST /act_{ad-account-id}/advideos` | Official API requirement |
| Large files | Chunked upload phases: `start`, `transfer`, `finish`, `cancel` | Official API requirement |
| Processing | Poll until video is usable **before** creating the ad creative | Official behavior + our recommendation |
| Creative | `object_story_spec.video_data` with `video_id` + thumbnail via `image_url` or `image_hash` | Official API requirement |

---

## Feed versus vertical video variants

**Label: Proposed future design**

Do **not** assume one video file is ideal for every placement.

| Variant | Typical use | Practical export (our recommendation; re-verify) |
|---------|-------------|--------------------------------------------------|
| Feed video | FB/IG Feed | ~**1080×1350 (4:5)** or square; **15–30 s** sweet spot; MP4 H.264 + AAC; prefer **&lt;500 MB** even though max is 4 GB |
| Vertical video | Stories / Reels | **1080×1920 (9:16)**; **15–30 s** preferred; respect safe zones; sound-on + captions |
| Full Feed + Stories/Reels coverage | Both variants + matching posters | Separate binaries; placement eligibility flags; optional image fallback |

Whether Prompt 3 uses one multi-placement ad with asset customization vs separate creative revisions is an **open Scott decision**.

---

## Thumbnails / posters

**Label: Official API capability + proposed future design**

| Item | Guidance | Classification |
|------|----------|----------------|
| API | Attach poster with `video_data.image_url` or `image_hash` | Official API requirement for custom thumb |
| Package | Prefer an explicit package poster per video variant | Our recommendation / proposed design |
| Auto-thumb | Meta may generate thumbnails; relying on auto-thumb only is an open policy decision | Proposed future design (needs Scott approval) |
| Framing | Poster should match video aspect and remain readable under Feed chrome | Our recommendation |

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

**Label: Proposed future design — NOT implemented**

### Current schema (do not treat as video-ready)

Today `mediaAsset` supports `url` | `githubPath` | `path`, optional dimensions/alt, and optional `role: primary | carousel | video`. There is **no** authoritative `type`, thumbnail reference, placement eligibility, MIME, or duration field in the shipped schema.

Selection priority remains: `ads.media[]` → `media.ogImage` → fail.

### Additive model (illustrative only — requires Scott + schema approval)

```json
{
  "githubPath": "media/ad-hero-feed.mp4",
  "type": "video",
  "role": "primary",
  "placementRoles": ["facebook_feed", "instagram_stream"],
  "mimeType": "video/mp4",
  "width": 1080,
  "height": 1350,
  "durationSeconds": 20,
  "thumbnailRef": "media/ad-thumb-feed.png",
  "fallbackRef": "media/og-image.png",
  "eligibility": { "feed": true, "stories": false, "reels": false }
}
```

**Compatibility rules (proposed):**

- Existing `{ "githubPath": "media/og-image.png", "role": "primary" }` remains valid → infer `type: "image"`.
- When present, `type` is authoritative over `role: "video"`.
- Thumbnails are separate image assets linked by reference fields.
- Creative revision strings (e.g. `image-v1`, later `video-feed-v1`) continue to gate new Meta object sets.
- Fingerprints for video ops must include **video binary hash + thumbnail hash** without breaking existing `image-v1` image-only fingerprints.

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
| Sandbox landing persists `utm_*` + `fbclid` | Yes (sandbox landing session helpers) | Current / proven (sandbox) |
| Production `landing-template` attribution/`eventId` parity | Backlog — not assumed done | Open gap |
| WF3 Sheet columns for `metaCampaignId`, `metaAdSetId`, `metaAdId`, `placement` | Reserved; values blank until populated | Current schema readiness; **not** live join |
| WF2 capture of `campaign_id` / `ad_id` / `placement` query keys | Not in sandbox attribution capture today | **Open Track C gap** |
| WF4 emission of Meta dynamic URL parameters | Not implemented | **Open Track C / Track B gap** |
| Paid-click-to-event end-to-end proof | Not claimed complete by this document | **Open** |

Do **not** present attribution joins or Track C work as finished. Image V1 create-paused does not require closing these gaps.

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

## Prompt 2 scope and smallest next creative steps

**Prompt 2 scope is unchanged:** Image V1 create-paused, Feed-first, no video schema/upload implementation in Prompt 2.

1. Complete remaining Prompt 2 create-path / write-back / ledger / approval gates as already planned.
2. After one PAUSED image ad: Phase 7 Feed previews (may be PARTIAL with Stories/Reels disabled).
3. Optionally align fixture `media.ogImage` width/height to **1734×907** (narrow docs/fixture fix — ask Scott).
4. **After** Image V1 PASS/PARTIAL and Scott track selection: expand implementation via Prompt 3 (Track C if attribution P0, else Track A video) using this document as the media SSOT — re-verify Meta sources first.

---

## Change log

| Date | Change |
|------|--------|
| 2026-07-19 | Initial living stub: measured og-image, Feed-first policy, Stories/Reels out of V1, official Ads Guide provenance |
| 2026-07-20 | Feed positions confirmed implemented in adapter; fixture dims aligned to 1734×907 |
| 2026-07-20 | Expanded to living SSOT from Prompt 3 prep research: reading labels, re-verification, default click architecture, image/video matrices, bundles, canonical filenames, proposed `ads.media[]` (not implemented), attribution expectations/gaps, interactive-format stance, expanded official source list. Image V1 proven inventory preserved. No code/schema changes. |
