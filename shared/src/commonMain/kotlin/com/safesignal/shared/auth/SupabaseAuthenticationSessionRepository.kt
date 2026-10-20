
package com.safesignal.shared.auth

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.withTimeout

class SupabaseAuthenticationSessionRepository(
    private val gateway: AuthenticationSessionGateway,
) : AuthenticationSessionRepository {

    constructor(client: SupabaseClient) : this(
        gateway = SupabaseAuthenticationSessionGateway(client),
    )

    override suspend fun restoreSession(): AuthenticationState {
        return try {
            val userId = withTimeout(10_000L) {
                gateway.awaitInitialization()

                if (!gateway.hasCurrentSession()) {
                    return@withTimeout null
                }

                gateway.retrieveVerifiedUserId()
            }

            if (userId == null) {
                AuthenticationState.SignedOut
            } else {
                AuthenticationSessionResolver.resolve(
                    verifiedUserId = userId,
                    sessionVerified = true,
                )
            }
        } catch (_: TimeoutCancellationException) {
            AuthenticationState.Error(
                message = "Session verification timed out. Please try again.",
            )
        } catch (cancellation: CancellationException) {
            throw cancellation
        } catch (_: Exception) {
            AuthenticationState.Error(
                message = "Unable to verify your session. Please try again.",
            )
        }
    }
}

private class SupabaseAuthenticationSessionGateway(
    private val client: SupabaseClient,
) : AuthenticationSessionGateway {

    override suspend fun awaitInitialization() {
        client.auth.awaitInitialization()
    }

    override fun hasCurrentSession(): Boolean {
        return client.auth.currentSessionOrNull() != null
    }

    override suspend fun retrieveVerifiedUserId(): String {
        return client.auth.retrieveUserForCurrentSession().id
    }
}
