
package com.safesignal.shared.auth

interface AuthenticationSessionRepository {
    suspend fun restoreSession(): AuthenticationState
}
