# Phase 14 — Authentication device acceptance checklist

This checklist is a **manual release gate**, not proof that sign-in works on a physical device. Automated shared tests and Android CI cover logic/builds but cannot verify browser redirects, installed-app link handling, or real Supabase accounts end-to-end.

## Preparation (test environment only)

- Use a physical Android device with a test build from the expected branch, and a dedicated non-production Supabase test account. Never paste credentials, OAuth codes, refresh tokens, or raw callback URLs into issues or logs.
- Confirm Android package/signing certificate matches the deployed `https://auth.vikwora.com/.well-known/assetlinks.json` declaration. Verify the active auth provider's redirect allowlist includes the exact callback `https://auth.vikwora.com/login-callback`.
- Ensure the backend is reachable; collect only redacted diagnostic timestamps and non-sensitive status outcomes.

## Acceptance scenarios

| Scenario | Expected result | Evidence |
| --- | --- | --- |
| Fresh install, no session | Account area shows not signed in; emergency SOS remains accessible | Device observation |
| Valid browser sign-in via `https://auth.vikwora.com/login-callback` | Installed app handles allowed callback; account reports signed in only after server verification | Device + test backend |
| Return to foreground | Session is rechecked, not treated as permanently verified | Device + backend |
| Session revoked or signed out | After revalidation account reports not signed in or a safe verification error, never the old identity | Device + backend |
| Account switch | Account state reflects the newly server-verified account | Device + backend |
| Device offline / identity verification unavailable | Account area does not claim a newly verified session; SOS screen stays independently available | Offline device |
| Callback from wrong scheme, host, or path | Callback is ignored; no authentication code is logged | Device + redacted logs |
| Supabase initialization stalls or fails | Generic, non-sensitive account error; SOS still accessible | Controlled test outage |

## Non-negotiable safety gates

1. Do not trigger a real emergency dispatch, emergency-service call, or alert to actual contacts during auth testing. Use an explicit sandbox/test recipient and confirm no real delivery will occur.
2. Do not represent successful Android CI builds as proof that real sign-in, offline operation, or SOS delivery worked.
3. Do not merge authentication deployment or release as completed until device results and exact build/backend configuration are recorded by a tester.
4. Record PASS / FAIL / BLOCKED for each scenario, device OS version, build SHA, test backend identity (non-secret), and any sanitized issue reference.

## Current verification boundary

Phases 14B–14S add shared session restoration, callback allowlisting, Android app wiring, and automated regression coverage. As of this checklist's creation, **physical-device end-to-end authentication and emergency SOS independence have not been verified in this document**. Real validation requires a tester with Android hardware and correctly configured external identity services.
