# SafeSignal — Kotlin Multiplatform (KMP) Architecture & Platform Responsibilities

## 1. KMP Code Sharing Architecture

SafeSignal maximizes cross-platform code sharing across Android and iOS by placing all core domain logic, repositories, local persistence abstractions, emergency state engines, network serialization, and reactive state stores in `commonMain`.

```
                    +----------------------------------------+
                    |          commonMain (Shared)           |
                    |  - Domain: Models, Use Cases, Rules    |
                    |  - State: EmergencyStateMachine        |
                    |  - Data: Repositories, Ktor Client     |
                    |  - Cache: Room KMP Local Database      |
                    |  - UI: Compose Multiplatform Screens   |
                    +----------------------------------------+
                                /                \
                               /                  \
                              v                    v
         +--------------------------+  +--------------------------+
         |    androidMain (Native)  |  |      iosMain (Native)    |
         | - FusedLocationProvider  |  | - CoreLocation Manager   |
         | - Android WorkManager    |  | - BGTaskScheduler        |
         | - Foreground Service     |  | - APNs Notification Hub  |
         | - Firebase Cloud Msg     |  | - Keychain Storage       |
         | - Android Keystore       |  | - StoreKit 2 Billing     |
         | - Google Play Billing    |  | - Native SMS MessageUI   |
         | - Telephony / SMS Int.   |  |                          |
         +--------------------------+  +--------------------------+
```

---

## 2. Android vs. iOS Platform Responsibility Matrix

| Subsystem | Common Interface (`commonMain`) | Android Implementation (`androidMain`) | iOS Implementation (`iosMain`) |
| :--- | :--- | :--- | :--- |
| **Location Engine** | `interface LocationService` | `FusedLocationProviderClient` with `Priority.PRIORITY_HIGH_ACCURACY` | `CLLocationManager` with `kCLLocationAccuracyBest` and `allowsBackgroundLocationUpdates` |
| **Emergency Tracking**| `interface EmergencyTrackingService`| Android Foreground Service with `FOREGROUND_SERVICE_TYPE_LOCATION` notification | Native iOS background location session with active blue pill indicator |
| **Secure Token Storage**| `interface SecureStorage` | Android Keystore + EncryptedSharedPreferences | iOS Keychain Services (`kSecClassGenericPassword`) |
| **Offline Background Sync**| `interface BackgroundSyncManager` | `WorkManager` with `Constraints.Builder().setRequiredNetworkType(CONNECTED)` | `BGProcessingTaskRequest` / `BGAppRefreshTaskRequest` via `BGTaskScheduler` |
| **Push Notifications** | `interface PushNotificationService` | Firebase Cloud Messaging (FCM) token handler + NotificationChannels | Apple Push Notification service (APNs) token registration |
| **Emergency Calling** | `interface EmergencyDialer` | `Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + number))` | `UIApplication.shared.open(URL(string: "tel:" + number)!)` |
| **SMS Fallback** | `interface SmsFallbackManager` | Verified SMS Composer Intent (`Intent.ACTION_SENDTO` with `smsto:`) | `MFMessageComposeViewController` sheet |
| **Haptics** | `interface HapticEngine` | `Vibrator` / `VibrationEffect.createPredefined(EFFECT_HEAVY_CLICK)` | `UIImpactFeedbackGenerator(style: .heavy)` / `UINotificationFeedbackGenerator` |
| **Subscription Billing**| `interface BillingService` | Google Play Billing Library 7.x (`BillingClient`) | StoreKit 2 (`Product.purchase()`, `Transaction.currentEntitlements`) |
