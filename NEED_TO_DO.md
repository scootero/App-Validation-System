# NEED TO DO — Platform follow-ups + new-app readiness

**Created:** 2026-07-31  
**Intent:** Capture work that is **not** being implemented now, plus an audit of whether you can start a fresh idea from `app-package-starter` today.  
**Ending state preference (locked for now):** WF4 creates **PAUSED** ads only; human activates / polishes in Meta Ads Manager.

---

## 1. Future: optional Ads Manager extras → `app.json` → WF4

Captured from live video ad edit (`human-lab-validation-VID-1`, Active) after manual polish in Ads Manager.

**Do not implement WF4 API changes in this pass.** Spec / starter / adapter / live WF4 later.

### 1.1 What you filled in manually (source of truth for later automation)

| Ads Manager UI | Example values (Human Lab video) | Today in package / WF4 |
|----------------|----------------------------------|-------------------------|
| **Primary text** (multi) | 3 variants, e.g. “Better sleep or less stress?…”, “Join Human Lab…”, “Explore experiments…” | `ads.primaryTexts[]` exists; **WF4 uses index `[0]` only** |
| **Headline** (multi) | 4 variants, e.g. “Human Lab”, “Try Research-Based Experiments”, … | `ads.headlines[]` exists; **WF4 uses `[0]` only** |
| **Description** (multi) | 5 variants, e.g. “Try the App Today!”, … | `ads.descriptions[]` exists; **WF4 uses `[0]` only** |
| **Optimize text per person** | **Enabled** | **Not modeled** in `app.json` / WF4 |
| **Call to action** | **Learn more** | Package often `SIGN_UP`; Meta enum likely `LEARN_MORE` |
| **Ad / campaign naming** | `human-lab-validation-VID-1` (manual rename) | WF4 builds from `ads.campaignName` + fixed suffixes (`-adset-v1`, `-creative-a`, `-ad-a`) |

### 1.2 Proposed later `app.json` shape (optional fields)

Keep current arrays; add explicit options so templates can document multi-copy + Advantage+ text:

```json
"ads": {
  "campaignName": "human-lab-validation",
  "nameSuffix": "VID-1",
  "objective": "traffic",
  "callToAction": "LEARN_MORE",
  "headlines": ["…", "…", "…", "…"],
  "primaryTexts": ["…", "…", "…"],
  "descriptions": ["…", "…", "…", "…", "…"],
  "creativeOptions": {
    "optimizeTextPerPerson": true,
    "useAllCopyVariants": true
  }
}
```

Notes for implementers later:

- `headlines` / `primaryTexts` / `descriptions` already support arrays in Spec 1.5.0 / starter — the gap is **WF4 Meta creative payload**, not inventing array fields.
- Multi-variant + “Optimize text per person” maps to Meta **Advantage+ creative / asset feed / degrees of freedom** style creatives (verify current Marketing API docs at implement time — do not guess from memory).
- Until then: author full arrays in `app.json` for documentation; expect only `[0]` on create-paused; finish extras in Ads Manager after PAUSED create (current preferred ending state).

### 1.3 WF4 / adapter work items (later)

| ID | Task | Owner area |
|----|------|------------|
| NTD-ADS-01 | Map all `ads.headlines` / `primaryTexts` / `descriptions` into Meta creative (not `[0]` only) when `creativeOptions.useAllCopyVariants` | `lib/meta-adapter.js` + Create Creative |
| NTD-ADS-02 | Model + send `optimizeTextPerPerson` (Advantage+ text) with official API fields | adapter + WF4 |
| NTD-ADS-03 | Honor `callToAction` including `LEARN_MORE` vs `SIGN_UP` (and document allowed enums in starter) | adapter + starter |
| NTD-ADS-04 | Optional `ads.nameSuffix` / revision-aware names (`…-VID-1`, `…-IMG-1`) for campaign / ad set / ad | adapter naming |
| NTD-ADS-05 | Update `app-package-starter` + `app-validation-spec` examples with multi-copy + `creativeOptions` | starter / spec |
| NTD-ADS-06 | Document: create-paused still PAUSED; multi-copy may still need Ads Manager QA until Advantage+ path proven | docs |

