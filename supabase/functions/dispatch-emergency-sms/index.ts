import { createClient } from "npm:@supabase/supabase-js@2"
import {
  buildEmergencySms,
  readSupabaseSecretKey,
  requireEnv,
  retryDelaySeconds,
  type SmsQueueItem,
} from "../_shared/sms.ts"

type TwilioMessageResponse = {
  sid?: string
  status?: string
  code?: number
}

const jsonHeaders = { "content-type": "application/json; charset=utf-8" }

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: jsonHeaders,
    })
  }

  const expectedWorkerSecret = requireEnv("SMS_DISPATCH_SECRET")
  const providedWorkerSecret = req.headers.get("x-safesignal-worker-secret") ?? ""

  if (!providedWorkerSecret || providedWorkerSecret !== expectedWorkerSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: jsonHeaders,
    })
  }

  const supabaseUrl = requireEnv("SUPABASE_URL")
  const supabaseSecretKey = readSupabaseSecretKey()
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID")
  const authToken = requireEnv("TWILIO_AUTH_TOKEN")
  const statusCallbackUrl = requireEnv("TWILIO_STATUS_CALLBACK_URL")
  const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID")?.trim()
  const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER")?.trim()

  if (!messagingServiceSid && !fromNumber) {
    throw new Error("Configure TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER")
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.rpc("claim_emergency_sms_batch", {
    p_limit: 10,
  })

  if (error) {
    return new Response(JSON.stringify({ error: "claim_failed" }), {
      status: 500,
      headers: jsonHeaders,
    })
  }

  const items = (data ?? []) as SmsQueueItem[]
  let accepted = 0
  let retrying = 0

  for (const item of items) {
    try {
      const form = new URLSearchParams()
      form.set("To", item.phone_e164)
      form.set("Body", buildEmergencySms(item))
      form.set("StatusCallback", statusCallbackUrl)

      if (messagingServiceSid) {
        form.set("MessagingServiceSid", messagingServiceSid)
      } else {
        form.set("From", fromNumber!)
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
        {
          method: "POST",
          headers: {
            "authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            "content-type": "application/x-www-form-urlencoded",
          },
          body: form,
        },
      )

      const result = await response.json() as TwilioMessageResponse

      if (response.ok && result.sid) {
        const { data: completed, error: completeError } = await supabase.rpc(
          "complete_emergency_sms_attempt",
          {
            p_recipient_id: item.recipient_id,
            p_lease_token: item.lease_token,
            p_provider_message_id: result.sid,
          },
        )

        if (completeError || completed !== true) {
          throw new Error("provider acceptance could not be persisted")
        }

        accepted += 1
        continue
      }

      const providerCode = result.code ? `twilio_${result.code}` : `twilio_http_${response.status}`
      await supabase.rpc("fail_emergency_sms_attempt", {
        p_recipient_id: item.recipient_id,
        p_lease_token: item.lease_token,
        p_error_code: providerCode,
        p_retry_after_seconds: retryDelaySeconds(item.attempt_count),
      })
      retrying += 1
    } catch {
      await supabase.rpc("fail_emergency_sms_attempt", {
        p_recipient_id: item.recipient_id,
        p_lease_token: item.lease_token,
        p_error_code: "dispatch_exception",
        p_retry_after_seconds: retryDelaySeconds(item.attempt_count),
      })
      retrying += 1
    }
  }

  return new Response(
    JSON.stringify({
      claimed: items.length,
      accepted,
      retrying,
    }),
    { status: 200, headers: jsonHeaders },
  )
})
