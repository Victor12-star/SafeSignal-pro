# SafeSignal — Sweden & Nigeria Country Safety Specifications

## 1. Unified `CountrySafetyConfig` Architectural Model

To guarantee SafeSignal never hardcodes country rules in UI screens or business logic, all localized behavior is driven by the country configuration repository:

```kotlin
// commonMain/src/commonMain/kotlin/core/country/CountrySafetyConfig.kt

package core.country

import kotlinx.datetime.Instant

enum class PrivacyRegion {
    EU_GDPR,
    NIGERIA_NDPA, // Nigeria Data Protection Act
    GENERIC_GLOBAL
}

enum class EmergencyServiceType {
    ALL_EMERGENCIES,
    POLICE,
    AMBULANCE,
    FIRE,
    RAPID_RESPONSE
}

data class EmergencyNumber(
    val service: EmergencyServiceType,
    val label: String,
    val number: String,
    val verifiedAt: String, // e.g. "2026-09-01"
    val source: String
)

data class EmergencyCategoryConfig(
    val id: String,
    val titleEn: String,
    val titleLocal: String,
    val isEnabled: Boolean,
    val defaultMessage: String
)

data class CountrySafetyConfig(
    val countryCode: String, // ISO 3166-1 alpha-2 (e.g., "SE", "NG")
    val countryName: String,
    val callingCode: String, // e.g., "+46", "+234"
    val defaultLanguage: String,
    val supportedLanguages: List<String>,
    val emergencyNumbers: List<EmergencyNumber>,
    val categories: List<EmergencyCategoryConfig>,
    val smsFallbackSupported: Boolean,
    val lowDataDefault: Boolean,
    val privacyRegion: PrivacyRegion,
    val legalNotice: String
)
```

---

## 2. Sweden Configuration Specification (`SE`)

- **Country Code**: `SE`
- **International Calling Code**: `+46`
- **Languages**: Swedish (`sv`), English (`en`)
- **Verified Emergency Number**: `112` (SOS Alarm Sverige, last verified 2026-09-01).
- **Privacy Region**: `EU_GDPR`
- **Legal Notice**:
  *"SafeSignal operates under strict GDPR compliance in Sweden. Location data is processed exclusively during active safety sessions and purged within 48 hours post-resolution. SafeSignal does NOT replace 112 emergency services."*
- **Specific Technical Priorities**:
  - Ephemeral GPS tracking strictly bounded to active session.
  - No background tracking outside explicit sessions.
  - Zero commercialization or sale of user location.
  - Full right-to-erasure self-service in Settings.

---

## 3. Nigeria Configuration Specification (`NG`)

- **Country Code**: `NG`
- **International Calling Code**: `+234`
- **Languages**: English (`en`) (Architected for zero-refactor extension to Hausa, Yoruba, Igbo).
- **Verified Emergency Numbers**:
  - `112` (National Emergency Communications Centre / NCC).
  - `199` (National Police Emergency Response).
  - `0803 123 0000` (Local verified patrol desk).
- **Privacy Region**: `NIGERIA_NDPA` (Nigeria Data Protection Act 2023 compliance).
- **SMS Fallback**: Supported & enabled by default.
- **Low-Data Mode**: Enabled by default (Payloads compressed to < 180 bytes, suppressing high-resolution map tiles).
- **Specific Technical Priorities**:
  - Offline-first creation: 100% resilient to network failure.
  - Last-known-location preservation with high-contrast timestamp.
  - Prepared SMS composer fallback with pre-filled Google Maps shortlink.
  - Aggressive queue retry with network recovery detection.

---

## 4. Generic International Fallback (`GENERIC_GLOBAL`)

- **Calling Code**: User-defined / international.
- **Languages**: English (`en`).
- **Emergency Number**: Standard fallback `112` / `911` dial prompt.
- **Privacy Region**: `GENERIC_GLOBAL`.
- Ensures travelers or users in unsupported countries still have full offline SOS persistence, live tracking to trusted contacts, and map links.
