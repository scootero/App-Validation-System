import {
  workflow,
  node,
  trigger,
  ifElse,
  expr,
  newCredential,
} from '@n8n/workflow-sdk';

/** Live n8n Data Table — WF4 Operation Ledger (created 2026-07-16). */
const WF4_OPERATION_LEDGER_TABLE_ID = 'Yys4vVmQGk8fTxag';
const META_AD_ACCOUNT_ID = 'act_979257825150251';
const META_GRAPH_BASE = `https://graph.facebook.com/v25.0/${META_AD_ACCOUNT_ID}`;
/** Proof-only sandbox Drive app.json for Image V1 write-back rehearsal — not long-term production lookup. */
const SANDBOX_DRIVE_APP_JSON_FILE_ID = '1V1UQP4vH3O8xYexn-Jphfn29Sv30Z6xn';
const metaCredential = newCredential('Meta Marketing API - Orro');
const googleDriveCredential = newCredential('Google Service Account account');

const ledgerTableRl = {
  __rl: true as const,
  mode: 'id' as const,
  value: WF4_OPERATION_LEDGER_TABLE_ID,
  cachedResultName: 'WF4 Operation Ledger',
};

const processWf4Code =
  "/**\n" +
  " * WF4 Meta Adapter — single source of truth for Ad Plan + Meta request mapping.\n" +
  " * Consumed by scripts/wf4-rehearse.js and inlined into n8n Process Code via\n" +
  " * scripts/sync-wf4-adapter-into-workflow.js. Do not duplicate mappings elsewhere.\n" +
  " *\n" +
  " * V1 Meta pairing (architecture revision):\n" +
  " *   objective: OUTCOME_TRAFFIC\n" +
  " *   optimization_goal: LINK_CLICKS\n" +
  " *   billing_event: IMPRESSIONS\n" +
  " * LANDING_PAGE_VIEWS is an alternative pending account validation — not locked for V1.\n" +
  " */\n" +
  "var __wf4Exports =\n" +
  "  typeof module !== \"undefined\" && module.exports ? module.exports : {};\n" +
  "if (typeof globalThis !== \"undefined\") {\n" +
  "  globalThis.WF4MetaAdapter = __wf4Exports;\n" +
  "}\n" +
  "\n" +
  "(function (exports) {\n" +
  "  \"use strict\";\n" +
  "\n" +
  "  var PROVIDER = \"meta\";\n" +
  "  var DEFAULT_META_API_VERSION = \"v25.0\";\n" +
  "  var DEFAULT_MAX_DAILY_BUDGET_USD = 2;\n" +
  "\n" +
  "  var OBJECTIVE_MAPPING = {\n" +
  "    traffic: \"OUTCOME_TRAFFIC\",\n" +
  "    conversions: \"OUTCOME_SALES\",\n" +
  "    awareness: \"OUTCOME_AWARENESS\",\n" +
  "    leads: \"OUTCOME_LEADS\",\n" +
  "    \"app-installs\": \"OUTCOME_APP_PROMOTION\",\n" +
  "  };\n" +
  "\n" +
  "  var V1_OPTIMIZATION_GOAL = \"LINK_CLICKS\";\n" +
  "  var V1_BILLING_EVENT = \"IMPRESSIONS\";\n" +
  "  /** Alternative (not V1 default): LANDING_PAGE_VIEWS + IMPRESSIONS — account-validate first. */\n" +
  "  var ALT_OPTIMIZATION_GOAL = \"LANDING_PAGE_VIEWS\";\n" +
  "\n" +
  "  var SPECIAL_AD_CATEGORIES = [];\n" +
  "  var META_ID_FIELDS = [\"campaignId\", \"adSetId\", \"creativeId\", \"adId\"];\n" +
  "  var DEFAULT_ENVIRONMENT = \"sandbox\";\n" +
  "  var DEFAULT_CREATIVE_REVISION = \"image-v1\";\n" +
  "  var DEFAULT_WORKFLOW_VERSION = \"wf4-image-v1\";\n" +
  "  var LOCK_TTL_MS = 5 * 60 * 1000;\n" +
  "  /** Feed-first V1 — Stories/Reels excluded. */\n" +
  "  var V1_FACEBOOK_POSITIONS = [\"feed\"];\n" +
  "  var V1_INSTAGRAM_POSITIONS = [\"stream\"];\n" +
  "  var V1_PLACEMENT_SET = \"facebook:feed|instagram:stream\";\n" +
  "  var STAGE_ORDER = [\n" +
  "    \"campaign\",\n" +
  "    \"adset\",\n" +
  "    \"image\",\n" +
  "    \"creative\",\n" +
  "    \"ad\",\n" +
  "    \"verified\",\n" +
  "    \"writeback_done\",\n" +
  "  ];\n" +
  "\n" +
  "  var LOCATION_TO_COUNTRY = {\n" +
  "    \"united states\": \"US\",\n" +
  "    us: \"US\",\n" +
  "  };\n" +
  "\n" +
  "  /** V1 image creative extensions only (no video). */\n" +
  "  var IMAGE_EXTENSIONS = {\n" +
  "    png: \"image/png\",\n" +
  "    jpg: \"image/jpeg\",\n" +
  "    jpeg: \"image/jpeg\",\n" +
  "    gif: \"image/gif\",\n" +
  "    webp: \"image/webp\",\n" +
  "  };\n" +
  "\n" +
  "  function roundBudget(value) {\n" +
  "    return Math.round(value * 100) / 100;\n" +
  "  }\n" +
  "\n" +
  "  function getCrypto() {\n" +
  "    try {\n" +
  "      if (typeof require === \"function\") return require(\"crypto\");\n" +
  "    } catch (e) {\n" +
  "      /* n8n / browser */\n" +
  "    }\n" +
  "    return null;\n" +
  "  }\n" +
  "\n" +
  "  function sha256Hex(value) {\n" +
  "    var crypto = getCrypto();\n" +
  "    if (!crypto || !crypto.createHash) {\n" +
  "      throw new Error(\"SHA256_UNAVAILABLE: crypto.createHash required\");\n" +
  "    }\n" +
  "    return crypto.createHash(\"sha256\").update(String(value), \"utf8\").digest(\"hex\");\n" +
  "  }\n" +
  "\n" +
  "  function sha256BytesHex(buf) {\n" +
  "    var crypto = getCrypto();\n" +
  "    if (!crypto || !crypto.createHash) {\n" +
  "      throw new Error(\"SHA256_UNAVAILABLE: crypto.createHash required\");\n" +
  "    }\n" +
  "    return crypto.createHash(\"sha256\").update(buf).digest(\"hex\");\n" +
  "  }\n" +
  "\n" +
  "  function stableStringify(value) {\n" +
  "    if (value === null || typeof value !== \"object\") {\n" +
  "      return JSON.stringify(value);\n" +
  "    }\n" +
  "    if (Array.isArray(value)) {\n" +
  "      return \"[\" + value.map(stableStringify).join(\",\") + \"]\";\n" +
  "    }\n" +
  "    var keys = Object.keys(value).sort();\n" +
  "    return (\n" +
  "      \"{\" +\n" +
  "      keys\n" +
  "        .map(function (k) {\n" +
  "          return JSON.stringify(k) + \":\" + stableStringify(value[k]);\n" +
  "        })\n" +
  "        .join(\",\") +\n" +
  "      \"}\"\n" +
  "    );\n" +
  "  }\n" +
  "\n" +
  "  function buildOperationKey(parts) {\n" +
  "    return [parts.appId, parts.environment, parts.provider, parts.creativeRevision].join(\"|\");\n" +
  "  }\n" +
  "\n" +
  "  function buildPlacementSet(platforms) {\n" +
  "    var parts = [];\n" +
  "    if (!platforms || platforms.indexOf(\"facebook\") !== -1) parts.push(\"facebook:feed\");\n" +
  "    if (platforms && platforms.indexOf(\"instagram\") !== -1) parts.push(\"instagram:stream\");\n" +
  "    return parts.join(\"|\") || V1_PLACEMENT_SET;\n" +
  "  }\n" +
  "\n" +
  "  function buildCopyFingerprint(adPlan) {\n" +
  "    return sha256Hex(\n" +
  "      stableStringify({\n" +
  "        headlines: adPlan.headlines || [],\n" +
  "        primaryTexts: adPlan.primaryTexts || [],\n" +
  "        descriptions: adPlan.descriptions || [],\n" +
  "        callToAction: adPlan.callToAction || \"\",\n" +
  "      })\n" +
  "    );\n" +
  "  }\n" +
  "\n" +
  "  function buildTargetingFingerprint(adPlan) {\n" +
  "    return sha256Hex(\n" +
  "      stableStringify({\n" +
  "        locations: adPlan.targeting.locations,\n" +
  "        ageMin: adPlan.targeting.ageMin,\n" +
  "        ageMax: adPlan.targeting.ageMax,\n" +
  "        platforms: adPlan.platforms,\n" +
  "        facebook_positions: V1_FACEBOOK_POSITIONS,\n" +
  "        instagram_positions: V1_INSTAGRAM_POSITIONS,\n" +
  "      })\n" +
  "    );\n" +
  "  }\n" +
  "\n" +
  "  function buildBudgetFingerprint(adPlan) {\n" +
  "    return sha256Hex(\n" +
  "      stableStringify({\n" +
  "        dailyBudgetUsd: adPlan.budget.dailyBudgetUsd,\n" +
  "        currency: adPlan.budget.currency,\n" +
  "        durationDays: adPlan.budget.durationDays,\n" +
  "        totalAmount: adPlan.budget.totalAmount,\n" +
  "      })\n" +
  "    );\n" +
  "  }\n" +
  "\n" +
  "  function buildContentFingerprint(adPlan, identity) {\n" +
  "    var payload = {\n" +
  "      appId: adPlan.appId,\n" +
  "      environment: identity.environment,\n" +
  "      workflowVersion: identity.workflowVersion,\n" +
  "      objective: mapAuthorObjective(adPlan.authorObjective),\n" +
  "      optimization: V1_OPTIMIZATION_GOAL,\n" +
  "      billing: V1_BILLING_EVENT,\n" +
  "      landingUrl: adPlan.landingUrl,\n" +
  "      targetingFingerprint: buildTargetingFingerprint(adPlan),\n" +
  "      budgetFingerprint: buildBudgetFingerprint(adPlan),\n" +
  "      creativeSha256: identity.creativeSha256,\n" +
  "      copyFingerprint: buildCopyFingerprint(adPlan),\n" +
  "      creativeRevision: identity.creativeRevision,\n" +
  "      placementSet: identity.placementSet,\n" +
  "    };\n" +
  "    return sha256Hex(stableStringify(payload));\n" +
  "  }\n" +
  "\n" +
  "  function firstMissingStage(row) {\n" +
  "    row = row || {};\n" +
  "    if (!row.campaignId) return \"campaign\";\n" +
  "    if (!row.adSetId) return \"adset\";\n" +
  "    if (!row.imageHash) return \"image\";\n" +
  "    if (!row.creativeId) return \"creative\";\n" +
  "    if (!row.adId) return \"ad\";\n" +
  "    var phase = String(row.phase || \"\");\n" +
  "    if (phase !== \"verified\" && phase !== \"writeback_done\") return \"verified\";\n" +
  "    if (phase !== \"writeback_done\") return \"writeback_done\";\n" +
  "    return null;\n" +
  "  }\n" +
  "\n" +
  "  function isCompleteLedgerRow(row) {\n" +
  "    if (!row) return false;\n" +
  "    var phase = String(row.phase || \"\");\n" +
  "    var ids = META_ID_FIELDS.filter(function (f) {\n" +
  "      return row[f] != null && String(row[f]).trim() !== \"\";\n" +
  "    });\n" +
  "    return phase === \"writeback_done\" || phase === \"verified\" || ids.length === 4;\n" +
  "  }\n" +
  "\n" +
  "  function lockIsHeld(row, executionId, nowMs) {\n" +
  "    if (!row || !row.lockOwner) return false;\n" +
  "    if (String(row.lockOwner) === String(executionId)) return false;\n" +
  "    if (!row.lockExpiresAt) return true;\n" +
  "    var exp = Date.parse(row.lockExpiresAt);\n" +
  "    if (isNaN(exp)) return true;\n" +
  "    return exp > nowMs;\n" +
  "  }\n" +
  "\n" +
  "  /**\n" +
  "   * Pure ledger decision for claim / resume / already_complete / conflicts.\n" +
  "   * Does not perform I/O — caller runs Lookup → decide → Upsert → re-Lookup confirm.\n" +
  "   */\n" +
  "  function evaluateLedgerDecision(ledgerRow, opts) {\n" +
  "    opts = opts || {};\n" +
  "    var executionId = opts.executionId || \"local\";\n" +
  "    var nowMs = opts.nowMs != null ? opts.nowMs : Date.now();\n" +
  "    var contentFingerprint = opts.contentFingerprint;\n" +
  "    var operationKey = opts.operationKey;\n" +
  "\n" +
  "    if (ledgerRow && lockIsHeld(ledgerRow, executionId, nowMs)) {\n" +
  "      return {\n" +
  "        action: \"lock_held\",\n" +
  "        outcome: \"failed\",\n" +
  "        error: \"LEDGER_LOCK_HELD: operationKey=\" + operationKey,\n" +
  "        resumeFrom: null,\n" +
  "        metaCreate: null,\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    if (!ledgerRow) {\n" +
  "      return {\n" +
  "        action: \"claim\",\n" +
  "        outcome: \"in_progress\",\n" +
  "        resumeFrom: \"campaign\",\n" +
  "        metaCreate: {},\n" +
  "        lockOwner: executionId,\n" +
  "        lockExpiresAt: new Date(nowMs + LOCK_TTL_MS).toISOString(),\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var rowFp = ledgerRow.contentFingerprint || \"\";\n" +
  "    if (rowFp && contentFingerprint && rowFp !== contentFingerprint) {\n" +
  "      if (isCompleteLedgerRow(ledgerRow) || firstMissingStage(ledgerRow) !== \"campaign\") {\n" +
  "        return {\n" +
  "          action: \"revision_conflict\",\n" +
  "          outcome: \"manual_review_required\",\n" +
  "          error:\n" +
  "            \"LEDGER_REVISION_CONFLICT: fingerprint mismatch for \" +\n" +
  "            operationKey +\n" +
  "            \" — bump ads.meta.creativeRevision for a deliberate new variant\",\n" +
  "          resumeFrom: null,\n" +
  "          metaCreate: null,\n" +
  "        };\n" +
  "      }\n" +
  "    }\n" +
  "\n" +
  "    if (isCompleteLedgerRow(ledgerRow) && (!rowFp || rowFp === contentFingerprint)) {\n" +
  "      return {\n" +
  "        action: \"already_complete\",\n" +
  "        outcome: \"already_complete\",\n" +
  "        resumeFrom: null,\n" +
  "        metaCreate: {\n" +
  "          campaignId: ledgerRow.campaignId || null,\n" +
  "          adSetId: ledgerRow.adSetId || null,\n" +
  "          imageHash: ledgerRow.imageHash || null,\n" +
  "          creativeId: ledgerRow.creativeId || null,\n" +
  "          adId: ledgerRow.adId || null,\n" +
  "        },\n" +
  "        error: null,\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var resumeFrom = firstMissingStage(ledgerRow);\n" +
  "    if (resumeFrom && resumeFrom !== \"campaign\") {\n" +
  "      return {\n" +
  "        action: \"resume\",\n" +
  "        outcome: \"resumed\",\n" +
  "        resumeFrom: resumeFrom,\n" +
  "        metaCreate: {\n" +
  "          campaignId: ledgerRow.campaignId || null,\n" +
  "          adSetId: ledgerRow.adSetId || null,\n" +
  "          imageHash: ledgerRow.imageHash || null,\n" +
  "          creativeId: ledgerRow.creativeId || null,\n" +
  "          adId: ledgerRow.adId || null,\n" +
  "        },\n" +
  "        lockOwner: executionId,\n" +
  "        lockExpiresAt: new Date(nowMs + LOCK_TTL_MS).toISOString(),\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    return {\n" +
  "      action: \"claim\",\n" +
  "      outcome: \"in_progress\",\n" +
  "      resumeFrom: \"campaign\",\n" +
  "      metaCreate: {\n" +
  "        campaignId: ledgerRow.campaignId || null,\n" +
  "        adSetId: ledgerRow.adSetId || null,\n" +
  "        imageHash: ledgerRow.imageHash || null,\n" +
  "        creativeId: ledgerRow.creativeId || null,\n" +
  "        adId: ledgerRow.adId || null,\n" +
  "      },\n" +
  "      lockOwner: executionId,\n" +
  "      lockExpiresAt: new Date(nowMs + LOCK_TTL_MS).toISOString(),\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  /**\n" +
  "   * Approval + safety gates for create_paused (mode + approval + hard gate + caps).\n" +
  "   * No approval-token / Header Auth compare — those were removed from V1.\n" +
  "   */\n" +
  "  function evaluateCreatePausedGates(input) {\n" +
  "    input = input || {};\n" +
  "    var mode = input.mode || \"dry_run\";\n" +
  "    var approval = Boolean(input.approval);\n" +
  "    var createPausedAllowed = input.createPausedAllowed === true;\n" +
  "    var tripleApproved = mode === \"create_paused\" && approval === true;\n" +
  "    var failures = [];\n" +
  "\n" +
  "    if (mode !== \"create_paused\") failures.push(\"mode_not_create_paused\");\n" +
  "    if (!approval) failures.push(\"approval_false\");\n" +
  "    if (!createPausedAllowed) failures.push(\"create_paused_hard_gate_false\");\n" +
  "    if (input.budgetCapPassed === false) failures.push(\"over_budget\");\n" +
  "    if (input.ledgerDecisionAction === \"lock_held\") failures.push(\"ledger_lock_held\");\n" +
  "    if (input.ledgerDecisionAction === \"revision_conflict\") failures.push(\"ledger_revision_conflict\");\n" +
  "    if (input.ledgerDecisionAction === \"already_complete\") failures.push(\"already_complete\");\n" +
  "    if (input.requiredMetaIdsPresent === false) failures.push(\"missing_meta_ids\");\n" +
  "    if (input.landingUrlValid === false) failures.push(\"invalid_landing_url\");\n" +
  "    if (input.creativeValid === false) failures.push(\"invalid_creative\");\n" +
  "\n" +
  "    return {\n" +
  "      mode: mode,\n" +
  "      approval: approval,\n" +
  "      tripleApproved: tripleApproved,\n" +
  "      createPausedAllowed: createPausedAllowed,\n" +
  "      createPathOpen: tripleApproved && createPausedAllowed && failures.length === 0,\n" +
  "      failures: failures,\n" +
  "      redacted: true,\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function redactSensitiveFields(obj) {\n" +
  "    if (!obj || typeof obj !== \"object\") return obj;\n" +
  "    var clone = Array.isArray(obj) ? obj.slice() : Object.assign({}, obj);\n" +
  "    var keys = Object.keys(clone);\n" +
  "    for (var i = 0; i < keys.length; i++) {\n" +
  "      var k = keys[i];\n" +
  "      var lower = k.toLowerCase();\n" +
  "      if (\n" +
  "        lower.indexOf(\"approvaltoken\") !== -1 ||\n" +
  "        lower === \"wf4createpausedapprovaltoken\" ||\n" +
  "        lower.indexOf(\"accesstoken\") !== -1\n" +
  "      ) {\n" +
  "        clone[k] = clone[k] ? \"[REDACTED]\" : \"\";\n" +
  "      } else if (clone[k] && typeof clone[k] === \"object\") {\n" +
  "        clone[k] = redactSensitiveFields(clone[k]);\n" +
  "      }\n" +
  "    }\n" +
  "    return clone;\n" +
  "  }\n" +
  "\n" +
  "  function buildLedgerStageUpsert(plan, metaCreate, phase, lock) {\n" +
  "    metaCreate = metaCreate || {};\n" +
  "    lock = lock || {};\n" +
  "    return {\n" +
  "      operationKey: plan.operationKey,\n" +
  "      appId: plan.appId,\n" +
  "      experimentRunId: plan.experimentRunId || \"\",\n" +
  "      provider: plan.provider || PROVIDER,\n" +
  "      environment: plan.environment,\n" +
  "      creativeRevision: plan.creativeRevision,\n" +
  "      contentFingerprint: plan.contentFingerprint,\n" +
  "      creativeSha256: plan.creativeSha256,\n" +
  "      phase: phase,\n" +
  "      campaignId: metaCreate.campaignId || \"\",\n" +
  "      adSetId: metaCreate.adSetId || \"\",\n" +
  "      imageHash: metaCreate.imageHash || \"\",\n" +
  "      creativeId: metaCreate.creativeId || \"\",\n" +
  "      adId: metaCreate.adId || \"\",\n" +
  "      lockOwner: lock.lockOwner != null ? lock.lockOwner : \"\",\n" +
  "      lockExpiresAt: lock.lockExpiresAt != null ? lock.lockExpiresAt : \"\",\n" +
  "      resumeFrom: lock.resumeFrom || \"\",\n" +
  "      outcome: lock.outcome || \"in_progress\",\n" +
  "      lastError: lock.lastError || \"\",\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function normalizeGithubRepo(raw) {\n" +
  "    if (!raw || typeof raw !== \"string\") return null;\n" +
  "    var s = raw.trim();\n" +
  "    s = s.replace(/^https?:\\/\\/github\\.com\\//i, \"\");\n" +
  "    s = s.replace(/\\.git$/i, \"\");\n" +
  "    s = s.replace(/\\/+$/, \"\");\n" +
  "    var parts = s.split(\"/\");\n" +
  "    if (parts.length < 2 || !parts[0] || !parts[1]) return null;\n" +
  "    return parts[0] + \"/\" + parts[1];\n" +
  "  }\n" +
  "\n" +
  "  function filenameFromPath(p) {\n" +
  "    var parts = String(p || \"\").split(\"/\");\n" +
  "    return parts[parts.length - 1] || \"\";\n" +
  "  }\n" +
  "\n" +
  "  function extensionOf(filename) {\n" +
  "    var m = String(filename || \"\")\n" +
  "      .toLowerCase()\n" +
  "      .match(/\\.([a-z0-9]+)$/);\n" +
  "    return m ? m[1] : \"\";\n" +
  "  }\n" +
  "\n" +
  "  /**\n" +
  "   * Generic creative binary resolution for any app package.\n" +
  "   * Reads ads.media[] / media.ogImage + source.assetsGithubRepo ?? source.mockupGithubRepo.\n" +
  "   * Does not hardcode app ids, repos, or filenames.\n" +
  "   */\n" +
  "  function resolveCreativeSource(app, creative) {\n" +
  "    if (!creative || !creative.kind || !creative.value) {\n" +
  "      return { ok: false, error: \"CREATIVE_PATH_MISSING: no usable creative value\" };\n" +
  "    }\n" +
  "\n" +
  "    if (creative.kind === \"url\") {\n" +
  "      var urlValue = String(creative.value).trim();\n" +
  "      if (!/^https:\\/\\//i.test(urlValue)) {\n" +
  "        return { ok: false, error: \"CREATIVE_DOWNLOAD_FAILED: creative url must be HTTPS\" };\n" +
  "      }\n" +
  "      var urlFilename = filenameFromPath(urlValue.split(\"?\")[0]);\n" +
  "      var urlExt = extensionOf(urlFilename);\n" +
  "      if (!IMAGE_EXTENSIONS[urlExt]) {\n" +
  "        return {\n" +
  "          ok: false,\n" +
  "          error:\n" +
  "            \"CREATIVE_UNSUPPORTED_TYPE: expected image extension (png/jpg/jpeg/gif/webp), got \" +\n" +
  "            (urlExt || \"none\"),\n" +
  "        };\n" +
  "      }\n" +
  "      return {\n" +
  "        ok: true,\n" +
  "        resolved: {\n" +
  "          kind: \"url\",\n" +
  "          value: urlValue,\n" +
  "          role: creative.role || \"primary\",\n" +
  "          resolvedFrom: creative.source,\n" +
  "          repo: null,\n" +
  "          branch: null,\n" +
  "          githubPath: null,\n" +
  "          url: urlValue,\n" +
  "          downloadUrl: urlValue,\n" +
  "          filename: urlFilename,\n" +
  "          expectedMime: IMAGE_EXTENSIONS[urlExt],\n" +
  "          expectedMimeFamily: \"image\",\n" +
  "          resolutionMethod: \"direct_url\",\n" +
  "        },\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    if (creative.kind !== \"githubPath\") {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error: \"CREATIVE_UNSUPPORTED_TYPE: unsupported creative kind \" + creative.kind,\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var githubPath = String(creative.value).trim().replace(/^\\/+/, \"\");\n" +
  "    if (!githubPath) {\n" +
  "      return { ok: false, error: \"CREATIVE_PATH_MISSING: githubPath is empty\" };\n" +
  "    }\n" +
  "\n" +
  "    var filename = filenameFromPath(githubPath);\n" +
  "    var ext = extensionOf(filename);\n" +
  "    if (!IMAGE_EXTENSIONS[ext]) {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error:\n" +
  "          \"CREATIVE_UNSUPPORTED_TYPE: expected image extension (png/jpg/jpeg/gif/webp), got \" +\n" +
  "          (ext || \"none\"),\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var source = (app && app.source) || {};\n" +
  "    var repoRaw = source.assetsGithubRepo || source.mockupGithubRepo;\n" +
  "    if (!repoRaw) {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error:\n" +
  "          \"CREATIVE_REPO_UNRESOLVED: set source.assetsGithubRepo or source.mockupGithubRepo for githubPath creatives\",\n" +
  "      };\n" +
  "    }\n" +
  "    var repo = normalizeGithubRepo(repoRaw);\n" +
  "    if (!repo) {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error: \"CREATIVE_REPO_INVALID: expected owner/repo, got \" + String(repoRaw),\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var branch = String(source.assetsBranch || source.mockupBranch || \"main\").trim() || \"main\";\n" +
  "    var downloadUrl =\n" +
  "      \"https://raw.githubusercontent.com/\" +\n" +
  "      repo +\n" +
  "      \"/\" +\n" +
  "      encodeURIComponent(branch).replace(/%2F/gi, \"/\") +\n" +
  "      \"/\" +\n" +
  "      githubPath\n" +
  "        .split(\"/\")\n" +
  "        .map(function (seg) {\n" +
  "          return encodeURIComponent(seg);\n" +
  "        })\n" +
  "        .join(\"/\");\n" +
  "\n" +
  "    return {\n" +
  "      ok: true,\n" +
  "      resolved: {\n" +
  "        kind: \"githubPath\",\n" +
  "        value: githubPath,\n" +
  "        role: creative.role || \"primary\",\n" +
  "        resolvedFrom: creative.source,\n" +
  "        repo: repo,\n" +
  "        branch: branch,\n" +
  "        githubPath: githubPath,\n" +
  "        url: null,\n" +
  "        downloadUrl: downloadUrl,\n" +
  "        filename: filename,\n" +
  "        expectedMime: IMAGE_EXTENSIONS[ext],\n" +
  "        expectedMimeFamily: \"image\",\n" +
  "        resolutionMethod: \"github_raw\",\n" +
  "      },\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function buildUtmQuery(utmTemplate) {\n" +
  "    var u = utmTemplate || {};\n" +
  "    var parts = [];\n" +
  "    if (u.source) parts.push(\"utm_source=\" + encodeURIComponent(u.source));\n" +
  "    if (u.medium) parts.push(\"utm_medium=\" + encodeURIComponent(u.medium));\n" +
  "    if (u.campaign) parts.push(\"utm_campaign=\" + encodeURIComponent(u.campaign));\n" +
  "    if (u.content) parts.push(\"utm_content=\" + encodeURIComponent(u.content));\n" +
  "    if (u.term) parts.push(\"utm_term=\" + encodeURIComponent(u.term));\n" +
  "    return parts.join(\"&\");\n" +
  "  }\n" +
  "\n" +
  "  function mapCountries(locations) {\n" +
  "    var countries = [];\n" +
  "    for (var i = 0; i < (locations || []).length; i++) {\n" +
  "      var key = String(locations[i]).trim().toLowerCase();\n" +
  "      countries.push(LOCATION_TO_COUNTRY[key] || \"VERIFY_COUNTRY_CODE\");\n" +
  "    }\n" +
  "    return countries.length ? countries : [\"VERIFY_COUNTRY_CODE\"];\n" +
  "  }\n" +
  "\n" +
  "  function selectCreative(app) {\n" +
  "    var adsMedia = (app.ads && app.ads.media) || [];\n" +
  "    for (var i = 0; i < adsMedia.length; i++) {\n" +
  "      var item = adsMedia[i];\n" +
  "      if (item.url || item.githubPath) {\n" +
  "        return {\n" +
  "          kind: item.url ? \"url\" : \"githubPath\",\n" +
  "          value: item.url || item.githubPath,\n" +
  "          role: item.role || \"primary\",\n" +
  "          source: \"ads.media\",\n" +
  "        };\n" +
  "      }\n" +
  "    }\n" +
  "    var og = app.media && app.media.ogImage;\n" +
  "    if (og && (og.url || og.githubPath)) {\n" +
  "      return {\n" +
  "        kind: og.url ? \"url\" : \"githubPath\",\n" +
  "        value: og.url || og.githubPath,\n" +
  "        role: \"fallback\",\n" +
  "        source: \"media.ogImage\",\n" +
  "      };\n" +
  "    }\n" +
  "    return null;\n" +
  "  }\n" +
  "\n" +
  "  function checkIdempotency(app, provider) {\n" +
  "    var meta = (app.ads && app.ads.meta) || {};\n" +
  "    var runKey = {\n" +
  "      appId: app.appId,\n" +
  "      experimentRunId: app.analytics && app.analytics.experimentRunId,\n" +
  "      provider: provider || PROVIDER,\n" +
  "    };\n" +
  "    var existing = META_ID_FIELDS.filter(function (field) {\n" +
  "      return meta[field] != null && meta[field] !== \"\";\n" +
  "    });\n" +
  "    return {\n" +
  "      runKey: runKey,\n" +
  "      refused: existing.length > 0,\n" +
  "      existingFields: existing,\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function mapAuthorObjective(authorObjective) {\n" +
  "    var key = String(authorObjective || \"traffic\").toLowerCase();\n" +
  "    return OBJECTIVE_MAPPING[key] || OBJECTIVE_MAPPING.traffic;\n" +
  "  }\n" +
  "\n" +
  "  function buildAdPlan(app, config) {\n" +
  "    config = config || {};\n" +
  "    var maxDailyBudgetUsd =\n" +
  "      config.maxDailyBudgetUsd != null\n" +
  "        ? Number(config.maxDailyBudgetUsd)\n" +
  "        : DEFAULT_MAX_DAILY_BUDGET_USD;\n" +
  "    var provider = config.provider || PROVIDER;\n" +
  "    var mode = config.mode || \"dry_run\";\n" +
  "\n" +
  "    if (!app || !app.appId) {\n" +
  "      return { ok: false, error: \"Missing appId\" };\n" +
  "    }\n" +
  "    if (!app.ads) {\n" +
  "      return { ok: false, error: \"Missing ads section\" };\n" +
  "    }\n" +
  "    if (!app.experiment || !app.experiment.testBudget) {\n" +
  "      return { ok: false, error: \"Missing experiment.testBudget\" };\n" +
  "    }\n" +
  "    if (!app.deployment || !app.deployment.landing || !app.deployment.landing.url) {\n" +
  "      return { ok: false, error: \"Missing deployment.landing.url\" };\n" +
  "    }\n" +
  "    if (!/^https:\\/\\//i.test(app.deployment.landing.url)) {\n" +
  "      return { ok: false, error: \"deployment.landing.url must be HTTPS\" };\n" +
  "    }\n" +
  "\n" +
  "    var targeting = app.ads.targeting || {};\n" +
  "    if (!targeting.locations || !targeting.locations.length) {\n" +
  "      return { ok: false, error: \"ads.targeting.locations required\" };\n" +
  "    }\n" +
  "    if (targeting.ageMin == null || targeting.ageMax == null) {\n" +
  "      return { ok: false, error: \"ads.targeting.ageMin and ageMax required\" };\n" +
  "    }\n" +
  "    var platforms = app.ads.platforms || [];\n" +
  "    if (platforms.indexOf(\"facebook\") === -1 && platforms.indexOf(\"instagram\") === -1) {\n" +
  "      return { ok: false, error: \"ads.platforms must include facebook and/or instagram\" };\n" +
  "    }\n" +
  "\n" +
  "    var creative = selectCreative(app);\n" +
  "    if (!creative) {\n" +
  "      return { ok: false, error: \"No usable creative (ads.media[] or media.ogImage)\" };\n" +
  "    }\n" +
  "\n" +
  "    var creativeResolved = resolveCreativeSource(app, creative);\n" +
  "    if (!creativeResolved.ok) {\n" +
  "      return { ok: false, error: creativeResolved.error };\n" +
  "    }\n" +
  "\n" +
  "    var budget = app.experiment.testBudget;\n" +
  "    if (!budget.durationDays || budget.durationDays <= 0) {\n" +
  "      return { ok: false, error: \"experiment.testBudget.durationDays must be > 0\" };\n" +
  "    }\n" +
  "    if (budget.currency && budget.currency !== \"USD\") {\n" +
  "      return { ok: false, error: \"experiment.testBudget.currency must be USD for V1 cap check\" };\n" +
  "    }\n" +
  "    var dailyBudgetUsd = roundBudget(Number(budget.amount) / Number(budget.durationDays));\n" +
  "    if (dailyBudgetUsd > maxDailyBudgetUsd) {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error:\n" +
  "          \"Daily budget \" +\n" +
  "          dailyBudgetUsd +\n" +
  "          \" USD exceeds MAX_DAILY_BUDGET_USD=\" +\n" +
  "          maxDailyBudgetUsd +\n" +
  "          \" (fail-closed; never clamp)\",\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var idem = checkIdempotency(app, provider);\n" +
  "    if (idem.refused) {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error:\n" +
  "          \"Idempotency refusal: ads.meta already has \" +\n" +
  "          idem.existingFields.join(\", \") +\n" +
  "          \" for runKey \" +\n" +
  "          JSON.stringify(idem.runKey),\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var landingUrl = app.deployment.landing.url;\n" +
  "    var utmQuery = buildUtmQuery(app.ads.utmTemplate);\n" +
  "    var destinationUrl = utmQuery ? landingUrl + \"?\" + utmQuery : landingUrl;\n" +
  "    var environment = config.environment || DEFAULT_ENVIRONMENT;\n" +
  "    var creativeRevision =\n" +
  "      (app.ads.meta && app.ads.meta.creativeRevision) ||\n" +
  "      config.creativeRevision ||\n" +
  "      DEFAULT_CREATIVE_REVISION;\n" +
  "    var workflowVersion = config.workflowVersion || DEFAULT_WORKFLOW_VERSION;\n" +
  "    var creativeSha256 = config.creativeSha256 || null;\n" +
  "    if (!creativeSha256) {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error:\n" +
  "          \"CREATIVE_SHA256_REQUIRED: pass config.creativeSha256 (binary hash) for operation fingerprint\",\n" +
  "      };\n" +
  "    }\n" +
  "    var placementSet = buildPlacementSet(platforms);\n" +
  "    var operationKey = buildOperationKey({\n" +
  "      appId: app.appId,\n" +
  "      environment: environment,\n" +
  "      provider: provider,\n" +
  "      creativeRevision: creativeRevision,\n" +
  "    });\n" +
  "\n" +
  "    var adPlan = {\n" +
  "      mode: mode,\n" +
  "      provider: provider,\n" +
  "      appId: app.appId,\n" +
  "      experimentRunId: app.analytics && app.analytics.experimentRunId,\n" +
  "      runKey: idem.runKey,\n" +
  "      environment: environment,\n" +
  "      creativeRevision: creativeRevision,\n" +
  "      workflowVersion: workflowVersion,\n" +
  "      creativeSha256: creativeSha256,\n" +
  "      operationKey: operationKey,\n" +
  "      placementSet: placementSet,\n" +
  "      authorObjective: app.ads.objective || \"traffic\",\n" +
  "      campaignName: app.ads.campaignName,\n" +
  "      callToAction: app.ads.callToAction,\n" +
  "      headlines: app.ads.headlines || [],\n" +
  "      primaryTexts: app.ads.primaryTexts || [],\n" +
  "      descriptions: app.ads.descriptions || [],\n" +
  "      platforms: platforms,\n" +
  "      targeting: {\n" +
  "        locations: targeting.locations,\n" +
  "        ageMin: targeting.ageMin,\n" +
  "        ageMax: targeting.ageMax,\n" +
  "        interests: targeting.interests || null,\n" +
  "      },\n" +
  "      creative: creative,\n" +
  "      creativeResolved: creativeResolved.resolved,\n" +
  "      landingUrl: landingUrl,\n" +
  "      destinationUrl: destinationUrl,\n" +
  "      budget: {\n" +
  "        currency: budget.currency,\n" +
  "        totalAmount: budget.amount,\n" +
  "        durationDays: budget.durationDays,\n" +
  "        dailyBudgetUsd: dailyBudgetUsd,\n" +
  "      },\n" +
  "      budgetCapCheck: {\n" +
  "        maxDailyBudgetUsd: maxDailyBudgetUsd,\n" +
  "        passed: true,\n" +
  "      },\n" +
  "      wf3Gate: {\n" +
  "        required: true,\n" +
  "        status: config.wf3GateStatus || \"proven\",\n" +
  "        requiredEvents: [\n" +
  "          \"page_view\",\n" +
  "          \"email_captured\",\n" +
  "          \"buy_now_clicked\",\n" +
  "          \"mockup_interacted\",\n" +
  "        ],\n" +
  "      },\n" +
  "      rootStatusPreserved: app.status || null,\n" +
  "    };\n" +
  "\n" +
  "    adPlan.contentFingerprint = buildContentFingerprint(adPlan, {\n" +
  "      environment: environment,\n" +
  "      workflowVersion: workflowVersion,\n" +
  "      creativeSha256: creativeSha256,\n" +
  "      creativeRevision: creativeRevision,\n" +
  "      placementSet: placementSet,\n" +
  "    });\n" +
  "\n" +
  "    return {\n" +
  "      ok: true,\n" +
  "      adPlan: adPlan,\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function buildMetaRequests(adPlan, config) {\n" +
  "    config = config || {};\n" +
  "    var metaApiVersion = config.metaApiVersion || DEFAULT_META_API_VERSION;\n" +
  "    var pageId = config.pageId || \"CONFIG_META_PAGE_ID\";\n" +
  "    var adAccountId = config.adAccountId || \"act_{META_AD_ACCOUNT_ID}\";\n" +
  "    var instagramUserId = config.instagramUserId || null;\n" +
  "    var dailyBudgetMinor = Math.round(adPlan.budget.dailyBudgetUsd * 100);\n" +
  "    var metaObjective = mapAuthorObjective(adPlan.authorObjective);\n" +
  "\n" +
  "    var adSetTargeting = {\n" +
  "      geo_locations: { countries: mapCountries(adPlan.targeting.locations) },\n" +
  "      age_min: adPlan.targeting.ageMin,\n" +
  "      age_max: adPlan.targeting.ageMax,\n" +
  "      publisher_platforms: adPlan.platforms,\n" +
  "      facebook_positions: V1_FACEBOOK_POSITIONS.slice(),\n" +
  "      instagram_positions: V1_INSTAGRAM_POSITIONS.slice(),\n" +
  "      // Required by current Marketing API (subcode 1870227). 0 = keep explicit ages.\n" +
  "      targeting_automation: { advantage_audience: 0 },\n" +
  "    };\n" +
  "    if (adPlan.targeting.interests && adPlan.targeting.interests.length) {\n" +
  "      adSetTargeting.interests = adPlan.targeting.interests.map(function () {\n" +
  "        return \"VERIFY_INTEREST_ID\";\n" +
  "      });\n" +
  "    }\n" +
  "\n" +
  "    var headline = adPlan.headlines[0];\n" +
  "    var primaryText = adPlan.primaryTexts[0];\n" +
  "    var description = (adPlan.descriptions && adPlan.descriptions[0]) || \"\";\n" +
  "\n" +
  "    var objectStorySpec = {\n" +
  "      page_id: pageId,\n" +
  "      link_data: {\n" +
  "        link: adPlan.destinationUrl,\n" +
  "        message: primaryText,\n" +
  "        name: headline,\n" +
  "        description: description,\n" +
  "        call_to_action: {\n" +
  "          type: adPlan.callToAction,\n" +
  "          value: { link: adPlan.destinationUrl },\n" +
  "        },\n" +
  "        image_hash: \"VERIFY_AFTER_IMAGE_UPLOAD\",\n" +
  "      },\n" +
  "    };\n" +
  "    if (\n" +
  "      instagramUserId &&\n" +
  "      adPlan.platforms &&\n" +
  "      adPlan.platforms.indexOf(\"instagram\") !== -1\n" +
  "    ) {\n" +
  "      objectStorySpec.instagram_user_id = instagramUserId;\n" +
  "    }\n" +
  "\n" +
  "    return {\n" +
  "      metaApiVersion: metaApiVersion,\n" +
  "      v1Pairing: {\n" +
  "        objective: metaObjective,\n" +
  "        optimization_goal: V1_OPTIMIZATION_GOAL,\n" +
  "        billing_event: V1_BILLING_EVENT,\n" +
  "        note:\n" +
  "          \"LANDING_PAGE_VIEWS is an alternative pending account validation; not V1 default.\",\n" +
  "        alternativeOptimizationGoal: ALT_OPTIMIZATION_GOAL,\n" +
  "      },\n" +
  "      pausedStatuses: {\n" +
  "        campaign: \"PAUSED\",\n" +
  "        adSet: \"PAUSED\",\n" +
  "        creative: \"N/A_ASSET\",\n" +
  "        ad: \"PAUSED\",\n" +
  "      },\n" +
  "      statusForDeliveryEntities: \"PAUSED\",\n" +
  "      neverSendActive: true,\n" +
  "      requests: {\n" +
  "        campaign: {\n" +
  "          name: adPlan.campaignName,\n" +
  "          objective: metaObjective,\n" +
  "          status: \"PAUSED\",\n" +
  "          special_ad_categories: SPECIAL_AD_CATEGORIES.slice(),\n" +
  "          // Required when using ad-set budgets (not CBO). Probe-proven 2026-07-26.\n" +
  "          is_adset_budget_sharing_enabled: false,\n" +
  "        },\n" +
  "        adSet: {\n" +
  "          name: adPlan.campaignName + \"-adset-v1\",\n" +
  "          status: \"PAUSED\",\n" +
  "          daily_budget: dailyBudgetMinor,\n" +
  "          billing_event: V1_BILLING_EVENT,\n" +
  "          optimization_goal: V1_OPTIMIZATION_GOAL,\n" +
  "          // Account requires explicit strategy; omitting triggers subcode 2490487.\n" +
  "          bid_strategy: \"LOWEST_COST_WITHOUT_CAP\",\n" +
  "          targeting: adSetTargeting,\n" +
  "          promoted_object: { page_id: pageId },\n" +
  "        },\n" +
  "        imageUpload: {\n" +
  "          endpoint: \"POST /\" + adAccountId + \"/adimages\",\n" +
  "          source: \"ads.media githubPath or media.ogImage\",\n" +
  "          image_hash: \"VERIFY_AFTER_IMAGE_UPLOAD\",\n" +
  "          resolutionMethod: adPlan.creativeResolved\n" +
  "            ? adPlan.creativeResolved.resolutionMethod\n" +
  "            : null,\n" +
  "          downloadUrl: adPlan.creativeResolved\n" +
  "            ? adPlan.creativeResolved.downloadUrl\n" +
  "            : null,\n" +
  "          filename: adPlan.creativeResolved ? adPlan.creativeResolved.filename : null,\n" +
  "          repo: adPlan.creativeResolved ? adPlan.creativeResolved.repo : null,\n" +
  "          branch: adPlan.creativeResolved ? adPlan.creativeResolved.branch : null,\n" +
  "          githubPath: adPlan.creativeResolved\n" +
  "            ? adPlan.creativeResolved.githubPath\n" +
  "            : null,\n" +
  "          expectedMime: adPlan.creativeResolved\n" +
  "            ? adPlan.creativeResolved.expectedMime\n" +
  "            : null,\n" +
  "          expectedMimeFamily: \"image\",\n" +
  "        },\n" +
  "        creative: {\n" +
  "          name: adPlan.campaignName + \"-creative-a\",\n" +
  "          object_story_spec: objectStorySpec,\n" +
  "        },\n" +
  "        ad: {\n" +
  "          name: adPlan.campaignName + \"-ad-a\",\n" +
  "          status: \"PAUSED\",\n" +
  "          creative: { creative_id: \"CREATIVE_ID_FROM_CREATE_CREATIVE\" },\n" +
  "        },\n" +
  "      },\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function buildLedgerPlan(adPlan) {\n" +
  "    return {\n" +
  "      operationKey: adPlan.operationKey,\n" +
  "      appId: adPlan.appId,\n" +
  "      experimentRunId: adPlan.experimentRunId,\n" +
  "      provider: adPlan.provider,\n" +
  "      environment: adPlan.environment,\n" +
  "      creativeRevision: adPlan.creativeRevision,\n" +
  "      contentFingerprint: adPlan.contentFingerprint,\n" +
  "      creativeSha256: adPlan.creativeSha256,\n" +
  "      placementSet: adPlan.placementSet,\n" +
  "      phase: \"planned\",\n" +
  "      campaignId: null,\n" +
  "      adSetId: null,\n" +
  "      imageHash: null,\n" +
  "      creativeId: null,\n" +
  "      adId: null,\n" +
  "      lockOwner: null,\n" +
  "      lockExpiresAt: null,\n" +
  "      resumeFrom: null,\n" +
  "      outcome: null,\n" +
  "      lastError: null,\n" +
  "      reconciliation:\n" +
  "        \"V1: claim-lock → already_complete | resume same fingerprint | revision_conflict | lock_held; no auto-delete\",\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function buildWriteBackPreview(adPlan, ids) {\n" +
  "    ids = ids || {};\n" +
  "    return {\n" +
  "      ads: {\n" +
  "        meta: {\n" +
  "          status: \"created_paused\",\n" +
  "          campaignId: ids.campaignId || \"<campaign-id>\",\n" +
  "          adSetId: ids.adSetId || \"<ad-set-id>\",\n" +
  "          creativeId: ids.creativeId || \"<creative-id>\",\n" +
  "          adId: ids.adId || \"<ad-id>\",\n" +
  "          landingUrl: adPlan.destinationUrl,\n" +
  "          dailyBudget: adPlan.budget.dailyBudgetUsd,\n" +
  "          createdAt: ids.createdAt || \"<iso8601>\",\n" +
  "          lastSyncedAt: null,\n" +
  "        },\n" +
  "      },\n" +
  "      rootStatusUnchanged: true,\n" +
  "      rootStatusNote:\n" +
  "        \"Preserve existing root status (e.g. ready). Set validating only after human-approved activation.\",\n" +
  "      writeBackTiming:\n" +
  "        \"verified_complete_only: merge ads.meta into app.json only after Campaign/AdSet/Creative/Ad are created and verified PAUSED; partial IDs stay in the ledger\",\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  /**\n" +
  "   * Merge verified-complete ads.meta into an existing app.json without touching\n" +
  "   * root status or author fields. Partial-step IDs must not call this — ledger only.\n" +
  "   */\n" +
  "  function mergeAdsMetaWriteBack(appJson, writeBackMeta, options) {\n" +
  "    options = options || {};\n" +
  "    if (!appJson || typeof appJson !== \"object\") {\n" +
  "      return { ok: false, error: \"WRITEBACK_APPJSON_REQUIRED\" };\n" +
  "    }\n" +
  "    var metaIn = writeBackMeta || {};\n" +
  "    if (metaIn.ads && metaIn.ads.meta) {\n" +
  "      metaIn = metaIn.ads.meta;\n" +
  "    }\n" +
  "    var requiredIds = [\"campaignId\", \"adSetId\", \"creativeId\", \"adId\"];\n" +
  "    var missing = requiredIds.filter(function (k) {\n" +
  "      return metaIn[k] == null || String(metaIn[k]).trim() === \"\" || String(metaIn[k]).indexOf(\"<\") === 0;\n" +
  "    });\n" +
  "    if (options.requireCompleteIds !== false && missing.length) {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error: \"WRITEBACK_INCOMPLETE_IDS: \" + missing.join(\",\"),\n" +
  "        missingIds: missing,\n" +
  "      };\n" +
  "    }\n" +
  "    if (options.requireVerifiedStatus !== false && metaIn.status !== \"created_paused\") {\n" +
  "      return {\n" +
  "        ok: false,\n" +
  "        error: \"WRITEBACK_STATUS_REQUIRED: status must be created_paused before Drive merge\",\n" +
  "      };\n" +
  "    }\n" +
  "\n" +
  "    var clone = JSON.parse(JSON.stringify(appJson));\n" +
  "    var rootBefore = clone.status;\n" +
  "    if (!clone.ads || typeof clone.ads !== \"object\") clone.ads = {};\n" +
  "    if (!clone.ads.meta || typeof clone.ads.meta !== \"object\") clone.ads.meta = {};\n" +
  "\n" +
  "    var keys = [\n" +
  "      \"status\",\n" +
  "      \"campaignId\",\n" +
  "      \"adSetId\",\n" +
  "      \"creativeId\",\n" +
  "      \"adId\",\n" +
  "      \"landingUrl\",\n" +
  "      \"dailyBudget\",\n" +
  "      \"createdAt\",\n" +
  "      \"lastSyncedAt\",\n" +
  "    ];\n" +
  "    for (var i = 0; i < keys.length; i++) {\n" +
  "      var key = keys[i];\n" +
  "      if (Object.prototype.hasOwnProperty.call(metaIn, key)) {\n" +
  "        clone.ads.meta[key] = metaIn[key];\n" +
  "      }\n" +
  "    }\n" +
  "    // Preserve creativeRevision if already present and not supplied\n" +
  "    if (\n" +
  "      metaIn.creativeRevision != null &&\n" +
  "      String(metaIn.creativeRevision).trim() !== \"\"\n" +
  "    ) {\n" +
  "      clone.ads.meta.creativeRevision = metaIn.creativeRevision;\n" +
  "    }\n" +
  "\n" +
  "    clone.status = rootBefore;\n" +
  "    return {\n" +
  "      ok: true,\n" +
  "      appJson: clone,\n" +
  "      rootStatusUnchanged: clone.status === rootBefore,\n" +
  "      rootStatus: clone.status,\n" +
  "      adsMeta: clone.ads.meta,\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  function buildDryRunBundle(app, config) {\n" +
  "    config = config || {};\n" +
  "    var planResult = buildAdPlan(app, config);\n" +
  "    if (!planResult.ok) {\n" +
  "      return planResult;\n" +
  "    }\n" +
  "    var adPlan = planResult.adPlan;\n" +
  "    var meta = buildMetaRequests(adPlan, config);\n" +
  "    var ledgerPlan = buildLedgerPlan(adPlan);\n" +
  "    var writeBackPreview = buildWriteBackPreview(adPlan);\n" +
  "\n" +
  "    return {\n" +
  "      ok: true,\n" +
  "      bundle: {\n" +
  "        mode: adPlan.mode,\n" +
  "        appId: adPlan.appId,\n" +
  "        provider: adPlan.provider,\n" +
  "        runKey: adPlan.runKey,\n" +
  "        metaApiVersion: meta.metaApiVersion,\n" +
  "        adAccountIdRef: \"n8n.config.META_AD_ACCOUNT_ID\",\n" +
  "        pageIdRef: \"n8n.config.META_PAGE_ID\",\n" +
  "        metaAccountConfig: {\n" +
  "          META_BUSINESS_PORTFOLIO_ID: config.businessPortfolioId || null,\n" +
  "          META_AD_ACCOUNT_ID: config.adAccountId || null,\n" +
  "          META_PAGE_ID: config.pageId || null,\n" +
  "          META_INSTAGRAM_USER_ID: config.instagramUserId || null,\n" +
  "        },\n" +
  "        wf3Gate: adPlan.wf3Gate,\n" +
  "        adPlan: {\n" +
  "          authorObjective: adPlan.authorObjective,\n" +
  "          campaignName: adPlan.campaignName,\n" +
  "          platforms: adPlan.platforms,\n" +
  "          targeting: adPlan.targeting,\n" +
  "          budget: adPlan.budget,\n" +
  "          destinationUrl: adPlan.destinationUrl,\n" +
  "          rootStatusPreserved: adPlan.rootStatusPreserved,\n" +
  "        },\n" +
  "        source: {\n" +
  "          landingUrl: adPlan.landingUrl,\n" +
  "          creative: {\n" +
  "            kind: adPlan.creativeResolved.kind,\n" +
  "            value: adPlan.creativeResolved.value,\n" +
  "            role: adPlan.creativeResolved.role,\n" +
  "            resolvedFrom: adPlan.creativeResolved.resolvedFrom,\n" +
  "            repo: adPlan.creativeResolved.repo,\n" +
  "            branch: adPlan.creativeResolved.branch,\n" +
  "            githubPath: adPlan.creativeResolved.githubPath,\n" +
  "            url: adPlan.creativeResolved.url,\n" +
  "            downloadUrl: adPlan.creativeResolved.downloadUrl,\n" +
  "            filename: adPlan.creativeResolved.filename,\n" +
  "            expectedMime: adPlan.creativeResolved.expectedMime,\n" +
  "            expectedMimeFamily: adPlan.creativeResolved.expectedMimeFamily,\n" +
  "            resolutionMethod: adPlan.creativeResolved.resolutionMethod,\n" +
  "          },\n" +
  "        },\n" +
  "        computed: {\n" +
  "          destinationUrl: adPlan.destinationUrl,\n" +
  "          dailyBudget: adPlan.budget.dailyBudgetUsd,\n" +
  "          currency: adPlan.budget.currency,\n" +
  "          totalBudget: adPlan.budget.totalAmount,\n" +
  "          durationDays: adPlan.budget.durationDays,\n" +
  "          pausedStatuses: meta.pausedStatuses,\n" +
  "          statusForDeliveryEntities: meta.statusForDeliveryEntities,\n" +
  "        },\n" +
  "        budgetCapCheck: adPlan.budgetCapCheck,\n" +
  "        v1Pairing: meta.v1Pairing,\n" +
  "        requests: meta.requests,\n" +
  "        ledgerPlan: ledgerPlan,\n" +
  "        operationIdentity: {\n" +
  "          operationKey: adPlan.operationKey,\n" +
  "          contentFingerprint: adPlan.contentFingerprint,\n" +
  "          creativeSha256: adPlan.creativeSha256,\n" +
  "          creativeRevision: adPlan.creativeRevision,\n" +
  "          environment: adPlan.environment,\n" +
  "          placementSet: adPlan.placementSet,\n" +
  "          workflowVersion: adPlan.workflowVersion,\n" +
  "        },\n" +
  "        writeBackAfterCreatePausedOnly: writeBackPreview,\n" +
  "        safety: {\n" +
  "          externalWritePerformed: false,\n" +
  "          liveAdsCreated: false,\n" +
  "          spendPossible: false,\n" +
  "          requiresExplicitApprovalBeforeCreatePaused: true,\n" +
  "          neverSendActive: true,\n" +
  "          tripleApprovalRequired: {\n" +
  "            mode: \"create_paused\",\n" +
  "            approval: true,\n" +
  "            createPausedAllowed: true,\n" +
  "          },\n" +
  "          feedFirstPlacements: true,\n" +
  "          storiesReelsOutOfV1: true,\n" +
  "        },\n" +
  "      },\n" +
  "    };\n" +
  "  }\n" +
  "\n" +
  "  exports.PROVIDER = PROVIDER;\n" +
  "  exports.DEFAULT_META_API_VERSION = DEFAULT_META_API_VERSION;\n" +
  "  exports.DEFAULT_MAX_DAILY_BUDGET_USD = DEFAULT_MAX_DAILY_BUDGET_USD;\n" +
  "  exports.DEFAULT_ENVIRONMENT = DEFAULT_ENVIRONMENT;\n" +
  "  exports.DEFAULT_CREATIVE_REVISION = DEFAULT_CREATIVE_REVISION;\n" +
  "  exports.DEFAULT_WORKFLOW_VERSION = DEFAULT_WORKFLOW_VERSION;\n" +
  "  exports.V1_FACEBOOK_POSITIONS = V1_FACEBOOK_POSITIONS;\n" +
  "  exports.V1_INSTAGRAM_POSITIONS = V1_INSTAGRAM_POSITIONS;\n" +
  "  exports.V1_PLACEMENT_SET = V1_PLACEMENT_SET;\n" +
  "  exports.STAGE_ORDER = STAGE_ORDER;\n" +
  "  exports.OBJECTIVE_MAPPING = OBJECTIVE_MAPPING;\n" +
  "  exports.V1_OPTIMIZATION_GOAL = V1_OPTIMIZATION_GOAL;\n" +
  "  exports.V1_BILLING_EVENT = V1_BILLING_EVENT;\n" +
  "  exports.ALT_OPTIMIZATION_GOAL = ALT_OPTIMIZATION_GOAL;\n" +
  "  exports.SPECIAL_AD_CATEGORIES = SPECIAL_AD_CATEGORIES;\n" +
  "  exports.buildAdPlan = buildAdPlan;\n" +
  "  exports.buildMetaRequests = buildMetaRequests;\n" +
  "  exports.buildLedgerPlan = buildLedgerPlan;\n" +
  "  exports.buildWriteBackPreview = buildWriteBackPreview;\n" +
  "  exports.mergeAdsMetaWriteBack = mergeAdsMetaWriteBack;\n" +
  "  exports.buildDryRunBundle = buildDryRunBundle;\n" +
  "  exports.buildOperationKey = buildOperationKey;\n" +
  "  exports.buildContentFingerprint = buildContentFingerprint;\n" +
  "  exports.evaluateLedgerDecision = evaluateLedgerDecision;\n" +
  "  exports.evaluateCreatePausedGates = evaluateCreatePausedGates;\n" +
  "  exports.redactSensitiveFields = redactSensitiveFields;\n" +
  "  exports.buildLedgerStageUpsert = buildLedgerStageUpsert;\n" +
  "  exports.sha256Hex = sha256Hex;\n" +
  "  exports.sha256BytesHex = sha256BytesHex;\n" +
  "  exports.firstMissingStage = firstMissingStage;\n" +
  "  exports.mapAuthorObjective = mapAuthorObjective;\n" +
  "  exports.selectCreative = selectCreative;\n" +
  "  exports.resolveCreativeSource = resolveCreativeSource;\n" +
  "  exports.checkIdempotency = checkIdempotency;\n" +
  "  exports.IMAGE_EXTENSIONS = IMAGE_EXTENSIONS;\n" +
  "})(__wf4Exports);\n" +
  "\n" +
  "const input = $input.first().json;\n" +
  "const mode = input.mode || 'dry_run';\n" +
  "const approval = Boolean(input.approval);\n" +
  "let app = null;\n" +
  "if (input.appJson && typeof input.appJson === 'object') {\n" +
  "  app = input.appJson;\n" +
  "} else if (input.useFixtureAppJson) {\n" +
  "  app = JSON.parse(input.fixtureAppJson || '{}');\n" +
  "} else {\n" +
  "  throw new Error('No appJson provided and fixture disabled');\n" +
  "}\n" +
  "const creativeSha256 = input.WF4_CREATIVE_SHA256 || input.creativeSha256 || '';\n" +
  "if (!creativeSha256) {\n" +
  "  throw new Error('CREATIVE_SHA256_REQUIRED: set WF4_CREATIVE_SHA256 in Workflow Config (sandbox planning hash)');\n" +
  "}\n" +
  "const result = WF4MetaAdapter.buildDryRunBundle(app, {\n" +
  "  mode: mode,\n" +
  "  provider: input.provider || 'meta',\n" +
  "  environment: input.environment || 'sandbox',\n" +
  "  workflowVersion: input.workflowVersion || 'wf4-image-v1',\n" +
  "  creativeSha256: creativeSha256,\n" +
  "  maxDailyBudgetUsd: input.MAX_DAILY_BUDGET_USD != null ? Number(input.MAX_DAILY_BUDGET_USD) : 2,\n" +
  "  metaApiVersion: input.metaApiVersion || input.META_API_VERSION || 'v25.0',\n" +
  "  wf3GateStatus: input.wf3GateStatus || 'proven',\n" +
  "  pageId: input.META_PAGE_ID || 'CONFIG_META_PAGE_ID',\n" +
  "  adAccountId: input.META_AD_ACCOUNT_ID || null,\n" +
  "  instagramUserId: input.META_INSTAGRAM_USER_ID || null,\n" +
  "  businessPortfolioId: input.META_BUSINESS_PORTFOLIO_ID || null,\n" +
  "});\n" +
  "if (!result.ok) {\n" +
  "  throw new Error(result.error || 'WF4 dry-run bundle failed');\n" +
  "}\n" +
  "const gate = WF4MetaAdapter.evaluateCreatePausedGates({\n" +
  "  mode: mode,\n" +
  "  approval: approval,\n" +
  "  createPausedAllowed: false,\n" +
  "  budgetCapPassed: result.bundle.budgetCapCheck && result.bundle.budgetCapCheck.passed !== false,\n" +
  "  requiredMetaIdsPresent: Boolean(input.META_AD_ACCOUNT_ID && input.META_PAGE_ID),\n" +
  "  landingUrlValid: Boolean(result.bundle.computed && result.bundle.computed.destinationUrl),\n" +
  "  creativeValid: Boolean(result.bundle.source && result.bundle.source.creative),\n" +
  "});\n" +
  "const safeOut = WF4MetaAdapter.redactSensitiveFields({\n" +
  "  bundle: result.bundle,\n" +
  "  tripleApproved: gate.tripleApproved,\n" +
  "  approvalGate: gate,\n" +
  "  _createPausedAllowed: false,\n" +
  "});\n" +
  "return [{ json: Object.assign({}, WF4MetaAdapter.redactSensitiveFields(input), safeOut) }];\n" +
  "";

