# SafeSignal — Emergency Engine & State Machine

## 1. Formal State Machine Specification

SafeSignal models every emergency as a deterministic finite-state automaton (DFA). Status changes cannot skip lifecycle gates and are backed by immutable audit event logs.

```text
               [ IDLE / NO ACTIVE INCIDENT ]
                            |
                   (Hold SOS for 2.0s)
                            v
                       [ CREATED ] <--- Local persistence guaranteed
                            |
                 (Acquire GPS / Last Known)
                            v
                  [ PENDING_LOCATION ]
                            |
                    (Location attached)
                            v
                  [ PENDING_DELIVERY ]
                     /              \
         (Network OK)                (Network down / Timeout)
              v                               v
    [ PARTIALLY_DELIVERED ]           [ CONNECTION_LOST ]
              |                               |
    (All contacts reached)             (Automatic retry loop)
              v                               |
        [ DELIVERED ] <-----------------------+ (Signal returns)
              |
      (Recipient acknowledges)
              v
       [ ACKNOWLEDGED ]
              |
       (User resolves)
              v
        [ RESOLVED ] ---> Cease GPS daemon; trigger 48h ephemeral retention
```

---

## 2. Complete State Definitions & Semantic Truthfulness

| State | Internal Enum | Exact UI Message to User | System Action |
| :--- | :--- | :--- | :--- |
| **Created** | `CREATED` | *"Emergency created locally."* | UUID generated; stored in local SQLite; monotonic timestamp logged. |
| **Pending Location** | `PENDING_LOCATION` | *"Acquiring precise coordinates..."* | FusedLocationProvider requested; fallback timer (1.5s) primed to use Last Known Location. |
| **Pending Delivery** | `PENDING_DELIVERY` | *"Sending alerts to contacts..."* | Network worker launched; push payload queued; fallback timer started. |
| **Partially Delivered**| `PARTIALLY_DELIVERED`| *"Alert delivered to X of Y contacts."* | At least one recipient confirmed push receipt; remaining recipients queued. |
| **Delivered** | `DELIVERED` | *"Alert delivered to all contacts."* | All active trusted contacts' push gateways returned HTTP 200 / FCM message ID. |
| **Acknowledged** | `ACKNOWLEDGED` | *"Responding: [Name] has acknowledged."*| Recipient pressed "I'm Responding"; sender phone emits distinctive double haptic pulse. |
| **Connection Lost** | `CONNECTION_LOST` | *"No network. Alert saved locally. Retrying automatically."* | WorkManager / BGTask scheduled; SMS fallback option surfaced; location polling slowed to save battery. |
| **Resolved** | `RESOLVED` | *"Emergency resolved."* | Sender entered safe confirmation PIN; live location stream permanently killed; retention clock started. |
| **Cancelled** | `CANCELLED` | *"Emergency cancelled (false alarm)."* | Cancelled within 5-second grace period; cancellation notice dispatched to any notified contacts. |

---

## 3. Idempotency & Delivery Guarantees

### Idempotency Key Architecture
Every remote request generated during an emergency carries a composite idempotency key:
`Idempotency-Key: {incident_id}:{sequence_number}:{event_type}`
- `incident_id`: Client-generated UUIDv4 stored upon initial button press.
- `sequence_number`: Monotonically increasing integer (0 = creation, 1 = initial location, 2..N = live breadcrumbs).
- `event_type`: `INITIAL_ALERT` | `LOCATION_UPDATE` | `STATUS_CHANGE` | `RESOLUTION`.

### Server Deduplication Rules (PostgreSQL / Supabase)
1. The `emergency_incidents` table has a primary key `id UUID PRIMARY KEY`.
2. A unique constraint exists on `(incident_id, sequence_number)` inside `emergency_locations`.
3. If an unstable network causes a client to submit the same location update three times, the server executes `ON CONFLICT DO NOTHING` and returns the existing state without creating duplicate push alerts or database rows.

---

## 4. Location Update Frequency vs. Battery Preservation

During `ACTIVE`, `DELIVERED`, or `ACKNOWLEDGED` states, the background location engine adapts to battery state:

| Battery Level | Network State | Polling Interval | Min Displacement | GPS Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Normal (> 25%)** | Online (4G/5G/WiFi) | Every 15 seconds | 10 meters | High Accuracy (GNSS + Cell + WiFi) |
| **Low (10% - 25%)** | Online | Every 45 seconds | 25 meters | Balanced Power Accuracy |
| **Critical (< 10%)**| Online | Every 120 seconds | 50 meters | Low Power / Cell Tower Triangulation |
| **Any Level** | Offline (No Signal) | Every 60 seconds (local store)| 20 meters | GPS only; queue in SQLite until reconnect |

---

## 5. Real-Time Battery Monitor & Automatic Low Battery Alert (<15%)

In accordance with Master Development Directive Section 25:
> *"During an emergency, optionally include battery level if this can be obtained without unnecessary permissions. Example: Battery 14%. This helps recipients understand whether communication may soon stop."*

### Specification & Trigger Rules:
1. **Real-Time Battery Telemetry in Status Bar**:
   - The status bar continuously monitors device power state (level percentage and charging status) via native platform APIs (`BatteryManager` on Android, `UIDevice.batteryLevel` on iOS, and `navigator.getBattery` on Web).
   - Visual status changes dynamically: Green ($\ge 50\%$), Amber ($15-49\%$), and Pulsing Red ($<15\%$).
2. **Automatic Low Battery Trigger (<15%)**:
   - During an ACTIVE emergency session, if the battery level drops below **15%**, the emergency engine automatically synthesizes and broadcasts a high-priority **Low Battery Warning** to all configured trusted contacts.
   - **Payload Content**: Current battery level %, critical warning flag, and exact latitude/longitude coordinates with accuracy radius.
   - **User Confirmation**: Sender phone emits a discreet warning haptic pattern alerting the user that contacts have been notified of impending power loss.
   - **Recipient Experience**: Recipient web and push views display a prominent warning banner: *"Sender Device Power Warning (<15%): Alex's phone battery has dropped to X%. Communication and live location updates may cease if the device loses power. Note the recorded coordinates immediately."*
   - **Idempotent Dispatch**: Flag `isLowBatteryAlertSent: true` prevents redundant repeated triggers during the same emergency incident while continuing to update live coordinates until shutdown.

