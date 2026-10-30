package com.safesignal.shared.journey

import kotlinx.coroutines.sync.withLock

/**
 * Storage boundary for journey data. Implementations must encrypt local records,
 * enforce owner isolation and never treat repository writes as proof of monitoring.
 */
interface JourneySessionRepository {
    suspend fun save(session: JourneySession)
    suspend fun getById(ownerId: String, sessionId: String): JourneySession?
    suspend fun getAllForOwner(ownerId: String): List<JourneySession>
    suspend fun transition(ownerId: String, sessionId: String, expectedStatus: JourneyStatus, toStatus: JourneyStatus): JourneySession
    suspend fun delete(ownerId: String, sessionId: String)
}

/** Raised for missing sessions or unauthorised owner requests, without leaking existence. */
class JourneyNotFoundException : IllegalStateException("Journey not found")
class JourneyConflictException : IllegalStateException("Journey state changed; refresh and retry")

/**
 * Local test-only implementation. Never use in production: data is not persisted or encrypted.
 */
class InMemoryJourneySessionRepository : JourneySessionRepository {
    private val lock = kotlinx.coroutines.sync.Mutex()
    private val sessions = mutableMapOf<String, JourneySession>()

    override suspend fun save(session: JourneySession) = lock.withLock {
        require(JourneySessionRules.validate(session).isEmpty()) { "Invalid journey session" }
        val existing = sessions[session.id]
        require(existing == null || existing.ownerId == session.ownerId) { "Cannot replace another owner's journey" }
        sessions[session.id] = session.copy(trustedContactIds = session.trustedContactIds.toList())
    }

    override suspend fun getById(ownerId: String, sessionId: String): JourneySession? = lock.withLock {
        sessions[sessionId]?.takeIf { it.ownerId == ownerId }?.copy(trustedContactIds = sessions[sessionId]!!.trustedContactIds.toList())
    }

    override suspend fun getAllForOwner(ownerId: String): List<JourneySession> = lock.withLock {
        sessions.values.filter { it.ownerId == ownerId }.map { it.copy(trustedContactIds = it.trustedContactIds.toList()) }
    }

    override suspend fun transition(ownerId: String, sessionId: String, expectedStatus: JourneyStatus, toStatus: JourneyStatus): JourneySession = lock.withLock {
        val current = sessions[sessionId]?.takeIf { it.ownerId == ownerId } ?: throw JourneyNotFoundException()
        if (current.status != expectedStatus) throw JourneyConflictException()
        require(JourneySessionRules.canTransition(current.status, toStatus)) { "Journey transition not permitted" }
        current.copy(status = toStatus).also { sessions[sessionId] = it }
    }

    override suspend fun delete(ownerId: String, sessionId: String) {
        lock.withLock {
            val current = sessions[sessionId]?.takeIf { it.ownerId == ownerId } ?: throw JourneyNotFoundException()
            sessions.remove(current.id)
        }
    }
}