const respondDryRunCode =
  "const item = $input.first().json;\n" +
  "function redact(obj) {\n" +
  "  if (!obj || typeof obj !== 'object') return obj;\n" +
  "  var clone = Array.isArray(obj) ? obj.slice() : Object.assign({}, obj);\n" +
  "  Object.keys(clone).forEach(function (k) {\n" +
  "    var lower = k.toLowerCase();\n" +
  "    if (lower.indexOf('approvaltoken') !== -1 || lower === 'wf4createpausedapprovaltoken' || lower.indexOf('accesstoken') !== -1) {\n" +
  "      clone[k] = clone[k] ? '[REDACTED]' : '';\n" +
  "    } else if (clone[k] && typeof clone[k] === 'object') {\n" +
  "      clone[k] = redact(clone[k]);\n" +
  "    }\n" +
  "  });\n" +
  "  return clone;\n" +
  "}\n" +
  "const redacted = redact(item);\n" +
  "return [{ json: {\n" +
  "  ok: true,\n" +
  "  mode: 'dry_run',\n" +
  "  bundle: redacted.bundle,\n" +
  "  safety: redacted.bundle && redacted.bundle.safety,\n" +
  "  runKey: redacted.bundle && redacted.bundle.runKey,\n" +
  "  operationKey: redacted.bundle && redacted.bundle.ledgerPlan && redacted.bundle.ledgerPlan.operationKey,\n" +
  "  approvalGate: redacted.approvalGate || null,\n" +
  "  externalWritePerformed: false,\n" +
  "  metaHttpCalls: 0,\n" +
  "  driveWrites: 0,\n" +
  "  _createPausedAllowed: false\n" +
  "} }];";

