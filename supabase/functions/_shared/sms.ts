export type EmergencySmsContext = {
  senderName: string;
  emergencyType: string;
  occurredAtIso: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type SmsSendRequest = {
  toE164: string;
  body: string;
};

export type SmsAcceptedResult = {
  providerMessageId: string;
  providerStatus: string;
};

export interface SmsProvider {
  send(request: SmsSendRequest): Promise<SmsAcceptedResult>;
}

const emergencyLabels: Record<string, string> = {
  PERSONAL_DANGER: "Personal danger",
  MEDICAL: "Medical",
  ACCIDENT: "Accident",
  THREAT_ROBBERY: "Threat or robbery",
  UNSAFE_JOURNEY: "Unsafe journey",
  LOST_STRANDED: "Lost or stranded",
  OTHER: "Other",
};

export function buildEmergencySms(context: EmergencySmsContext): string {
  const name = context.senderName.trim() || "A SafeSignal user";
  const emergency = emergencyLabels[context.emergencyType] ?? "Emergency";
  const location =
    Number.isFinite(context.latitude) && Number.isFinite(context.longitude)
      ? `https://maps.google.com/?q=${context.latitude},${context.longitude}`
      : "Location unavailable";

  return [
    `SafeSignal alert from ${name}.`,
    `Type: ${emergency}.`,
    `Location: ${location}.`,
    `Time: ${context.occurredAtIso}.`,
    "Please contact them now. If there is immediate danger, call local emergency services.",
  ].join(" ");
}

export function normalizeProviderDestination(e164: string): string {
  if (!/^\+[1-9][0-9]{7,14}$/.test(e164)) {
    throw new Error("Invalid E.164 destination");
  }
  return e164.slice(1);
}
