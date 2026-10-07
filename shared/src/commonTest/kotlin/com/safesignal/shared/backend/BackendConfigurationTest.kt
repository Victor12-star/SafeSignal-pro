package com.safesignal.shared.backend

import kotlin.test.Test
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class BackendConfigurationTest {
    @Test
    fun acceptsHttpsProjectUrlAndPublishableKey() {
        val config = BackendConfiguration(
            projectUrl = "https://example.supabase.co",
            publishableKey = "sb_publishable_example",
        )

        assertTrue(config.requireProductionSafe().isConfigured)
    }

    @Test
    fun rejectsMissingConfiguration() {
        assertFailsWith<IllegalArgumentException> {
            BackendConfiguration("", "").requireProductionSafe()
        }
    }

    @Test
    fun rejectsHttpBackendForProductionMobileClient() {
        assertFailsWith<IllegalArgumentException> {
            BackendConfiguration(
                projectUrl = "http://example.supabase.co",
                publishableKey = "sb_publishable_example",
            ).requireProductionSafe()
        }
    }

    @Test
    fun rejectsSupabaseSecretKeyInMobileConfiguration() {
        assertFailsWith<IllegalArgumentException> {
            BackendConfiguration(
                projectUrl = "https://example.supabase.co",
                publishableKey = "sb_secret_do_not_embed",
            ).requireProductionSafe()
        }
    }

    @Test
    fun rejectsCredentialsEmbeddedInBackendUrl() {
        assertFailsWith<IllegalArgumentException> {
            BackendConfiguration(
                projectUrl = "https://user:pass@example.supabase.co",
                publishableKey = "sb_publishable_example",
            ).requireProductionSafe()
        }
    }
}