const createPausedBlockedCode =
  "const item = $input.first().json;\n" +
  "if (item._createPausedAllowed !== true) {\n" +
  "  throw new Error('CREATE_PAUSED_DISABLED: Meta mutations are not enabled. Keep create nodes disabled until explicit operator approval.');\n" +
  "}\n" +
  "return [{ json: item }];";

const ledgerIdempotencyCode =
  "function firstMissingStage(row) {\n" +
  "  row = row || {};\n" +
  "  if (!row.campaignId) return 'campaign';\n" +
  "  if (!row.adSetId) return 'adset';\n" +
  "  if (!row.imageHash) return 'image';\n" +
  "  if (!row.creativeId) return 'creative';\n" +
  "  if (!row.adId) return 'ad';\n" +
  "  var phase = String(row.phase || '');\n" +
  "  if (phase !== 'verified' && phase !== 'writeback_done') return 'verified';\n" +
  "  if (phase !== 'writeback_done') return 'writeback_done';\n" +
  "  return null;\n" +
  "}\n" +
  "function isComplete(row) {\n" +
  "  if (!row) return false;\n" +
  "  var phase = String(row.phase || '');\n" +
  "  var ids = ['campaignId','adSetId','creativeId','adId'].filter(function (f) {\n" +
  "    return row[f] != null && String(row[f]).trim() !== '';\n" +
  "  });\n" +
  "  return phase === 'writeback_done' || phase === 'verified' || ids.length === 4;\n" +
  "}\n" +
  "function evaluate(ledgerRow, opts) {\n" +
  "  var executionId = opts.executionId;\n" +
  "  var nowMs = opts.nowMs;\n" +
  "  var contentFingerprint = opts.contentFingerprint;\n" +
  "  var operationKey = opts.operationKey;\n" +
  "  if (ledgerRow && ledgerRow.lockOwner && String(ledgerRow.lockOwner) !== String(executionId)) {\n" +
  "    var exp = ledgerRow.lockExpiresAt ? Date.parse(ledgerRow.lockExpiresAt) : NaN;\n" +
  "    if (isNaN(exp) || exp > nowMs) {\n" +
  "      return { action: 'lock_held', error: 'LEDGER_LOCK_HELD: operationKey=' + operationKey };\n" +
  "    }\n" +
  "  }\n" +
  "  if (!ledgerRow) {\n" +
  "    return { action: 'claim', outcome: 'in_progress', resumeFrom: 'campaign', metaCreate: {}, lockOwner: executionId, lockExpiresAt: new Date(nowMs + 300000).toISOString() };\n" +
  "  }\n" +
  "  var rowFp = ledgerRow.contentFingerprint || '';\n" +
  "  if (rowFp && contentFingerprint && rowFp !== contentFingerprint && (isComplete(ledgerRow) || firstMissingStage(ledgerRow) !== 'campaign')) {\n" +
  "    return { action: 'revision_conflict', error: 'LEDGER_REVISION_CONFLICT: fingerprint mismatch for ' + operationKey };\n" +
  "  }\n" +
  "  if (isComplete(ledgerRow) && (!rowFp || rowFp === contentFingerprint)) {\n" +
  "    return { action: 'already_complete', outcome: 'already_complete', metaCreate: { campaignId: ledgerRow.campaignId || null, adSetId: ledgerRow.adSetId || null, imageHash: ledgerRow.imageHash || null, creativeId: ledgerRow.creativeId || null, adId: ledgerRow.adId || null } };\n" +
  "  }\n" +
  "  var resumeFrom = firstMissingStage(ledgerRow);\n" +
  "  var metaCreate = { campaignId: ledgerRow.campaignId || null, adSetId: ledgerRow.adSetId || null, imageHash: ledgerRow.imageHash || null, creativeId: ledgerRow.creativeId || null, adId: ledgerRow.adId || null };\n" +
  "  if (resumeFrom && resumeFrom !== 'campaign') {\n" +
  "    return { action: 'resume', outcome: 'resumed', resumeFrom: resumeFrom, metaCreate: metaCreate, lockOwner: executionId, lockExpiresAt: new Date(nowMs + 300000).toISOString() };\n" +
  "  }\n" +
  "  return { action: 'claim', outcome: 'in_progress', resumeFrom: 'campaign', metaCreate: metaCreate, lockOwner: executionId, lockExpiresAt: new Date(nowMs + 300000).toISOString() };\n" +
  "}\n" +
  "const item = $('Create Paused Blocked').first().json;\n" +
  "const rows = $input.all().map(function (i) { return i.json; }).filter(function (r) {\n" +
  "  return r && (r.operationKey || r.phase);\n" +
  "});\n" +
  "const ledgerRow = rows[0] || null;\n" +
  "const plan = (item.bundle && item.bundle.ledgerPlan) || {};\n" +
  "const executionId = String(($execution && $execution.id) || ('local-' + Date.now()));\n" +
  "const decision = evaluate(ledgerRow, {\n" +
  "  operationKey: plan.operationKey,\n" +
  "  contentFingerprint: plan.contentFingerprint,\n" +
  "  executionId: executionId,\n" +
  "  nowMs: Date.now(),\n" +
  "});\n" +
  "if (decision.action === 'lock_held') throw new Error(decision.error || 'LEDGER_LOCK_HELD');\n" +
  "if (decision.action === 'revision_conflict') throw new Error(decision.error || 'LEDGER_REVISION_CONFLICT');\n" +
  "if (decision.action === 'already_complete') {\n" +
  "  return [{ json: Object.assign({}, item, { ledgerExisting: ledgerRow, ledgerAction: 'already_complete', ledgerDecision: decision, metaCreate: decision.metaCreate || {}, outcome: 'already_complete' }) }];\n" +
  "}\n" +
  "const ledgerAction = decision.action === 'resume' ? 'resume' : 'upsert_planned';\n" +
  "return [{ json: Object.assign({}, item, { ledgerExisting: ledgerRow, ledgerAction: ledgerAction, ledgerDecision: decision, metaCreate: decision.metaCreate || {}, resumeFrom: decision.resumeFrom || 'campaign', ledgerClaim: { lockOwner: decision.lockOwner, lockExpiresAt: decision.lockExpiresAt, outcome: decision.outcome } }) }];";

