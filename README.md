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

This branch establishes the native mobile foundation only. SOS delivery, GPS tracking, SMS, push notifications, encrypted persistence, authentication, subscriptions, and backend delivery are not yet production ready.

Simulated behavior from the web prototype is not accepted as production evidence.
