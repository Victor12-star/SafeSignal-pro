import { CountrySafetyConfig, EmergencyCategory } from '../types/safety';

const UNIVERSAL_CATEGORIES: EmergencyCategory[] = [
  { id: 'danger', titleEn: 'Personal Danger', titleLocal: 'Personal Danger', iconName: 'AlertTriangle', defaultMessage: 'I am in acute danger. Please contact emergency services or come to my location immediately.' },
  { id: 'threat', titleEn: 'Threat or Assault', titleLocal: 'Threat or Assault', iconName: 'ShieldAlert', defaultMessage: 'Active threat or robbery in progress. Tracking coordinates.' },
  { id: 'medical', titleEn: 'Medical Emergency', titleLocal: 'Medical Emergency', iconName: 'HeartPulse', defaultMessage: 'Severe medical emergency. Urgent healthcare or ambulance required.' },
  { id: 'accident', titleEn: 'Accident / Collision', titleLocal: 'Accident / Collision', iconName: 'Car', defaultMessage: 'Traffic accident or personal injury has occurred.' },
  { id: 'unsafe_journey', titleEn: 'Unsafe Journey', titleLocal: 'Unsafe Journey', iconName: 'Footprints', defaultMessage: 'Feeling unsafe along my transit route. Monitoring coordinates.' },
  { id: 'lost', titleEn: 'Lost / Stranded', titleLocal: 'Lost / Stranded', iconName: 'Compass', defaultMessage: 'Stranded in unfamiliar territory or breakdown area.' },
  { id: 'other', titleEn: 'General Emergency', titleLocal: 'General Emergency', iconName: 'HelpCircle', defaultMessage: 'Urgent situation. Please inspect my coordinates.' },
];

export const SWEDEN_CONFIG: CountrySafetyConfig = {
  countryCode: 'SE',
  countryName: 'Sweden',
  callingCode: '+46',
  continent: 'Europe',
  flagEmoji: '🇸🇪',
  defaultLanguage: 'sv',
  supportedLanguages: ['sv', 'en'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'SOS Alarm Sverige', number: '112', verifiedAt: '2026-09-01', source: 'Polisen & SOS Alarm AB Official Directory' },
    { service: 'POLICE', label: 'Polisen (Non-urgent)', number: '11414', verifiedAt: '2026-09-01', source: 'Polisen Sverige' },
    { service: 'AMBULANCE', label: 'Sjukvårdsrådgivning', number: '1177', verifiedAt: '2026-09-01', source: '1177 Vårdguiden' },
  ],
  categories: [
    { id: 'danger', titleEn: 'Personal Danger', titleLocal: 'Akut personlig fara', iconName: 'AlertTriangle', defaultMessage: 'Jag behöver akut hjälp. Någon hotar eller följer efter mig.' },
    { id: 'threat', titleEn: 'Threat or Robbery', titleLocal: 'Hot eller rån', iconName: 'ShieldAlert', defaultMessage: 'Jag utsätts för rån eller våldshot.' },
    { id: 'medical', titleEn: 'Medical Emergency', titleLocal: 'Medicinskt nödläge', iconName: 'HeartPulse', defaultMessage: 'Medicinskt akutläge. Jag behöver omedelbar vårdhjälp.' },
    { id: 'accident', titleEn: 'Accident', titleLocal: 'Olycka', iconName: 'Car', defaultMessage: 'Trafik- eller personskada har inträffat.' },
    { id: 'unsafe_journey', titleEn: 'Unsafe Journey', titleLocal: 'Otrygg hemresa', iconName: 'Footprints', defaultMessage: 'Känner mig otrygg på väg hem. Följ min position.' },
    { id: 'other', titleEn: 'Other Emergency', titleLocal: 'Annat nödläge', iconName: 'HelpCircle', defaultMessage: 'Jag behöver hjälp omedelbart.' },
  ],
  smsFallbackSupported: false,
  lowDataDefault: false,
  privacyRegion: 'EU_GDPR',
  legalNotice: 'Under EU GDPR (Regulation 2016/679), coordinates are processed ephemerally solely during active sessions and purged within 48h. SafeSignal does not replace official SOS Alarm 112 dispatch.',
  popularCities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala'],
};

