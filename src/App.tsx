import React, { useState, useEffect } from 'react';
import {
  CountrySafetyConfig,
  EmergencyIncident,
  LocationCoordinate,
  NetworkStatus,
  RecipientStatus,
  SafeJourney,
  TrustedContact,
} from './types/safety';
import {
  ALL_SUPPORTED_COUNTRIES,
  COUNTRIES_CONFIG_MAP,
  resolveCountrySafetyConfig,
  SWEDEN_CONFIG,
} from './config/countries';
import {
  detectCountryFromCoordinates,
  generateBatteryHistory,
  generateSecureToken,
  INITIAL_CONTACTS,
  generateInitialBreadcrumbs,
} from './services/emergencyEngine';
import { SosButton } from './components/SosButton';
import { ActiveEmergencyView } from './components/ActiveEmergencyView';
import { SafeJourneyView } from './components/SafeJourneyView';
import { ContactsManager } from './components/ContactsManager';
import { RecipientEmergencyModal } from './components/RecipientEmergencyModal';
import { ArchitectureConsole } from './components/ArchitectureConsole';
import { BatteryStatusBarWidget } from './components/BatteryStatusBarWidget';
import { PlayStoreComplianceModal } from './components/PlayStoreComplianceModal';
import { HapticPatternTesterModal } from './components/HapticPatternTesterModal';
import { SafetyInsightsView } from './components/SafetyInsightsView';
import { ShakeCountdownModal } from './components/ShakeCountdownModal';
import { LockScreenOverlay } from './components/LockScreenOverlay';
import { ShakeSettingsCard } from './components/ShakeSettingsCard';
import { networkRetryEngine, BackoffTelemetry } from './services/networkRetryEngine';
import { hapticFeedbackService } from './services/hapticFeedbackService';
import { shakeDetectionService } from './services/shakeDetectionService';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Vibrate,
  Footprints,
  Users,
  Settings,
  Globe,
  Wifi,
  WifiOff,
  VolumeX,
  Volume2,
  Compass,
  Plane,
  MapPin,
  RefreshCw,
  FileText,
  Trash2,
  Activity,
  ChevronRight,
  Smartphone,
  Lock,
  Zap,
} from 'lucide-react';