### 1.4 Intentionally still manual (even after NTD-ADS-*)

- Activating ads / spend
- Final visual QA in Ads Manager
- Any Meta UI-only recommendation toggles not exposed by API
- Pause / kill in emergencies (until runbook + optional automation)

---

## 2. Audit: can you start a new idea from `app-package-starter` today?

Audit stance: **you as a new operator**, duplicating the starter, wanting WF0 → WF4 PAUSED → manual activate.

### 2.1 Verdict

| Question | Answer |
|----------|--------|
| Can you **author** a new package from `app-package-starter` + Cursor + `START_HERE.md`? | **Yes** — scaffold is usable |
| Can you follow Drive / GitHub / Vercel human steps from the README? | **Mostly yes** — docs are clear for WF0–WF2 setup |
| Will the **full Human Lab–proven pipeline** run for a brand-new `appId` with zero doc drift? | **Not yet** — gaps below |
| Is “templates all line up for production multi-app” Done? | **No** — Track D / F still open |

**Practical recommendation:** You *can* start a new idea in the starter **now** for content + mockup + `app.json`. Treat WF3/WF4 for that new app as a **guided replay of Human Lab sandbox**, not a fully productized one-click path, until the gaps in §2.3 are closed.

### 2.2 What already lines up (good)

1. **`app-package-starter/`** — `START_HERE.md`, `README.md`, `app.json` (Spec 1.5.0), `mockup/`, `copy/`, `media/`, `docs/`
2. **Drive rule** — `App Validation/{appId}/app.json` **only** (no media/mockup on Drive)
3. **Human infra** — GitHub full app repo; Vercel mockup (root = `mockup`); separate landing repo/project for WF2
4. **Automation ownership** — WF0 webhook, WF1 mockup URLs, WF2 landing URLs, WF-Ads `ads.meta.*`, WF-Decision `validation.*` documented in starter
5. **Sandbox proof** — Human Lab: WF0→WF3 measurement + WF4 image + video create-paused PASS; manual activate preferred
6. **Reference package** — `test-app-packages/human-lab/`
7. **Live n8n** — WF0–WF4 sandboxes exist (not only blueprints), even if some index docs are stale

### 2.3 Gaps / risks (fix before trusting a second live app)

| # | Gap | Why it matters | Suggested fix (later) |
|---|-----|----------------|------------------------|
| G1 | **`START_HERE` / README jump WF2 → WF-Ads → WF-Decision** and barely mention **WF3** create-paused / video | New user skips event proof and approval phrases | Add WF3 + WF4 PAUSED steps + approval phrases to START_HERE |
| G2 | **`n8n-workflows/README.md` still says “no workflow JSON exported yet”** | False; WF0/WF1 JSON + rehearsal exports exist | Refresh index; point to live/canonical IDs |
| G3 | Starter **`ads.objective`: `"conversions"`** vs proven WF4 V1 **`traffic` / OUTCOME_TRAFFIC** | Wrong objective may fail or create wrong campaign type | Align starter default to `traffic` for V1 |
| G4 | Starter **`ads.media`** is image/`og-image` only; no video + `thumbnailRef` example | Video path won’t work without A2 media model | Add optional video example + link `CREATIVE-ASSET-SPECS.md` |
| G5 | Spec / starter **not fully synced** to live WF4 (`variants`, video SHA, ledger `videoId`) | Second app may miss write-back / idempotency fields | Track D Spec 1.5.0 coordinated pass |
| G6 | **WF3** proven for Human Lab Sheet/webhook; **multi-app parameterization** incomplete | New `appId` may need new Sheet tab / webhook path / WF3 config | BL-038 / parameterized WF3 |
| G7 | Live WF4 sandbox often used **fixture `app.json`**, not always Drive-first for every run | Operator may not know which file is SSOT for proof vs package | Document: Drive `App Validation/{appId}/app.json` for real apps; fixture = sandbox only |
| G8 | **WF-Decision** not built | No automated kill/scale / terminal status | Track E |
| G9 | **Operator runbook** (credentials, order, recovery) incomplete | Easy to miss Vercel landing create or Meta checklist | Track F |
| G10 | Process hard-gate may still show `createPausedAllowed: true` in live Process text while create nodes are disabled | Confusing safety story | Apply hard-gate false when possible |
| G11 | Starter `media/` is thin (screenshots folder + README); real creatives must be added | WF2/WF4 fail closed without assets | Checklist: push `media/*` before WF2/WF4 |
| G12 | Optional Ads Manager multi-copy / Optimize text (§1) not in WF4 | Expect manual polish after PAUSED | NTD-ADS-* later |

