# Try-Out UX Change Checklist

Date: 2026-07-31  
Scope: Hero / live-mockup try-out affordances only. Expand sizing untouched.

## Synced files (template ↔ Human Lab sandbox)

| File | Behavior |
|------|----------|
| `components/Hero.tsx` | Mobile: badge + headline + subhead → try-it cue + mockup → body/benefits/CTAs. Desktop: two-column preserved + “Try it out” arrow toward mockup. Hero-local tighter top padding. |
| `components/LiveMockupEmbed.tsx` | Collapsed phone smaller on mobile (`max-w-[280px]` → `sm:max-w-[320px]` → `lg:max-w-[340px]`). Stronger accent “Click to expand” chip. |

## Explicit non-goals (do not port with this change)

- `lib/session.ts`
- `lib/tracking.ts`
- `components/TrackingProvider.tsx`
- Expand overlay constants / scale math (`FOCUS_INSET`, `FOCUS_CLOSE_HEIGHT`, `computeScaleToFit`)
- App copy / `app-config.json` / Drive `app.json`

## Ship order

1. Push `rehearsals/wf2-human-lab-sandbox/landing-project` → `scootero/Human-Lab-WF2-Sandbox` (test first)
2. Push `landing-template` → `scootero/Landing-Page-Template` (same UI diffs)

## Verify after deploy

- Phone-width: try-out mockup visible near top without scrolling past full hero
- Mid-width (`< lg`): same single-column stack, padded sides
- Desktop (`lg+`): copy left, mockup right, “Try it out” arrow visible
- Expand still opens/fits with previous relative sizing