export const NIGERIA_CONFIG: CountrySafetyConfig = {
  countryCode: 'NG',
  countryName: 'Nigeria',
  callingCode: '+234',
  continent: 'Africa',
  flagEmoji: '🇳🇬',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'ha', 'yo', 'ig'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'National Emergency Comms', number: '112', verifiedAt: '2026-09-01', source: 'Nigerian Communications Commission (NCC)' },
    { service: 'POLICE', label: 'Nigeria Police Force Response', number: '199', verifiedAt: '2026-09-01', source: 'NPF Control Room Headquarters' },
    { service: 'RAPID_RESPONSE', label: 'Lagos State Emergency (LASEMA)', number: '767', verifiedAt: '2026-09-01', source: 'Lagos State Emergency Management Agency' },
  ],
  categories: [
    { id: 'danger', titleEn: 'Personal Danger', titleLocal: 'Immediate Danger', iconName: 'AlertTriangle', defaultMessage: 'I am in severe danger. Please reach out to emergency response or come to my location.' },
    { id: 'threat', titleEn: 'Threat or Robbery', titleLocal: 'Armed Threat or Robbery', iconName: 'ShieldAlert', defaultMessage: 'Armed threat or robbery in progress. Tracking coordinates quietly.' },
    { id: 'accident', titleEn: 'Highway Breakdown', titleLocal: 'Highway Breakdown or Crash', iconName: 'Car', defaultMessage: 'Vehicle breakdown or highway incident in an unsafe transit area.' },
    { id: 'medical', titleEn: 'Medical Emergency', titleLocal: 'Medical Emergency', iconName: 'HeartPulse', defaultMessage: 'Urgent medical assistance required immediately.' },
    { id: 'unsafe_journey', titleEn: 'Unsafe Transit', titleLocal: 'Unsafe Transit Route', iconName: 'Footprints', defaultMessage: 'Feeling unsafe along my transit route. Monitoring coordinates.' },
    { id: 'other', titleEn: 'General Emergency', titleLocal: 'General Emergency', iconName: 'HelpCircle', defaultMessage: 'Emergency situation. Please check my coordinates.' },
  ],
  smsFallbackSupported: true,
  lowDataDefault: true,
  privacyRegion: 'NIGERIA_NDPA',
  legalNotice: 'SafeSignal operates in accordance with the Nigeria Data Protection Act (NDPA) 2023. Ephemeral location is stored locally first and synced via low-data compression.',
  popularCities: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'],
};

export const UNITED_STATES_CONFIG: CountrySafetyConfig = {
  countryCode: 'US',
  countryName: 'United States',
  callingCode: '+1',
  continent: 'North America',
  flagEmoji: '🇺🇸',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'Universal Emergency Service', number: '911', verifiedAt: '2026-09-01', source: 'Federal Communications Commission (FCC)' },
    { service: 'POLICE', label: 'Non-Emergency Services', number: '311', verifiedAt: '2026-09-01', source: 'Municipal 311 Directory' },
    { service: 'RAPID_RESPONSE', label: 'Suicide & Crisis Lifeline', number: '988', verifiedAt: '2026-09-01', source: 'SAMHSA' },
  ],
  categories: UNIVERSAL_CATEGORIES,
  smsFallbackSupported: true,
  lowDataDefault: false,
  privacyRegion: 'US_STATE_PRIVACY',
  legalNotice: 'Governed by state privacy frameworks (CCPA/CPRA). SafeSignal never sells or shares precise geolocation data. Emergency data is retained strictly for incident resolution.',
  popularCities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'San Francisco'],
};

