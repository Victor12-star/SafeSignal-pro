package com.safesignal.shared.auth

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/** Regression tests for the exact allowlisted authentication App Link. */
class AuthenticationCallbackPolicyTest {
    @Test
    fun validCallbackIsAllowed() {
        assertTrue(AuthenticationCallbackPolicy.isAllowed("https", "auth.vikwora.com", "/login-callback"))
    }

    @Test
    fun insecureOrWrongDestinationsAreRejected() {
        assertFalse(AuthenticationCallbackPolicy.isAllowed("http", "auth.vikwora.com", "/login-callback"))
        assertFalse(AuthenticationCallbackPolicy.isAllowed("https", "evil.example", "/login-callback"))
        assertFalse(AuthenticationCallbackPolicy.isAllowed("https", "auth.vikwora.com.evil.example", "/login-callback"))
        assertFalse(AuthenticationCallbackPolicy.isAllowed("https", "auth.vikwora.com", "/different"))
        assertFalse(AuthenticationCallbackPolicy.isAllowed("https", "auth.vikwora.com", "/login-callback/"))
    }

    @Test
    fun missingUriFieldsAreRejected() {
        assertFalse(AuthenticationCallbackPolicy.isAllowed(null, "auth.vikwora.com", "/login-callback"))
        assertFalse(AuthenticationCallbackPolicy.isAllowed("https", null, "/login-callback"))
        assertFalse(AuthenticationCallbackPolicy.isAllowed("https", "auth.vikwora.com", null))
    }
}
