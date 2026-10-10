import test from "node:test";
import assert from "node:assert/strict";
import worker, { makeAssetLinksDocument } from "../src/index.js";

const validFingerprint = Array.from({ length: 32 }, () => "AB").join(":");

test("rejects missing and invalid fingerprints", () => {
  assert.throws(() => makeAssetLinksDocument([]));
  assert.throws(() => makeAssetLinksDocument(["unknown"]));
});

test("produces Android Digital Asset Links JSON for the release app", () => {
  const result = makeAssetLinksDocument([validFingerprint]);
  assert.equal(result[0].target.package_name, "com.safesignal.app");
  assert.deepEqual(result[0].target.sha256_cert_fingerprints, [validFingerprint]);
});

test("fails closed if signing fingerprint is not configured", async () => {
  const res = await worker.fetch(new Request("https://auth.vikwora.com/.well-known/assetlinks.json"), {});
  assert.equal(res.status, 503);
});

test("serves valid assetlinks without redirects", async () => {
  const res = await worker.fetch(new Request("https://auth.vikwora.com/.well-known/assetlinks.json"), {
    ANDROID_RELEASE_SHA256: validFingerprint,
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /application\/json/);
  const data = await res.json();
  assert.equal(data[0].target.package_name, "com.safesignal.app");
});

test("returns 404 for unrelated paths and hosts", async () => {
  const env = { ANDROID_RELEASE_SHA256: validFingerprint };
  assert.equal((await worker.fetch(new Request("https://auth.vikwora.com/callback?code=secret"), env)).status, 404);
  assert.equal((await worker.fetch(new Request("https://another.vikwora.com/.well-known/assetlinks.json"), env)).status, 404);
});
