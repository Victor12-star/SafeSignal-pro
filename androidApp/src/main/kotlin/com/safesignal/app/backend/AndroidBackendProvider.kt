package com.safesignal.app.backend

import com.safesignal.app.BuildConfig
import com.safesignal.shared.backend.BackendConfiguration
import com.safesignal.shared.backend.SafeSignalBackendClientFactory
import io.github.jan.supabase.SupabaseClient

class AndroidBackendProvider {
    val configuration = BackendConfiguration(
        projectUrl = BuildConfig.SUPABASE_URL,
        publishableKey = BuildConfig.SUPABASE_PUBLISHABLE_KEY,
    )

    val client: SupabaseClient? by lazy {
        if (!configuration.isConfigured) {
            null
        } else {
            SafeSignalBackendClientFactory.create(configuration)
        }
    }
}
