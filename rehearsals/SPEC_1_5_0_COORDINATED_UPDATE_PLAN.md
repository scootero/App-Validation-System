# Spec 1.5.0 Coordinated Update Plan

**Status:** Backlog-only plan. Do not apply these updates until WF3 proof and WF4 dry-run review are complete.

## Update Principles

- Apply one coordinated update instead of piecemeal edits.
- Keep WF1/WF2 canonical unless a critical defect is found.
- Treat WF3 proof artifacts as evidence for tracking docs and workflow exports.
- Treat WF4 as dry-run/design until WF3 is proven.
- Validate existing `app.json` fields before adding schema fields.

## Implementation Order

1. Finish WF3 local and external sandbox proof.
2. Review WF4 dry-run payload against current Meta API docs.
3. Decide whether optional fields such as `ads.specialAdCategories` are required.
4. Build/export n8n workflow JSONs after shared components are agreed.
5. Update production docs and examples in one pass.
6. Update starter guidance after the canonical docs are synchronized.
7. Run final consistency review against WF1-WF4 contracts.

## Production Files To Update Later

| Area | Candidate files | Reason |
|------|-----------------|--------|
| Architecture | `N8N_PLATFORM_ARCHITECTURE.md` | Reflect WF3 proof, WF4 dry-run status, shared components |
| Spec docs | `app-validation-spec/APP_PACKAGE_SPEC.md` | Add any approved field clarifications |
| Schema | `app-validation-spec/schemas/app.schema.json` | Only if optional fields are approved |
| Examples/templates | `app-validation-spec/templates/app.json`, examples | Align event names and WF4 recommendations |
| Starter | `app-package-starter/README.md`, `START_HERE.md`, `app.json` | Add WF3/WF4 setup guidance after proof |
| Landing template | `landing-template/README.md` | Fix minor tracking path/readme drift |
| n8n workflows | `n8n-workflows/*` | Add WF3 prompt/export and later WF-Ads prompt/export |
| Setup tracker | `PLATFORM_SETUP_VALUES.md` | Mark real sandbox/prod setup state |
| Implementation guide | `AI_IMPLEMENTATION_GUIDE.md` | Update stale current-state language |

## Release Checklist

- [ ] Master backlog reviewed.
- [ ] Dependency graph reviewed.
- [ ] WF3 external evidence attached.
- [ ] WF4 dry-run reviewed.
- [ ] Schema additions approved or explicitly deferred.
- [ ] Shared components documented.
- [ ] Production docs updated in one pass.
- [ ] No production secrets introduced.
- [ ] All references use canonical WF names and Spec 1.5.0 field paths.
