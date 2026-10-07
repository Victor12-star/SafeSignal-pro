# SafeSignal — Threat Model & Security Architecture

## 1. Threat Modeling Framework (STRIDE)

| STRIDE Category | Specific Attack / Risk Vector | Severity | SafeSignal Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Adversary crafts fake emergency alert impersonating a user to panic contacts. | Critical | All API endpoints require authenticated JWT tokens issued via Supabase Auth. Push dispatches verify sender identity against backend user profile. |
| **Tampering** | Man-in-the-Middle (MitM) alters GPS coordinates in transit to misdirect responders. | Critical | Strict TLS 1.3 certificate pinning in Ktor HTTP client. Location updates include client-signed cryptographic hashes and server-validated timestamp sequences. |
| **Repudiation** | Malicious contact claims they never received the alert or denies acknowledging it. | Medium | Recipient acknowledgement events log client timestamps, recipient user ID, and delivery receipt tokens in an immutable append-only `emergency_acknowledgements` table. |
| **Information Disclosure**| Unauthorized party accesses live coordinates of a victim (e.g., domestic abuser or stalker). | Catastrophic | Supabase Row Level Security (RLS) strictly restricts incident and location tables so ONLY verified trusted contacts linked to that incident can read data. Web access tokens use 256-bit cryptographically secure random tokens (`crypto.randomUUID()`) with 24-hour time-to-live (TTL). |
| **Denial of Service** | Flooding backend with bogus SOS triggers to exhaust SMS/Push notification quotas. | High | Rate-limiting at Edge Function level (max 2 new emergency incidents per 5 minutes per user account). Free-tier abuse throttled via device fingerprinting. |
| **Elevation of Privilege**| User accesses another user's contact list or emergency history by guessing incident UUIDs. | Critical | RLS policies: `auth.uid() = user_id` enforced on all tables. No sequential IDs exposed; UUIDv4 across all database schemas. |

---

## 2. Emergency Link Security (Recipient Web View)

For contacts without the SafeSignal native app installed:
1. **High-Entropy Tokens**: Incident links use the format `https://safesignal.app/e/{token}` where `token` is a 32-character base62 cryptographically secure random string stored in a dedicated `emergency_access_tokens` table.
2. **Strict Time-to-Live (TTL)**: Tokens expire automatically 24 hours after generation or immediately when the incident is resolved by the owner.
3. **Revocation**: The incident owner can revoke any active link with a single tap.
4. **No Identity Leakage**: The recipient web page shows only necessary safety information: Sender first name, incident type, current/last known location on a map, timestamp, battery level, and emergency service quick-dial. No sensitive account details, email addresses, or full contact directories are rendered.
5. **Rate-Limiting & Anti-Scraping**: The public web view is protected by rate limits (max 30 requests/min per IP) and returns HTTP 404 for expired or nonexistent tokens.

---

## 3. Data Protection & GDPR Compliance (Sweden & EU)
- **Principle of Ephemeral Processing**: Precise location points are retained in hot storage only during the active emergency session and are moved to a purge queue 48 hours post-resolution.
- **Explicit Consent**: Zero background location access prior to user-initiated SOS or Safe Journey sessions. Clear, contextual permission dialogs explaining exact data use.
- **No Third-Party Analytics / Ad Trackers**: Completely zero third-party advertising SDKs, commercial telemetry, or data broker integrations.
- **Right to Erasure (Account Deletion)**: A dedicated in-app "Delete My Account & All Data" flow immediately deletes user profile, contacts, historical incidents, and tokens via a cascading database foreign key transaction.
