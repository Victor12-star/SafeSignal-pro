
package com.safesignal.shared.auth

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class SupabaseAuthenticationSessionRepositoryTest {

    private class FakeGateway : AuthenticationSessionGateway {
        var initialized = false
        var sessionExists = false
        var userId = "test-user"
        var failure: Exception? = null
        var verifiedUserLookups = 0

        override suspend fun awaitInitialization() {
            initialized = true
        }

        override fun hasCurrentSession(): Boolean {
            return sessionExists
        }

        override suspend fun retrieveVerifiedUserId(): String {
            verifiedUserLookups++
            failure?.let { throw it }
            return userId
        }
    }

    @Test
    fun missingSessionReturnsSignedOut() = runTest {
        val gateway = FakeGateway()
        val repository = SupabaseAuthenticationSessionRepository(gateway)

        assertEquals(
            AuthenticationState.SignedOut,
            repository.restoreSession()
        )
        assertTrue(gateway.initialized)
        // No stored session means no identity retrieval should be attempted.
        assertEquals(0, gateway.verifiedUserLookups)
    }

    @Test
    fun verifiedSessionReturnsSignedIn() = runTest {
        val gateway = FakeGateway().apply {
            sessionExists = true
            userId = "verified-user-123"
        }

        val repository = SupabaseAuthenticationSessionRepository(gateway)

        assertEquals(
            AuthenticationState.SignedIn("verified-user-123"),
            repository.restoreSession()
        )
        assertEquals(1, gateway.verifiedUserLookups)
    }

    /**
     * A present local session is not enough to authenticate a user.
     * A missing or blank server-verified identity must fail closed.
     */
    @Test
    fun blankVerifiedUserIdReturnsSignedOut() = runTest {
        val gateway = FakeGateway().apply {
            sessionExists = true
            userId = "   "
        }

        val repository = SupabaseAuthenticationSessionRepository(gateway)
        assertEquals(AuthenticationState.SignedOut, repository.restoreSession())
    }

    /**
     * Startup failures must not expose backend details or incorrectly sign a user in.
     * SOS remains independent from the resulting authentication error state.
     */
    @Test
    fun initializationFailureReturnsSafeError() = runTest {
        val gateway = object : AuthenticationSessionGateway {
            override suspend fun awaitInitialization() {
                throw IllegalStateException("Sensitive initialization details")
            }

            override fun hasCurrentSession(): Boolean = true

            override suspend fun retrieveVerifiedUserId(): String = "should-not-be-reached"
        }

        val repository = SupabaseAuthenticationSessionRepository(gateway)
        assertEquals(
            AuthenticationState.Error("Unable to verify your session. Please try again."),
            repository.restoreSession()
        )
    }

    @Test
    fun verificationFailureReturnsSafeError() = runTest {
        val gateway = FakeGateway().apply {
            sessionExists = true
            failure = IllegalStateException("Sensitive internal error")
        }

        val repository = SupabaseAuthenticationSessionRepository(gateway)

        assertEquals(
            AuthenticationState.Error(
                "Unable to verify your session. Please try again."
            ),
            repository.restoreSession()
        )
    }

    @Test
    fun cancellationIsPropagated() = runTest {
        val gateway = FakeGateway().apply {
            sessionExists = true
            failure = CancellationException("Cancelled")
        }

        val repository = SupabaseAuthenticationSessionRepository(gateway)

        assertFailsWith<CancellationException> {
            repository.restoreSession()
        }
    }

    /**
     * Lifecycle cancellation during startup must propagate to the caller.
     * Swallowing it as a display error could leave obsolete authentication work running.
     */
    @Test
    fun initializationCancellationIsPropagated() = runTest {
        val gateway = object : AuthenticationSessionGateway {
            override suspend fun awaitInitialization() {
                throw CancellationException("Screen no longer active")
            }

            override fun hasCurrentSession(): Boolean = true

            override suspend fun retrieveVerifiedUserId(): String = "unreachable-user"
        }

        val repository = SupabaseAuthenticationSessionRepository(gateway)

        assertFailsWith<CancellationException> {
            repository.restoreSession()
        }
    }

    @Test
    fun sessionVerificationTimeoutReturnsSafeError() = runTest {
        val gateway = object : AuthenticationSessionGateway {

            override suspend fun awaitInitialization() {
                awaitCancellation()
            }

            override fun hasCurrentSession(): Boolean = true

            override suspend fun retrieveVerifiedUserId(): String {
                return "unreachable-user"
            }
        }

        val repository = SupabaseAuthenticationSessionRepository(gateway)

        assertEquals(
            AuthenticationState.Error(
                "Session verification timed out. Please try again."
            ),
            repository.restoreSession()
        )
    }
}
