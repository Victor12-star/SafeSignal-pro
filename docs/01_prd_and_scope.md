# SafeSignal — Product Requirements Document (PRD) & Scope Boundaries

## 1. Product Purpose & Value Proposition
SafeSignal is a mission-critical personal safety system engineered for situations where an individual may be in physical danger, facing an acute medical crisis, or under coercion, and cannot safely place a voice call, speak audibly, or manually communicate their coordinates.

The system allows immediate, discreet SOS activation and deterministic delivery of verified emergency information to configured trusted contacts (family, partners, neighbours, medical responders), backed by temporary live location tracking and offline persistence.

### Core Architecture Axiom
> **SAVE FIRST. SEND SECOND.**  
> An emergency incident MUST first be securely persisted in encrypted local device storage before any remote network call is attempted. Network failure, airplane mode, zero bars, or API timeouts must NEVER destroy or silently discard an emergency event.

---

## 2. Primary Launch Markets & Dual Configuration (Sweden & Nigeria)
SafeSignal is architected from Day 1 to support two distinct launch markets without branching the core emergency engine:

| Market | Alpha-2 | Dial Code | Verified Emergency # | Primary Languages | Regional Priorities & Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sweden** | `SE` | `+46` | `112` (SOS Alarm) | Swedish, English | Strict GDPR compliance, ephemeral location processing, zero tracking outside active sessions, strict right-to-erasure (account deletion), zero advertising. |
| **Nigeria** | `NG` | `+234` | `112` / `199` / Local NPF | English (Hausa, Yoruba, Igbo ready) | Low-data payload optimization, intermittent 2G/3G connectivity handling, SMS fallback composer, battery conservation, last-known-location preservation. |
| **Generic International** | `XX` | User-defined | Local Verified / ITU standard | English | Graceful fallback with standard ISO-3166 compliance and manual emergency dispatch dialer. |

---

## 3. V1 Feature Boundary (Strict V1 Scope)

### In-Scope for V1:
1. **Local-First Emergency Engine**:
   - Hold-to-activate SOS (2.0s press-and-hold with haptic & visual progress ring).
   - Instant local SQLite/Room incident creation with monotonic timestamp & UUIDv4.
   - Dual SOS Types: Standard SOS (audible/clear) and Silent SOS (discreet haptic, screen privacy).
   - Pre-configured emergency templates (Threat, Medical, Accident, Lost, Unsafe Journey, Other).
2. **Deterministic State Machine**:
   - Explicit states: `CREATED`, `PENDING_LOCATION`, `PENDING_DELIVERY`, `ACTIVE`, `PARTIALLY_DELIVERED`, `DELIVERED`, `ACKNOWLEDGED`, `CONNECTION_LOST`, `RESOLVED`, `CANCELLED`.
   - Truthful recipient delivery counters (`X of Y delivered, Z queued`). Never fake delivery.
3. **Location Subsystem**:
   - Fine & Coarse GPS acquisition with fallback to Last Known Location (with exact age timestamp).
   - Session-only tracking: automatically halts GPS daemon when incident or Safe Journey is resolved.
4. **Country-Aware Safety Configuration (`CountrySafetyConfig`)**:
   - Home Country vs. Current Safety Region decoupling (supports cross-border travel).
   - Localized emergency dispatch action button surfacing verified emergency number.
5. **Trusted Contacts Manager**:
   - Manual addition (no blanket address book scraping).
   - E.164 phone normalization with country code validation (+46, +234, etc.).
   - Contact groups (Family, Friends, Neighbours, Medical, Work).
6. **Safe Journey Mode**:
   - Destination + Estimated Arrival Time (ETA) timer.
   - "Are you safe?" check-in prompt with 3-minute grace countdown.
   - Configurable escalation to trusted contacts if unacknowledged.
7. **Offline Queue & Idempotent Synchronization**:
   - Exponential backoff retry queue with idempotency keys (`incident_id` + `update_sequence`).
   - Network state listener (`ONLINE`, `LIMITED`, `OFFLINE`, `RECOVERING`).
8. **Delivery & Fallback Hierarchy**:
   - Primary: Push notifications (FCM on Android, APNs on iOS) via Supabase Edge Functions.
   - Secondary: Ephemeral Secure Emergency Web Link (high-entropy token, expiring in 24h).
   - Tertiary: Prepared SMS Composer fallback with pre-filled coordinates and token link (Play Store compliant).
9. **Two-Way Discreet Acknowledgement**:
   - Recipient taps "I'm Responding".
   - Sender receives distinct, discreet vibration pattern and status tag change.
10. **Data Privacy & GDPR**:
    - Ephemeral location retention (automatic deletion 48 hours post-resolution).
    - In-app Account & Data Deletion self-service flow.

---

## 4. Out-of-Scope / Future Roadmap (Post-V1)
- Duress PIN / Fake decoying screen (requires extensive adversarial threat modeling).
- Wear OS / Apple Watch companion apps.
- Hardware button triggers (triple power-button) or Quick Settings tiles.
- Direct automated 911/112/199 PSAP dispatch (no direct integration without signed bilateral government SLA).
- Continuous background passive tracking (strictly prohibited by SafeSignal privacy charter).
- Audio / Video background recording (defer until local encryption keys and legal admissibility are vetted).
- AI audio stress analysis or automatic crash detection.
