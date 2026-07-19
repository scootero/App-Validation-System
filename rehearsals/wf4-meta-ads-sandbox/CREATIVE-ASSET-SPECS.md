# WF4 Creative Asset Specs (Living)

**Status:** Living stub — Image V1 Feed-first  
**Last updated:** 2026-07-19  
**Does not block:** first PAUSED create-paused proof (Prompt 2). Deep placement research and Stories/Reels perfection are deferred.

---

## Provenance (official Meta docs)

Verified **2026-07-19** from Meta’s public Ads Guide (not memory-only):

| Document | URL | Notes captured |
|----------|-----|----------------|
| Facebook Ads Guide — Image (Facebook Feed) | https://www.facebook.com/business/ads-guide/update/image | JPG/PNG; design rec **4:5** @ 1440×1800; max **30 MB**; min width **600 px**; primary text 50–150 chars; headline ~27 chars |
| Same guide — placement picker lists | (same page) | Distinct placements: Facebook Feed, Facebook stories, Ads on Facebook Reels, Instagram feed, Instagram Stories, Instagram Reels, etc. |

Re-check this page immediately before create-paused enablement; Meta can change recommendations without notice.

**Important:** Current Meta Feed *recommendations* skew vertical (4:5). Landscape **1.91:1** assets are still commonly used for Feed but may letterbox/crop differently than 4:5. Image V1 accepts landscape for Feed-first PAUSED proof and validates visually in Phase 7.

---

## Current V1 asset inventory

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
| Fixture drift | `fixtures/app-json-wf4-sandbox.json` → `media.ogImage` still declares **1200×630** — **stale** vs measured file. Doc debt only unless Scott authorizes narrow fixture alignment. |

Do **not** create new creative variants until Scott approves.

---

## Image V1 placement policy (locked default)

| Placement | V1 enabled? | Rationale |
|-----------|-------------|-----------|
| Facebook desktop Feed | **Yes** (target) | Landscape asset; Phase 7 preview required |
| Facebook mobile Feed | **Yes** (target) | Same |
| Instagram Feed | **Yes** (target) | Same; IG identity configured |
| Facebook Stories | **No — out of V1** | Needs vertical ~9:16; no asset |
| Instagram Stories | **No — out of V1** | Same |
| Facebook Reels / IG Reels | **No — out of V1** | Same |
| Other (Marketplace, Explore, AN, etc.) | **No — out of V1** | Not in Feed-first scope |

**Preferred create-paused targeting (implement in later phase, not Phase 1):** restrict beyond `publisher_platforms` alone:

- Keep `publisher_platforms: ["facebook", "instagram"]`
- Add Feed-only position lists (exact enum values to confirm against Marketing API targeting docs at implement time), e.g. conceptual intent:
  - `facebook_positions`: feed-only (exclude `story`, `reels`, …)
  - `instagram_positions`: feed/stream-only (exclude Stories/Reels)

Today’s adapter only sets `publisher_platforms` from `ads.platforms` — **no position restriction yet** ([`lib/meta-adapter.js`](lib/meta-adapter.js)). Without restriction, Advantage+/default positions may include Stories/Reels.

---

## Placement matrix (stub)

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

From `fixtures/app-json-wf4-sandbox.json` (adapter uses first headline):

| Field | Value | Guide note (Feed image) |
|-------|--------|-------------------------|
| Primary text | Discover what actually works for your stress, sleep, and habits. | Rec 50–150 chars — check truncation in preview |
| Headline | Stop guessing. Start testing. | Rec ~27 chars — may truncate |
| Description | Human Lab turns self-improvement into structured experiments. | Preview cutoff TBD |
| CTA | `SIGN_UP` | Supported in Ads Guide CTA list |
| Landing | `https://human-lab-wf2-sandbox.vercel.app` | Required for traffic |

---

## Missing assets (not blocking PAUSED proof)

- No vertical **9:16** Stories/Reels variant
- No **1:1** or **4:5** Feed-optimized variant
- No placement-specific crops

Creating these requires Scott approval (Prompt 2: do not invent variants in this chat).

---

## Smallest next creative/placement step

1. Design Phase 2+3 contracts (idempotency + approval token) — no Meta writes.
2. At implement time: encode Feed-only `facebook_positions` / `instagram_positions` before first create-paused.
3. After one PAUSED ad: Phase 7 Ads Manager / official preview for the three Feed surfaces.
4. Optionally align fixture `media.ogImage` width/height to 1734×907 (narrow docs/fixture fix — ask Scott).

---

## Change log

| Date | Change |
|------|--------|
| 2026-07-19 | Initial living stub: measured og-image, Feed-first policy, Stories/Reels out of V1, official Ads Guide provenance |