const mergeAfterCampaignCode =
  "const prev = $('Ledger Idempotency Check').first().json;\n" +
  "const created = $input.first().json;\n" +
  "// Prefer resume/ledger campaignId first — skipped Create Campaign passes Data Table row {id:N}.\n" +
  "const campaignId =\n" +
  "  (prev.metaCreate && prev.metaCreate.campaignId) ||\n" +
  "  created.id ||\n" +
  "  created.campaign_id;\n" +
  "if (!campaignId) throw new Error('Create Campaign PAUSED returned no id');\n" +
  "if (String(campaignId).length < 10) {\n" +
  "  throw new Error('Create Campaign PAUSED returned non-Meta id: ' + campaignId);\n" +
  "}\n" +
  "return [{ json: Object.assign({}, prev, { metaCreate: Object.assign({}, prev.metaCreate || {}, { campaignId: String(campaignId) }) }) }];";

const mergeAfterAdSetCode =
  "const prev = $('Merge Campaign Id').first().json;\n" +
  "const created = $input.first().json;\n" +
  "const adSetId = created.id || created.adset_id;\n" +
  "if (!adSetId) throw new Error('Create Ad Set PAUSED returned no id');\n" +
  "return [{ json: Object.assign({}, prev, { metaCreate: Object.assign({}, prev.metaCreate || {}, { adSetId: String(adSetId) }) }) }];";

