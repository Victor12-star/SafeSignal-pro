import {
  EmergencyIncident,
  EmergencyState,
  LocationCoordinate,
  NetworkStatus,
  RecipientStatus,
  TrustedContact,
} from '../types/safety';

// Generate cryptographic random token for recipient web access
export function generateSecureToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Format normalized international phone numbers according to E.164 standard
export function normalizePhoneNumber(rawNumber: string, defaultCallingCode: string): string {
  const cleaned = rawNumber.trim();
  const digits = cleaned.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    return digits;
  }
  if (digits.startsWith('00')) {
    return `+${digits.slice(2)}`;
  }
  if (digits.startsWith('0')) {
    return `${defaultCallingCode}${digits.slice(1)}`;
  }
  return `${defaultCallingCode}${digits}`;
}

// Calculate payload size in bytes for Low-Data mode audit
export function calculatePayloadBytes(data: unknown): number {
  return new Blob([JSON.stringify(data)]).size;
}

// Global default contacts showing international trusted network
export const INITIAL_CONTACTS: TrustedContact[] = [
  {
    id: 'contact_1',
    name: 'Astrid Lind',
    phone: '+46701234567',
    relationship: 'Partner',
    group: 'Primary',
    isActive: true,
  },
  {
    id: 'contact_2',
    name: 'Chidi Okafor',
    phone: '+2348039876543',
    relationship: 'Family',
    group: 'Primary',
    isActive: true,
  },
  {
    id: 'contact_3',
    name: 'Elena Rostova',
    phone: '+447911123456',
    relationship: 'Friend',
    group: 'Primary',
    isActive: true,
  },
  {
    id: 'contact_4',
    name: 'Marcus Vance',
    phone: '+14155552671',
    relationship: 'Work',
    group: 'Secondary',
    isActive: true,
  },
  {
    id: 'contact_5',
    name: 'Dr. Kenji Sato',
    phone: '+819012345678',
    relationship: 'Medical',
    group: 'Secondary',
    isActive: true,
  },
];

// Offline Queue item model
export interface QueuedIncidentUpdate {
  id: string;
  incidentId: string;
  sequence: number;
  type: 'INCIDENT_CREATE' | 'LOCATION_UPDATE' | 'STATUS_CHANGE';
  payload: Record<string, unknown>;
  queuedAt: number;
  retryCount: number;
}

// Approximate Country Boundary Resolver from Geolocation
export function detectCountryFromCoordinates(lat: number, lng: number): string {
  // Sweden (roughly lat 55-69, lng 11-24)
  if (lat >= 55.0 && lat <= 69.5 && lng >= 11.0 && lng <= 24.5) return 'SE';
  // Nigeria (roughly lat 4-14, lng 2.5-15)
  if (lat >= 4.0 && lat <= 14.0 && lng >= 2.5 && lng <= 15.0) return 'NG';
  // United Kingdom (lat 49.5-61, lng -8 to 2)
  if (lat >= 49.5 && lat <= 61.0 && lng >= -8.5 && lng <= 2.0) return 'GB';
  // United States (contiguous approx lat 24-50, lng -125 to -66)
  if (lat >= 24.0 && lat <= 50.0 && lng >= -125.0 && lng <= -66.0) return 'US';
  // Germany (lat 47-55, lng 5.8-15.2)
  if (lat >= 47.0 && lat <= 55.5 && lng >= 5.8 && lng <= 15.2) return 'DE';
  // France (lat 42-51, lng -5 to 8.5)
  if (lat >= 42.0 && lat <= 51.2 && lng >= -5.2 && lng <= 8.5) return 'FR';
  // Spain (lat 35.5-44, lng -9.5 to 3.5)
  if (lat >= 35.5 && lat <= 44.0 && lng >= -9.5 && lng <= 3.5) return 'ES';
  // Japan (lat 30-46, lng 128-146)
  if (lat >= 30.0 && lat <= 46.0 && lng >= 128.0 && lng <= 146.0) return 'JP';
  // Australia (lat -44 to -10, lng 112 to 154)
  if (lat >= -44.0 && lat <= -10.0 && lng >= 112.0 && lng <= 154.0) return 'AU';
  // South Africa (lat -35 to -22, lng 16 to 33)
  if (lat >= -35.0 && lat <= -22.0 && lng >= 16.0 && lng <= 33.0) return 'ZA';
  // Brazil (lat -34 to 5, lng -74 to -34)
  if (lat >= -34.0 && lat <= 5.5 && lng >= -74.0 && lng <= -34.0) return 'BR';
  // India (lat 8 to 36, lng 68 to 97)
  if (lat >= 8.0 && lat <= 36.0 && lng >= 68.0 && lng <= 97.5) return 'IN';
  // UAE (lat 22.5 to 26.5, lng 51 to 56.5)
  if (lat >= 22.5 && lat <= 26.5 && lng >= 51.0 && lng <= 56.5) return 'AE';

  return 'GLOBAL';
}