export const UNITED_KINGDOM_CONFIG: CountrySafetyConfig = {
  countryCode: 'GB',
  countryName: 'United Kingdom',
  callingCode: '+44',
  continent: 'Europe',
  flagEmoji: '🇬🇧',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'cy'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'Emergency Services (Primary)', number: '999', verifiedAt: '2026-09-01', source: 'Home Office & British Telecom Operator' },
    { service: 'ALL_EMERGENCIES', label: 'European Emergency Number', number: '112', verifiedAt: '2026-09-01', source: 'Ofcom UK' },
    { service: 'POLICE', label: 'Police Non-Emergency', number: '101', verifiedAt: '2026-09-01', source: 'National Police Chiefs Council' },
    { service: 'AMBULANCE', label: 'NHS Non-Emergency Health', number: '111', verifiedAt: '2026-09-01', source: 'National Health Service (NHS)' },
  ],
  categories: UNIVERSAL_CATEGORIES,
  smsFallbackSupported: true,
  lowDataDefault: false,
  privacyRegion: 'UK_GDPR',
  legalNotice: 'Compliant with UK Data Protection Act 2018 & UK GDPR. Session tracking stops instantly upon resolution.',
  popularCities: ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Belfast'],
};

export const GERMANY_CONFIG: CountrySafetyConfig = {
  countryCode: 'DE',
  countryName: 'Germany',
  callingCode: '+49',
  continent: 'Europe',
  flagEmoji: '🇩🇪',
  defaultLanguage: 'de',
  supportedLanguages: ['de', 'en'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'Feuerwehr & Rettungsdienst', number: '112', verifiedAt: '2026-09-01', source: 'Bundesamt für Bevölkerungsschutz und Katastrophenhilfe' },
    { service: 'POLICE', label: 'Polizei Notruf', number: '110', verifiedAt: '2026-09-01', source: 'Bundespolizei & Landespolizeien' },
    { service: 'AMBULANCE', label: 'Ärztlicher Bereitschaftsdienst', number: '116117', verifiedAt: '2026-09-01', source: 'Kassenärztliche Bundesvereinigung' },
  ],
  categories: [
    { id: 'danger', titleEn: 'Personal Danger', titleLocal: 'Akute Gefahr', iconName: 'AlertTriangle', defaultMessage: 'Ich bin in akuter Gefahr. Bitte Notruf verständigen oder Position aufsuchen.' },
    { id: 'threat', titleEn: 'Threat or Assault', titleLocal: 'Bedrohung / Überfall', iconName: 'ShieldAlert', defaultMessage: 'Überfall oder Bedrohung im Gange. Verfolge meine Koordinaten.' },
    { id: 'medical', titleEn: 'Medical Emergency', titleLocal: 'Medizinischer Notfall', iconName: 'HeartPulse', defaultMessage: 'Medizinischer Notfall. Rettungsdienst benötigt.' },
    { id: 'accident', titleEn: 'Accident', titleLocal: 'Verkehrsunfall', iconName: 'Car', defaultMessage: 'Ein Unfall hat sich ereignet.' },
    { id: 'unsafe_journey', titleEn: 'Unsafe Journey', titleLocal: 'Unsicherer Heimweg', iconName: 'Footprints', defaultMessage: 'Fühle mich auf dem Heimweg unsicher.' },
    { id: 'other', titleEn: 'Other Emergency', titleLocal: 'Sonstiger Notfall', iconName: 'HelpCircle', defaultMessage: 'Dringende Hilfe erforderlich.' },
  ],
  smsFallbackSupported: false,
  lowDataDefault: false,
  privacyRegion: 'EU_GDPR',
  legalNotice: 'Streng konform mit DSGVO (BDSG). Keine Weitergabe von Standortdaten. Lokale Speicherung zuerst.',
  popularCities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
};

