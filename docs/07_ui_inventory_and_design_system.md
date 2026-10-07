# SafeSignal — UI Screen Inventory & Design System

## 1. UI Screen Inventory (18 Core Screens)

1. **SPLASH_SCREEN**: Minimal calm wordmark, checks local session & encrypted SQLite encryption key.
2. **ONBOARDING_SCREEN**: 3-step privacy education: (1) Save First, Send Second, (2) No passive continuous surveillance, (3) Country selection (Sweden / Nigeria / Other).
3. **AUTH_LOGIN_SCREEN**: Clean email & password sign-in with biometric unlock (Face/Fingerprint).
4. **AUTH_REGISTER_SCREEN**: Registration with E.164 phone verification and home country selection.
5. **HOME_SCREEN**: Primary safety hub:
   - System Status ("Protection Ready" / "No Network — Offline Guard Active").
   - Primary `HOLD FOR SOS` (2.0-second tactile activation control).
   - SOS Type quick toggle: Standard vs. Silent.
   - Quick action: Start Safe Journey.
   - Bottom Tab Navigation (Home, Contacts, Journey, Settings).
6. **ACTIVE_EMERGENCY_SCREEN**: High-clarity crisis dashboard:
   - Incident Status banner with exact truthful counter ("Alert delivered to 2 of 3 contacts").
   - Live location map view with accuracy radius and GPS timestamp.
   - Live breadcrumb trail.
   - Recipient acknowledgement cards ("Erik is responding").
   - Quick-dial verified local emergency dispatch button (112 for Sweden, 112/199 for Nigeria).
   - "Resolve Emergency" button (with confirmation challenge).
7. **SILENT_EMERGENCY_SCREEN**: Discreet black/dimmed view with no loud visuals or audio feedback, gentle periodic haptic pulse.
8. **CONTACTS_LIST_SCREEN**: Manage trusted contacts grouped by category (Family, Friends, Neighbours, Medical).
9. **ADD_EDIT_CONTACT_SCREEN**: Form with country code picker, E.164 phone validation, relationship tag, and notification preference.
10. **SAFE_JOURNEY_SETUP_SCREEN**: Set destination, estimated duration (e.g., 20 mins), and choose which contacts to monitor.
11. **SAFE_JOURNEY_ACTIVE_SCREEN**: Live countdown timer, destination route preview, and "I'm Safe" check-in button.
12. **SAFE_JOURNEY_CHECKIN_MODAL**: Escalation warning: "Are you safe? 3 minutes before contacts are notified."
13. **EMERGENCY_TEMPLATES_SCREEN**: Customize templates (Personal Threat, Medical Emergency, Highway Breakdown, Lost).
14. **RECIPIENT_EMERGENCY_WEB_VIEW**: Web view for contacts without app, showing sender status, map, battery, and "I'm Responding" button.
15. **SETTINGS_SCREEN**: Safety preferences, Emergency Country selector, Low-Data mode toggle, offline queue diagnostics.
16. **PRIVACY_AND_GDPR_SCREEN**: Data transparency, location retention policy (48h), export data, and "Delete My Account & Data" action.
17. **SUBSCRIPTION_PAYWALL_SCREEN**: Transparent comparison between Free Safety Foundation and SafeSignal Plus.
18. **EMERGENCY_HISTORY_SCREEN**: Audit logs of past resolved incidents (coordinates purged per retention schedule).

---

## 2. Design System & Anti-Slop Discipline

SafeSignal follows a strict safety-native design language:
- **Calm Authority**: 60% deep neutral slate canvas (`#090D16`), 30% structural surfaces (`#111827`), 10% purposeful accents (Rose/Amber/Emerald only at action points).
- **Zero-Pill Discipline**: Metadata, tags, and status labels are rendered as clean, unboxed text with subtle `·` separators, avoiding floating candy badges.
- **Typography**: Display & Headers in clean geometric sans (`Plus Jakarta Sans`), data and coordinates in tabular monospace (`JetBrains Mono`).
- **Touch Target Ergonomics**: All interactive safety targets $\ge 48\text{px}$. The primary SOS button has a massive $180\text{px} \times 180\text{px}$ touch zone reachable one-handed.
