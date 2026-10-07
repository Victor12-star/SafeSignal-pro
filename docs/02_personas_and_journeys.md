# SafeSignal — User Personas & Main User Journeys

## 1. Respectful, Non-Sensitive User Personas

### Persona A: Urban Night Commuter (Stockholm, Sweden)
- **Profile**: 28-year-old software designer living in Södermalm, frequently walking home from commuter rail stations past midnight in dark sub-zero winter conditions.
- **Environment**: High 5G/4G coverage, cold outdoor conditions (gloves on), high privacy consciousness, strict GDPR expectations.
- **Pain Points**: Fear of being accosted in secluded suburban walkways; needing to activate emergency alert discreetly with one hand while phone is in pocket or mitten; wants reassurance without panicking family unnecessarily.
- **Primary Need**: Hold-to-activate Silent SOS, discreet haptic feedback, 112 verified quick-dial if physical assault occurs, zero battery drain.

### Persona B: Highway & Rural Transit Commuter (Lagos / Ibadan Corridor, Nigeria)
- **Profile**: 34-year-old logistics supervisor traveling between Lagos and Ogun State, encountering frequent highway checkpoints, unlit rural stretches, and unpredictable cellular coverage.
- **Environment**: Fluctuating 3G/2G network blackspots, power cuts requiring strict battery preservation, high incidence of express highway breakdowns and road threats.
- **Pain Points**: Data connections drop completely during critical stretches; alerts fail silently on standard apps; contacts use different mobile networks (MTN, Airtel, Glo).
- **Primary Need**: Ultra-compact low-data payload, local persistence so SOS is never lost, prepared SMS fallback with Google Maps coordinates and battery percentage, automatic queue retry when signal flickers back.

### Persona C: Independent Solo Senior / Medical Vulnerability (Gothenburg / Abuja)
- **Profile**: 68-year-old living alone with mild cardiac history, taking daily solitary evening walks.
- **Environment**: High contrast UI required, large touch targets, simple non-overwhelming controls.
- **Pain Points**: Tripping or feeling sudden dizziness outdoors and unable to navigate complex nested menus or dial numbers while experiencing shortness of breath.
- **Primary Need**: Pre-configured "Medical Emergency" template, single 2-second hold trigger, automatic inclusion of trusted neighbours and adult children with live location pin.

---

## 2. Main End-to-End User Journeys

### Journey 1: Acute Emergency SOS (Save First, Send Second)
1. **Trigger**: User experiences immediate danger. Opens SafeSignal (or wakes phone to lockscreen widget/app).
2. **Action**: User presses and holds the primary `HOLD FOR SOS` control. A tactile vibration pulse increases in frequency over 2.0 seconds while a radial ring completes.
3. **Local Creation (T+0ms)**: App immediately writes a new row to local encrypted SQLite/Room database (`status = CREATED`, `timestamp = UTC now`, `incident_id = UUIDv4`).
4. **Acquire Fix (T+50ms)**: App starts location daemon (`PRIORITY_HIGH_ACCURACY`). If GPS lock takes >1500ms, immediately snapshots **Last Known Location** with exact age tag (e.g., "Fix from 3 mins ago") so transmission is not stalled.
5. **Remote Delivery Attempt (T+100ms)**: App checks network state.
   - *If Online*: Posts incident payload to Supabase backend. Supabase dispatches FCM/APNs push notifications to configured Trusted Contacts. State moves to `DELIVERED` or `PARTIALLY_DELIVERED`.
   - *If Offline / Weak Data*: Incident is enqueued in local `pending_delivery_queue`. App displays: *"No connection. Emergency saved locally. Automatic retry active."*
6. **Recipient Experience**: Contact receives high-priority notification: *"Safety alert from Astrid — Tap to view location."* Contact opens recipient view and clicks *"I'm Responding"*.
7. **Discreet Acknowledgement**: Sender's device receives a double haptic pulse: *"Erik is responding"*.
8. **Resolution**: When threat passes, sender enters resolution PIN/confirmation. Incident enters `RESOLVED`. Live location service immediately shuts down.

### Journey 2: Safe Journey with Monitored Check-In
1. **Setup**: User departs city center for a 25-minute walk home.
2. **Start**: User selects "Safe Journey", inputs estimated duration (25 min) and designates 2 emergency contacts.
3. **Monitoring**: Low-power geofencing / timer daemon activates. App displays passive countdown timer.
4. **Prompt**: At T = 25 min, phone vibrates and displays: *"Are you safe? 3 minutes to confirm."*
5. **Safe Case**: User taps *"I'm Safe"*. Journey session terminates normally. Contacts receive no alarm.
6. **Escalation Case**: User does not respond after 3 minutes (and two escalating chime/vibrations). App automatically transitions journey into `ACTIVE_ESCALATION` SOS, dispatching last known location to designated contacts.

### Journey 3: Weak Network / SMS Fallback in Remote Transit
1. **Trigger**: User activates SOS while traveling in an area with zero cellular data (2G voice/SMS only).
2. **Local Commit**: Incident saved locally. Remote HTTP POST fails with `NetworkUnavailableException`.
3. **Fallback Escalation**: App detects data unavailability and prompts/activates the SMS Fallback Manager.
4. **Composer Launch**: Pre-populates the device SMS composer to configured emergency contacts with:
   `[SafeSignal SOS] Alex needs help! Last location: https://maps.google.com/?q=6.5244,3.3792 (Acc: 12m). Battery: 19%. Web: https://safesignal.app/e/7f3a9`
5. **Background Sync**: SafeSignal background worker continuously monitors network connectivity. When mobile data reconnects 18 minutes later, the stored incident and location updates are idempotently synced to the backend without duplicate entries.
