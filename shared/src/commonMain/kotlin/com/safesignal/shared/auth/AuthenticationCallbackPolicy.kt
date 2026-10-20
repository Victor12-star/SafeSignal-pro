package com.safesignal.shared.auth

/**
 * Validates the fixed HTTPS callback destination registered for SafeSignal Pro.
 *
 * Only navigation intents for this exact scheme, host, and path may be passed
 * to the Supabase auth SDK. Do not loosen this policy to accept arbitrary
 * redirect hosts: callback URLs may contain one-time authentication codes.
 *
 * URI parsing remains at the platform boundary; this policy is platform-neutral
 * so security-sensitive matching can be unit tested in shared code.
 */
object AuthenticationCallbackPolicy {
    fun isAllowed(scheme: String?, host: String?, path: String?): Boolean =
        scheme == "https" &&
            host == "auth.vikwora.com" &&
            path == "/login-callback"
}
