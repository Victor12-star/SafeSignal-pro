
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
     * Session restoration is repeated when the app resumes or auth changes.
     * A previously verified identity must not remain signed in after its local session disappears.
     */
    @Test
    fun missingSessionAfterSuccessfulRestorationReturnsSignedOut() = runTest {
        val gateway = FakeGateway().apply {
            sessionExists = true
            userId = "previous-user"
        }
        val repository = SupabaseAuthenticationSessionRepository(gateway)

        assertEquals(AuthenticationState.SignedIn("previous-user"), repository.restoreSession())
        assertEquals(1, gateway.verifiedUserLookups)

        gateway.sessionExists = false
        assertEquals(AuthenticationState.SignedOut, repository.restoreSession())
        // A missing session must short-circuit and never reuse or refetch the old identity.
        assertEquals(1, gateway.verifiedUserLookups)
    }

    /**
     * When account switching changes the server-verified user, each restoration
     * must read the current identity instead of reusing a previously verified one.
     */
    @Test
    fun accountSwitchUsesFreshVerifiedIdentity() = runTest {
        val gateway = FakeGateway().apply {
            sessionExists = true
            userId = "first-user"
        }
        val repository = SupabaseAuthenticationSessionRepository(gateway)

        assertEquals(AuthenticationState.SignedIn("first-user"), repository.restoreSession())
        gateway.userId = "second-user"
        assertEquals(AuthenticationState.SignedIn("second-user"), repository.restoreSession())
        assertEquals(2, gateway.verifiedUserLookups)
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

    /**
     * Even checking for a cached session may fail (for example, a corrupt local store).
     * Do not expose internal error details or attempt identity lookup after this failure.
     */
    @Test
    fun sessionPresenceFailureReturnsSafeErrorWithoutIdentityLookup() = runTest {
        var identityLookups = 0
        val gateway = object : AuthenticationSessionGateway {
            override suspend fun awaitInitialization() = Unit

            override fun hasCurrentSession(): Boolean {
                throw IllegalStateException("Sensitive local storage details")
            }

            override suspend fun retrieveVerifiedUserId(): String {
                identityLookups++
                return "must-not-be-used"
            }
        }

        val repository = SupabaseAuthenticationSessionRepository(gateway)
        assertEquals(
            AuthenticationState.Error("Unable to verify your session. Please try again."),
            repository.restoreSession(),
        )
        assertEquals(0, identityLookups)
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

    /**
     * A hanging network lookup after a locally stored session is found must time out.
     * A cached session alone cannot justify showing the user as authenticated.
     */
    @Test
    fun verifiedIdentityLookupTimeoutReturnsSafeError() = runTest {
        val gateway = object : AuthenticationSessionGateway {
            override suspend fun awaitInitialization() = Unit

            override fun hasCurrentSession(): Boolean = true

            override suspend fun retrieveVerifiedUserId(): String {
                awaitCancellation()
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
