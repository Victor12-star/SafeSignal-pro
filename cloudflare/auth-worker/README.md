# SafeSignal verified App Links scaffold

This is an **undeployed scaffold** for `auth.vikwora.com`, not a complete sign-in flow.

The Worker serves `/.well-known/assetlinks.json` only when a valid verified fingerprint is configured. The two application associations are independent:

- `ANDROID_DEBUG_SHA256`: `com.safesignal.app.debug` — for testing signed local builds. The currently verified local fingerprint is `46:74:E9:8D:2E:9F:20:A7:FE:A5:5C:93:2B:1E:61:6D:8A:28:42:E3:D8:92:7F:16:18:67:2E:31:AD:F7:94:26`.
- `ANDROID_RELEASE_SHA256`: `com.safesignal.app` — must come from the actual future Google Play app signing certificate.

Do not configure `ANDROID_RELEASE_SHA256` using the debug fingerprint. Missing or malformed fingerprints cause an HTTP 503 response. No domain route is attached yet.

## Before production use

1. Obtain the actual Google Play App Signing fingerprint (not a random CI debug
   fingerprint). Confirm the release application ID `com.safesignal.app`.
2. Validate the updated HTTPS Android App Links manifest and Supabase callback handler on a physical debug-signed phone, including strict URL validation and authentication flow protections.
3. Configure the Supabase HTTPS redirect allowlist only after validating the Android callback handler, installed-app verification and OAuth flow protections.
4. Deploy to a staging Worker and verify normal/rejected requests and TLS.
5. Configure `auth.vikwora.com` as a custom domain only when the Worker is ready.
6. Verify `https://auth.vikwora.com/.well-known/assetlinks.json` serves HTTP 200,
   proper JSON and correct `Content-Type`, without redirects.
7. Test App Links verification and cold-start/resumed callbacks on a real signed
   Android build. Do not merge or claim production readiness before tests pass.

**Note:** App Links association establishes the domain/app relationship; it does
not itself perform authentication. Never place authentication tokens in logs or
return them in web pages. The Worker intentionally does not implement a login
callback or tracking website yet.
