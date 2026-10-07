# SafeSignal — Subscriptions & App Store Compliance (Google Play & Apple)

## 1. Subscription Regionalization & Free Safety Foundation

### Safety Charter: Free Core Protection
SafeSignal firmly guarantees that **life-saving functionality is NEVER locked behind a paywall**. No user in danger will ever encounter a payment screen when attempting to activate SOS or reach their emergency contacts.

| Feature Capability | Free Safety Foundation | SafeSignal Plus (Subscription) |
| :--- | :--- | :--- |
| **SOS Activation & Engine** | Unlimited Standard & Silent SOS | Unlimited |
| **Trusted Contacts** | Up to 3 Primary Contacts | Unlimited Contacts & Custom Groups |
| **Live Location Sharing** | Full Session-based Live Tracking | Full Live Tracking + Historical Trail |
| **Safe Journey Mode** | Basic Journey Timer (1 active/day) | Unlimited Journeys + Smart Delay Escalation |
| **Offline Persistence & Queue**| Included for all users | Included |
| **Regional Dispatch Dialer** | 112 / 199 verified emergency dialer | Verified dialer + Custom Private Security Dialers |
| **Data Retention Controls** | 48-Hour Auto-Purge | 48-Hour Purge or Extended Encrypted Audit Log |

### Store-Driven Regional Pricing
Subscription pricing is delegated to store platforms to avoid currency conversion discrepancies:
- **Sweden**: Billed in Swedish Kronor (`SEK`) via Google Play / Apple StoreKit.
- **Nigeria**: Billed in Nigerian Naira (`NGN`) via Google Play / Apple StoreKit.
- **Client Entitlement Verification**: Client booleans (`isPremium = true`) are untrusted; entitlements are validated server-side via cryptographic receipt verification webhooks from Google Play Developer API and Apple App Store Server API.

---

## 2. Google Play Store Compliance Checklist (Android 16 / API 36 Target)

- [x] **Target SDK 36 (Android 16)**: Built with modern Android toolchain, compatible with 16KB memory page sizes.
- [x] **Zero Restricted SMS Permissions**: App avoids `SEND_SMS` / `READ_SMS`, utilizing the system `ACTION_SENDTO` intent for pre-filled fallback.
- [x] **Background Location Prominent Disclosure**: Clear in-app dialog presented prior to `ACCESS_BACKGROUND_LOCATION` explaining exact usage, stopping immediately when session ends.
- [x] **In-App Account Deletion**: Self-service account deletion accessible from Settings with automatic cascading data purge.
- [x] **Google Play Data Safety Section**:
  - Location collected only on user-initiated safety sessions; not shared with third-party brokers.
  - User contacts collected only via manual entry; no blanket address book scraping.
  - Zero data collected for advertising or marketing purposes.
- [x] **14-Day Closed Testing**: Complete 14-day continuous testing with 12+ opted-in testers for personal developer accounts prior to production rollout.

---

## 3. Apple App Store Compliance Checklist

- [x] **Human Interface Guidelines (HIG)**: Natural iOS navigation, full Dynamic Type support, high-contrast dark mode.
- [x] **App Tracking Transparency (ATT)**: Not required because SafeSignal performs ZERO third-party tracking or advertising.
- [x] **Background Modes Declaration**: Compliant `location` background mode declared exclusively for active emergency sessions.
- [x] **StoreKit 2 Implementation**: Full support for subscription purchases, immediate restore purchases, and clear renewal disclosures.
- [x] **Safety Disclaimer**: Prominent disclaimer that SafeSignal does not replace official national emergency call centers (SOS Alarm 112).
