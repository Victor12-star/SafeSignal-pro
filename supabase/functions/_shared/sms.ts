export type SmsQueueItem = {
  recipient_id: string
  incident_id: string
  phone_e164: string
  contact_name: string
  sender_name: string
  emergency_type: string
  country_code: string
  lease_token: string
  attempt_count: number
}

export function formatEmergencyType(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function buildEmergencySms(item: SmsQueueItem): string {
  const type = formatEmergencyType(item.emergency_type)
  return [
    `SafeSignal emergency from ${item.sender_name}.`,
    `Type: ${type}.`,
    "Please contact them now.",
    "If there is immediate danger, contact local emergency services.",
  ].join(" ")
}

export function retryDelaySeconds(attemptCount: number): number {
  const exponent = Math.max(0, Math.min(attemptCount - 1, 4))
  return Math.min(900, 30 * (2 ** exponent))
}

export function mapTwilioStatus(
  rawStatus: string,
): "SMS_SENT" | "DELIVERED" | "FAILED" | null {
  const status = rawStatus.toLowerCase()

  if (status === "sent") return "SMS_SENT"
  if (status === "delivered") return "DELIVERED"
  if (["failed", "undelivered", "canceled"].includes(status)) return "FAILED"

  return null
}

export function requireEnv(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function readSupabaseSecretKey(): string {
  const modern = Deno.env.get("SUPABASE_SECRET_KEYS")
  if (modern) {
    const parsed = JSON.parse(modern) as Record<string, string>
    const key = parsed.default
    if (key) return key
  }

  return requireEnv("SUPABASE_SERVICE_ROLE_KEY")
}
