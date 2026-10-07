export type PrivacyRegion =
  | 'EU_GDPR'
  | 'NIGERIA_NDPA'
  | 'US_STATE_PRIVACY'
  | 'UK_GDPR'
  | 'CANADA_PIPEDA'
  | 'AUSTRALIA_PRIVACY'
  | 'JAPAN_APPI'
  | 'SOUTH_AFRICA_POPIA'
  | 'BRAZIL_LGPD'
  | 'GENERIC_GLOBAL';

export type Continent = 'Europe' | 'Africa' | 'North America' | 'South America' | 'Asia' | 'Oceania';

export type EmergencyServiceType = 'ALL_EMERGENCIES' | 'POLICE' | 'AMBULANCE' | 'FIRE' | 'RAPID_RESPONSE' | 'DISASTER';

export interface EmergencyNumber {
  service: EmergencyServiceType;
  label: string;
  number: string;
  verifiedAt: string;
  source: string;
}

export interface EmergencyCategory {
  id: string;
  titleEn: string;
  titleLocal: string;
  iconName: string;
  defaultMessage: string;
}

export interface CountrySafetyConfig {
  countryCode: string;
  countryName: string;
  callingCode: string;
  continent: Continent;
  flagEmoji: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  emergencyNumbers: EmergencyNumber[];
  categories: EmergencyCategory[];
  smsFallbackSupported: boolean;
  lowDataDefault: boolean;
  privacyRegion: PrivacyRegion;
  legalNotice: string;
  popularCities?: string[];
}

export type EmergencyState =
  | 'IDLE'
  | 'CREATED'
  | 'PENDING_LOCATION'
  | 'PENDING_DELIVERY'
  | 'ACTIVE'
  | 'PARTIALLY_DELIVERED'
  | 'DELIVERED'
  | 'ACKNOWLEDGED'
  | 'CONNECTION_LOST'
  | 'RESOLVED'
  | 'CANCELLED';

export type NetworkStatus = 'ONLINE' | 'LIMITED' | 'OFFLINE' | 'RECOVERING';

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestamp: number;
  isLastKnown: boolean;
}

export interface RecipientStatus {
  contactId: string;
  name: string;
  phone: string;
  channel: 'PUSH' | 'WEB_LINK' | 'SMS';
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED' | 'FAILED';
  deliveredAt?: string;
  acknowledgedAt?: string;
}

export interface BatteryHistoryPoint {
  timestamp: number;
  batteryLevel: number;
  timeLabel: string;
  isCritical?: boolean;
}

export interface EmergencyIncident {
  id: string;
  userId: string;
  countryCode: string;
  emergencyType: string;
  isSilent: boolean;
  customMessage: string;
  batteryLevel: number;
  batteryCharging?: boolean;
  batteryHistory?: BatteryHistoryPoint[];
  isLowBatteryAlertSent?: boolean;
  lowBatteryAlertSentAt?: string;
  status: EmergencyState;
  createdAt: string;
  resolvedAt?: string;
  location?: LocationCoordinate;
  locationHistory?: LocationCoordinate[];
  recipients: RecipientStatus[];
  idempotencyKey: string;
  isSavedLocally: boolean;
  isSyncedToCloud: boolean;
  accessToken: string;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: 'Family' | 'Partner' | 'Friend' | 'Neighbour' | 'Medical' | 'Work';
  group: 'Primary' | 'Secondary' | 'Night Commute';
  isActive: boolean;
}

export interface SafeJourney {
  id: string;
  destination: string;
  durationMinutes: number;
  startedAt: number;
  expiresAt: number;
  contactIds: string[];
  status: 'ACTIVE' | 'SAFE' | 'CHECKIN_PENDING' | 'ESCALATED';
}

export interface UserTravelProfile {
  homeCountryCode: string;
  currentRegionCode: string;
  isAutoDetectEnabled: boolean;
  travelModeActive: boolean;
  lastRegionChangeTimestamp: number;
}
