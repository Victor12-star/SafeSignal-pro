
package com.safesignal.shared.auth

import kotlin.test.Test
import kotlin.test.assertEquals

class AuthenticationSessionResolverTest {

    @Test
    fun unverifiedSessionIsSignedOut() {
        val state = AuthenticationSessionResolver.resolve(
            verifiedUserId = "example-user",
            sessionVerified = false,
        )

        assertEquals(AuthenticationState.SignedOut, state)
    }

    @Test
    fun missingUserIsSignedOut() {
        val state = AuthenticationSessionResolver.resolve(
            verifiedUserId = null,
            sessionVerified = true,
        )

        assertEquals(AuthenticationState.SignedOut, state)
    }

    @Test
    fun blankUserIsSignedOut() {
        val state = AuthenticationSessionResolver.resolve(
            verifiedUserId = " ",
            sessionVerified = true,
        )

        assertEquals(AuthenticationState.SignedOut, state)
    }

    @Test
    fun verifiedSessionWithUserReturnsSignedIn() {
        val state = AuthenticationSessionResolver.resolve(
            verifiedUserId = "test-user-123",
            sessionVerified = true,
        )

        assertEquals(
            AuthenticationState.SignedIn("test-user-123"),
            state,
        )
    }
}