const resolveCreativeDownloadPlanCode =
  "const prev = $('Merge AdSet Id').first().json;\n" +
  "const creative = prev.bundle && prev.bundle.source && prev.bundle.source.creative;\n" +
  "const imageUpload = prev.bundle && prev.bundle.requests && prev.bundle.requests.imageUpload;\n" +
  "if (!creative || !creative.downloadUrl) {\n" +
  "  throw new Error('CREATIVE_REPO_UNRESOLVED: bundle.source.creative.downloadUrl missing');\n" +
  "}\n" +
  "if (!creative.filename) {\n" +
  "  throw new Error('CREATIVE_PATH_MISSING: bundle.source.creative.filename missing');\n" +
  "}\n" +
  "if (creative.expectedMimeFamily !== 'image') {\n" +
  "  throw new Error('CREATIVE_UNSUPPORTED_TYPE: expectedMimeFamily must be image');\n" +
  "}\n" +
  "if (creative.kind === 'githubPath' && !creative.repo) {\n" +
  "  throw new Error('CREATIVE_REPO_UNRESOLVED: githubPath creative missing repo');\n" +
  "}\n" +
  "const plan = {\n" +
  "  downloadUrl: creative.downloadUrl,\n" +
  "  filename: creative.filename,\n" +
  "  expectedMime: creative.expectedMime || (imageUpload && imageUpload.expectedMime) || null,\n" +
  "  expectedMimeFamily: 'image',\n" +
  "  resolutionMethod: creative.resolutionMethod,\n" +
  "  repo: creative.repo || null,\n" +
  "  branch: creative.branch || null,\n" +
  "  githubPath: creative.githubPath || null,\n" +
  "  kind: creative.kind,\n" +
  "};\n" +
  "return [{ json: Object.assign({}, prev, { creativeDownloadPlan: plan }) }];";

