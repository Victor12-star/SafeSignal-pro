# SafeSignal verified App Links scaffold

This is an **undeployed scaffold** for `auth.vikwora.com`, not a complete sign-in flow.

The Worker returns `/.well-known/assetlinks.json` only when
`ANDROID_RELEASE_SHA256` is configured with one or more **verified, colon-separated,
uppercase SHA-256 fingerprints** from the actual Android release signing certificate.
Without that configuration, it fails closed with HTTP 503.

## Before production use

1. Obtain the actual Google Play App Signing fingerprint (not a random CI debug
   fingerprint). Confirm the release application ID `com.safesignal.app`.
2. Configure verified HTTPS App Links in the Android manifest and Supabase callback
   handler, with strict URL validation and authentication flow protections.
3. Configure the Supabase redirect allowlist. The current Android custom-scheme
   callback must be reviewed/replaced as part of PR #13.
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
