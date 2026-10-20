
package com.safesignal.shared.auth

object AuthenticationSessionResolver {

    fun resolve(
        verifiedUserId: String?,
        sessionVerified: Boolean,
    ): AuthenticationState {
        if (!sessionVerified || verifiedUserId.isNullOrBlank()) {
            return AuthenticationState.SignedOut
        }

        return AuthenticationState.SignedIn(
            userId = verifiedUserId,
        )
    }
}
