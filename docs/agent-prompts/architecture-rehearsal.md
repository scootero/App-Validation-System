Act as the lead orchestration agent for this project.

Your job is to delegate work to specialized sub-agents, create a safe implementation plan, duplicate the required folders/projects, manually rehearse the first two workflows, identify every missing dependency, and produce a clear step-by-step list of anything I must do manually.

Do not modify or damage the current working projects.

## Primary goal

Prove that our architecture works end-to-end for the first two workflows before we build the actual n8n workflows:

WF1:
Google Drive app.json → GitHub mockup repo → Vercel mockup deployment → write deployment data back to app.json

WF2:
Google Drive app.json → inline landing content + GitHub media assets + WF1 mockup URL → generated landing repo → Vercel landing deployment → write landing deployment data back to app.json

Production Google Drive must contain only:

App Validation/{appId}/app.json

GitHub owns:
- mockup source code
- media/assets
- package files
- lockfiles and build configuration
- generated per-app landing repository

## Delegate work

Create and coordinate specialized sub-agents for at least:

1. Architecture/spec agent
2. app-package-starter agent
3. schema/validator agent
4. WF1 simulation agent
5. WF2 simulation agent
6. landing-template agent
7. GitHub/Vercel integration agent
8. test/verification agent
9. documentation agent

Each agent should inspect its own area, report findings, and coordinate with the other agents before changes are made.

## Safety rules

1. Do not edit, delete, rename, move, or overwrite the existing reference projects unless I explicitly approve it.
2. Do not modify the current Human Lab repo, production Google Drive app.json, Vercel projects, or existing landing-template directly.
3. Create test duplicates, branches, fixtures, or clearly named sandbox folders.
4. Do not commit, push, deploy, create paid resources, or make public changes without stopping for approval.
5. Do not expose or copy secrets into files.
6. Do not include node_modules, dist, build output, credentials, or tokens in test repos.
7. If a test requires an external GitHub repo, Vercel project, Drive change, credential, or manual action, stop and list exactly what I need to do.
8. When something fails, identify whether the problem belongs in:
   - the specification
   - app-package-starter
   - app.json schema
   - landing-template
   - workflow blueprint
   - test fixture
   - external configuration
9. Fix the reusable source/template/process, not only the copied test package.
10. Preserve current working files until the duplicate rehearsal proves the replacement path works.

## Architecture decisions to enforce

### Google Drive

Production layout:

App Validation/{appId}/
└── app.json

No production Drive dependency on:

- copy/
- media/
- mockup/
- docs/
- logs/
- reports/
- README.md
- package.json
- package-lock.json
- .gitignore

### app.json

app.json is the control manifest and workflow state record.

It must contain or reference everything required for:

- app identity
- audience
- pricing and CTA
- branding
- landing-page copy
- SEO
- media assets
- mockup GitHub source
- Vercel project metadata
- ads
- tracking
- analytics
- experiment rules
- deployment state
- validation summary

Landing-page copy must be inline in app.json for production.

Media assets must use:

- media.url, or
- media.githubPath

Default media repository resolution:

source.assetsGithubRepo ?? source.mockupGithubRepo

Default media branch:

source.assetsBranch ?? source.mockupBranch

WF2 may fetch only explicitly declared media asset paths. It must not inspect or depend on mockup source files.

### GitHub mockup repo

Use the full per-app repository model:

- mockup source under /mockup
- media assets under /media or the configured assets root
- package/build files as needed
- no node_modules
- no dist

Vercel mockup root should normally equal:

source.mockupRootDirectory = "mockup"

### WF1

WF1 equivalent must:

1. Locate App Validation/{appId}/app.json
2. Read app.json only
3. Validate:
   - appId
   - status
   - source.mockupGithubRepo
   - source.mockupBranch
   - source.mockupRootDirectory
   - Vercel mockup project ID or name
4. Confirm the GitHub repo/branch/root contains deployable mockup source
5. Trigger or simulate the Vercel deployment from GitHub
6. Resolve the public mockup URL
7. Merge-write only:
   - deployment.mockup.*
   - mockup.previewUrl
8. Preserve all unrelated app.json fields

### WF2

WF2 equivalent must:

1. Read the same Drive app.json only
2. Validate the WF1 mockup deployment URL exists
3. Read inline landing-page content from app.json
4. Resolve declared media from GitHub paths or HTTPS URLs
5. Use:
   source.assetsGithubRepo ?? source.mockupGithubRepo
6. Generate:
   - app-data/app-config.json
   - app-data/images or equivalent resolved assets
7. Duplicate/bootstrap landing-template into a new safe test landing project
8. Confirm all landing-template requirements are satisfied
9. Embed the deployed mockup URL
10. Confirm:
    - hero
    - benefits
    - features
    - FAQ
    - pricing
    - CTA
    - social proof
    - icon/favicon
    - logo
    - screenshots
    - OG image
    - SEO
    - font family
    - tracking configuration
11. Build locally
12. Prepare or simulate GitHub landing repo creation/update
13. Prepare or simulate Vercel landing deployment
14. Merge-write only:
    - deployment.landing.*
    - deployment.githubRepoUrl
15. Preserve all unrelated app.json fields

app-config.json must remain generated output and must be reproducible from app.json plus declared GitHub/URL assets.

## app-package-starter test