export const FRANCE_CONFIG: CountrySafetyConfig = {
  countryCode: 'FR',
  countryName: 'France',
  callingCode: '+33',
  continent: 'Europe',
  flagEmoji: '🇫🇷',
  defaultLanguage: 'fr',
  supportedLanguages: ['fr', 'en'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'Urgences Européennes', number: '112', verifiedAt: '2026-09-01', source: 'Ministère de l’Intérieur' },
    { service: 'AMBULANCE', label: 'SAMU (Urgences Médicales)', number: '15', verifiedAt: '2026-09-01', source: 'Service d’Aide Médicale Urgente' },
    { service: 'POLICE', label: 'Police Secours', number: '17', verifiedAt: '2026-09-01', source: 'Police Nationale' },
    { service: 'FIRE', label: 'Sapeurs-Pompiers', number: '18', verifiedAt: '2026-09-01', source: 'Pompiers de France' },
  ],
  categories: [
    { id: 'danger', titleEn: 'Personal Danger', titleLocal: 'Danger Personnel', iconName: 'AlertTriangle', defaultMessage: 'Je suis en danger immédiat. Veuillez prévenir les secours ou me rejoindre.' },
    { id: 'threat', titleEn: 'Threat or Assault', titleLocal: 'Agression / Menace', iconName: 'ShieldAlert', defaultMessage: 'Agression en cours. Suivez mes coordonnées.' },
    { id: 'medical', titleEn: 'Medical Emergency', titleLocal: 'Urgence Médicale', iconName: 'HeartPulse', defaultMessage: 'Urgence médicale vitale. SAMU nécessaire.' },
    { id: 'accident', titleEn: 'Accident', titleLocal: 'Accident de la route', iconName: 'Car', defaultMessage: 'Un accident vient de se produire.' },
    { id: 'unsafe_journey', titleEn: 'Unsafe Journey', titleLocal: 'Trajet Inquietant', iconName: 'Footprints', defaultMessage: 'Je me sens en insécurité sur mon trajet retour.' },
    { id: 'other', titleEn: 'Other Emergency', titleLocal: 'Autre Urgence', iconName: 'HelpCircle', defaultMessage: 'Assistance urgente requise.' },
  ],
  smsFallbackSupported: false,
  lowDataDefault: false,
  privacyRegion: 'EU_GDPR',
  legalNotice: 'Conformité totale RGPD (CNIL). Les données GPS sont éphémères et détruites 48h après la clôture de l’alerte.',
  popularCities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'],
};

export const CANADA_CONFIG: CountrySafetyConfig = {
  countryCode: 'CA',
  countryName: 'Canada',
  callingCode: '+1',
  continent: 'North America',
  flagEmoji: '🇨🇦',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'fr'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'Universal Emergency', number: '911', verifiedAt: '2026-09-01', source: 'Canadian Radio-television and Telecommunications Commission (CRTC)' },
    { service: 'POLICE', label: 'Non-Emergency Services', number: '311', verifiedAt: '2026-09-01', source: 'Municipal Services Canada' },
  ],
  categories: UNIVERSAL_CATEGORIES,
  smsFallbackSupported: true,
  lowDataDefault: false,
  privacyRegion: 'CANADA_PIPEDA',
  legalNotice: 'Compliant with PIPEDA and provincial privacy standards. Geolocation data is only retained for active safety sessions.',
  popularCities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'],
};

export const AUSTRALIA_CONFIG: CountrySafetyConfig = {
  countryCode: 'AU',
  countryName: 'Australia',
  callingCode: '+61',
  continent: 'Oceania',
  flagEmoji: '🇦🇺',
  defaultLanguage: 'en',
  supportedLanguages: ['en'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'Triple Zero (Primary)', number: '000', verifiedAt: '2026-09-01', source: 'Australian Communications and Media Authority (ACMA)' },
    { service: 'ALL_EMERGENCIES', label: 'Mobile GSM Emergency', number: '112', verifiedAt: '2026-09-01', source: 'Telstra & ACMA Mobile Standard' },
    { service: 'POLICE', label: 'Police Assistance Line', number: '131444', verifiedAt: '2026-09-01', source: 'National Police Assistance Line' },
  ],
  categories: UNIVERSAL_CATEGORIES,
  smsFallbackSupported: true,
  lowDataDefault: false,
  privacyRegion: 'AUSTRALIA_PRIVACY',
  legalNotice: 'Adheres to the Australian Privacy Principles (APPs). Location data is strictly used for emergency escalation.',
  popularCities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
};

