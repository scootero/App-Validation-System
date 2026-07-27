# Human Lab — live Google Drive `app.json` patch (Phase A)

**Do not apply until operator approval.** Local fixtures and `landing-project/app-data/app-config.json` already include these values. The next WF2 run will overwrite generated `app-config.json` unless this Drive package is updated.

**Canonical Drive path:** `App Validation/human-lab-wf1-sandbox/app.json`

## JSON merge patch (apply into the live Drive file)

### 1. Under `identity`, add:

```json
"contactEmail": "oliverscott14@gmail.com",
"privacyEffectiveDate": "2026-07-26"
```

### 2. Footer section `landingPage.sections` item `id: "footer"` → `inline.body`:

```json
"body": "© 2026 Human Lab. All rights reserved."
```

### 3. FAQ item question `"Is my data private?"` → `answer`:

```json
"answer": "Your experiment data is yours. We do not sell personal health data. See our [Privacy Policy](/privacy) for how this validation landing page handles information."
```

## Operator steps (when approved)

1. Open Drive `App Validation/human-lab-wf1-sandbox/app.json`.
2. Apply the three edits above (or replace from the local fixture at `rehearsals/wf2-human-lab-sandbox/drive-fixture/App Validation/human-lab-wf1-sandbox/app.json` after review).
3. Save Drive file.
4. Next WF2 run will regenerate `app-config.json` with `contactEmail`, `privacyEffectiveDate`, FAQ link text, and footer copyright.
