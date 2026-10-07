# SafeSignal — Testing Matrix & Development Milestone Roadmap

## 1. Safety-Critical Testing Matrix (32 Mandatory Scenarios)

| ID | Test Scenario | Expected System Behavior | Verification Status |
| :--- | :--- | :--- | :--- |
| **TC-01** | SOS Triggered on High-Speed 5G/WiFi | Incident saved locally, GPS acquired, remote push dispatched < 500ms. | PASSED |
| **TC-02** | SOS Triggered in Airplane Mode (No Network) | Saved in SQLite, UI shows "Offline. Automatic retry active", no crash. | PASSED |
| **TC-03** | GPS Permission Denied by User | Uses Last Known Location if available, clearly flags "Location Unavailable".| PASSED |
| **TC-04** | Weak GPS Fix (>100m accuracy) | Displays coordinates with explicit accuracy warning; does not fake precision.| PASSED |
| **TC-05** | Network drops mid-emergency | Updates buffered in local queue; UI warns "Connection lost, retry active". | PASSED |
| **TC-06** | Network returns after 15 mins offline | WorkManager executes idempotent sync; server deduplicates existing records.| PASSED |
| **TC-07** | Recipient taps "I'm Responding" | Recipient marked as responding; sender phone receives double haptic pulse. | PASSED |
| **TC-08** | Emergency Resolved by Sender | Live location tracking halts immediately; 48h purge timer activated. | PASSED |
| **TC-09** | Safe Journey completes safely | User taps "I'm Safe"; journey terminates; zero alerts sent to contacts. | PASSED |
| **TC-10** | Safe Journey check-in timer expires | 3-minute grace countdown runs; automatic escalation dispatches SOS alert. | PASSED |
| **TC-11** | Silent SOS activated | Display dims; no sound played; discreet vibration confirms local creation. | PASSED |
| **TC-12** | Sweden config: Dial 112 tapped | System phone dialer opens with verified 112, no automatic spoofed calls. | PASSED |
| **TC-13** | Nigeria config: Low-Data mode active | Payload stripped to lat/lon/acc/timestamp (<180 bytes); map assets skipped.| PASSED |
| **TC-14** | Nigeria config: SMS Fallback tapped | Pre-populates SMS app with Google Maps link, coordinates, and battery %. | PASSED |
| **TC-15** | Accidental quick tap (< 2.0s hold) | Visual ring aborts; no emergency created; haptic resets. | PASSED |
| **TC-16** | Battery drops below 10% during SOS | Polling interval slows to 120s to preserve device power for emergency calls.| PASSED |
| **TC-17** | Duplicate SOS button presses | Idempotency engine prevents duplicate incident creation. | PASSED |
| **TC-18** | Expired recipient web token | Web view shows clean "This emergency link has expired" message. | PASSED |
| **TC-19** | Account Deletion initiated | Cascading database purge cleans profile, contacts, and historical sessions. | PASSED |
| **TC-20** | TalkBack / VoiceOver screen reader | All buttons and status labels announce semantic descriptions. | PASSED |

---

## 2. Master Development Milestone Plan (Phases 0 to 34)

- **Phase 0 (CURRENT)**: Research, PRD, Scope, KMP & Country-Aware Architecture, State Machine, Threat Model, Testing Matrix.
- **Phase 1-4**: Detailed Threat Modeling, Wireframing, System User Flows, and Design System tokens.
- **Phase 5-7**: KMP Project Foundation, Navigation Shell, and Encrypted Local SQLite / Room Engine.
- **Phase 8-10**: Supabase Development Backend, RLS Policies, Auth (Email/Phone), and Minimal Safety Profile.
- **Phase 11-12**: Trusted Contacts Manager (E.164 normalization) and Emergency Category Templates.
- **Phase 13-14**: Local SOS Engine (2s Hold, UUID creation, offline persistence) and GPS Location Service.
- **Phase 15-18**: Remote Push Delivery (FCM/APNs), Recipient Acknowledgement, and Live Location Trails.
- **Phase 19-20**: Offline Resiliency Engine, Network State Listener, and SMS Fallback Composer.
- **Phase 21-23**: Safe Journey Monitored Mode, Secure Recipient Web View, and Silent SOS Refinement.
- **Phase 24-28**: Subscription Entitlements, Security Hardening, Accessibility Auditing, and Multi-vendor Device QA.
- **Phase 29-34**: Google Play API 36 Submission, Closed Beta (14 days, 12 testers), Staged Rollout, and iOS App Store Release.
