
package com.safesignal.shared.auth

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class AuthenticationStateTest {

    @Test
    fun checkingStateCanBeCreated() {
        val state: AuthenticationState = AuthenticationState.Checking

        assertIs<AuthenticationState.Checking>(state)
    }

    @Test
    fun signedOutStateCanBeCreated() {
        val state: AuthenticationState = AuthenticationState.SignedOut

        assertIs<AuthenticationState.SignedOut>(state)
    }

    @Test
    fun signedInStateContainsUserId() {
        val state = AuthenticationState.SignedIn(
            userId = "test-user-123",
        )

        assertEquals("test-user-123", state.userId)
    }

    @Test
    fun errorStateContainsMessage() {
        val state = AuthenticationState.Error(
            message = "Authentication failed",
        )

        assertEquals("Authentication failed", state.message)
    }
}