export const JAPAN_CONFIG: CountrySafetyConfig = {
  countryCode: 'JP',
  countryName: 'Japan',
  callingCode: '+81',
  continent: 'Asia',
  flagEmoji: '🇯🇵',
  defaultLanguage: 'ja',
  supportedLanguages: ['ja', 'en'],
  emergencyNumbers: [
    { service: 'POLICE', label: 'Keisatsu (Police)', number: '110', verifiedAt: '2026-09-01', source: 'National Police Agency of Japan' },
    { service: 'AMBULANCE', label: 'Kyūkyū / Shōbō (Ambulance & Fire)', number: '119', verifiedAt: '2026-09-01', source: 'Fire and Disaster Management Agency (FDMA)' },
    { service: 'DISASTER', label: 'Maritime Safety Agency (Coast Guard)', number: '118', verifiedAt: '2026-09-01', source: 'Japan Coast Guard' },
  ],
  categories: [
    { id: 'danger', titleEn: 'Personal Danger', titleLocal: '身の危険・緊急事態', iconName: 'AlertTriangle', defaultMessage: '命の危険があります。至急助けを呼ぶか、現在地を確認してください。' },
    { id: 'threat', titleEn: 'Threat or Stalker', titleLocal: 'ストーカー・不審者・脅迫', iconName: 'ShieldAlert', defaultMessage: 'つきまといや不審者による脅迫。位置情報を追跡中。' },
    { id: 'medical', titleEn: 'Medical Emergency', titleLocal: '急病・医療救護 (119)', iconName: 'HeartPulse', defaultMessage: '急病または大怪我です。救急車が必要です。' },
    { id: 'accident', titleEn: 'Traffic Accident', titleLocal: '交通事故 (110)', iconName: 'Car', defaultMessage: '交通事故が発生しました。' },
    { id: 'unsafe_journey', titleEn: 'Unsafe Commute', titleLocal: '帰宅時の不安', iconName: 'Footprints', defaultMessage: '帰宅ルートで危険を感じています。' },
    { id: 'other', titleEn: 'General Emergency', titleLocal: 'その他の緊急事態', iconName: 'HelpCircle', defaultMessage: '緊急救援が必要です。' },
  ],
  smsFallbackSupported: false,
  lowDataDefault: false,
  privacyRegion: 'JAPAN_APPI',
  legalNotice: '個人情報保護法（APPI）に準拠。緊急時セッション以外での位置情報の追跡・収集は行いません。',
  popularCities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya'],
};

export const SOUTH_AFRICA_CONFIG: CountrySafetyConfig = {
  countryCode: 'ZA',
  countryName: 'South Africa',
  callingCode: '+27',
  continent: 'Africa',
  flagEmoji: '🇿🇦',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'zu', 'xh', 'af'],
  emergencyNumbers: [
    { service: 'POLICE', label: 'SAPS Flying Squad (Police)', number: '10111', verifiedAt: '2026-09-01', source: 'South African Police Service' },
    { service: 'AMBULANCE', label: 'Ambulance Response', number: '10177', verifiedAt: '2026-09-01', source: 'National Department of Health' },
    { service: 'ALL_EMERGENCIES', label: 'Cellular Emergency', number: '112', verifiedAt: '2026-09-01', source: 'ICASA Mobile Emergency Standard' },
  ],
  categories: UNIVERSAL_CATEGORIES,
  smsFallbackSupported: true,
  lowDataDefault: true,
  privacyRegion: 'SOUTH_AFRICA_POPIA',
  legalNotice: 'Governed by the Protection of Personal Information Act (POPIA). Emergency telemetry uses low-data encryption.',
  popularCities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Gqeberha'],
};

