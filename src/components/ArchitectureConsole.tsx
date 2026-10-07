import React, { useState } from 'react';
import {
  Shield,
  Globe,
  CheckCircle,
  Play,
  Compass,
  Lock,
  Smartphone,
  PhoneCall,
} from 'lucide-react';
import { ALL_SUPPORTED_COUNTRIES } from '../config/countries';

interface ArchitectureConsoleProps {
  onRunTestScenario?: (scenarioId: string) => void;
}

export const ArchitectureConsole: React.FC<ArchitectureConsoleProps> = ({ onRunTestScenario }) => {
  const [activeTab, setActiveTab] = useState<'pillars' | 'global' | 'testrunner'>('pillars');
  const [selectedPillar, setSelectedPillar] = useState<number>(1);
  const [selectedContinent, setSelectedContinent] = useState<string>('All');

  const pillars = [
    {
      id: 1,
      title: '01. Global Product Requirements (PRD)',
      category: 'Foundation',
      summary: 'Universal mission-critical safety platform for high-risk situations worldwide.',
      details: `SafeSignal is engineered for any territory on Earth where a person is in acute danger and cannot safely speak aloud, dial numbers, or describe coordinates.
Core Axiom: "SAVE FIRST. SEND SECOND." Every emergency incident is committed to encrypted local SQLite before any network call is initiated. Network loss or API downtime will never discard an emergency.
Global Scope: Supports all continents with home-country vs. current-region separation (Travel Mode).`,
      deliverables: ['Global problem definition', 'Deterministic delivery states', 'Ephemeral tracking guarantees', 'Cross-border travel support'],
    },
    {
      id: 2,
      title: '02. V1 Feature Boundary & Global Scope',
      category: 'Scope',
      summary: 'Strict V1 scope focused on uncompromised reliability and truthfulness worldwide.',
      details: `V1 Scope:
1. Local-first SOS engine (2.0s hold activation).
2. Standard SOS (visible/audible) and Silent SOS (discreet haptic).
3. Session-only GPS tracking (kills GPS daemon when resolved).
4. CountrySafetyConfig decoupled repository covering Europe, Africa, Americas, Asia, Oceania.
5. Home Country vs. Current Safety Region (Travel Mode).
6. Trusted contacts manager with normalized E.164 phone formats (+46, +234, +1, +44, etc.).
7. Safe Journey mode with arrival timer and grace escalation.
8. Low-Data mode (<180 byte compressed payloads) for emerging networks.
9. Prepared SMS Fallback composer without restricted store permissions.
10. Ephemeral location purge (48-hour schedule).`,
      deliverables: ['Universal bounded feature matrix', 'Zero-paywall safety foundation', 'No fake statuses'],
    },
    {
      id: 3,
      title: '03. Future Roadmap (Post-V1)',
      category: 'Scope',
      summary: 'Explicit list of deferred features to protect core stability.',
      details: `Strictly Out-of-Scope for V1:
- Duress PIN / Decoy screen (deferred pending legal and coercive threat research).
- Wear OS / Apple Watch companion apps.
- Hardware button shortcuts (triple power press) or Quick Settings tile.
- Direct automated PSAP 911/112/199 dispatch (requires bilateral government treaties).
- Audio / Video background streaming.
- AI voice stress analysis or automatic crash detection.`,
      deliverables: ['No premature expansion', 'Documented future extension points'],
    },
    {
      id: 4,
      title: '04. Respectful User Personas Across Continents',
      category: 'Design',
      summary: 'Targeted personas spanning urban, rural, and international travel environments.',
      details: `1. Urban Night Commuter (Stockholm, SE / London, UK / Berlin, DE): Late commute on public transit in dark winter conditions. High 4G/5G, needs silent 2s hold SOS, GDPR compliance.
2. Transit & Highway Commuter (Lagos/Ibadan, NG / Nairobi, KE / Mumbai, IN): Commuter through 2G/3G network blackspots. Needs low-data compression, SMS fallback, local queueing.
3. International Traveler (e.g. Swede in Nigeria, American in Japan, Nigerian in the UK): Operates under Travel Mode. Contacts remain in home international E.164 format, while emergency dialer updates to local service numbers.
4. Independent Senior (Gothenburg / Chicago / Tokyo): Solo living. Needs pre-configured Medical SOS, high-contrast display, large touch hitboxes.`,
      deliverables: ['Diverse environmental constraints', 'Extreme network variance coverage'],
    },
    {
      id: 5,
      title: '05. Main User Journeys',
      category: 'UX',
      summary: 'End-to-end flows for Acute SOS, Safe Journey, and Weak-Signal Fallback.',
      details: `Journey 1: Acute SOS
Hold 2.0s -> Local SQLite commit (T+0ms) -> Acquire GPS/Last Known -> Attempt Push -> Active Live Sharing -> Recipient acknowledges -> Safe resolution -> 48h purge.

Journey 2: Safe Journey
Set ETA -> Monitoring daemon starts -> Arrival prompt ("Are you safe?") -> 3-min countdown -> Safe tap terminates, or escalation sends emergency alerts.

Journey 3: Weak Network / SMS
SOS triggered offline -> Queued locally -> SMS composer pre-populates coordinates -> Background WorkManager syncs when network returns.`,
      deliverables: ['Save-first sequence flowcharts', 'Graceful failure mitigation'],
    },
    {
      id: 6,
      title: '06. Emergency State Machine',
      category: 'Architecture',
      summary: 'Deterministic finite-state automaton with immutable audit transitions.',
      details: `States:
CREATED -> PENDING_LOCATION -> PENDING_DELIVERY -> ACTIVE -> PARTIALLY_DELIVERED -> DELIVERED -> ACKNOWLEDGED -> CONNECTION_LOST -> RESOLVED | CANCELLED.

Idempotency Key: {incident_id}:{sequence_number}:{event_type}.
Server enforces ON CONFLICT DO NOTHING to guarantee duplicate pushes never occur during unstable network retries.`,
      deliverables: ['Exhaustive transition matrix', 'No phantom "Delivered" states'],
    },
    {
      id: 7,
      title: '07. Threat Model (STRIDE)',
      category: 'Security',
      summary: 'Rigorous threat analysis protecting life-critical location data.',
      details: `STRIDE Mitigations:
- Spoofing: JWT authentication via Supabase Auth + sender identity verification.
- Tampering: TLS 1.3 certificate pinning in Ktor + signed sequence hashes.
- Repudiation: Append-only emergency_acknowledgements table with client timestamps.
- Information Disclosure: PostgreSQL Row Level Security (auth.uid() = user_id); 256-bit random tokens with 24h TTL for public web links.
- Denial of Service: Edge Function rate-limiting (max 2 new SOS incidents / 5 mins).`,
      deliverables: ['Anti-stalker protections', 'Ephemeral data purge schedule'],
    },
    {
      id: 8,
      title: '08. Database Schema & RLS',
      category: 'Backend',
      summary: 'PostgreSQL / Supabase relational schema with strict zero-leak policies.',
      details: `Tables:
- profiles (user metadata, home_country_code, current_safety_region, timezone)
- trusted_contacts (E.164 phone numbers, relationships, groups)
- emergency_incidents (idempotent UUIDs, status, timestamps)
- emergency_locations (breadcrumbs, accuracy, is_last_known)
- emergency_recipients (delivery channels, delivery status)
- emergency_acknowledgements (audit logs)
- emergency_access_tokens (high-entropy web access tokens)

All tables protected by Row Level Security (RLS). No separate databases per country needed.`,
      deliverables: ['Production PostgreSQL DDL', 'Strict multi-tenant isolation'],
    },
    {
      id: 9,
      title: '09. Kotlin Multiplatform Architecture',
      category: 'Architecture',
      summary: 'commonMain business engine with clean native platform boundaries.',
      details: `Core Domain in commonMain:
- Models, Repositories, Ktor HTTP client, Room KMP database, EmergencyStateMachine.
Native androidMain:
- FusedLocationProviderClient, WorkManager, Foreground Service, FCM, Keystore, Play Billing.
Native iosMain:
- CLLocationManager, BGTaskScheduler, APNs, Keychain, StoreKit 2.`,
      deliverables: ['KMP shared code structure', 'Platform-agnostic interfaces'],
    },
    {
      id: 10,
      title: '10. Platform Responsibility Matrix',
      category: 'Architecture',
      summary: 'Exact subsystem mapping across Android, iOS, and Common Code.',
      details: `Interfaces defined in commonMain:
- LocationService -> Android: FusedLocation / iOS: CoreLocation
- EmergencyTrackingService -> Android: ForegroundService / iOS: Active Location Session
- SecureStorage -> Android: Keystore / iOS: Keychain
- BackgroundSyncManager -> Android: WorkManager / iOS: BGTaskScheduler
- PushNotificationService -> Android: FCM / iOS: APNs
- SmsFallbackManager -> Android: ACTION_SENDTO / iOS: MFMessageComposeViewController`,
      deliverables: ['Clean separation of concerns', 'No Android APIs in commonMain'],
    },
    {
      id: 11,
      title: '11. UI Screen Inventory (18 Screens)',
      category: 'UX',
      summary: 'Exhaustive inventory of every screen in the SafeSignal mobile app.',
      details: `1. Splash Screen
2. Onboarding & Privacy Education
3. Auth Login
4. Auth Register
5. Home Hub (Hold for SOS, Status, Journey trigger)
6. Active Emergency Dashboard
7. Silent Emergency View
8. Contacts List
9. Add/Edit Contact
10. Safe Journey Setup
11. Safe Journey Active
12. Safe Journey Check-in Modal
13. Emergency Templates
14. Recipient Web View
15. Settings & Region Selector (Travel Mode)
16. Privacy & International Account Deletion
17. Subscription Paywall (Local currency SEK/NGN/USD/EUR/GBP)
18. Emergency History Audit Log`,
      deliverables: ['18 screen functional specifications', 'Full navigational hierarchy'],
    },
    {
      id: 12,
      title: '12. UI/UX Design System',
      category: 'Design',
      summary: 'Calm, authoritative, anti-slop design system for crisis conditions.',
      details: `Design Principles:
- 60-30-10 Color Discipline: 60% deep neutral slate (#090D16), 30% structural surfaces (#111827), 10% high-intent accents.
- Zero-Pill Discipline: Metadata and timestamps rendered as clean unboxed text with subtle typographic separators.
- Typography: Plus Jakarta Sans (Display/Body) + JetBrains Mono (Coordinates & Tabular Numbers).
- Touch Ergonomics: Primary SOS touch target is 180x180px with tactile progress feedback.`,
      deliverables: ['Accessibility AA compliance', 'Anti-AI-slop visual restraint'],
    },
    {
      id: 13,
      title: '13. Contextual Permission Strategy',
      category: 'Privacy',
      summary: 'Zero permissions on launch; contextual just-in-time requests only.',
      details: `1. ACCESS_FINE_LOCATION: Requested contextually before starting SOS or Safe Journey with prominent disclosure.
2. ACCESS_BACKGROUND_LOCATION: Prominent disclosure shown before background monitoring toggle.
3. POST_NOTIFICATIONS: Requested when configuring trusted contacts.
4. ZERO DANGEROUS SMS PERMISSIONS: App uses system ACTION_SENDTO composer; no SEND_SMS or READ_SMS needed.`,
      deliverables: ['100% Google Play location policy compliance', 'No intrusive prompts'],
    },
    {
      id: 14,
      title: '14. Offline Resiliency Engine',
      category: 'Resilience',
      summary: 'Atomic local persistence with idempotent exponential backoff sync.',
      details: `Offline Flow:
1. Save incident locally (UUIDv4 + timestamp).
2. Attach last known location if GPS lock unavailable.
3. If network is offline, enqueue in SQLite retry queue and schedule WorkManager.
4. Surface pre-filled SMS composer as immediate fallback.
5. On network restoration, sync queued records with idempotency deduplication.`,
      deliverables: ['Zero data loss during network blackouts', 'Truthful offline UI state'],
    },
    {
      id: 15,
      title: '15. Notification Strategy',
      category: 'Delivery',
      summary: 'High-priority critical alerts with lock-screen privacy masking.',
      details: `Categories:
- Active SOS: High Priority push notification overriding DND where permitted.
- Recipient Acknowledged: Silent high-priority haptic pulse confirming responder.
- Safe Journey Check-in: Gentle reminder chime with 3-minute grace period.
- Lockscreen Privacy: Shows "Safety alert from Alex" without exposing sensitive crisis details to bystanders.`,
      deliverables: ['Android NotificationChannels', 'APNs critical alert payloads'],
    },
    {
      id: 16,
      title: '16. Subscription Architecture',
      category: 'Monetization',
      summary: 'Free Safety Foundation guarantees emergency core is never paywalled.',
      details: `Free Safety Foundation:
- Unlimited SOS activations, 5 trusted contacts, session-based live tracking, basic Safe Journey, verified emergency dialers, 48h purge.
SafeSignal Plus:
- Unlimited contacts, custom contact groups, extended audit history, smart delay escalation.
Regionalized Store Pricing:
- Local currency provided by Google Play and Apple StoreKit (SEK, NGN, USD, GBP, EUR, JPY, etc.).`,
      deliverables: ['No paywalls in emergencies', 'Server-verified receipts'],
    },
    {
      id: 17,
      title: '17. Google Play Compliance (API 36+)',
      category: 'Compliance',
      summary: 'Target SDK 36 (Android 16), 16KB page sizes, Data Safety compliance.',
      details: `Compliance Verification:
- Target SDK 36 (Android 16) with 64-bit and 16KB page support.
- Prominent background location disclosure modal.
- No restricted SMS permissions (uses ACTION_SENDTO).
- Self-service in-app account and data deletion.
- Data Safety declaration: location never sold, zero advertising trackers.
- 14-day closed testing protocol with 12+ opted-in testers.`,
      deliverables: ['Play Store policy sign-off', 'Zero store rejection vectors'],
    },
    {
      id: 18,
      title: '18. Apple App Store Compliance',
      category: 'Compliance',
      summary: 'StoreKit 2, Human Interface Guidelines, and privacy manifests.',
      details: `Compliance Verification:
- HIG-compliant typography and dynamic text scaling.
- Location background mode declared exclusively for active safety sessions.
- StoreKit 2 subscription purchase and restore handling.
- Mandatory legal disclaimer: "SafeSignal does not replace official emergency services."
- App Tracking Transparency: not required (0 third-party trackers).`,
      deliverables: ['iOS App Store readiness', 'Strict privacy transparency'],
    },
    {
      id: 19,
      title: '19. Safety Testing Matrix',
      category: 'QA',
      summary: '32 exhaustive scenarios covering network drops, GPS loss, and recovery.',
      details: `Core Test Cases:
- TC-01: SOS on high-speed 5G/WiFi.
- TC-02: SOS in Airplane Mode (Offline SQLite commit).
- TC-03: GPS permission denied (Last known location fallback).
- TC-05: Network drops mid-emergency (Buffer updates in queue).
- TC-06: Network returns after 15m (Idempotent sync).
- TC-07: Recipient taps "I'm Responding" (Discreet haptic acknowledgement).
- TC-10: Safe Journey timer expiration (Grace period and escalation).
- TC-13: Nigeria / Emerging Markets Low-Data mode (<180 byte compressed payload).
- TC-14: SMS Fallback pre-filled composer execution.
- TC-20: Cross-border Travel Mode transition (SE -> NG -> US).`,
      deliverables: ['32 verified automated test cases', 'Hardware vendor matrix'],
    },
    {
      id: 20,
      title: '20. Development Milestone Roadmap',
      category: 'DevOps',
      summary: 'Phased rollout from Phase 0 specification to Phase 34 App Store release.',
      details: `Phase Schedule:
- Phase 0 (CURRENT): Complete PRD, KMP architecture, state machine, testing matrix.
- Phase 1-7: KMP foundation, local SQLite persistence, design tokens.
- Phase 8-12: Supabase backend, RLS, Auth, Contacts Manager.
- Phase 13-20: Local SOS engine, GPS service, Push delivery, Offline queue, SMS fallback.
- Phase 21-28: Safe Journey, Recipient web view, Subscription billing, Security hardening.
- Phase 29-34: Google Play API 36 release, 14-day closed beta, iOS finalization.`,
      deliverables: ['Sequential milestone acceptance criteria', 'Risk mitigation checkpoints'],
    },
  ];

  const currentPillar = pillars.find((p) => p.id === selectedPillar) || pillars[0];

  const filteredCountries = selectedContinent === 'All'
    ? ALL_SUPPORTED_COUNTRIES
    : ALL_SUPPORTED_COUNTRIES.filter((c) => c.continent === selectedContinent);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-500" />
            <h1 className="text-base font-bold text-white tracking-tight">
              SafeSignal Global Architecture & Directive Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Decoupled CountrySafetyConfig engine supporting all world regions, travel mode, and offline resilience
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('pillars')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'pillars' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            20 System Pillars
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'global' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Global Country Registry ({ALL_SUPPORTED_COUNTRIES.length}+)
          </button>
          <button
            onClick={() => setActiveTab('testrunner')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'testrunner' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Test Matrix Runner
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'pillars' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Pillar Navigation */}
          <div className="w-72 border-r border-slate-800 bg-slate-950 overflow-y-auto p-3 space-y-1 shrink-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Specification Pillars
            </div>
            {pillars.map((pillar) => (
              <button
                key={pillar.id}
                onClick={() => setSelectedPillar(pillar.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-start justify-between ${
                  selectedPillar === pillar.id
                    ? 'bg-rose-950/40 text-rose-200 border border-rose-900/60 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="truncate pr-2">
                  <div>{pillar.title}</div>
                  <div className="text-[10px] text-slate-500 font-normal truncate mt-0.5">
                    {pillar.summary}
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 shrink-0">
                  {pillar.category}
                </span>
              </button>
            ))}
          </div>

          {/* Pillar Details Inspector */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 text-rose-400 rounded">
                  Pillar {currentPillar.id} / 20
                </span>
                <span className="text-xs text-slate-400">· {currentPillar.category}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{currentPillar.title}</h2>
              <p className="text-xs text-slate-400">{currentPillar.summary}</p>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {currentPillar.details}
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Key Architectural Deliverables
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentPillar.deliverables.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 flex items-center gap-2 text-xs text-slate-300"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Country Registry Tab */}
      {activeTab === 'global' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-rose-500" /> Global Country Safety Registry
                </h2>
                <p className="text-xs text-slate-400">
                  Decoupled regional configuration layer (`CountrySafetyConfig`). Adapts emergency numbers, dial codes, privacy regimes, and low-data modes dynamically without changing core engine code.
                </p>
              </div>

              {/* Continent Filter */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                {['All', 'Europe', 'Africa', 'North America', 'South America', 'Asia', 'Oceania'].map((cont) => (
                  <button
                    key={cont}
                    onClick={() => setSelectedContinent(cont)}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      selectedContinent === cont ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cont}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Mode Concept Box */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <Compass className="w-4 h-4 text-sky-400" />
                Directive Requirement: Home Country vs. Current Safety Region (Travel Mode)
              </div>
              <p className="text-slate-300 leading-relaxed">
                When a user travels abroad (e.g. Sweden 🇸🇪 &rarr; Nigeria 🇳🇬 or USA 🇺🇸 &rarr; Japan 🇯🇵):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-sky-400 block font-bold mb-1">1. Local Emergency Dispatch</span>
                  <span className="text-slate-400">Instantly displays verified local services (112, 911, 999, 110/119, etc.).</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-emerald-400 block font-bold mb-1">2. Preserved E.164 Contacts</span>
                  <span className="text-slate-400">Home contacts remain addressable over international telephony & SMS.</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-amber-400 block font-bold mb-1">3. Non-Intrusive Awareness</span>
                  <span className="text-slate-400">Emergency behavior never changes silently without clear user awareness.</span>
                </div>
              </div>
            </div>

            {/* Grid of Global Countries */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCountries.map((c) => (
                <div
                  key={c.countryCode}
                  className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{c.flagEmoji}</span>
                        <div>
                          <h3 className="text-sm font-bold text-white">{c.countryName}</h3>
                          <span className="text-[11px] text-slate-400">
                            {c.continent} · {c.callingCode}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 text-slate-300 rounded border border-slate-800">
                        {c.countryCode}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Emergency Number:</span>
                        <span className="font-mono font-bold text-rose-400">
                          {c.emergencyNumbers.map((n) => n.number).join(' / ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Privacy Framework:</span>
                        <span className="font-mono text-emerald-400 text-[11px]">{c.privacyRegion}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">SMS Fallback:</span>
                        <span className={c.smsFallbackSupported ? 'text-sky-400 font-semibold' : 'text-slate-500'}>
                          {c.smsFallbackSupported ? 'Supported' : 'Push Primary'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Low-Data Default:</span>
                        <span className={c.lowDataDefault ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                          {c.lowDataDefault ? 'Active (<180B)' : 'Standard'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 line-clamp-2">
                    {c.legalNotice}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Test Matrix Runner Tab */}
      {activeTab === 'testrunner' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Interactive Global Safety Test Matrix (Scenarios TC-01 to TC-20)</h2>
              <p className="text-xs text-slate-400">
                Execute automated validation tests across network failures, GPS dropouts, SMS fallbacks, and cross-border travel mode transitions.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'TC-01', name: 'SOS Triggered on High-Speed 5G/WiFi (Sweden / US / UK)', state: 'ONLINE', expectation: 'Incident committed to SQLite; push sent in <500ms.' },
                { id: 'TC-02', name: 'SOS in Airplane Mode (No Network)', state: 'OFFLINE', expectation: 'Saved locally; UI reports "Offline. Retrying automatically".' },
                { id: 'TC-03', name: 'GPS Unavailable / Timeout', state: 'NO_GPS', expectation: 'Preserves last known location with clear age timestamp.' },
                { id: 'TC-05', name: 'Network Drops Mid-Emergency', state: 'CONNECTION_LOST', expectation: 'Updates enqueued locally in SQLite; zero data loss.' },
                { id: 'TC-06', name: 'Network Returns After Offline (RECOVERING)', state: 'RECOVERING', expectation: 'Exponential backoff retry with full jitter dispatches queued emergency packets before promoting to ONLINE.' },
                { id: 'TC-07', name: 'Recipient Taps "I\'m Responding"', state: 'ACKNOWLEDGED', expectation: 'Discreet double haptic pulse emitted on sender phone.' },
                { id: 'TC-10', name: 'Safe Journey Check-In Expiration', state: 'ESCALATION', expectation: '3-minute grace countdown runs; automatic escalation triggered.' },
                { id: 'TC-13', name: 'Low-Data Mode Audit (Nigeria, Kenya, India)', state: 'LOW_DATA', expectation: 'Payload compressed to 142 bytes; map assets suppressed.' },
                { id: 'TC-14', name: 'SMS Fallback Composer Launch', state: 'SMS_READY', expectation: 'Native SMS composer pre-filled without requiring SEND_SMS.' },
                { id: 'TC-18', name: 'Real-Time Battery Drop Below 15% (Auto-Alert)', state: 'LOW_BATTERY', expectation: 'Automatically triggers critical low battery broadcast to all contacts with coordinates.' },
                { id: 'TC-19', name: 'Battery Drain Projection (<5% in 20 Mins)', state: 'SHUTDOWN_RISK', expectation: 'Chart highlighted in glowing red with 5% shutdown reserve line and countdown banner.' },
                { id: 'TC-20', name: 'Cross-Border Travel Mode (Sweden -> Nigeria -> US)', state: 'TRAVEL_MODE', expectation: 'Emergency numbers switch dynamically; contacts retained in E.164.' },
                { id: 'TC-21', name: 'Shake-to-Trigger SOS (Lock Screen & Pocket Gesture)', state: 'SHAKE_GESTURE', expectation: '3D accelerometer shake initiates emergency sequence even while device is locked, providing a faster alternative to the 2s on-screen hold.' },
              ].map((test) => (
                <div
                  key={test.id}
                  className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-rose-400 font-bold">{test.id}</span>
                      <span className="font-semibold text-white">{test.name}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{test.expectation}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 text-emerald-400 rounded border border-emerald-950">
                      PASSED
                    </span>
                    {onRunTestScenario && (
                      <button
                        onClick={() => onRunTestScenario(test.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 text-rose-400" /> Run in App
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
