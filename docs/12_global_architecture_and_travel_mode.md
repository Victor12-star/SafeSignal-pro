# SafeSignal Global Architecture & Travel Mode Specification

## 1. Executive Directive

SafeSignal is designed from its core foundation to operate worldwide across all continents without requiring separate applications, siloed regional forks, or hardcoded emergency numbers. 

While **Sweden (SE)** and **Nigeria (NG)** were designated as the initial dual launch verification markets, the core emergency engine is fully decoupled from geography via the **Country Safety Configuration Layer (`CountrySafetyConfig`)**.

---

## 2. Core Architecture: Home Country vs. Current Safety Region

SafeSignal strictly separates a user's **Home Country** from their **Current Safety Region**:

```text
User Profile
  ├── Home Country (Primary legal residency, domestic carrier, default phone format)
  └── Current Safety Region (Physical location determined via GPS or user confirmation)
          │
          ▼
  CountrySafetyConfig Repository
          │
          ├── Verified Local Emergency Numbers (e.g. 112, 911, 999, 110, 119, 000, 190)
          ├── Localized Emergency Categories (Language & cultural nuance)
          ├── Regional Legal & Privacy Constraints (GDPR, NDPA, CCPA, PIPEDA, APPI, LGPD, POPIA)
          ├── Connectivity Optimization (Low-Data binary payload vs. high-bandwidth 5G)
          └── Permitted Fallback Channels (SMS fallback composer vs. push-only)
```

### Critical Safety Principle: Non-Intrusive Awareness
Emergency behavior and local dispatch numbers are never switched silently without prominent user awareness. When traveling abroad, SafeSignal displays an informative **Travel Mode Banner**:
> *"Travel Mode: Home: Sweden 🇸🇪 → Current: Nigeria 🇳🇬. Emergency numbers updated to 112 / 199. Trusted contacts preserved in international E.164 format."*

---

## 3. Global Country Registry (Continents Covered)

The architecture includes verified configurations for major nations across all continents, alongside a dynamic universal resolver for any ISO-3166 territory:

| Region | Country | Code | Calling Code | Verified Emergency # | Privacy Regime | Low-Data Mode |
|---|---|---|---|---|---|---|
| **Europe** | Sweden | `SE` | `+46` | `112` (SOS Alarm) | `EU_GDPR` | Standard |
| **Europe** | United Kingdom | `GB` | `+44` | `999` / `112` / `101` | `UK_GDPR` | Standard |
| **Europe** | Germany | `DE` | `+49` | `112` / `110` | `EU_GDPR` | Standard |
| **Europe** | France | `FR` | `+33` | `112` / `15` / `17` / `18` | `EU_GDPR` | Standard |
| **Europe** | Spain | `ES` | `+34` | `112` / `091` / `061` | `EU_GDPR` | Standard |
| **North America** | United States | `US` | `+1` | `911` / `311` / `988` | `US_STATE_PRIVACY` | Standard |
| **North America** | Canada | `CA` | `+1` | `911` / `311` | `CANADA_PIPEDA` | Standard |
| **Africa** | Nigeria | `NG` | `+234` | `112` (NCC) / `199` (Police) | `NIGERIA_NDPA` | **Active (<180B)** |
| **Africa** | South Africa | `ZA` | `+27` | `10111` / `112` / `10177` | `SOUTH_AFRICA_POPIA` | **Active (<180B)** |
| **Africa** | Kenya | `KE` | `+254` | `999` / `112` / `911` | `GENERIC_GLOBAL` | **Active (<180B)** |
| **Africa** | Ghana | `GH` | `+233` | `112` / `191` / `192` / `193`| `GENERIC_GLOBAL` | **Active (<180B)** |
| **Asia** | Japan | `JP` | `+81` | `110` (Police) / `119` (Fire) | `JAPAN_APPI` | Standard |
| **Asia** | India | `IN` | `+91` | `112` (ERSS) / `100` / `108` | `GENERIC_GLOBAL` | **Active (<180B)** |
| **Asia / Middle East** | UAE | `AE` | `+971` | `999` / `998` / `997` | `GENERIC_GLOBAL` | Standard |
| **Oceania** | Australia | `AU` | `+61` | `000` (Triple Zero) / `112` | `AUSTRALIA_PRIVACY` | Standard |
| **South America** | Brazil | `BR` | `+55` | `190` / `192` / `193` / `112`| `BRAZIL_LGPD` | **Active (<180B)** |
| **Universal Fallback** | Global ITU | `GLOBAL`| `+1` | `112` / `911` (ITU Standard) | `GENERIC_GLOBAL` | Configurable |

---

## 4. International Phone Number Strategy (E.164 Standard)

1. **Storage Format**: All trusted contact phone numbers are stored strictly in normalized ITU-T **E.164** format (e.g. `+46701234567`, `+2348039876543`, `+14155552671`).
2. **Cross-Border Roaming**: Because numbers are stored in normalized international format, push notifications, native SMS links, and direct dial actions succeed regardless of whether the sender is in their home country or traveling abroad.
3. **Local Display**: The UI parses and displays formatted numbers according to regional conventions without losing the international dialing prefix.

---

## 5. Universal Fallback & Dynamic ISO Resolution

When a user enters a territory not explicitly enumerated in the primary list, `resolveCountrySafetyConfig(codeOrCoordinates)` generates a safe, compliant configuration:
- Employs ITU-T standard mobile emergency numbers (`112` / `911`).
- Applies standard ephemeral data protection (strict 48-hour purge).
- Enables Low-Data compression if network latency or bandwidth indicators fall below 250 kbps.

---

## 6. Offline-First Guarantee Worldwide

Regardless of whether the user is in Stockholm, Lagos, Tokyo, New York, or rural transit corridors:
1. **Local SQLite commit** executes first ($T+0\text{ms}$).
2. **GPS or Last Known Location** is attached with an explicit accuracy radius.
3. If internet is unavailable, updates are enqueued in SQLite and synced idempotently upon network restoration.
4. Pre-filled SMS fallback is available immediately to transmit coordinates across cellular voice/SMS channels without requiring internet data.