const validateCreativeBinaryCode =
  "const prev = $('Resolve Creative Download Plan').first().json;\n" +
  "const item = $input.first();\n" +
  "const plan = prev.creativeDownloadPlan;\n" +
  "const binary = item.binary && (item.binary.data || item.binary[Object.keys(item.binary)[0]]);\n" +
  "if (!binary) {\n" +
  "  throw new Error('CREATIVE_BINARY_EMPTY: download returned no binary');\n" +
  "}\n" +
  "const mime = String(binary.mimeType || binary.fileType || '').toLowerCase();\n" +
  "const fileName = binary.fileName || plan.filename;\n" +
  "const allowed = ['image/png','image/jpeg','image/jpg','image/gif','image/webp'];\n" +
  "const looksImage = mime.indexOf('image/') === 0 || allowed.indexOf(mime) !== -1;\n" +
  "if (mime && !looksImage) {\n" +
  "  throw new Error('CREATIVE_NOT_IMAGE: content-type=' + mime);\n" +
  "}\n" +
  "if (plan.expectedMime && mime && mime !== 'image/jpg' && mime !== plan.expectedMime && !(plan.expectedMime === 'image/jpeg' && mime === 'image/jpg')) {\n" +
  "  // Soft mismatch: still require image/*; exact MIME may vary by CDN.\n" +
  "  if (mime.indexOf('image/') !== 0) {\n" +
  "    throw new Error('CREATIVE_NOT_IMAGE: expected ' + plan.expectedMime + ' got ' + mime);\n" +
  "  }\n" +
  "}\n" +
  "let byteSize = 0;\n" +
  "if (typeof binary.fileSize === 'number') byteSize = binary.fileSize;\n" +
  "else if (binary.data && typeof binary.data === 'string' && binary.data.length > 0) {\n" +
  "  byteSize = binary.data.length;\n" +
  "}\n" +
  "if (!(byteSize > 0)) {\n" +
  "  throw new Error('CREATIVE_BINARY_EMPTY: downloaded image has zero bytes');\n" +
  "}\n" +
  "const meta = {\n" +
  "  filename: fileName || plan.filename,\n" +
  "  mimeType: mime || plan.expectedMime || 'image/png',\n" +
  "  byteSize: byteSize || null,\n" +
  "  downloadUrl: plan.downloadUrl,\n" +
  "  resolutionMethod: plan.resolutionMethod,\n" +
  "};\n" +
  "return [{\n" +
  "  json: Object.assign({}, prev, {\n" +
  "    metaCreate: Object.assign({}, prev.metaCreate || {}, { creativeBinaryMeta: meta }),\n" +
  "  }),\n" +
  "  binary: item.binary,\n" +
  "}];";

const mergeAfterImageCode =
  "const prev = $('Validate Creative Binary').first().json;\n" +
  "const created = $input.first().json;\n" +
  "let imageHash = null;\n" +
  "if (created.images) {\n" +
  "  const keys = Object.keys(created.images);\n" +
  "  if (keys.length) imageHash = created.images[keys[0]].hash || null;\n" +
  "}\n" +
  "imageHash = imageHash || created.hash || created.image_hash;\n" +
  "if (!imageHash) throw new Error('Upload Ad Image returned no image_hash');\n" +
  "return [{ json: Object.assign({}, prev, { metaCreate: Object.assign({}, prev.metaCreate || {}, { imageHash: String(imageHash) }) }) }];";

const mergeAfterCreativeCode =
  "const prev = $('Merge Image Hash').first().json;\n" +
  "const created = $input.first().json;\n" +
  "const creativeId = created.id || created.creative_id;\n" +
  "if (!creativeId) throw new Error('Create Creative returned no id');\n" +
  "return [{ json: Object.assign({}, prev, { metaCreate: Object.assign({}, prev.metaCreate || {}, { creativeId: String(creativeId) }) }) }];";

const prepareLedgerVerifiedCode =
  "const prev = $('Merge Creative Id').first().json;\n" +
  "const created = $input.first().json;\n" +
  "const adId = created.id || created.ad_id;\n" +
  "if (!adId) throw new Error('Create Ad PAUSED returned no id');\n" +
  "const mc = Object.assign({}, prev.metaCreate || {}, { adId: String(adId) });\n" +
  "const plan = (prev.bundle && prev.bundle.ledgerPlan) || {};\n" +
  "const claim = prev.ledgerClaim || {};\n" +
  "return [{ json: Object.assign({}, prev, {\n" +
  "  metaCreate: mc,\n" +
  "  ledgerUpsert: {\n" +
  "    operationKey: plan.operationKey,\n" +
  "    appId: plan.appId,\n" +
  "    experimentRunId: plan.experimentRunId || '',\n" +
  "    provider: plan.provider || 'meta',\n" +
  "    environment: plan.environment || 'sandbox',\n" +
  "    creativeRevision: plan.creativeRevision || 'image-v1',\n" +
  "    contentFingerprint: plan.contentFingerprint || '',\n" +
  "    creativeSha256: plan.creativeSha256 || '',\n" +
  "    phase: 'verified',\n" +
  "    campaignId: mc.campaignId || '',\n" +
  "    adSetId: mc.adSetId || '',\n" +
  "    imageHash: mc.imageHash || '',\n" +
  "    creativeId: mc.creativeId || '',\n" +
  "    adId: mc.adId || '',\n" +
  "    lockOwner: claim.lockOwner || '',\n" +
  "    lockExpiresAt: claim.lockExpiresAt || '',\n" +
  "    resumeFrom: '',\n" +
  "    outcome: 'in_progress',\n" +
  "    lastError: '',\n" +
  "  }\n" +
  "}) }];";