export const BRAZIL_CONFIG: CountrySafetyConfig = {
  countryCode: 'BR',
  countryName: 'Brazil',
  callingCode: '+55',
  continent: 'South America',
  flagEmoji: '🇧🇷',
  defaultLanguage: 'pt',
  supportedLanguages: ['pt', 'en'],
  emergencyNumbers: [
    { service: 'POLICE', label: 'Polícia Militar', number: '190', verifiedAt: '2026-09-01', source: 'Ministério da Justiça e Segurança Pública' },
    { service: 'AMBULANCE', label: 'SAMU (Ambulância)', number: '192', verifiedAt: '2026-09-01', source: 'Ministério da Saúde' },
    { service: 'FIRE', label: 'Corpo de Bombeiros', number: '193', verifiedAt: '2026-09-01', source: 'Corpo de Bombeiros Militar' },
    { service: 'ALL_EMERGENCIES', label: 'Emergência Celular', number: '112', verifiedAt: '2026-09-01', source: 'Anatel' },
  ],
  categories: [
    { id: 'danger', titleEn: 'Personal Danger', titleLocal: 'Perigo Pessoal Imediato', iconName: 'AlertTriangle', defaultMessage: 'Estou em perigo imediato. Chame a emergência ou venha à minha localização.' },
    { id: 'threat', titleEn: 'Threat or Robbery', titleLocal: 'Assalto / Ameaça Armada', iconName: 'ShieldAlert', defaultMessage: 'Assalto ou violência iminente. Monitorando localização.' },
    { id: 'medical', titleEn: 'Medical Emergency', titleLocal: 'Emergência Médica (SAMU)', iconName: 'HeartPulse', defaultMessage: 'Emergência médica grave. SAMU necessário.' },
    { id: 'accident', titleEn: 'Accident', titleLocal: 'Acidente de Trânsito', iconName: 'Car', defaultMessage: 'Acidente de trânsito ocorrido.' },
    { id: 'unsafe_journey', titleEn: 'Unsafe Route', titleLocal: 'Trajeto Inseguro', iconName: 'Footprints', defaultMessage: 'Sensação de insegurança durante o trajeto.' },
    { id: 'other', titleEn: 'Other Emergency', titleLocal: 'Outra Emergência', iconName: 'HelpCircle', defaultMessage: 'Socorro urgente necessário.' },
  ],
  smsFallbackSupported: true,
  lowDataDefault: true,
  privacyRegion: 'BRAZIL_LGPD',
  legalNotice: 'Em total conformidade com a LGPD (Lei Geral de Proteção de Dados). Rastreamento ativado apenas em emergência.',
  popularCities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'],
};

export const INDIA_CONFIG: CountrySafetyConfig = {
  countryCode: 'IN',
  countryName: 'India',
  callingCode: '+91',
  continent: 'Asia',
  flagEmoji: '🇮🇳',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'hi'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'Emergency Response Support System (ERSS)', number: '112', verifiedAt: '2026-09-01', source: 'Ministry of Home Affairs ERSS' },
    { service: 'POLICE', label: 'Police Control Room', number: '100', verifiedAt: '2026-09-01', source: 'National Police Portal' },
    { service: 'AMBULANCE', label: 'National Ambulance Service', number: '108', verifiedAt: '2026-09-01', source: 'Ministry of Health and Family Welfare' },
    { service: 'RAPID_RESPONSE', label: 'Women Helpline', number: '1091', verifiedAt: '2026-09-01', source: 'National Commission for Women' },
  ],
  categories: UNIVERSAL_CATEGORIES,
  smsFallbackSupported: true,
  lowDataDefault: true,
  privacyRegion: 'GENERIC_GLOBAL',
  legalNotice: 'Operates under the Digital Personal Data Protection Act (DPDP) 2023. Ephemeral location during emergency only.',
  popularCities: ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai'],
};

export const KENYA_CONFIG: CountrySafetyConfig = {
  countryCode: 'KE',
  countryName: 'Kenya',
  callingCode: '+254',
  continent: 'Africa',
  flagEmoji: '🇰🇪',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'sw'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'National Disaster Comms', number: '999', verifiedAt: '2026-09-01', source: 'National Police Service of Kenya' },
    { service: 'ALL_EMERGENCIES', label: 'Mobile Emergency Comms', number: '112', verifiedAt: '2026-09-01', source: 'Communications Authority of Kenya' },
    { service: 'POLICE', label: 'Police Response Line', number: '911', verifiedAt: '2026-09-01', source: 'National Police Service' },
  ],
  categories: UNIVERSAL_CATEGORIES,
  smsFallbackSupported: true,
  lowDataDefault: true,
  privacyRegion: 'GENERIC_GLOBAL',
  legalNotice: 'Compliant with Kenya Data Protection Act 2019. Saves emergency incident locally before low-data sync.',
  popularCities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
};