export const CRITICAL_BATTERY_THRESHOLD = 15;

export function isBatteryCritical(batteryLevel: number): boolean {
  return batteryLevel <= CRITICAL_BATTERY_THRESHOLD;
}

export function createLowBatteryAlertMessage(
  batteryLevel: number,
  senderName: string,
  loc?: LocationCoordinate
): string {
  const coordsStr = loc ? `https://maps.google.com/?q=${loc.latitude.toFixed(5)},${loc.longitude.toFixed(5)}` : 'Location unavailable';
  return `[SafeSignal Alert] Low Battery Warning: ${senderName}'s device is at ${batteryLevel}% battery (critical) during active emergency. Phone may shut down soon. Last recorded location: ${coordsStr}`;
}

// Generate realistic or interpolated battery history for the past 60 minutes
export function generateBatteryHistory(
  currentBattery: number,
  existingHistory?: import('../types/safety').BatteryHistoryPoint[]
): import('../types/safety').BatteryHistoryPoint[] {
  if (existingHistory && existingHistory.length >= 5) {
    // Append or update the latest point
    const updated = [...existingHistory];
    const now = Date.now();
    const lastPoint = updated[updated.length - 1];
    if (now - lastPoint.timestamp < 30000) {
      updated[updated.length - 1] = {
        timestamp: now,
        batteryLevel: currentBattery,
        timeLabel: 'Now',
        isCritical: isBatteryCritical(currentBattery),
      };
      return updated;
    }
  }

  // Derive historical drop over 60 minutes (typical high-drain emergency GPS usage: ~12-18% per hour)
  const now = Date.now();
  const drainPerHour = Math.max(10, Math.min(22, 16)); // ~16% per hour during live GPS & cellular transmission
  const stepMinutes = [60, 45, 30, 15, 0];

  return stepMinutes.map((minsAgo) => {
    const fraction = minsAgo / 60;
    // Calculate past battery level (capped at 100)
    const level = Math.min(100, Math.round(currentBattery + drainPerHour * fraction));
    const label = minsAgo === 0 ? 'Now' : `-${minsAgo}m`;
    return {
      timestamp: now - minsAgo * 60 * 1000,
      batteryLevel: level,
      timeLabel: label,
      isCritical: isBatteryCritical(level),
    };
  });
}

// Estimate minutes of battery life remaining based on current level and high-drain emergency tracking profile
export function estimateRemainingMinutes(batteryLevel: number, isCharging = false): number {
  if (isCharging) return 999;
  // Emergency GPS + high accuracy cellular telemetry consumes ~0.25% - 0.35% per minute (~15-20% / hour)
  const drainRatePerMinute = 0.28;
  return Math.max(1, Math.round(batteryLevel / drainRatePerMinute));
}

export const SHUTDOWN_BATTERY_THRESHOLD = 5;

