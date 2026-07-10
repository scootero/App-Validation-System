#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const payloadsPath = path.join(root, "fixtures", "wf3-payloads.json");
const expectedRowsPath = path.join(root, "fixtures", "expected-sheet-rows.json");

const canonicalEvents = new Set([
  "page_view",
  "email_captured",
  "buy_now_clicked",
  "mockup_interacted",
]);

const requiredFields = [
  "eventType",
  "appId",
  "appName",
  "experimentId",
  "experimentRunId",
  "timestamp",
];

const sheetColumns = [
  "timestamp",
  "eventType",
  "appId",
  "appName",
  "experimentId",
  "experimentRunId",
  "projectId",
  "deploymentId",
  "landingVersion",
  "landingVariantId",
  "mockupVersionId",
  "campaignName",
  "visitorId",
  "sessionId",
  "email",
  "price",
  "pageUrl",
  "referrer",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmContent",
  "utmTerm",
  "timeOnPageSeconds",
  "mockupInteracted",
  "eventId",
  "receivedAt",
  "fbclid",
  "consentStatus",
  "metaCampaignId",
  "metaAdSetId",
  "metaAdId",
  "placement",
];

/** Client payloads omit receivedAt (n8n always sets it). */
const clientPayloadColumns = sheetColumns.filter((c) => c !== "receivedAt");

const META_COLUMNS = new Set([
  "metaCampaignId",
  "metaAdSetId",
  "metaAdId",
  "placement",
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function generateEventIdFallback() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function validatePayload(payload) {
  const errors = [];

  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (!canonicalEvents.has(payload.eventType)) {
    errors.push(`Unknown eventType: ${payload.eventType}`);
  }

  for (const column of clientPayloadColumns) {
    if (!(column in payload)) {
      errors.push(`Missing client payload field: ${column}`);
    }
  }

  if (payload.eventType === "email_captured") {
    assert(payload.email, "email_captured must include email");
    assert(payload.price === "", "email_captured must not include price");
  }

  if (payload.eventType === "buy_now_clicked") {
    assert(payload.email, "buy_now_clicked must include email");
    assert(payload.price, "buy_now_clicked must include price");
  }

  if (payload.eventType === "mockup_interacted") {
    assert(payload.mockupInteracted === true, "mockup_interacted must set mockupInteracted true");
  }

  return errors;
}

/**
 * Normalize a client payload into a Sheet row (n8n Map To Sheet Row semantics).
 * @param {object} payload
 * @param {{ receivedAt?: string }} [options]
 */
function mapPayloadToSheetRow(payload, options = {}) {
  const receivedAt = options.receivedAt || new Date().toISOString();

  return sheetColumns.map((column) => {
    if (column === "receivedAt") {
      return receivedAt;
    }

    if (column === "eventId") {
      const id = payload.eventId;
      if (id === undefined || id === null || id === "") {
        return generateEventIdFallback();
      }
      return id;
    }

    if (column === "consentStatus") {
      if (
        payload.consentStatus === undefined ||
        payload.consentStatus === null ||
        payload.consentStatus === ""
      ) {
        return "unknown";
      }
      return payload.consentStatus;
    }

    if (META_COLUMNS.has(column)) {
      if (payload[column] === undefined || payload[column] === null) {
        return "";
      }
      return payload[column];
    }

    if (payload[column] === undefined || payload[column] === null) {
      if (column === "timeOnPageSeconds") return 0;
      if (column === "mockupInteracted") return false;
      return "";
    }

    return payload[column];
  });
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function main() {
  const payloads = readJson(payloadsPath);
  const expected = readJson(expectedRowsPath);

  assert(
    deepEqual(expected.columns, sheetColumns),
    "Expected columns fixture does not match canonical Sheet columns"
  );

  const rehearsalReceivedAt =
    expected.rehearsalReceivedAt || "2026-07-10T12:05:00.000Z";

  const results = [];
  for (const eventType of canonicalEvents) {
    const payload = payloads[eventType];
    assert(payload, `Missing payload fixture for ${eventType}`);

    const errors = validatePayload(payload);
    assert(errors.length === 0, `${eventType} validation failed: ${errors.join("; ")}`);

    const row = mapPayloadToSheetRow(payload, { receivedAt: rehearsalReceivedAt });
    const expectedRow = expected.rows[eventType];
    assert(expectedRow, `Missing expected row for ${eventType}`);
    assert(
      row.length === 33,
      `${eventType} mapped row length ${row.length}, expected 33`
    );
    assert(deepEqual(row, expectedRow), `${eventType} row mapping mismatch`);

    results.push({
      eventType,
      status: "passed",
      columns: row.length,
      appId: payload.appId,
      experimentRunId: payload.experimentRunId,
      eventId: row[sheetColumns.indexOf("eventId")],
      receivedAt: row[sheetColumns.indexOf("receivedAt")],
      fbclid: row[sheetColumns.indexOf("fbclid")],
      consentStatus: row[sheetColumns.indexOf("consentStatus")],
    });
  }

  console.log(JSON.stringify({ status: "passed", results }, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(JSON.stringify({ status: "failed", error: error.message }, null, 2));
    process.exit(1);
  }
}

module.exports = {
  sheetColumns,
  clientPayloadColumns,
  validatePayload,
  mapPayloadToSheetRow,
  generateEventIdFallback,
};
