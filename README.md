# SafeSignal

SafeSignal is being migrated from the original React/Vite proof-of-concept into a production-oriented Kotlin Multiplatform mobile application.

## Current mobile architecture

- Kotlin Multiplatform shared code
- Compose Multiplatform shared UI foundation
- Native Android application module
- iOS target in the shared module for future Xcode integration
- Android target SDK 36
- Java 17 toolchain

The existing React/Vite prototype is intentionally preserved during migration. It is a reference implementation only and must not be treated as production emergency infrastructure.

## Open in Android Studio

1. Clone the repository.
2. Open the repository root in Android Studio.
3. Use JDK 17 for Gradle.
4. Install Android SDK Platform 36.
5. Allow Gradle sync to complete.
6. Run the **androidApp** configuration on an emulator or physical Android device.

Android entry point:

`androidApp/src/main/kotlin/com/safesignal/app/MainActivity.kt`

Shared Compose entry point:

`shared/src/commonMain/kotlin/com/safesignal/shared/SafeSignalApp.kt`

## Important status

The repository contains native Kotlin Multiplatform and Android implementation work beyond the initial foundation, including session restoration, Android authentication callbacks, and authentication regression tests. **Passing GitHub CI does not establish production readiness or demonstrate that real emergency delivery works.**

Authentication is **partially implemented but not release-verified**: server-verified session handling and a strict callback allowlist have automated coverage, while browser-to-app sign-in, Android App Links, offline behavior, account changes, and SOS independence still require documented physical-device testing.

Before claiming any emergency or authentication feature is safe for release, consult:

- [Implementation status and evidence](docs/13_real_implementation_status.md) — historical baseline plus dated authentication checkpoint.
- [Authentication device acceptance checklist](docs/14_auth_device_acceptance.md) — test account, callback, lifecycle, offline, and SOS release gates.
- [Testing matrix and milestones](docs/10_testing_matrix_and_milestones.md) — broader release verification plan.

SOS delivery, GPS tracking, SMS, push notifications, encrypted persistence, subscriptions, and backend delivery **must be assessed individually** against current source code and real-world evidence. This README does not certify them as ready.

Simulated behavior from the React/Vite prototype is not accepted as production evidence.
