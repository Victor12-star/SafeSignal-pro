package com.safesignal.shared.auth

sealed interface AuthenticationState {
    data object Checking : AuthenticationState

    data object SignedOut : AuthenticationState

    data class SignedIn(
        val userId: String,
    ) : AuthenticationState

    data class Error(
        val message: String,
    ) : AuthenticationState
}