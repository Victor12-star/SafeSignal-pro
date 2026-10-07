import {
  buildEmergencySms,
  formatEmergencyType,
  mapTwilioStatus,
  retryDelaySeconds,
} from "./sms.ts"

Deno.test("formats emergency type without technical enum syntax", () => {
  if (formatEmergencyType("PERSONAL_DANGER") !== "Personal Danger") {
    throw new Error("Emergency type formatting failed")
  }
})

Deno.test("SMS is concise and does not claim delivery or emergency-service notification", () => {
  const body = buildEmergencySms({
    recipient_id: "r1",
    incident_id: "i1",
    phone_e164: "+46700000000",
    contact_name: "Contact",
    sender_name: "Victor Example",
    emergency_type: "MEDICAL",
    country_code: "SE",
    lease_token: "lease",
    attempt_count: 1,
  })

  if (!body.includes("Victor Example")) throw new Error("Sender name missing")
  if (!body.includes("Medical")) throw new Error("Emergency type missing")
  if (/delivered|police notified|ambulance notified/i.test(body)) {
    throw new Error("SMS contains an unsupported delivery or emergency-services claim")
  }
})

Deno.test("retry delay is bounded exponential backoff", () => {
  const values = [1, 2, 3, 4, 5, 10].map(retryDelaySeconds)
  const expected = [30, 60, 120, 240, 480, 480]

  if (JSON.stringify(values) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected retry sequence: ${JSON.stringify(values)}`)
  }
})

Deno.test("Twilio status mapping preserves sent versus delivered truth", () => {
  if (mapTwilioStatus("sent") !== "SMS_SENT") throw new Error("sent mapping failed")
  if (mapTwilioStatus("delivered") !== "DELIVERED") throw new Error("delivered mapping failed")
  if (mapTwilioStatus("undelivered") !== "FAILED") throw new Error("failure mapping failed")
  if (mapTwilioStatus("queued") !== null) throw new Error("queued should not be treated as final")
})