export const GHANA_CONFIG: CountrySafetyConfig = {
  countryCode: 'GH',
  countryName: 'Ghana',
  callingCode: '+233',
  continent: 'Africa',
  flagEmoji: '🇬🇭',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'ak'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'National Emergency Call Centre', number: '112', verifiedAt: '2026-09-01', source: 'Ministry of Communications Ghana' },
    { service: 'POLICE', label: 'Ghana Police Emergency', number: '191', verifiedAt: '2026-09-01', source: 'Ghana Police Service' },
    { service: 'FIRE', label: 'Ghana National Fire Service', number: '192', verifiedAt: '2026-09-01', source: 'GNFS' },
    { service: 'AMBULANCE', label: 'National Ambulance Service', number: '193', verifiedAt: '2026-09-01', source: 'NAS Ghana' },
  ],
  categories: UNIVERSAL_CATEGORIES,
  smsFallbackSupported: true,
  lowDataDefault: true,
  privacyRegion: 'GENERIC_GLOBAL',
  legalNotice: 'Compliant with Data Protection Act 2012 (Act 843). Local offline queue with automatic retry.',
  popularCities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Tema'],
};

export const UAE_CONFIG: CountrySafetyConfig = {
  countryCode: 'AE',
  countryName: 'United Arab Emirates',
  callingCode: '+971',
  continent: 'Asia',
  flagEmoji: '🇦🇪',
  defaultLanguage: 'ar',
  supportedLanguages: ['ar', 'en'],
  emergencyNumbers: [
    { service: 'POLICE', label: 'Police Emergency', number: '999', verifiedAt: '2026-09-01', source: 'Ministry of Interior UAE' },
    { service: 'AMBULANCE', label: 'National Ambulance', number: '998', verifiedAt: '2026-09-01', source: 'National Ambulance UAE' },
    { service: 'FIRE', label: 'Civil Defence (Fire)', number: '997', verifiedAt: '2026-09-01', source: 'Civil Defence UAE' },
  ],
  categories: UNIVERSAL_CATEGORIES,
  smsFallbackSupported: false,
  lowDataDefault: false,
  privacyRegion: 'GENERIC_GLOBAL',
  legalNotice: 'Compliant with UAE Federal Data Protection Law (Federal Decree-Law No. 45/2021). Strict encryption.',
  popularCities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'],
};

export const SPAIN_CONFIG: CountrySafetyConfig = {
  countryCode: 'ES',
  countryName: 'Spain',
  callingCode: '+34',
  continent: 'Europe',
  flagEmoji: '🇪🇸',
  defaultLanguage: 'es',
  supportedLanguages: ['es', 'ca', 'gl', 'eu', 'en'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'Emergencias 112', number: '112', verifiedAt: '2026-09-01', source: 'Ministerio del Interior de España' },
    { service: 'POLICE', label: 'Policía Nacional', number: '091', verifiedAt: '2026-09-01', source: 'Cuerpo Nacional de Policía' },
    { service: 'POLICE', label: 'Guardia Civil', number: '062', verifiedAt: '2026-09-01', source: 'Guardia Civil' },
    { service: 'AMBULANCE', label: 'Urgencias Sanitarias', number: '061', verifiedAt: '2026-09-01', source: 'Servicio Nacional de Salud' },
  ],
  categories: [
    { id: 'danger', titleEn: 'Personal Danger', titleLocal: 'Peligro Personal Inminente', iconName: 'AlertTriangle', defaultMessage: 'Estoy en peligro inminente. Por favor avisad a emergencias o venid a mi ubicación.' },
    { id: 'threat', titleEn: 'Threat or Robbery', titleLocal: 'Amenaza o Robo', iconName: 'ShieldAlert', defaultMessage: 'Amenaza o asalto en curso. Rastreo activado.' },
    { id: 'medical', titleEn: 'Medical Emergency', titleLocal: 'Emergencia Médica', iconName: 'HeartPulse', defaultMessage: 'Emergencia médica grave. Ambulancia requerida.' },
    { id: 'accident', titleEn: 'Accident', titleLocal: 'Accidente de Tráfico', iconName: 'Car', defaultMessage: 'Ha ocurrido un accidente.' },
    { id: 'unsafe_journey', titleEn: 'Unsafe Commute', titleLocal: 'Trayecto Inseguro', iconName: 'Footprints', defaultMessage: 'Sensación de inseguridad de camino a casa.' },
    { id: 'other', titleEn: 'Other Emergency', titleLocal: 'Otra Emergencia', iconName: 'HelpCircle', defaultMessage: 'Ayuda urgente requerida.' },
  ],
  smsFallbackSupported: false,
  lowDataDefault: false,
  privacyRegion: 'EU_GDPR',
  legalNotice: 'Cumplimiento estricto con el RGPD y la LOPDGDD. Los datos de geolocalización solo se procesan en emergencias activas.',
  popularCities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Málaga'],
};

