
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

    /**
     * Kotlin's isNullOrBlank treats tabs and line breaks as blank too.
     * This prevents whitespace-only identities from being accepted as authenticated users.
     */
    @Test
    fun whitespaceOnlyVerifiedIdentityIsSignedOut() {
        for (value in listOf("", "\t", "\n", " \t \n ")) {
            assertEquals(
                AuthenticationState.SignedOut,
                AuthenticationSessionResolver.resolve(
                    verifiedUserId = value,
                    sessionVerified = true,
                ),
            )
        }
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