function buildPrepareLedgerStageCode(prevNodeName: string, phase: string): string {
  return (
    "const prev = $('" +
    prevNodeName +
    "').first().json;\n" +
    "const plan = (prev.bundle && prev.bundle.ledgerPlan) || {};\n" +
    "const mc = prev.metaCreate || {};\n" +
    "const claim = prev.ledgerClaim || {};\n" +
    "return [{ json: Object.assign({}, prev, {\n" +
    "  ledgerUpsert: {\n" +
    "    operationKey: plan.operationKey,\n" +
    "    appId: plan.appId,\n" +
    "    experimentRunId: plan.experimentRunId || '',\n" +
    "    provider: plan.provider || 'meta',\n" +
    "    environment: plan.environment || 'sandbox',\n" +
    "    creativeRevision: plan.creativeRevision || 'image-v1',\n" +
    "    contentFingerprint: plan.contentFingerprint || '',\n" +
    "    creativeSha256: plan.creativeSha256 || '',\n" +
    "    phase: '" +
    phase +
    "',\n" +
    "    campaignId: mc.campaignId || '',\n" +
    "    adSetId: mc.adSetId || '',\n" +
    "    imageHash: mc.imageHash || '',\n" +
    "    creativeId: mc.creativeId || '',\n" +
    "    adId: mc.adId || '',\n" +
    "    lockOwner: claim.lockOwner || '',\n" +
    "    lockExpiresAt: claim.lockExpiresAt || '',\n" +
    "    resumeFrom: '',\n" +
    "    outcome: 'in_progress',\n" +
    "    lastError: '',\n" +
    "  }\n" +
    "}) }];"
  );
}

const prepareLedgerCampaignCode = buildPrepareLedgerStageCode('Merge Campaign Id', 'campaign');
const prepareLedgerAdSetCode = buildPrepareLedgerStageCode('Merge AdSet Id', 'adset');
const prepareLedgerImageCode = buildPrepareLedgerStageCode('Merge Image Hash', 'image');
const prepareLedgerCreativeCode = buildPrepareLedgerStageCode('Merge Creative Id', 'creative');

const prepareWriteBackCode =
  "const prev = $('Prepare Ledger Verified').first().json;\n" +
  "const plan = (prev.bundle && prev.bundle.ledgerPlan) || {};\n" +
  "const mc = prev.metaCreate || {};\n" +
  "const preview = (prev.bundle && prev.bundle.writeBackAfterCreatePausedOnly && prev.bundle.writeBackAfterCreatePausedOnly.ads && prev.bundle.writeBackAfterCreatePausedOnly.ads.meta) || {};\n" +
  "const writeBackMeta = {\n" +
  "  status: 'created_paused',\n" +
  "  campaignId: mc.campaignId,\n" +
  "  adSetId: mc.adSetId,\n" +
  "  creativeId: mc.creativeId,\n" +
  "  adId: mc.adId,\n" +
  "  landingUrl: preview.landingUrl || (prev.bundle && prev.bundle.computed && prev.bundle.computed.destinationUrl) || null,\n" +
  "  dailyBudget: preview.dailyBudget != null ? preview.dailyBudget : (prev.bundle && prev.bundle.computed && prev.bundle.computed.dailyBudget),\n" +
  "  createdAt: new Date().toISOString(),\n" +
  "  lastSyncedAt: null,\n" +
  "  creativeRevision: plan.creativeRevision || 'image-v1',\n" +
  "};\n" +
  "const required = ['campaignId','adSetId','creativeId','adId'];\n" +
  "const missing = required.filter(function (k) { return !writeBackMeta[k]; });\n" +
  "if (missing.length) throw new Error('WRITEBACK_INCOMPLETE_IDS: ' + missing.join(','));\n" +
  "return [{ json: Object.assign({}, prev, {\n" +
  "  sandboxDriveAppJsonFileId: '" +
  SANDBOX_DRIVE_APP_JSON_FILE_ID +
  "',\n" +
  "  writeBackMeta: writeBackMeta,\n" +
  "  writeBackProofOnly: true,\n" +
  "}) }];";

const mergeAdsMetaWriteBackCode =
  "const prev = $('Prepare Write-Back').first().json;\n" +
  "const item = $input.first();\n" +
  "let appJson = null;\n" +
  "if (item.json && item.json.ads) appJson = item.json;\n" +
  "else if (item.binary && item.binary.data) {\n" +
  "  const bin = item.binary.data;\n" +
  "  const raw = bin.data;\n" +
  "  if (typeof raw === 'string') {\n" +
  "    const text = Buffer.from(raw, bin.encoding === 'base64' || !bin.encoding ? 'base64' : bin.encoding).toString('utf8');\n" +
  "    appJson = JSON.parse(text);\n" +
  "  }\n" +
  "}\n" +
  "if (!appJson || typeof appJson !== 'object') throw new Error('WRITEBACK_APPJSON_REQUIRED: Drive download did not yield app.json');\n" +
  "const rootBefore = appJson.status;\n" +
  "const metaIn = prev.writeBackMeta || {};\n" +
  "const clone = JSON.parse(JSON.stringify(appJson));\n" +
  "if (!clone.ads) clone.ads = {};\n" +
  "if (!clone.ads.meta) clone.ads.meta = {};\n" +
  "['status','campaignId','adSetId','creativeId','adId','landingUrl','dailyBudget','createdAt','lastSyncedAt','creativeRevision'].forEach(function (k) {\n" +
  "  if (Object.prototype.hasOwnProperty.call(metaIn, k) && metaIn[k] != null) clone.ads.meta[k] = metaIn[k];\n" +
  "});\n" +
  "clone.status = rootBefore;\n" +
  "const outBin = Buffer.from(JSON.stringify(clone, null, 2), 'utf8').toString('base64');\n" +
  "const claim = prev.ledgerClaim || {};\n" +
  "const plan = (prev.bundle && prev.bundle.ledgerPlan) || {};\n" +
  "const mc = prev.metaCreate || {};\n" +
  "return [{\n" +
  "  json: Object.assign({}, prev, {\n" +
  "    mergedAppJson: clone,\n" +
  "    rootStatusUnchanged: clone.status === rootBefore,\n" +
  "    fileId: prev.sandboxDriveAppJsonFileId,\n" +
  "    ledgerUpsert: {\n" +
  "      operationKey: plan.operationKey,\n" +
  "      appId: plan.appId,\n" +
  "      experimentRunId: plan.experimentRunId || '',\n" +
  "      provider: plan.provider || 'meta',\n" +
  "      environment: plan.environment || 'sandbox',\n" +
  "      creativeRevision: plan.creativeRevision || 'image-v1',\n" +
  "      contentFingerprint: plan.contentFingerprint || '',\n" +
  "      creativeSha256: plan.creativeSha256 || '',\n" +
  "      phase: 'writeback_done',\n" +
  "      campaignId: mc.campaignId || '',\n" +
  "      adSetId: mc.adSetId || '',\n" +
  "      imageHash: mc.imageHash || '',\n" +
  "      creativeId: mc.creativeId || '',\n" +
  "      adId: mc.adId || '',\n" +
  "      lockOwner: '',\n" +
  "      lockExpiresAt: '',\n" +
  "      resumeFrom: '',\n" +
  "      outcome: 'already_complete',\n" +
  "      lastError: '',\n" +
  "    },\n" +
  "  }),\n" +
  "  binary: { data: { data: outBin, mimeType: 'application/json', fileName: 'app.json', encoding: 'base64' } },\n" +
  "}];";

const fixtureAppJson = JSON.stringify({
  specVersion: '1.5.0',
  appId: 'human-lab-wf1-sandbox',
  status: 'ready',
  identity: { appName: 'Human Lab' },
  ads: {
    campaignName: 'human-lab-validation',
    objective: 'traffic',
    platforms: ['facebook', 'instagram'],
    headlines: [
      'Stop guessing. Start testing.',
      'Run science-backed experiments on yourself',
    ],
    primaryTexts: ['Discover what actually works for your stress, sleep, and habits.'],
    descriptions: ['Human Lab turns self-improvement into structured experiments.'],
    callToAction: 'SIGN_UP',
    utmTemplate: { source: 'facebook', medium: 'paid_social', campaign: 'human-lab-validation' },
    targeting: { locations: ['United States'], ageMin: 25, ageMax: 55 },
    meta: {
      status: null,
      campaignId: null,
      adSetId: null,
      creativeId: null,
      adId: null,
      landingUrl: null,
      dailyBudget: null,
      createdAt: null,
      lastSyncedAt: null,
      creativeRevision: 'image-v1',
    },
    media: [
      {
        githubPath: 'media/og-image.png',
        alt: 'Human Lab — Stop guessing. Start testing.',
        role: 'primary',
      },
    ],
  },
  media: {
    ogImage: {
      alt: 'Human Lab — Stop guessing. Start testing.',
      width: 1734,
      height: 907,
      githubPath: 'media/og-image.png',
    },
  },
  analytics: {
    experimentId: 'exp_human-lab_2026q2_001',
    experimentRunId: 'run_human-lab_2026q2_001',
  },
  experiment: { testBudget: { currency: 'USD', amount: 14, durationDays: 14 } },
  source: {
    mockupGithubRepo: 'scootero/Human-Lab-WF1-Sandbox',
    mockupBranch: 'main',
  },
  deployment: { landing: { url: 'https://human-lab-wf2-sandbox.vercel.app' } },
});

const manualRun = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Run' },
});

const workflowConfig = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Workflow Config',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          { id: 'mode', name: 'mode', value: 'dry_run', type: 'string' },
          { id: 'approval', name: 'approval', value: false, type: 'boolean' },
          { id: 'provider', name: 'provider', value: 'meta', type: 'string' },
          { id: 'metaApiVersion', name: 'metaApiVersion', value: 'v25.0', type: 'string' },
          { id: 'META_API_VERSION', name: 'META_API_VERSION', value: 'v25.0', type: 'string' },
          { id: 'MAX_DAILY_BUDGET_USD', name: 'MAX_DAILY_BUDGET_USD', value: 2, type: 'number' },
          { id: 'META_BUSINESS_PORTFOLIO_ID', name: 'META_BUSINESS_PORTFOLIO_ID', value: '1074341285117707', type: 'string' },
          { id: 'META_AD_ACCOUNT_ID', name: 'META_AD_ACCOUNT_ID', value: 'act_979257825150251', type: 'string' },
          { id: 'META_PAGE_ID', name: 'META_PAGE_ID', value: '1237104852815793', type: 'string' },
          { id: 'META_INSTAGRAM_USER_ID', name: 'META_INSTAGRAM_USER_ID', value: '17841440875992246', type: 'string' },
          { id: 'wf3GateStatus', name: 'wf3GateStatus', value: 'proven', type: 'string' },
          { id: 'useFixtureAppJson', name: 'useFixtureAppJson', value: true, type: 'boolean' },
          { id: 'fixtureAppJson', name: 'fixtureAppJson', value: fixtureAppJson, type: 'string' },
          { id: 'environment', name: 'environment', value: 'sandbox', type: 'string' },
          { id: 'workflowVersion', name: 'workflowVersion', value: 'wf4-image-v1', type: 'string' },
          { id: 'WF4_CREATIVE_SHA256', name: 'WF4_CREATIVE_SHA256', value: 'ae73b936b39bb5d86c357c9bb2aab8d10b5b017f09d17e43a908ac49ce7e055d', type: 'string' },
          { id: 'appId', name: 'appId', value: 'human-lab-wf1-sandbox', type: 'string' },
        ],
      },
    },
  },
});

const processWf4 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Process WF4 Dry Run',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: processWf4Code,
    },
  },
});

const tripleApprovalGate = ifElse({
  version: 2.3,
  config: {
    name: 'Triple Approval Gate',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          {
            id: 'triple-approved',
            leftValue: expr('{{ $json.tripleApproved === true && $json._createPausedAllowed === true }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true' },
          },
        ],
      },
      looseTypeValidation: true,
    },
  },
});

const respondDryRun = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Respond Dry Run',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: respondDryRunCode,
    },
  },
});

const createPausedBlocked = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Create Paused Blocked',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: createPausedBlockedCode,
    },
  },
});

const ledgerLookup = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Ledger Lookup',
    disabled: true,
    alwaysOutputData: true,
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: ledgerTableRl,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: expr('{{ $json.bundle.ledgerPlan.operationKey }}'),
          },
        ],
      },
      returnAll: true,
    },
  },
});

const ledgerIdempotencyCheck = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Ledger Idempotency Check',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: ledgerIdempotencyCode,
    },
  },
});