Use the starter exactly as a future user or Cursor agent would.

The starter must clearly guide a user or AI through:

1. Creating a new app idea
2. Choosing a unique appId
3. Providing all required answers
4. Generating mockup source
5. Generating inline landing-page content
6. Generating required media/assets
7. Filling every required app.json field
8. Creating/configuring the GitHub mockup repo
9. Setting source.* values
10. Preparing Vercel mockup settings
11. Uploading only app.json to Drive
12. Running WF1
13. Running WF2

Audit whether the starter asks for everything needed by:

- WF0
- WF1
- WF2
- WF3
- WF-Ads
- WF-Decision
- landing-template
- app.schema.json
- validators

Identify every missing question, field, file, instruction, and ownership rule.

## Duplicate test environment

Before doing any work, propose a safe test name such as:

architecture-smoke-test
or
human-lab-v150-sandbox

Then propose the exact duplicate structure, for example:

sandbox/
├── app-package-starter-test/
├── test-app-packages/
│   └── architecture-smoke-test/
├── landing-template-test/
├── generated-landing-test/
├── drive-fixture/
│   └── App Validation/
│       └── architecture-smoke-test/
│           └── app.json
└── execution-log/

Use copies or fixtures, not the existing source folders directly.

## Required execution phases

### Phase 0 — Read-only discovery

Inspect:

- N8N_PLATFORM_ARCHITECTURE.md
- AI_IMPLEMENTATION_GUIDE.md
- PLATFORM_SETUP_VALUES.md
- app-validation-spec/
- app-package-starter/
- landing-template/
- test-app-packages/
- n8n-workflows/
- all README.md
- all START_HERE.md
- schemas
- validators
- transform scripts
- workflow blueprints
- current Human Lab reference package

Deliver:

- current architecture summary
- contradictions
- exact files involved
- proposed sandbox
- risks
- external actions requiring approval

Stop for approval before creating external resources.

### Phase 1 — Build isolated test package

Duplicate the starter into the sandbox.

Create a complete Spec 1.5.0 test app package using the documented starter flow.

Verify:

- app.json validates
- all landing copy is inline
- all media uses url or githubPath
- mockup code is under /mockup
- media is in the correct GitHub-owned location
- source.* is complete
- no Drive folder dependencies remain

Do not modify the original starter yet.

### Phase 2 — Simulate WF1 locally

Manually perform every operation WF1 would perform.

Where external deployment cannot happen safely:

- prepare exact API payloads
- validate repo paths
- validate Vercel project assumptions
- mock the response
- clearly distinguish simulated results from real results

Create a test copy of app.json with the expected WF1 merge-write.

Verify no unrelated fields are overwritten.

### Phase 3 — Simulate WF2 locally

Manually perform every operation WF2 would perform:

- read app.json only
- resolve inline content
- resolve declared GitHub/URL assets
- generate app-data
- duplicate landing-template
- place generated content/assets correctly
- run install/build/tests
- confirm mockup embedding
- confirm landing content and media
- create expected WF2 write-back in the test app.json

Do not modify the original landing-template.

### Phase 4 — Gap analysis

For every failure or manual workaround, classify it as:

- missing schema field
- missing starter question
- missing starter file
- transform bug
- landing-template issue
- workflow blueprint issue
- validator issue
- documentation issue
- external setup requirement

Provide the smallest reusable fix.

### Phase 5 — Proposed source updates

Only after the sandbox rehearsal succeeds, propose exact changes to:

- app-validation-spec
- app-package-starter
- landing-template
- test-app-packages
- n8n-workflows
- architecture docs
- README/START_HERE docs

Do not apply changes to the real source projects until I approve.

### Phase 6 — Optional real integration

After approval, provide a numbered checklist for me to:

- create or choose the test GitHub repo
- push the test mockup/media
- configure the test Vercel mockup project
- add/update the test Drive app.json
- run the real WF1-equivalent deployment
- create the test landing repo
- deploy the test landing page
- verify URLs and write-backs

Stop before each external action unless I explicitly authorize execution.

## Required deliverables

Produce:

1. Master orchestration plan
2. Sub-agent assignments
3. Sandbox folder/repo map
4. Architecture assumptions
5. User-input questionnaire required by app-package-starter
6. Complete test app.json
7. WF1 manual execution map
8. WF2 manual execution map
9. Exact files read and written
10. Exact external API payloads or simulated payloads
11. Pass/fail checklist for each stage
12. Missing requirements and fixes
13. Every manual step future n8n must automate
14. Proposed n8n node sequence for WF1
15. Proposed n8n node sequence for WF2
16. Source files that should eventually be changed
17. Clear list of actions I personally must perform
18. Final readiness verdict:
    - Ready to build WF1/WF2
    - Ready after listed fixes
    - Not ready
19. Recommended implementation order
20. Updated end-to-end architecture diagram

## Response style

Keep status reports concise and structured.

At every checkpoint provide:

- Completed
- Found
- Blocked
- Decisions needed
- Actions required from me
- Next step

## First response only

Do not start changing anything yet.

Your first response must include only:

1. Proposed sub-agent assignments
2. Proposed sandbox/test app name
3. Exact duplicate folders and fixtures to create
4. External GitHub/Drive/Vercel actions that may eventually be needed
5. Approval checkpoints
6. Any immediate architecture questions that must be answered before execution