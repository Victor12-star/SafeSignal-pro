
package com.safesignal.shared.auth

interface AuthenticationSessionGateway {
    suspend fun awaitInitialization()

    fun hasCurrentSession(): Boolean

    suspend fun retrieveVerifiedUserId(): String
}