const ledgerUpsertPlanned = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Ledger Upsert Planned',
    disabled: true,
    parameters: {
      resource: 'row',
      operation: 'upsert',
      dataTableId: ledgerTableRl,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: expr('{{ $json.bundle.ledgerPlan.operationKey }}'),
          },
        ],
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['operationKey'],
        value: {
          operationKey: expr('{{ $json.bundle.ledgerPlan.operationKey }}'),
          appId: expr('{{ $json.bundle.ledgerPlan.appId }}'),
          experimentRunId: expr('{{ $json.bundle.ledgerPlan.experimentRunId }}'),
          provider: expr('{{ $json.bundle.ledgerPlan.provider }}'),
          environment: expr("{{ $json.bundle.ledgerPlan.environment || 'sandbox' }}"),
          creativeRevision: expr("{{ $json.bundle.ledgerPlan.creativeRevision || 'image-v1' }}"),
          contentFingerprint: expr("{{ $json.bundle.ledgerPlan.contentFingerprint || '' }}"),
          creativeSha256: expr("{{ $json.bundle.ledgerPlan.creativeSha256 || '' }}"),
          phase: 'planned',
          campaignId: expr("{{ ($json.metaCreate && $json.metaCreate.campaignId) || '' }}"),
          adSetId: expr("{{ ($json.metaCreate && $json.metaCreate.adSetId) || '' }}"),
          imageHash: expr("{{ ($json.metaCreate && $json.metaCreate.imageHash) || '' }}"),
          creativeId: expr("{{ ($json.metaCreate && $json.metaCreate.creativeId) || '' }}"),
          adId: expr("{{ ($json.metaCreate && $json.metaCreate.adId) || '' }}"),
          lockOwner: expr("{{ ($json.ledgerClaim && $json.ledgerClaim.lockOwner) || '' }}"),
          lockExpiresAt: expr("{{ ($json.ledgerClaim && $json.ledgerClaim.lockExpiresAt) || '' }}"),
          resumeFrom: expr("{{ $json.resumeFrom || 'campaign' }}"),
          outcome: expr("{{ ($json.ledgerClaim && $json.ledgerClaim.outcome) || 'in_progress' }}"),
          lastError: '',
        },
      },
    },
  },
});

function ledgerUpsertColumnsFromLedgerUpsert() {
  return {
    mappingMode: 'defineBelow' as const,
    matchingColumns: ['operationKey'],
    value: {
      operationKey: expr('{{ $json.ledgerUpsert.operationKey }}'),
      appId: expr('{{ $json.ledgerUpsert.appId }}'),
      experimentRunId: expr('{{ $json.ledgerUpsert.experimentRunId }}'),
      provider: expr('{{ $json.ledgerUpsert.provider }}'),
      environment: expr('{{ $json.ledgerUpsert.environment }}'),
      creativeRevision: expr('{{ $json.ledgerUpsert.creativeRevision }}'),
      contentFingerprint: expr('{{ $json.ledgerUpsert.contentFingerprint }}'),
      creativeSha256: expr('{{ $json.ledgerUpsert.creativeSha256 }}'),
      phase: expr('{{ $json.ledgerUpsert.phase }}'),
      campaignId: expr('{{ $json.ledgerUpsert.campaignId }}'),
      adSetId: expr('{{ $json.ledgerUpsert.adSetId }}'),
      imageHash: expr('{{ $json.ledgerUpsert.imageHash }}'),
      creativeId: expr('{{ $json.ledgerUpsert.creativeId }}'),
      adId: expr('{{ $json.ledgerUpsert.adId }}'),
      lockOwner: expr('{{ $json.ledgerUpsert.lockOwner }}'),
      lockExpiresAt: expr('{{ $json.ledgerUpsert.lockExpiresAt }}'),
      resumeFrom: expr('{{ $json.ledgerUpsert.resumeFrom }}'),
      outcome: expr('{{ $json.ledgerUpsert.outcome }}'),
      lastError: expr('{{ $json.ledgerUpsert.lastError }}'),
    },
  };
}

function makeLedgerUpsertNode(name: string) {
  return node({
    type: 'n8n-nodes-base.dataTable',
    version: 1.1,
    config: {
      name,
      disabled: true,
      parameters: {
        resource: 'row',
        operation: 'upsert',
        dataTableId: ledgerTableRl,
        matchType: 'allConditions',
        filters: {
          conditions: [
            {
              keyName: 'operationKey',
              condition: 'eq',
              keyValue: expr('{{ $json.ledgerUpsert.operationKey }}'),
            },
          ],
        },
        columns: ledgerUpsertColumnsFromLedgerUpsert(),
      },
    },
  });
}

function makePrepareLedgerNode(name: string, jsCode: string) {
  return node({
    type: 'n8n-nodes-base.code',
    version: 2,
    config: {
      name,
      disabled: true,
      parameters: {
        mode: 'runOnceForAllItems',
        language: 'javaScript',
        jsCode,
      },
    },
  });
}

const createCampaignPaused = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Create Campaign PAUSED',
    disabled: true,
    parameters: {
      method: 'POST',
      url: `${META_GRAPH_BASE}/campaigns`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($(\'Ledger Idempotency Check\').item.json.bundle.requests.campaign) }}'),
    },
    credentials: {
      facebookGraphApi: metaCredential,
    },
  },
});

const mergeCampaignId = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge Campaign Id',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergeAfterCampaignCode,
    },
  },
});

const prepareLedgerCampaign = makePrepareLedgerNode(
  'Prepare Ledger Campaign',
  prepareLedgerCampaignCode
);
const ledgerUpsertCampaign = makeLedgerUpsertNode('Ledger Upsert Campaign');

const createAdSetPaused = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Create Ad Set PAUSED',
    disabled: true,
    parameters: {
      method: 'POST',
      url: `${META_GRAPH_BASE}/adsets`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr(
        "{{ JSON.stringify(Object.assign({}, $('Merge Campaign Id').item.json.bundle.requests.adSet, { campaign_id: $('Merge Campaign Id').item.json.metaCreate.campaignId })) }}"
      ),
    },
    credentials: {
      facebookGraphApi: metaCredential,
    },
  },
});

const mergeAdSetId = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge AdSet Id',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergeAfterAdSetCode,
    },
  },
});

const prepareLedgerAdSet = makePrepareLedgerNode('Prepare Ledger AdSet', prepareLedgerAdSetCode);
const ledgerUpsertAdSet = makeLedgerUpsertNode('Ledger Upsert AdSet');

const resolveCreativeDownloadPlan = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resolve Creative Download Plan',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: resolveCreativeDownloadPlanCode,
    },
  },
});

const downloadCreativeBinary = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Download Creative Binary',
    disabled: true,
    parameters: {
      method: 'GET',
      url: expr(
        "{{ $('Resolve Creative Download Plan').item.json.creativeDownloadPlan.downloadUrl }}"
      ),
      authentication: 'none',
      options: {
        response: {
          response: {
            responseFormat: 'file',
            outputPropertyName: 'data',
          },
        },
      },
    },
  },
});

const validateCreativeBinary = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validate Creative Binary',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: validateCreativeBinaryCode,
    },
  },
});

const uploadAdImage = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Upload Ad Image',
    disabled: true,
    parameters: {
      method: 'POST',
      url: `${META_GRAPH_BASE}/adimages`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      // Binary from Download Creative Binary → Validate Creative Binary (not a creative URL pass-through).
      sendBody: true,
      contentType: 'multipart-form-data',
      bodyParameters: {
        parameters: [
          {
            parameterType: 'formBinaryData',
            name: 'filename',
            inputDataFieldName: 'data',
          },
        ],
      },
    },
    credentials: {
      facebookGraphApi: metaCredential,
    },
  },
});

const mergeImageHash = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge Image Hash',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergeAfterImageCode,
    },
  },
});

const prepareLedgerImage = makePrepareLedgerNode('Prepare Ledger Image', prepareLedgerImageCode);
const ledgerUpsertImage = makeLedgerUpsertNode('Ledger Upsert Image');

const createCreative = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Create Creative',
    disabled: true,
    parameters: {
      method: 'POST',
      url: `${META_GRAPH_BASE}/adcreatives`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr(
        "{{ JSON.stringify((function () { var c = JSON.parse(JSON.stringify($('Merge Image Hash').item.json.bundle.requests.creative)); c.object_story_spec.link_data.image_hash = $('Merge Image Hash').item.json.metaCreate.imageHash; return c; })()) }}"
      ),
    },
    credentials: {
      facebookGraphApi: metaCredential,
    },
  },
});

const mergeCreativeId = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge Creative Id',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergeAfterCreativeCode,
    },
  },
});

const prepareLedgerCreative = makePrepareLedgerNode(
  'Prepare Ledger Creative',
  prepareLedgerCreativeCode
);
const ledgerUpsertCreative = makeLedgerUpsertNode('Ledger Upsert Creative');

const createAdPaused = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Create Ad PAUSED',
    disabled: true,
    parameters: {
      method: 'POST',
      url: `${META_GRAPH_BASE}/ads`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr(
        "{{ JSON.stringify({ name: $('Merge Creative Id').item.json.bundle.requests.ad.name, status: 'PAUSED', adset_id: $('Merge Creative Id').item.json.metaCreate.adSetId, creative: { creative_id: $('Merge Creative Id').item.json.metaCreate.creativeId } }) }}"
      ),
    },
    credentials: {
      facebookGraphApi: metaCredential,
    },
  },
});

const prepareLedgerVerified = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Ledger Verified',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: prepareLedgerVerifiedCode,
    },
  },
});

const ledgerMarkVerified = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Ledger Mark Verified',
    disabled: true,
    parameters: {
      resource: 'row',
      operation: 'upsert',
      dataTableId: ledgerTableRl,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: expr('{{ $json.ledgerUpsert.operationKey }}'),
          },
        ],
      },
      columns: ledgerUpsertColumnsFromLedgerUpsert(),
    },
  },
});

const prepareWriteBack = makePrepareLedgerNode('Prepare Write-Back', prepareWriteBackCode);

const downloadSandboxAppJson = node({
  type: 'n8n-nodes-base.googleDrive',
  version: 3,
  config: {
    name: 'Download Sandbox app.json',
    disabled: true,
    parameters: {
      resource: 'file',
      operation: 'download',
      authentication: 'serviceAccount',
      fileId: {
        __rl: true,
        mode: 'id',
        value: expr('{{ $json.sandboxDriveAppJsonFileId }}'),
      },
      options: {
        binaryPropertyName: 'data',
      },
    },
    credentials: {
      googleApi: googleDriveCredential,
    },
  },
});

const mergeAdsMetaWriteBackNode = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge ads.meta Write-Back',
    disabled: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mergeAdsMetaWriteBackCode,
    },
  },
});

const updateSandboxAppJson = node({
  type: 'n8n-nodes-base.googleDrive',
  version: 3,
  config: {
    name: 'Update Sandbox app.json',
    disabled: true,
    parameters: {
      resource: 'file',
      operation: 'update',
      authentication: 'serviceAccount',
      fileId: {
        __rl: true,
        mode: 'id',
        value: expr('{{ $json.fileId }}'),
      },
      changeFileContent: true,
      inputDataFieldName: 'data',
    },
    credentials: {
      googleApi: googleDriveCredential,
    },
  },
});

const prepareLedgerWritebackDone = makePrepareLedgerNode(
  'Prepare Ledger Writeback Done',
  "const prev = $('Merge ads.meta Write-Back').first().json;\n" +
    "if (!prev.ledgerUpsert) throw new Error('WRITEBACK_LEDGER_UPSERT_MISSING');\n" +
    "return [{ json: prev }];"
);
const ledgerUpsertWritebackDone = makeLedgerUpsertNode('Ledger Upsert Writeback Done');

const createPausedChain = createPausedBlocked
  .to(ledgerLookup)
  .to(ledgerIdempotencyCheck)
  .to(ledgerUpsertPlanned)
  .to(createCampaignPaused)
  .to(mergeCampaignId)
  .to(prepareLedgerCampaign)
  .to(ledgerUpsertCampaign)
  .to(createAdSetPaused)
  .to(mergeAdSetId)
  .to(prepareLedgerAdSet)
  .to(ledgerUpsertAdSet)
  .to(resolveCreativeDownloadPlan)
  .to(downloadCreativeBinary)
  .to(validateCreativeBinary)
  .to(uploadAdImage)
  .to(mergeImageHash)
  .to(prepareLedgerImage)
  .to(ledgerUpsertImage)
  .to(createCreative)
  .to(mergeCreativeId)
  .to(prepareLedgerCreative)
  .to(ledgerUpsertCreative)
  .to(createAdPaused)
  .to(prepareLedgerVerified)
  .to(ledgerMarkVerified)
  .to(prepareWriteBack)
  .to(downloadSandboxAppJson)
  .to(mergeAdsMetaWriteBackNode)
  .to(updateSandboxAppJson)
  .to(prepareLedgerWritebackDone)
  .to(ledgerUpsertWritebackDone);

export default workflow('wf4-meta-ads-sandbox', 'WF4 - Meta Ads Sandbox')
  .add(manualRun)
  .to(workflowConfig)
  .to(processWf4)
  .to(tripleApprovalGate.onTrue(createPausedChain).onFalse(respondDryRun));
