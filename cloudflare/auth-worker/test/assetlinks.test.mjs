import test from "node:test";
import assert from "node:assert/strict";
import worker, { makeAssetLinksDocument } from "../src/index.js";

const releaseFingerprint = Array.from({ length: 32 }, () => "AB").join(":");
const debugFingerprint = "46:74:E9:8D:2E:9F:20:A7:FE:A5:5C:93:2B:1E:61:6D:8A:28:42:E3:D8:92:7F:16:18:67:2E:31:AD:F7:94:26";
const endpoint = "https://auth.vikwora.com/.well-known/assetlinks.json";

test("rejects empty and malformed fingerprint configurations", () => {
  assert.throws(() => makeAssetLinksDocument({}));
  assert.throws(() => makeAssetLinksDocument({ ANDROID_DEBUG_SHA256: "invalid" }));
  assert.throws(() => makeAssetLinksDocument({ ANDROID_RELEASE_SHA256: "invalid", ANDROID_DEBUG_SHA256: debugFingerprint }));
});

test("debug certificate maps only to the debug package", () => {
  const statements = makeAssetLinksDocument({ ANDROID_DEBUG_SHA256: debugFingerprint });
  assert.equal(statements.length, 1);
  assert.equal(statements[0].target.package_name, "com.safesignal.app.debug");
  assert.deepEqual(statements[0].target.sha256_cert_fingerprints, [debugFingerprint]);
});

test("release certificate maps only to the release package", () => {
  const statements = makeAssetLinksDocument({ ANDROID_RELEASE_SHA256: releaseFingerprint });
  assert.equal(statements.length, 1);
  assert.equal(statements[0].target.package_name, "com.safesignal.app");
});

test("both debug and release certificates remain separate", () => {
  const statements = makeAssetLinksDocument({ ANDROID_DEBUG_SHA256: debugFingerprint, ANDROID_RELEASE_SHA256: releaseFingerprint });
  assert.deepEqual(statements.map((statement) => statement.target.package_name), [
    "com.safesignal.app",
    "com.safesignal.app.debug",
  ]);
});

test("missing or invalid certificates fail closed", async () => {
  assert.equal((await worker.fetch(new Request(endpoint), {})).status, 503);
  assert.equal((await worker.fetch(new Request(endpoint), { ANDROID_DEBUG_SHA256: "invalid" })).status, 503);
});

test("valid debug association is JSON over HTTPS with no redirect", async () => {
  const response = await worker.fetch(new Request(endpoint), { ANDROID_DEBUG_SHA256: debugFingerprint });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/json/);
  const document = await response.json();
  assert.equal(document[0].target.package_name, "com.safesignal.app.debug");
});

test("does not expose callback codes or serve unrelated hosts", async () => {
  const env = { ANDROID_DEBUG_SHA256: debugFingerprint };
  const callback = await worker.fetch(new Request("https://auth.vikwora.com/login-callback?code=secret"), env);
  assert.equal(callback.status, 404);
  assert.doesNotMatch(await callback.text(), /secret/);
  assert.equal((await worker.fetch(new Request("https://example.com/.well-known/assetlinks.json"), env)).status, 404);
});
