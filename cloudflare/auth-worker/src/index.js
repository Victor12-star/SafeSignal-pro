// Authentication domain foundation. Do not deploy before signing fingerprints are configured.
// Android verifies this exact HTTPS route to associate auth.vikwora.com with SafeSignal.
const SECURITY_HEADERS = {
  "cache-control": "public, max-age=300",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

const PACKAGE_FINGERPRINT_VARIABLES = Object.freeze([
  ["com.safesignal.app", "ANDROID_RELEASE_SHA256"],
  ["com.safesignal.app.debug", "ANDROID_DEBUG_SHA256"],
]);

function validatedFingerprints(raw) {
  const values = (raw || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!values.length) return [];
  if (!values.every((value) => /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(value))) {
    throw new Error("Invalid SHA-256 certificate fingerprint format");
  }
  return [...new Set(values)];
}

export function makeAssetLinksDocument(environment) {
  const statements = PACKAGE_FINGERPRINT_VARIABLES.flatMap(([packageName, variable]) => {
    const fingerprints = validatedFingerprints(environment[variable]);
    return fingerprints.length ? [{
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    }] : [];
  });
  if (!statements.length) throw new Error("At least one verified signing fingerprint is required");
  return statements;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== "auth.vikwora.com") {
      return new Response("Not found", { status: 404 });
    }
    if (url.pathname === "/.well-known/assetlinks.json" && request.method === "GET") {
      try {
        return new Response(JSON.stringify(makeAssetLinksDocument(env)), {
          status: 200,
          headers: { ...SECURITY_HEADERS, "content-type": "application/json; charset=utf-8" },
        });
      } catch {
        return new Response("App Links verification not configured", {
          status: 503,
          headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
        });
      }
    }
    // Never reflect query parameters, one-time auth codes, or access tokens to the response.
    return new Response("Not found", {
      status: 404,
      headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
    });
  },
};
