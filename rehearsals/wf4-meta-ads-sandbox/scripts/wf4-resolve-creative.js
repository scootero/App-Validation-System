#!/usr/bin/env node
/**
 * Safe creative binary resolution proof (no Meta writes).
 * Uses adapter SSOT + sandbox fixture; downloads image bytes only.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const adapter = require("../lib/meta-adapter");

const root = path.resolve(__dirname, "..");
const appJsonPath = path.join(root, "fixtures", "app-json-wf4-sandbox.json");

const SANDBOX_META = {
  maxDailyBudgetUsd: 2,
  metaApiVersion: "v25.0",
  pageId: "1237104852815793",
  adAccountId: "act_979257825150251",
  instagramUserId: "17841440875992246",
  businessPortfolioId: "1074341285117707",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function download(url) {
  return new Promise(function (resolve, reject) {
    const client = url.indexOf("https:") === 0 ? https : http;
    const req = client.get(url, { headers: { "User-Agent": "wf4-resolve-creative/1.0" } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location).then(resolve, reject);
        return;
      }
      const chunks = [];
      res.on("data", function (c) {
        chunks.push(c);
      });
      res.on("end", function () {
        resolve({
          statusCode: res.statusCode || 0,
          contentType: String(res.headers["content-type"] || ""),
          body: Buffer.concat(chunks),
        });
      });
    });
    req.on("error", reject);
  });
}

async function main() {
  const app = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
  const result = adapter.buildDryRunBundle(
    app,
    Object.assign({ mode: "dry_run", wf3GateStatus: "proven" }, SANDBOX_META)
  );
  assert(result.ok, result.error || "bundle failed");

  const creative = result.bundle.source.creative;
  assert(creative && creative.downloadUrl, "downloadUrl required");
  assert(creative.expectedMimeFamily === "image", "expectedMimeFamily must be image");
  assert(creative.resolutionMethod === "github_raw" || creative.resolutionMethod === "direct_url");

  const selected = adapter.selectCreative(app);
  const resolved = adapter.resolveCreativeSource(app, selected);
  assert(resolved.ok, resolved.error || "resolveCreativeSource failed");
  assert(resolved.resolved.downloadUrl === creative.downloadUrl, "resolve mismatch vs bundle");

  const resp = await download(creative.downloadUrl);
  assert(resp.statusCode === 200, "CREATIVE_DOWNLOAD_FAILED: status=" + resp.statusCode);
  assert(resp.body && resp.body.length > 0, "CREATIVE_BINARY_EMPTY");
  assert(
    resp.contentType.indexOf("image/") === 0,
    "CREATIVE_NOT_IMAGE: content-type=" + resp.contentType
  );

  const isPng =
    resp.body[0] === 0x89 &&
    resp.body[1] === 0x50 &&
    resp.body[2] === 0x4e &&
    resp.body[3] === 0x47;
  const isJpeg = resp.body[0] === 0xff && resp.body[1] === 0xd8;
  const isGif =
    resp.body[0] === 0x47 && resp.body[1] === 0x49 && resp.body[2] === 0x46;
  const isWebp =
    resp.body.length > 12 &&
    resp.body.toString("ascii", 0, 4) === "RIFF" &&
    resp.body.toString("ascii", 8, 12) === "WEBP";
  assert(isPng || isJpeg || isGif || isWebp, "CREATIVE_NOT_IMAGE: magic bytes not image");

  console.log("WF4 creative binary resolution proof: PASS");
  console.log("  metaHttpCalls: 0");
  console.log("  resolutionMethod: " + creative.resolutionMethod);
  console.log("  repo: " + (creative.repo || "(url)"));
  console.log("  branch: " + (creative.branch || "(n/a)"));
  console.log("  githubPath: " + (creative.githubPath || "(n/a)"));
  console.log("  downloadUrl: " + creative.downloadUrl);
  console.log("  filename: " + creative.filename);
  console.log("  content-type: " + resp.contentType);
  console.log("  byteSize: " + resp.body.length);
  console.log("  expectedMime: " + creative.expectedMime);
}

main().catch(function (err) {
  console.error("WF4 creative binary resolution proof: FAIL");
  console.error(err.message || err);
  process.exit(1);
});