export const GLOBAL_FALLBACK_CONFIG: CountrySafetyConfig = {
  countryCode: 'GLOBAL',
  countryName: 'Universal Global Fallback',
  callingCode: '+1',
  continent: 'Europe',
  flagEmoji: '🌐',
  defaultLanguage: 'en',
  supportedLanguages: ['en'],
  emergencyNumbers: [
    { service: 'ALL_EMERGENCIES', label: 'International GSM Emergency (ITU)', number: '112', verifiedAt: '2026-09-01', source: 'ITU-T Recommendation E.161' },
    { service: 'ALL_EMERGENCIES', label: 'North American GSM Emergency', number: '911', verifiedAt: '2026-09-01', source: 'Universal 911 Standard' },
  ],
  categories: UNIVERSAL_CATEGORIES,
  smsFallbackSupported: true,
  lowDataDefault: false,
  privacyRegion: 'GENERIC_GLOBAL',
  legalNotice: 'Standard international emergency operation. Coordinates shared solely with authorized contacts during active sessions.',
  popularCities: ['Worldwide Coverage', 'All Continents'],
};

export const COUNTRIES_CONFIG_MAP: Record<string, CountrySafetyConfig> = {
  SE: SWEDEN_CONFIG,
  NG: NIGERIA_CONFIG,
  US: UNITED_STATES_CONFIG,
  GB: UNITED_KINGDOM_CONFIG,
  DE: GERMANY_CONFIG,
  FR: FRANCE_CONFIG,
  CA: CANADA_CONFIG,
  AU: AUSTRALIA_CONFIG,
  JP: JAPAN_CONFIG,
  ZA: SOUTH_AFRICA_CONFIG,
  BR: BRAZIL_CONFIG,
  IN: INDIA_CONFIG,
  KE: KENYA_CONFIG,
  GH: GHANA_CONFIG,
  AE: UAE_CONFIG,
  ES: SPAIN_CONFIG,
  GLOBAL: GLOBAL_FALLBACK_CONFIG,
};

export const ALL_SUPPORTED_COUNTRIES: CountrySafetyConfig[] = [
  SWEDEN_CONFIG,
  NIGERIA_CONFIG,
  UNITED_STATES_CONFIG,
  UNITED_KINGDOM_CONFIG,
  GERMANY_CONFIG,
  FRANCE_CONFIG,
  SPAIN_CONFIG,
  CANADA_CONFIG,
  AUSTRALIA_CONFIG,
  JAPAN_CONFIG,
  SOUTH_AFRICA_CONFIG,
  BRAZIL_CONFIG,
  INDIA_CONFIG,
  KENYA_CONFIG,
  GHANA_CONFIG,
  UAE_CONFIG,
];

// Universal Country Safety Config Resolver
export function resolveCountrySafetyConfig(countryCodeOrName: string): CountrySafetyConfig {
  const normalized = countryCodeOrName.trim().toUpperCase();
  if (COUNTRIES_CONFIG_MAP[normalized]) {
    return COUNTRIES_CONFIG_MAP[normalized];
  }

  // Find by name match
  const foundByName = ALL_SUPPORTED_COUNTRIES.find(
    (c) => c.countryName.toUpperCase() === normalized || c.countryCode === normalized
  );
  if (foundByName) {
    return foundByName;
  }

  // Generate dynamic config for any ISO-3166 code
  return {
    ...GLOBAL_FALLBACK_CONFIG,
    countryCode: normalized.length === 2 ? normalized : 'INTL',
    countryName: countryCodeOrName || 'International Territory',
  };
}
