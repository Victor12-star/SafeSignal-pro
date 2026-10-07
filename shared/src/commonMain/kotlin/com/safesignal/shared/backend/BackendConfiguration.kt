package com.safesignal.shared.backend

data class BackendConfiguration(
    val projectUrl: String,
    val publishableKey: String,
) {
    val isConfigured: Boolean
        get() = projectUrl.isNotBlank() && publishableKey.isNotBlank()

    fun requireProductionSafe(): BackendConfiguration {
        require(isConfigured) { "SafeSignal backend is not configured" }
        require(projectUrl.startsWith("https://")) {
            "SafeSignal backend URL must use HTTPS"
        }
        require(!projectUrl.contains("@")) {
            "SafeSignal backend URL must not contain embedded credentials"
        }
        require(!publishableKey.startsWith("sb_secret_")) {
            "A Supabase secret key must never be embedded in the mobile app"
        }
        return this
    }
}
