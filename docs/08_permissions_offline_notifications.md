# SafeSignal — Permissions, Offline Strategy & Notifications

## 1. Contextual Permission Strategy

SafeSignal strictly adheres to the principle of "Just-in-Time Contextual Permissions":
1. **Never on App Launch**: The app requests zero runtime permissions during initial splash or registration.
2. **Foreground Location (`ACCESS_FINE_LOCATION`)**:
   - Requested contextually during Onboarding or upon first SOS/Journey configuration.
   - Educational prompt: *"SafeSignal uses your location during active SOS or Safe Journey sessions so your trusted contacts can locate you. SafeSignal never tracks you outside an active safety session."*
3. **Background Location (`ACCESS_BACKGROUND_LOCATION`)**:
   - Only requested if the user explicitly turns on "Monitored Safe Journey in Background".
   - Follows Google Play Prominent Disclosure guidelines with explicit clear text before opening the system permission screen.
4. **Push Notifications (`POST_NOTIFICATIONS`)**:
   - Requested when adding trusted contacts: *"Allow notifications so SafeSignal can alert you immediately when a loved one triggers an SOS or acknowledges your alert."*
5. **No Dangerous SMS Permissions**:
   - SafeSignal does NOT request `SEND_SMS` or `READ_SMS` permission.
   - For offline SMS fallback, the app triggers standard platform-native SMS composers (`Intent.ACTION_SENDTO` on Android, `MFMessageComposeViewController` on iOS) pre-filled with emergency text and coordinates, ensuring 100% compliance with Google Play Store SMS policies.

---

## 2. Offline Strategy: Save First, Send Second

```text
[ USER TRIGGERS SOS ]
         |
         v
+-------------------------------+
| Step 1: LOCAL ATOMIC COMMIT   | --> Write incident to encrypted SQLite/Room
| - Generate UUIDv4             |     (Incident is now permanent on disk)
| - UTC Timestamp               |
| - Pre-selected emergency type |
+-------------------------------+
         |
         v
+-------------------------------+
| Step 2: ATTACH LOCATION       | --> Query FusedLocationProvider (1.5s timeout)
| - Fine GPS or Last Known Loc  |     Write coordinates to local emergency_locations
+-------------------------------+
         |
         v
+-------------------------------+
| Step 3: NETWORK EVALUATION    |
+-------------------------------+
      /                   \
(Network Available)     (Network Unavailable / Weak)
    /                       \
   v                         v
+---------------------+   +------------------------------------+
| Attempt HTTP POST   |   | ENQUEUE IN OFFLINE RETRY QUEUE     |
| to Supabase Backend |   | - Register WorkManager one-time job|
+---------------------+   | - Set NetworkType = CONNECTED      |
   |           \          | - Surface SMS Fallback Composer    |
   v            v         +------------------------------------+
(Success)    (Timeout)              |
   |            \                   v
   v             +--------> [ Device Reconnects ]
[ Mark DELIVERED ]                  |
                            [ Idempotent Sync ]
```

---

## 3. Notification Hierarchy & Lock Screen Privacy

| Scenario | Recipient Device State | Notification Category | Title | Body (Lockscreen Private) | Action Buttons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Active SOS Alert** | Screen Off / DND | High Priority / Critical Alert | `🚨 SafeSignal SOS` | *"Safety alert from [Name]. Tap to view verified location."* | `[View Map]` `[I'm Responding]` |
| **Recipient Acknowledged**| Sender Phone | Silent / High Priority Haptic | `Discreet Confirmation` | *"[Name] is responding to your alert."* | `[Open App]` |
| **Safe Journey Check-In** | User Phone | Gentle Alert / Escalation Timer | `Safe Journey Status` | *"Are you safe? 3 minutes remaining to check in."* | `[I'm Safe]` |

- **Lock Screen Privacy**: By default, incident details (e.g., exact medical diagnosis or sensitive threat notes) are redacted on locked screens, showing only the authenticated sender name and emergency level.
