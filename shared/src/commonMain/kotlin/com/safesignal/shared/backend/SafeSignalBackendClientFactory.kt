package com.safesignal.shared.backend

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.functions.Functions
import io.github.jan.supabase.postgrest.Postgrest

object SafeSignalBackendClientFactory {
    fun create(
        configuration: BackendConfiguration,
    ): SupabaseClient {
        val safe = configuration.requireProductionSafe()

        return createSupabaseClient(
            supabaseUrl = safe.projectUrl,
            supabaseKey = safe.publishableKey,
        ) {
            install(Auth) {
                scheme = "https"
                host = "auth.vikwora.com"
            }
            install(Postgrest)
            install(Functions)
        }
    }
}