export default function App() {
  // App display mode: 'dual' (split side-by-side on wide screens), 'mobile' (phone view only), 'docs' (architecture console only)
  const [viewMode, setViewMode] = useState<'dual' | 'mobile' | 'docs'>('dual');

  // Home Country vs Current Safety Region (Travel Mode support)
  const [homeCountryCode, setHomeCountryCode] = useState<string>('SE');
  const [currentRegionCode, setCurrentRegionCode] = useState<string>('SE');
  const [isAutoDetectEnabled, setIsAutoDetectEnabled] = useState<boolean>(true);

  // Derived current country safety config
  const currentCountryConfig: CountrySafetyConfig = resolveCountrySafetyConfig(currentRegionCode);
  const homeCountryConfig: CountrySafetyConfig = resolveCountrySafetyConfig(homeCountryCode);
  const isTravelMode = homeCountryCode !== currentRegionCode;

  // Network State Simulator (ONLINE, LIMITED, OFFLINE, RECOVERING)
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('ONLINE');

  // Active Bottom Navigation Tab in Mobile View
  const [mobileTab, setMobileTab] = useState<'home' | 'contacts' | 'journey' | 'settings'>('home');

  // Covert / Stealth SOS mode toggle (Defaults to true for sender safety against hostile observers)
  const [isSilentMode, setIsSilentMode] = useState(true);

  // Selected Emergency Category Template
  const [selectedCategoryId, setSelectedCategoryId] = useState('danger');

  // Low-Data Mode Toggle
  const [lowDataEnabled, setLowDataEnabled] = useState(currentCountryConfig.lowDataDefault);

  // Contacts State
  const [contacts, setContacts] = useState<TrustedContact[]>(INITIAL_CONTACTS);

  // Active Emergency State
  const [activeIncident, setActiveIncident] = useState<EmergencyIncident | null>(null);

  // Real-Time Battery Monitor State (Simulated initial 24%, dynamically syncs with device if available)
  const [batteryLevel, setBatteryLevel] = useState<number>(24);
  const [isCharging, setIsCharging] = useState<boolean>(false);

  // Safe Journey State
  const [activeJourney, setActiveJourney] = useState<SafeJourney | null>(null);

  // Recipient Emergency Web View Simulation Modal
  const [showRecipientModal, setShowRecipientModal] = useState(false);

  // Play Store Compliance & Privacy Modal
  const [showComplianceModal, setShowComplianceModal] = useState(false);

  // Tactile Haptic Pattern Preview Modal
  const [showHapticModal, setShowHapticModal] = useState(false);

  // Settings sub-view state: 'settings' or 'insights'
  const [settingsSubView, setSettingsSubView] = useState<'settings' | 'insights'>('settings');

  // Phone Lock Screen Standby State (Shake detection remains fully active even when locked)
  const [isPhoneLocked, setIsPhoneLocked] = useState(false);

  // Shake SOS Countdown Modal State (Allows 3s grace cancellation or instant trigger)
  const [showShakeCountdown, setShowShakeCountdown] = useState(false);
  const [shakeIsSilent, setShakeIsSilent] = useState(false);

  // Travel Mode notification banner dismissal
  const [dismissTravelBanner, setDismissTravelBanner] = useState(false);

  // Backoff retry telemetry state
  const [backoffTelemetry, setBackoffTelemetry] = useState<BackoffTelemetry>(networkRetryEngine.getTelemetry());

  // Listen to network transitions and exponential backoff retry engine
  useEffect(() => {
    const handleOnline = () => {
      // Transition from offline to recovering with exponential backoff retry
      setNetworkStatus('RECOVERING');
      networkRetryEngine.startRecoveryBackoff();
    };

    const handleOffline = () => {
      setNetworkStatus('OFFLINE');
      networkRetryEngine.cancelBackoff();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = networkRetryEngine.subscribe((telemetry) => {
      setBackoffTelemetry(telemetry);
    });

    networkRetryEngine.setOnSyncSuccess(() => {
      setNetworkStatus('ONLINE');
      // Subtle micro-cadence confirming cloud transmission
      hapticFeedbackService.trigger('PACKET_DELIVERED');
      setActiveIncident((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isSyncedToCloud: true,
          status: 'DELIVERED',
          recipients: prev.recipients.map((r) => ({
            ...r,
            status: r.status === 'QUEUED' ? 'DELIVERED' : r.status,
            deliveredAt: r.deliveredAt || new Date().toISOString(),
          })),
        };
      });
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleForceRetry = () => {
    networkRetryEngine.forceImmediateRetry();
  };

  // Purge all ephemeral local emergency data & cached history (Google Play & GDPR Right to Erasure)
  const handlePurgeAllData = () => {
    setActiveIncident(null);
    setActiveJourney(null);
    networkRetryEngine.clearQueue();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.clear();
      } catch {}
    }
  };

  // Listen to browser Battery Status API if supported
  useEffect(() => {
    let batteryObj: any = null;
    const updateBattery = (b: any) => {
      setBatteryLevel(Math.round(b.level * 100));
      setIsCharging(b.charging);
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((b: any) => {
          batteryObj = b;
          updateBattery(b);
          b.addEventListener('levelchange', () => updateBattery(b));
          b.addEventListener('chargingchange', () => updateBattery(b));
        })
        .catch(() => {});
    }

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', () => updateBattery(batteryObj));
        batteryObj.removeEventListener('chargingchange', () => updateBattery(batteryObj));
      }
    };
  }, []);

  // AUTOMATIC LOW BATTERY TRIGGER (<15%) DURING ACTIVE EMERGENCY
  useEffect(() => {
    if (!activeIncident || activeIncident.status === 'RESOLVED' || activeIncident.status === 'CANCELLED') {
      return;
    }

    // Sync battery level, charging state, and battery history with active incident
    if (activeIncident.batteryLevel !== batteryLevel || activeIncident.batteryCharging !== isCharging) {
      setActiveIncident((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          batteryLevel,
          batteryCharging: isCharging,
          batteryHistory: generateBatteryHistory(batteryLevel, prev.batteryHistory),
        };
      });
    }

    // Automatically trigger high-priority Low Battery Alert to trusted contacts if level drops below 15%
    if (batteryLevel < 15 && !activeIncident.isLowBatteryAlertSent) {
      const alertTimestamp = new Date().toISOString();

      // Distinct warning haptic cadence on device
      hapticFeedbackService.trigger('LOW_BATTERY_WARNING');

      setActiveIncident((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          batteryLevel,
          batteryCharging: isCharging,
          batteryHistory: generateBatteryHistory(batteryLevel, prev.batteryHistory),
          isLowBatteryAlertSent: true,
          lowBatteryAlertSentAt: alertTimestamp,
          recipients: prev.recipients.map((r) => ({
            ...r,
          })),
        };
      });
    }
  }, [batteryLevel, isCharging, activeIncident]);

  // Update Low-Data default and category when region changes
  useEffect(() => {
    setLowDataEnabled(currentCountryConfig.lowDataDefault);
    setDismissTravelBanner(false);
  }, [currentRegionCode]);

  // Geolocation acquisition helper based on country or browser coordinates
  const acquireLocation = (): LocationCoordinate => {
    let baseLat = 59.3293;
    let baseLon = 18.0686;

    if (currentRegionCode === 'SE') {
      baseLat = 59.3293; baseLon = 18.0686; // Stockholm
    } else if (currentRegionCode === 'NG') {
      baseLat = 6.5244; baseLon = 3.3792; // Lagos
    } else if (currentRegionCode === 'US') {
      baseLat = 40.7128; baseLon = -74.006; // New York
    } else if (currentRegionCode === 'GB') {
      baseLat = 51.5074; baseLon = -0.1278; // London
    } else if (currentRegionCode === 'JP') {
      baseLat = 35.6762; baseLon = 139.6503; // Tokyo
    } else if (currentRegionCode === 'DE') {
      baseLat = 52.52; baseLon = 13.405; // Berlin
    } else if (currentRegionCode === 'FR') {
      baseLat = 48.8566; baseLon = 2.3522; // Paris
    } else if (currentRegionCode === 'AU') {
      baseLat = -33.8688; baseLon = 151.2093; // Sydney
    } else if (currentRegionCode === 'ZA') {
      baseLat = -26.2041; baseLon = 28.0473; // Johannesburg
    } else if (currentRegionCode === 'BR') {
      baseLat = -23.5505; baseLon = -46.6333; // São Paulo
    } else if (currentRegionCode === 'IN') {
      baseLat = 19.076; baseLon = 72.8777; // Mumbai
    } else if (currentRegionCode === 'KE') {
      baseLat = -1.2921; baseLon = 36.8219; // Nairobi
    } else if (currentRegionCode === 'GH') {
      baseLat = 5.6037; baseLon = -0.187; // Accra
    } else if (currentRegionCode === 'AE') {
      baseLat = 25.2048; baseLon = 55.2708; // Dubai
    } else if (currentRegionCode === 'ES') {
      baseLat = 40.4168; baseLon = -3.7038; // Madrid
    }

    // Small jitter to simulate live tracking updates
    const jitterLat = (Math.random() - 0.5) * 0.0008;
    const jitterLon = (Math.random() - 0.5) * 0.0008;

    return {
      latitude: baseLat + jitterLat,
      longitude: baseLon + jitterLon,
      accuracyMeters: 11.2,
      timestamp: Date.now(),
      isLastKnown: false,
    };
  };

  // Auto-detect country simulation
  const handleAutoDetectLocation = () => {
    const loc = acquireLocation();
    const detected = detectCountryFromCoordinates(loc.latitude, loc.longitude);
    if (detected && detected !== currentRegionCode) {
      setCurrentRegionCode(detected);
    }
  };

  // SOS Trigger Execution — Strictly follows "SAVE FIRST, SEND SECOND"
  const handleTriggerSos = (silent: boolean = isSilentMode) => {
    const incidentId = 'inc_' + generateSecureToken().slice(0, 8);
    const accessToken = generateSecureToken();
    const loc = acquireLocation();

    const selectedCategory = currentCountryConfig.categories.find((c) => c.id === selectedCategoryId);

    // Initial recipient statuses
    const recipients: RecipientStatus[] = contacts.map((contact) => ({
      contactId: contact.id,
      name: contact.name,
      phone: contact.phone,
      channel: 'PUSH',
      status: networkStatus === 'OFFLINE' ? 'QUEUED' : 'DELIVERED',
      deliveredAt: networkStatus === 'OFFLINE' ? undefined : new Date().toISOString(),
    }));

    const isCritical = batteryLevel < 15;

    // 1. SAVE FIRST: Atomic local creation
    const newIncident: EmergencyIncident = {
      id: incidentId,
      userId: 'user_alex_prod_01',
      countryCode: currentCountryConfig.countryCode,
      emergencyType: selectedCategory ? selectedCategory.titleEn : 'Personal Danger',
      isSilent: silent,
      customMessage: selectedCategory ? selectedCategory.defaultMessage : '',
      batteryLevel,
      batteryCharging: isCharging,
      batteryHistory: generateBatteryHistory(batteryLevel),
      isLowBatteryAlertSent: isCritical,
      lowBatteryAlertSentAt: isCritical ? new Date().toISOString() : undefined,
      status: networkStatus === 'OFFLINE' ? 'ACTIVE' : 'DELIVERED',
      createdAt: new Date().toISOString(),
      location: loc,
      locationHistory: loc ? generateInitialBreadcrumbs(loc) : undefined,
      recipients,
      idempotencyKey: `${incidentId}:0:INITIAL_ALERT`,
      isSavedLocally: true,
      isSyncedToCloud: networkStatus !== 'OFFLINE',
      accessToken,
    };

    setActiveIncident(newIncident);
    networkRetryEngine.initializeEmergencyPackets(newIncident);
    if (networkStatus === 'RECOVERING') {
      networkRetryEngine.startRecoveryBackoff();
    }
  };

  // Shake-to-Trigger SOS listener — initiates emergency sequence even when device is locked
  useEffect(() => {
    shakeDetectionService.start();
    const unsubscribe = shakeDetectionService.subscribeShake((silent) => {
      // Avoid re-triggering if incident is already active and in progress
      setActiveIncident((current) => {
        if (current && current.status !== 'RESOLVED' && current.status !== 'CANCELLED') {
          return current;
        }

        const settings = shakeDetectionService.getSettings();
        setShakeIsSilent(silent);

        if (settings.countdownGraceSeconds > 0) {
          setShowShakeCountdown(true);
        } else {
          setIsPhoneLocked(false);
          handleTriggerSos(silent);
        }

        return current;
      });
    });

    return () => {
      unsubscribe();
      shakeDetectionService.stop();
    };
  }, [contacts, currentCountryConfig, selectedCategoryId, batteryLevel, isCharging, networkStatus, isSilentMode]);

  const handleConfirmShakeSos = () => {
    setShowShakeCountdown(false);
    setIsPhoneLocked(false);
    handleTriggerSos(shakeIsSilent);
  };

  const handleCancelShakeSos = () => {
    setShowShakeCountdown(false);
  };

  // Resolve Emergency
  const handleResolveIncident = () => {
    if (!activeIncident) return;
    setActiveIncident(null);
    networkRetryEngine.clearQueue();
    // Ascending harmonic release cadence ("All Clear")
    hapticFeedbackService.trigger('INCIDENT_RESOLVED');
  };

  // Simulate Recipient Tapping "I'm Responding"
  const handleAcknowledge = (contactIdOrName: string) => {
    if (!activeIncident) return;

    // Distinctive gentle "Heartbeat" cadence (Lub-DUB) signalling responder is on their way
    hapticFeedbackService.trigger('RECIPIENT_ACKNOWLEDGED');

    setActiveIncident((prev) => {
      if (!prev) return null;
      const updatedRecipients = prev.recipients.map((r) => {
        if (r.contactId === contactIdOrName || r.name.toLowerCase().includes(contactIdOrName.toLowerCase())) {
          return {
            ...r,
            status: 'ACKNOWLEDGED' as const,
            acknowledgedAt: new Date().toISOString(),
          };
        }
        return r;
      });

      return {
        ...prev,
        status: 'ACKNOWLEDGED',
        recipients: updatedRecipients,
      };
    });
  };

  // Start Safe Journey
  const handleStartJourney = (destination: string, durationMinutes: number, contactIds: string[]) => {
    const journey: SafeJourney = {
      id: 'journey_' + Date.now(),
      destination,
      durationMinutes,
      startedAt: Date.now(),
      expiresAt: Date.now() + durationMinutes * 60 * 1000,
      contactIds,
      status: 'ACTIVE',
    };
    setActiveJourney(journey);
  };

  // Safe Journey confirmed safe
  const handleConfirmSafeJourney = () => {
    setActiveJourney(null);
  };

  // Safe Journey cancelled
  const handleCancelJourney = () => {
    setActiveJourney(null);
  };

  // Contacts management
  const handleAddContact = (contact: Omit<TrustedContact, 'id'>) => {
    const newContact: TrustedContact = {
      ...contact,
      id: 'contact_' + Date.now(),
    };
    setContacts((prev) => [...prev, newContact]);
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  // Network State Toggle Helper (Cycle through states)
  const cycleNetworkStatus = () => {
    const order: NetworkStatus[] = ['ONLINE', 'LIMITED', 'OFFLINE', 'RECOVERING'];
    const next = order[(order.indexOf(networkStatus) + 1) % order.length];
    setNetworkStatus(next);

    // If transitioning from OFFLINE to RECOVERING, initiate exponential backoff retry loop
    if (next === 'RECOVERING') {
      networkRetryEngine.startRecoveryBackoff();
    } else if (next === 'ONLINE') {
      networkRetryEngine.forceImmediateRetry();
    } else if (next === 'OFFLINE') {
      networkRetryEngine.cancelBackoff();
    }
  };

  // Interactive Test Scenario Runner
  const handleRunTestScenario = (scenarioId: string) => {
    if (scenarioId === 'TC-01') {
      setNetworkStatus('ONLINE');
      handleTriggerSos(false);
    } else if (scenarioId === 'TC-02') {
      setNetworkStatus('OFFLINE');
      handleTriggerSos(false);
    } else if (scenarioId === 'TC-05') {
      if (!activeIncident) handleTriggerSos(false);
      setNetworkStatus('OFFLINE');
      networkRetryEngine.cancelBackoff();
    } else if (scenarioId === 'TC-06') {
      if (!activeIncident) handleTriggerSos(false);
      setNetworkStatus('RECOVERING');
      networkRetryEngine.startRecoveryBackoff();
    } else if (scenarioId === 'TC-07') {
      if (!activeIncident) handleTriggerSos(false);
      setTimeout(() => {
        if (contacts[0]) handleAcknowledge(contacts[0].id);
      }, 400);
    } else if (scenarioId === 'TC-10') {
      handleStartJourney('Transit Corridor', 0.1, [contacts[0]?.id || 'contact_1']);
      setMobileTab('journey');
    } else if (scenarioId === 'TC-13') {
      setCurrentRegionCode('NG');
      setLowDataEnabled(true);
    } else if (scenarioId === 'TC-14') {
      setCurrentRegionCode('NG');
      if (!activeIncident) handleTriggerSos(false);
    } else if (scenarioId === 'TC-18') {
      // Test battery drop below 15% during active emergency
      if (!activeIncident) handleTriggerSos(false);
      setTimeout(() => {
        setBatteryLevel(14);
        setIsCharging(false);
      }, 400);
    } else if (scenarioId === 'TC-19') {
      // Test battery projection (<5% in 20 minutes, e.g. 9%)
      if (!activeIncident) handleTriggerSos(false);
      setTimeout(() => {
        setBatteryLevel(9);
        setIsCharging(false);
      }, 400);
    } else if (scenarioId === 'TC-20') {
      // Cross-border travel test
      setHomeCountryCode('SE');
      setCurrentRegionCode('NG');
    } else if (scenarioId === 'TC-21') {
      // Test Shake-to-trigger SOS while phone is locked
      setIsPhoneLocked(true);
      setTimeout(() => {
        shakeDetectionService.simulateShake();
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500/30">
      {/* Top Global Bar (Environment Controls & View Mode Toggles) */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
            <span className="font-extrabold text-sm tracking-tight text-white uppercase">SafeSignal</span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">· Global Safety Architecture</span>
        </div>

        {/* Global Controls: Region Selector, Auto-Detect, and Network Simulator */}
        <div className="flex items-center gap-2">
          {/* Current Region Selector (All Continents) */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
            <Globe className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="text-[11px] text-slate-400 hidden md:inline">Region:</span>
            <select
              value={currentRegionCode}
              onChange={(e) => setCurrentRegionCode(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer max-w-[150px] sm:max-w-none"
            >
              <optgroup label="Primary Launch Markets">
                <option value="SE" className="bg-slate-900">🇸🇪 Sweden (+46 · 112)</option>
                <option value="NG" className="bg-slate-900">🇳🇬 Nigeria (+234 · 112/199)</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="GB" className="bg-slate-900">🇬🇧 United Kingdom (+44 · 999/112)</option>
                <option value="DE" className="bg-slate-900">🇩🇪 Germany (+49 · 112/110)</option>
                <option value="FR" className="bg-slate-900">🇫🇷 France (+33 · 112/15/17)</option>
                <option value="ES" className="bg-slate-900">🇪🇸 Spain (+34 · 112)</option>
              </optgroup>
              <optgroup label="North America">
                <option value="US" className="bg-slate-900">🇺🇸 United States (+1 · 911)</option>
                <option value="CA" className="bg-slate-900">🇨🇦 Canada (+1 · 911)</option>
              </optgroup>
              <optgroup label="Africa">
                <option value="ZA" className="bg-slate-900">🇿🇦 South Africa (+27 · 10111/112)</option>
                <option value="KE" className="bg-slate-900">🇰🇪 Kenya (+254 · 999/112)</option>
                <option value="GH" className="bg-slate-900">🇬🇭 Ghana (+233 · 112/191)</option>
              </optgroup>
              <optgroup label="Asia & Middle East">
                <option value="JP" className="bg-slate-900">🇯🇵 Japan (+81 · 110/119)</option>
                <option value="IN" className="bg-slate-900">🇮🇳 India (+91 · 112)</option>
                <option value="AE" className="bg-slate-900">🇦🇪 United Arab Emirates (+971 · 999)</option>
              </optgroup>
              <optgroup label="Oceania & South America">
                <option value="AU" className="bg-slate-900">🇦🇺 Australia (+61 · 000/112)</option>
                <option value="BR" className="bg-slate-900">🇧🇷 Brazil (+55 · 190/192)</option>
              </optgroup>
              <optgroup label="Universal">
                <option value="GLOBAL" className="bg-slate-900">🌐 Universal Global Fallback</option>
              </optgroup>
            </select>
          </div>

          {/* Network Simulator Button */}
          <button
            onClick={cycleNetworkStatus}
            title="Click to cycle network state (Online -> Limited -> Offline -> Recovering)"
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              networkStatus === 'ONLINE'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : networkStatus === 'OFFLINE'
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-amber-950/60 border-amber-800 text-amber-300'
            }`}
          >
            {networkStatus === 'OFFLINE' ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span className="tabular-nums font-mono">{networkStatus}</span>
          </button>

          {/* Shake SOS Simulator Button */}
          <button
            onClick={() => shakeDetectionService.simulateShake()}
            title="Simulate accelerometer shake gesture (triggers emergency sequence)"
            className="px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-rose-300 transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="hidden sm:inline">Shake SOS</span>
          </button>

          {/* Lock Phone Standby Button */}
          <button
            onClick={() => setIsPhoneLocked(!isPhoneLocked)}
            title={isPhoneLocked ? 'Unlock phone screen' : 'Lock phone screen (Test shake-to-trigger while locked)'}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              isPhoneLocked
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isPhoneLocked ? 'Locked' : 'Lock Phone'}</span>
          </button>

          {/* Play Store Compliance & Privacy Button */}
          <button
            onClick={() => setShowComplianceModal(true)}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Google Play Store Compliance, Privacy Policy & Disclosures"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Play Store &amp; Privacy</span>
          </button>

          {/* View Mode Toggle */}
          <div className="hidden md:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('dual')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'dual' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dual View
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mobile App
            </button>
            <button
              onClick={() => setViewMode('docs')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'docs' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Global PRD & Pillars
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile View Container (Renders when viewMode is 'mobile' or 'dual') */}
        {(viewMode === 'mobile' || viewMode === 'dual') && (
          <div
            className={`flex flex-col items-center justify-center p-3 sm:p-6 bg-slate-950 border-r border-slate-800 overflow-y-auto ${
              viewMode === 'dual' ? 'w-full lg:w-[460px] shrink-0' : 'w-full'
            }`}
          >
            {/* Phone Bezel / Canvas */}
            <div className="w-full max-w-sm sm:max-w-[410px] h-full sm:h-[820px] bg-slate-950 rounded-2xl sm:rounded-[44px] border border-slate-800/80 sm:border-[5px] sm:border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
              {/* Phone Status Bar (Dynamic Island & Carrier) */}
              <div className="h-10 bg-slate-950 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-400 shrink-0 select-none z-20">
                <span className="font-mono">09:41</span>
                {/* Dynamic island pill */}
                <div className="w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span>{currentCountryConfig.flagEmoji} {currentCountryConfig.countryCode}</span>
                  {networkStatus === 'OFFLINE' ? (
                    <WifiOff className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Wifi className="w-3 h-3 text-emerald-400" />
                  )}
                  <BatteryStatusBarWidget
                    batteryLevel={batteryLevel}
                    isCharging={isCharging}
                    isEmergencyActive={!!activeIncident}
                    isLowBatteryAlertSent={activeIncident?.isLowBatteryAlertSent}
                    onUpdateBattery={(level, charging) => {
                      setBatteryLevel(level);
                      setIsCharging(charging);
                    }}
                  />
                </div>
              </div>

              {/* Mobile App Header (Top bar contract) */}
              <div className="h-12 bg-slate-950 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-500" />
                  <span className="text-sm font-bold text-white tracking-tight">SafeSignal</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded">
                    {currentCountryConfig.countryCode}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Silent SOS quick toggle */}
                  <button
                    onClick={() => setIsSilentMode(!isSilentMode)}
                    title="Toggle Silent SOS (Discreet haptic, dimmed UI)"
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isSilentMode
                        ? 'bg-slate-800 border-slate-600 text-slate-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSilentMode ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  {/* Lock Screen Standby Button */}
                  <button
                    type="button"
                    onClick={() => setIsPhoneLocked(true)}
                    title="Lock phone screen (Shake-to-trigger remains armed while locked)"
                    className="p-1.5 rounded-lg border bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Travel Mode Banner (Directive Section 6 & 7: Home Country vs Current Safety Region) */}
              {isTravelMode && !dismissTravelBanner && !activeIncident && (
                <div className="p-2.5 bg-sky-950/80 border-b border-sky-800 text-xs text-sky-200 flex items-center justify-between z-10 animate-fadeIn">
                  <div className="flex items-center gap-2 truncate pr-1">
                    <Plane className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="truncate">
                      <strong>Travel Mode:</strong> Home ({homeCountryConfig.countryCode} {homeCountryConfig.flagEmoji}) &rarr; Current ({currentCountryConfig.countryCode} {currentCountryConfig.flagEmoji})
                    </span>
                  </div>
                  <button
                    onClick={() => setDismissTravelBanner(true)}
                    className="text-[10px] text-sky-400 hover:text-sky-200 shrink-0 font-semibold underline ml-1"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Screen Body */}
              <div className="flex-1 overflow-y-auto flex flex-col bg-slate-950">
                {activeIncident ? (
                  /* Active Emergency Screen */
                  <ActiveEmergencyView
                    incident={activeIncident}
                    countryConfig={currentCountryConfig}
                    networkStatus={networkStatus}
                    backoffTelemetry={backoffTelemetry}
                    onResolve={handleResolveIncident}
                    onSimulateAcknowledgement={handleAcknowledge}
                    onOpenRecipientView={() => setShowRecipientModal(true)}
                    onRetrySync={() => cycleNetworkStatus()}
                    onForceRetry={handleForceRetry}
                    onUpdateLocation={(newLoc) => {
                      setActiveIncident((prev) => {
                        if (!prev) return null;
                        const prevHistory = prev.locationHistory || (prev.location ? [prev.location] : []);
                        // Append new location and preserve the last 5 updates
                        const updatedHistory = [...prevHistory, newLoc].slice(-5);
                        return {
                          ...prev,
                          location: newLoc,
                          locationHistory: updatedHistory,
                        };
                      });
                    }}
                  />
                ) : (
                  /* Normal Tab Navigation Views */
                  <>
                    {mobileTab === 'home' && (
                      <div className="flex-1 flex flex-col justify-between p-4 space-y-4">
                        {/* Status Card with Region & Emergency Number */}
                        <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  networkStatus === 'OFFLINE' ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                              />
                              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                                {networkStatus === 'OFFLINE' ? 'Offline Guard Active' : 'Protection Ready'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {contacts.length} trusted contact{contacts.length !== 1 ? 's' : ''} configured
                            </div>
                          </div>

                          <div className="text-right text-[11px] font-mono text-slate-400">
                            <div className="font-bold text-rose-400">
                              {currentCountryConfig.emergencyNumbers[0]?.number}
                            </div>
                            <div className="text-[9px] text-slate-500 uppercase">{currentCountryConfig.countryName}</div>
                          </div>
                        </div>

                        {/* Category Selector */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-400 uppercase tracking-wider">
                              SOS Category
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {currentCountryConfig.flagEmoji} {currentCountryConfig.countryName}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {currentCountryConfig.categories.slice(0, 4).map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`p-2 rounded-xl text-left border text-xs transition-colors truncate ${
                                  selectedCategoryId === cat.id
                                    ? 'bg-rose-950/40 border-rose-800 text-white font-semibold'
                                    : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                {cat.titleEn}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Central SOS Button: 2-Second Hold */}
                        <div className="flex-1 flex items-center justify-center">
                          <SosButton
                            onTrigger={() => handleTriggerSos(isSilentMode)}
                            isSilent={isSilentMode}
                          />
                        </div>

                        {/* Shake-to-Trigger Faster Alternative Indicator */}
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-400">
                              <Smartphone className="w-3.5 h-3.5 animate-pulse" />
                            </div>
                            <div>
                              <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                                <span>Shake to SOS Active</span>
                                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-800/40">
                                  Works Locked
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">Faster distress alternative to 2s hold</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => shakeDetectionService.simulateShake()}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-rose-300 rounded-lg text-[10px] font-semibold border border-slate-700 cursor-pointer transition-colors"
                              title="Simulate accelerometer shake gesture"
                            >
                              Test Shake
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsPhoneLocked(true)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-amber-300 rounded-lg text-[10px] font-semibold border border-slate-700 cursor-pointer flex items-center gap-1 transition-colors"
                              title="Lock phone screen to test lock-screen gesture"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>Lock</span>
                            </button>
                          </div>
                        </div>

                        {/* Quick Safe Journey shortcut */}
                        <button
                          onClick={() => setMobileTab('journey')}
                          className="w-full p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-200 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Footprints className="w-4 h-4 text-sky-400" />
                            <span className="font-semibold">Start Safe Journey</span>
                          </div>
                          <span className="text-slate-500 text-[11px]">Set arrival timer &rarr;</span>
                        </button>
                      </div>
                    )}

                    {mobileTab === 'contacts' && (
                      <ContactsManager
                        contacts={contacts}
                        onAddContact={handleAddContact}
                        onDeleteContact={handleDeleteContact}
                        defaultCallingCode={currentCountryConfig.callingCode}
                      />
                    )}

                    {mobileTab === 'journey' && (
                      <SafeJourneyView
                        contacts={contacts}
                        activeJourney={activeJourney}
                        onStartJourney={handleStartJourney}
                        onConfirmSafe={handleConfirmSafeJourney}
                        onCancelJourney={handleCancelJourney}
                      />
                    )}

                    {mobileTab === 'settings' && (
                      <div className="p-4 space-y-4 text-xs">
                        {/* Sub-View Switcher Pill Bar */}
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setSettingsSubView('settings')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              settingsSubView === 'settings'
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Preferences &amp; Region</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSettingsSubView('insights')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              settingsSubView === 'insights'
                                ? 'bg-rose-600 text-white shadow-sm shadow-rose-950/50'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span>Safety Insights</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          </button>
                        </div>

                        {settingsSubView === 'insights' ? (
                          <SafetyInsightsView onBack={() => setSettingsSubView('settings')} />
                        ) : (
                          <>
                            <div className="space-y-1">
                              <h2 className="text-base font-bold text-white">Global Safety Settings</h2>
                              <p className="text-slate-400 text-xs">Country configuration, travel mode &amp; privacy</p>
                            </div>

                            {/* Safety Insights Fast Launch Card */}
                            <div
                              onClick={() => setSettingsSubView('insights')}
                              className="p-3.5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 rounded-2xl border border-rose-500/40 hover:border-rose-400/80 transition-all cursor-pointer shadow-lg space-y-2 group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-400">
                                    <Activity className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      <span>Safety Insights &amp; Analytics</span>
                                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30 font-mono">
                                        Recharts
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                      Emergency frequency, responder velocity &amp; battery drain
                                    </p>
                                  </div>
                                </div>
                                <div className="p-1.5 bg-slate-800 rounded-lg text-slate-300 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono text-[10px]">
                                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
                                  <div className="text-slate-400 text-[9px]">TOTAL SOS</div>
                                  <div className="font-bold text-white text-xs">12 Events</div>
                                </div>
                                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
                                  <div className="text-slate-400 text-[9px]">AVG RESPONSE</div>
                                  <div className="font-bold text-amber-300 text-xs">88s</div>
                                </div>
                                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
                                  <div className="text-slate-400 text-[9px]">BATTERY AT TRIG</div>
                                  <div className="font-bold text-emerald-400 text-xs">52%</div>
                                </div>
                              </div>
                            </div>

                            {/* Home Country Selector */}
                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                              <label className="font-semibold text-slate-300 block">Home Country (Primary Residence)</label>
                              <select
                                value={homeCountryCode}
                                onChange={(e) => setHomeCountryCode(e.target.value)}
                                className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white"
                              >
                                {ALL_SUPPORTED_COUNTRIES.map((c) => (
                                  <option key={c.countryCode} value={c.countryCode}>
                                    {c.flagEmoji} {c.countryName} ({c.callingCode})
                                  </option>
                                ))}
                              </select>
                              <p className="text-[10px] text-slate-500">
                                Your home base determines default contact dialing formats and domestic legal residency.
                              </p>
                            </div>

                            {/* Current Safety Region */}
                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="font-semibold text-slate-300 block">Current Safety Region</label>
                                <button
                                  onClick={handleAutoDetectLocation}
                                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                                >
                                  <MapPin className="w-3 h-3" /> Auto-Detect GPS
                                </button>
                              </div>
                              <select
                                value={currentRegionCode}
                                onChange={(e) => setCurrentRegionCode(e.target.value)}
                                className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white"
                              >
                                {ALL_SUPPORTED_COUNTRIES.map((c) => (
                                  <option key={c.countryCode} value={c.countryCode}>
                                    {c.flagEmoji} {c.countryName} · Local Emergency: {c.emergencyNumbers[0]?.number}
                                  </option>
                                ))}
                              </select>
                              <p className="text-[11px] text-slate-400">
                                SafeSignal adapts emergency dispatch numbers ({currentCountryConfig.emergencyNumbers.map((n) => n.number).join(', ')}) and privacy regulations ({currentCountryConfig.privacyRegion}) to your current physical region.
                              </p>
                            </div>

                            {/* Low Data Mode Toggle */}
                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-slate-300">Low-Data Optimization</div>
                                <div className="text-[11px] text-slate-400">Compress payloads to &lt;180 bytes</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={lowDataEnabled}
                                onChange={(e) => setLowDataEnabled(e.target.checked)}
                                className="w-4 h-4 accent-rose-500 rounded"
                              />
                            </div>

                            {/* Shake-to-Trigger SOS (Pocket & Lock Screen Gesture) */}
                            <ShakeSettingsCard
                              onLockScreen={() => setIsPhoneLocked(true)}
                              onSimulateShake={() => shakeDetectionService.simulateShake()}
                            />

                            {/* Tactile Haptic Profiles (Eyes-Free Recognition) */}
                            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                  <Vibrate className="w-4 h-4 text-rose-400" />
                                  <span>Tactile Haptic Profiles</span>
                                </div>
                                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">
                                  Eyes-Free
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Distinct vibration cadences are configured for emergency triggers (prolonged heavy shockwaves) versus acknowledgments (gentle heartbeats) so you can distinguish states by touch alone.
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowHapticModal(true)}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                              >
                                <Vibrate className="w-3.5 h-3.5 text-rose-400" />
                                <span>Preview &amp; Feel Haptic Profiles</span>
                              </button>
                            </div>

                            {/* Play Store Compliance, Privacy & Data Deletion */}
                            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-slate-200">Play Store &amp; Privacy Policy</div>
                                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                  Compliant
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                {currentCountryConfig.legalNotice} SafeSignal strictly complies with Google Play Location Disclosures, zero-sale of personal data, and 48-hour ephemeral coordinate purge.
                              </p>
                              <div className="flex flex-col gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setShowComplianceModal(true)}
                                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                                >
                                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                                  <span>View Privacy Policy &amp; Disclosures</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handlePurgeAllData();
                                    setShowComplianceModal(true);
                                  }}
                                  className="text-rose-400 hover:text-rose-300 font-semibold text-xs text-left cursor-pointer flex items-center gap-1 pt-0.5"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Purge Stored Emergency Cache (Right to Erasure)</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Bottom Tab Bar (Navigation Anchor with touch hitboxes >= 44px) */}
              <nav className="h-16 bg-slate-950 border-t border-slate-800/80 grid grid-cols-4 items-center shrink-0 z-20">
                <button
                  type="button"
                  onClick={() => setMobileTab('home')}
                  className={`h-full flex flex-col items-center justify-center transition-colors min-w-[44px] ${
                    mobileTab === 'home' && !activeIncident ? 'text-rose-500' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span className="text-[10px] font-medium tracking-tight mt-1">SOS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab('journey')}
                  className={`h-full flex flex-col items-center justify-center transition-colors min-w-[44px] ${
                    mobileTab === 'journey' && !activeIncident ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Footprints className="w-5 h-5" />
                  <span className="text-[10px] font-medium tracking-tight mt-1">Journey</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab('contacts')}
                  className={`h-full flex flex-col items-center justify-center transition-colors min-w-[44px] ${
                    mobileTab === 'contacts' && !activeIncident ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-[10px] font-medium tracking-tight mt-1">Contacts</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab('settings')}
                  className={`h-full flex flex-col items-center justify-center transition-colors min-w-[44px] ${
                    mobileTab === 'settings' && !activeIncident ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-[10px] font-medium tracking-tight mt-1">Settings</span>
                </button>
              </nav>

              {/* Simulated Phone Lock Screen Overlay (Remains alert for shake gestures while locked) */}
              <LockScreenOverlay
                isLocked={isPhoneLocked}
                onUnlock={() => setIsPhoneLocked(false)}
                onTriggerSos={(silent) => {
                  setIsPhoneLocked(false);
                  handleTriggerSos(silent);
                }}
                batteryLevel={batteryLevel}
              />

              {/* Shake-to-SOS Countdown Modal */}
              <ShakeCountdownModal
                isOpen={showShakeCountdown}
                isSilent={shakeIsSilent}
                totalSeconds={shakeDetectionService.getSettings().countdownGraceSeconds || 3}
                onConfirm={handleConfirmShakeSos}
                onCancel={handleCancelShakeSos}
              />
            </div>
          </div>
        )}

        {/* Master Directive Architecture Console (Renders when viewMode is 'docs' or 'dual') */}
        {(viewMode === 'docs' || viewMode === 'dual') && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            <ArchitectureConsole onRunTestScenario={handleRunTestScenario} />
          </div>
        )}
      </div>

      {/* Recipient Emergency Web View Simulation Modal */}
      {showRecipientModal && activeIncident && (
        <RecipientEmergencyModal
          incident={activeIncident}
          onClose={() => setShowRecipientModal(false)}
          onAcknowledge={(responder) => {
            handleAcknowledge(responder);
          }}
        />
      )}

      {/* Google Play Store Compliance, Privacy & Data Deletion Modal */}
      <PlayStoreComplianceModal
        isOpen={showComplianceModal}
        onClose={() => setShowComplianceModal(false)}
        onPurgeAllData={handlePurgeAllData}
      />

      {/* Tactile Haptic Pattern Tester & Sensory Differentiation Modal */}
      <HapticPatternTesterModal
        isOpen={showHapticModal}
        onClose={() => setShowHapticModal(false)}
      />
    </div>
  );
}