// Check if projection shows battery will drop below 5% within the next 20 minutes
export function willBatteryDropBelow5In20Mins(batteryLevel: number, isCharging = false): boolean {
  if (isCharging) return false;
  // If already at or below 5%, immediately true
  if (batteryLevel <= SHUTDOWN_BATTERY_THRESHOLD) return true;
  // Drain rate is ~0.28% per min (16.8% / hour under continuous GPS lock & data transmission)
  // In 20 minutes, battery will drop by: 20 * 0.28 = 5.6%
  const projectedLevelIn20Mins = batteryLevel - (20 * 0.28);
  return projectedLevelIn20Mins < SHUTDOWN_BATTERY_THRESHOLD;
}

// Calculate estimated minutes remaining until battery drops below 5%
export function getMinutesUntilDropBelow5(batteryLevel: number, isCharging = false): number {
  if (isCharging) return 999;
  if (batteryLevel <= SHUTDOWN_BATTERY_THRESHOLD) return 0;
  const drainRatePerMinute = 0.28;
  return Math.max(1, Math.round((batteryLevel - SHUTDOWN_BATTERY_THRESHOLD) / drainRatePerMinute));
}

// Generate Direct SMS text message for native device SMS dispatch (ZERO APP REQUIRED for recipients)
export function formatDirectEmergencySms({
  senderName = 'Alex',
  countryName = 'Sweden',
  location,
  batteryLevel = 84,
  accessToken = '',
  isSilent = false,
}: {
  senderName?: string;
  countryName?: string;
  location?: LocationCoordinate;
  batteryLevel?: number;
  accessToken?: string;
  isSilent?: boolean;
}): string {
  const coordsStr = location
    ? `${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`
    : 'Unknown';
  const mapsLink = location
    ? `https://maps.google.com/?q=${coordsStr}`
    : 'GPS unavailable';
  const webLink = accessToken
    ? `https://safesignal.app/e/${accessToken}`
    : 'https://safesignal.app';

  return `🚨 [EMERGENCY ALARM] ${senderName} needs immediate assistance (${countryName})!
🔊 SOUND SIREN ALARM & TRACK LIVE:
${webLink}
(Opening this link rings a loud emergency siren on your phone & pulses vibration so you hear it across the room)

📍 Current GPS: ${mapsLink} (±${location?.accuracyMeters.toFixed(0) || 15}m)
🔋 Sender Battery: ${batteryLevel}%
⚠️ Responders: Tap link immediately to sound your phone alarm, view live breadcrumb trail & call dispatch. No app required.`;
}

// Build native SMS URI for single or multiple recipient phone numbers
export function createDirectSmsUri(phoneNumbers: string | string[], bodyText: string): string {
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const phones = Array.isArray(phoneNumbers) ? phoneNumbers.join(isIOS ? ',' : ';') : phoneNumbers;
  const separator = isIOS ? '&' : '?';
  return `sms:${phones}${separator}body=${encodeURIComponent(bodyText)}`;
}

// Calculate distance in meters between two lat/lng coordinates (Haversine formula)
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Generate realistic breadcrumbs trail of 5 sequential location updates ending at current location
export function generateInitialBreadcrumbs(currentLoc: LocationCoordinate): LocationCoordinate[] {
  const now = currentLoc.timestamp || Date.now();
  // Gradual movement sequence leading to current location (~30-80 meters total drift)
  const offsets = [
    { dLat: -0.00062, dLng: -0.00072, ageMs: 180000, acc: 16.4 }, // #1 (3 min ago)
    { dLat: -0.00044, dLng: -0.00045, ageMs: 120000, acc: 14.8 }, // #2 (2 min ago)
    { dLat: -0.00028, dLng: -0.00024, ageMs: 70000, acc: 13.5 },  // #3 (70s ago)
    { dLat: -0.00012, dLng: -0.00010, ageMs: 30000, acc: 12.0 },  // #4 (30s ago)
    { dLat: 0, dLng: 0, ageMs: 0, acc: currentLoc.accuracyMeters || 10.5 }, // #5 (Now - Current fix)
  ];

  return offsets.map((off) => ({
    latitude: currentLoc.latitude + off.dLat,
    longitude: currentLoc.longitude + off.dLng,
    accuracyMeters: off.acc,
    timestamp: now - off.ageMs,
    isLastKnown: false,
  }));
}

