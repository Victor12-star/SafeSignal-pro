// Authentication domain foundation. Do not deploy before signing fingerprints are configured.
// Android verifies this exact HTTPS route to associate auth.vikwora.com with SafeSignal.
const SECURITY_HEADERS = {
  "cache-control": "public, max-age=300",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

export function makeAssetLinksDocument(fingerprints) {
  if (!Array.isArray(fingerprints) || fingerprints.length === 0) {
    throw new Error("At least one verified signing fingerprint is required");
  }
  const clean = fingerprints.map((fingerprint) => {
    if (!/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(fingerprint)) {
      throw new Error("Invalid SHA-256 certificate fingerprint format");
    }
    return fingerprint;
  });
  return [{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.safesignal.app",
      sha256_cert_fingerprints: clean,
    },
  }];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== "auth.vikwora.com") {
      return new Response("Not found", { status: 404 });
    }
    if (url.pathname === "/.well-known/assetlinks.json" && request.method === "GET") {
      // This variable is provisioned only after the real release certificate is known.
      const fingerprints = (env.ANDROID_RELEASE_SHA256 || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (!fingerprints.length) {
        return new Response("App Links verification not configured", {
          status: 503,
          headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
        });
      }
      try {
        return new Response(JSON.stringify(makeAssetLinksDocument(fingerprints)), {
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
