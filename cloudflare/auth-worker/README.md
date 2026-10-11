# SafeSignal verified Android App Links foundation

The Cloudflare Worker `safesignal-auth` is deployed with the custom domain `auth.vikwora.com`. It serves `https://auth.vikwora.com/.well-known/assetlinks.json` for Android App Links verification. It is **not** an authentication server or complete sign-in flow.

The Worker publishes Android certificate associations only when valid fingerprints are configured. Debug and release associations are independent:

- `ANDROID_DEBUG_SHA256`: `com.safesignal.app.debug` — for signed local debug builds. The debug fingerprint verified on the Samsung test device is `46:74:E9:8D:2E:9F:20:A7:FE:A5:5C:93:2B:1E:61:6D:8A:28:42:E3:D8:92:7F:16:18:67:2E:31:AD:F7:94:26`.
- `ANDROID_RELEASE_SHA256`: `com.safesignal.app` — must come from the future Google Play App Signing certificate; it is not configured for release yet.

Never use the debug fingerprint for the release app. When no usable fingerprints exist, the association endpoint fails closed with HTTP 503. Do not commit Cloudflare API tokens or authentication secrets.

## Verified during Phase 13 (debug build)

- The Worker was deployed and `auth.vikwora.com` was attached as a Cloudflare custom domain. Domain control and release configuration must still be reviewed before production use.
- The public `/.well-known/assetlinks.json` endpoint was checked for the debug package/fingerprint, and Android on a physical Samsung SM-A176B (Android 16) reported the domain as verified.
- Android opened `https://auth.vikwora.com/login-callback` automatically and delivered a subsequent callback intent to a running `MainActivity`.
- An incorrect callback path was not resolved to the app when targeting its debug package.
- The Supabase project's allowed Redirect URLs list includes the exact callback URL. The Supabase Kotlin Auth client specifies the same `defaultRedirectUrl`.
- The debug APK built and installed, and a fresh crash-log check after callback routing recorded no crash. An earlier startup crash was traced to a local Supabase URL containing `/rest/v1`; local configuration was corrected to the base project URL.
- Seven Node.js Worker tests passed locally. Android/Worker/backend/edge GitHub CI jobs passed for the previous source commit.

These checks establish the **debug App Links and callback-routing foundation only**. They do not prove a real Supabase sign-in, successful session exchange, token persistence, or that `onNewIntent` handled every lifecycle situation.

## Remaining before production use

1. Implement and test the actual login, registration, verification, password recovery, session lifecycle, and logout experiences in a separate feature.
2. Exercise real auth callbacks on physical devices, including cold/warm startup, expired or malformed responses, and protection against leaked credentials; never log or reflect callback codes and tokens.
3. Obtain the actual Google Play App Signing SHA-256 fingerprint and verify the **release** application ID and release association separately.
4. Recheck production TLS, public Worker behavior, emergency-access policy, security and end-to-end tests. Never equate successful link verification with authenticated user sessions.

Requests to `/login-callback` served directly by the Worker return HTTP 404 `Not found`. This is intentional: Android should intercept the verified HTTPS link and route it to the app. The Worker does not serve a login page or mirror callback query parameters.
