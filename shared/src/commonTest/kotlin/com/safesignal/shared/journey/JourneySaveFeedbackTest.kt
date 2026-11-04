package com.safesignal.shared.journey

import com.safesignal.shared.auth.AuthenticationState
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class JourneySaveFeedbackTest {
    private fun reason(
        auth: AuthenticationState = AuthenticationState.SignedIn("owner-1"),
        contactsLoaded: Boolean = true,
        contactsAvailable: Boolean = true,
        storageFailed: Boolean = false,
        destination: String = "Library",
        duration: String = "30",
    ) = JourneySaveFeedback.reason(
        auth, contactsLoaded, contactsAvailable, storageFailed, destination, duration,
    )

    @Test fun validSignedInDraftHasNoBlocker() {
        assertNull(reason())
    }

    @Test fun signedOutAndCheckingSessionsShowClearMessages() {
        assertTrue(reason(auth = AuthenticationState.SignedOut)!!.contains("Sign in"))
        assertTrue(reason(auth = AuthenticationState.Checking)!!.contains("Checking"))
        assertTrue(reason(auth = AuthenticationState.Error("Network"))!!.contains("Sign in"))
    }

    @Test fun missingContactsAndStorageFailureExplainTheBlocker() {
        assertTrue(reason(contactsLoaded = false)!!.contains("Loading"))
        assertTrue(reason(storageFailed = true)!!.contains("could not be loaded"))
        assertTrue(reason(contactsAvailable = false)!!.contains("active trusted contact"))
    }

    @Test fun invalidInputsShowRealValidationErrors() {
        assertEquals("Destination is required", reason(destination = " "))
        assertEquals("Duration must be between 1 and 1440 minutes", reason(duration = "0"))
        assertTrue(reason(destination = "", duration = "invalid")!!.contains("Duration must"))
    }
}
