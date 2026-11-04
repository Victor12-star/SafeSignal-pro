package com.safesignal.shared.journey

import com.safesignal.shared.auth.AuthenticationState

/** Explicit prerequisite feedback; does not authorize saving or start tracking. */
object JourneySaveFeedback {
    fun reason(
        authenticationState: AuthenticationState,
        contactsLoaded: Boolean,
        contactsAvailable: Boolean,
        contactStorageFailed: Boolean,
        destination: String,
        durationMinutes: String,
    ): String? {
        if (authenticationState is AuthenticationState.Checking) {
            return "Checking your sign-in. Saving is not available yet."
        }
        if (authenticationState !is AuthenticationState.SignedIn) {
            return "Sign in to save a private journey draft. SOS remains available without signing in."
        }
        if (!contactsLoaded) return "Loading trusted contacts. Try again when loading finishes."
        if (contactStorageFailed) return "Trusted contacts could not be loaded securely. Cannot save a draft."
        if (!contactsAvailable) return "Add at least one active trusted contact before saving."
        return JourneyDraftValidator.validate(destination, durationMinutes).errors
            .takeIf { it.isNotEmpty() }?.joinToString(". ")
    }
}
