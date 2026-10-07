import { createClient } from "npm:@supabase/supabase-js@2"
import twilio from "npm:twilio@6.1.2"
import { readSupabaseSecretKey, requireEnv } from "../_shared/sms.ts"

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  const authToken = requireEnv("TWILIO_AUTH_TOKEN")
  const canonicalUrl = requireEnv("TWILIO_STATUS_CALLBACK_URL")
  const signature = req.headers.get("x-twilio-signature")

  if (!signature) {
    return new Response("Forbidden", { status: 403 })
  }

  const form = await req.formData()
  const params: Record<string, string> = {}

  for (const [key, value] of form.entries()) {
    if (typeof value === "string") params[key] = value
  }

  if (!twilio.validateRequest(authToken, signature, canonicalUrl, params)) {
    return new Response("Forbidden", { status: 403 })
  }

  const messageSid = params.MessageSid?.trim()
  const messageStatus = params.MessageStatus?.trim()
  const errorCode = params.ErrorCode?.trim() || null

  if (!messageSid || !messageStatus) {
    return new Response("Bad Request", { status: 400 })
  }

  const supabase = createClient(
    requireEnv("SUPABASE_URL"),
    readSupabaseSecretKey(),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const { error } = await supabase.rpc("apply_twilio_status_callback", {
    p_message_sid: messageSid,
    p_message_status: messageStatus,
    p_error_code: errorCode,
  })

  if (error) {
    return new Response("Server Error", { status: 500 })
  }

  return new Response(null, { status: 204 })
})