### 2.4 Operator path checklist (use this when starting a new idea)

Copy from `app-package-starter` → work as `{appId}`:

1. **Cursor + START_HERE** — fill identity, landing inline copy, experiment, ads copy/targeting, mockup screens.
2. **GitHub** — create full app repo; push `mockup/` + `media/`; never commit `node_modules` / `dist`.
3. **Vercel (mockup)** — import repo; Root Directory = `mockup`; deploy once manually; put project id/name in `source.*`.
4. **Drive** — folder `App Validation/{appId}/`; upload **only** `app.json`; `status: provisioning`.
5. **WF0** — set `appId` in config; run; confirm `tracking.webhookUrl` + `status: ready`.
6. **WF1** — run; confirm public mockup URL (not SSO-blocked).
7. **Landing infra (human)** — create landing GitHub repo + Vercel project (root = repo default).
8. **WF2** — run; confirm landing URL + tracking embed (shared webhook pattern).
9. **WF3** — browser smoke: `page_view` (and key events) → Sheet for this app/experiment IDs.
10. **Creatives** — image and/or video+thumb on GitHub; SHAs in WF4 config when using create-paused; `ads.meta.creativeRevision` / variants as needed.
11. **WF4** — dry_run first; create-paused only with explicit approval phrase; leave **PAUSED**.
12. **Ads Manager (you)** — preview; optional multi-text / CTA / naming polish; activate ~$1/day; pause when done.

Secrets: **n8n Credentials only** — never in `app.json` / git.

### 2.5 What “done enough” means right now

| Definition | Status |
|------------|--------|
| A — Image create-paused V1 | Done (Human Lab) |
| B — Video create-paused + previews | Mostly done (A8 formal checkbox may remain) |
| C — Automation to PAUSED + manual activate | Preferred ending state; matches how you’re operating |
| D — Any new package with only intentional manual steps | **Partial** — starter OK for authoring; multi-app + docs sync still open |

---

## 3. Suggested priority order (when you resume build work)

1. **Docs only (cheap):** Fix G1–G3 in starter + `n8n-workflows/README.md` (traffic default, WF3/WF4 steps, stale “no JSON” claim).
2. **Operator runbook (Track F):** One page: credentials, Drive, Vercel×2, WF0→WF4, approval phrases, Ads Manager activate.
3. **Multi-app WF3 (G6):** Parameterize Sheet / webhook / appId.
4. **NTD-ADS-01…06:** Multi-copy + Optimize text + naming + LEARN_MORE (after Meta API verify).
5. **Track D / Spec sync + Track E Decision** when you want full Def D.

---

## 4. References

- Starter: `app-package-starter/START_HERE.md`, `README.md`, `app.json`
- Spec: `app-validation-spec/`
- Live WF4 proof: `rehearsals/wf4-meta-ads-sandbox/external-proof-status.md`, `wf4-final-prompts/PROMPT-3-PROGRESS.md`
- Creative / video: `rehearsals/wf4-meta-ads-sandbox/CREATIVE-ASSET-SPECS.md`
- Dependency graph: `rehearsals/DEPENDENCY_GRAPH.md`
- Backlog: `rehearsals/SANDBOX-MASTER-BACKLOG.md`
- Screenshot evidence (2026-07-31): Ads Manager multi-text + Optimize text enabled; ad named `human-lab-validation-VID-1`
