package com.safesignal.app.journey

import android.content.Context
import com.safesignal.shared.journey.JourneyConflictException
import com.safesignal.shared.journey.JourneyNotFoundException
import com.safesignal.shared.journey.JourneySession
import com.safesignal.shared.journey.JourneySessionRepository
import com.safesignal.shared.journey.JourneySessionRules
import com.safesignal.shared.journey.JourneyStatus
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

/**
 * Encrypted local-only storage. Does not start GPS monitoring, notify contacts
 * or grant another device access to a journey.
 */
class AndroidEncryptedJourneySessionRepository(context: Context) : JourneySessionRepository {
    private val mutex = Mutex()
    private val store = EncryptedJourneyFileStore(
        File(context.applicationContext.filesDir, "journey_sessions.v1.enc"),
        JourneyKeystoreKeyProvider::getOrCreate,
    )

    override suspend fun save(session: JourneySession): Unit = withContext(Dispatchers.IO) {
        mutex.withLock {
            require(JourneySessionRules.validate(session).isEmpty()) { "Invalid journey" }
            val all = store.readAll().toMutableList()
            val index = all.indexOfFirst { it.id == session.id }
            require(index < 0 || all[index].ownerId == session.ownerId) { "Journey owner mismatch" }
            if (index >= 0) all[index] = session else all += session
            store.writeAll(all)
        }
    }

    override suspend fun getById(ownerId: String, sessionId: String): JourneySession? = withContext(Dispatchers.IO) {
        mutex.withLock { store.readAll().firstOrNull { it.id == sessionId && it.ownerId == ownerId } }
    }

    override suspend fun getAllForOwner(ownerId: String): List<JourneySession> = withContext(Dispatchers.IO) {
        mutex.withLock { store.readAll().filter { it.ownerId == ownerId } }
    }

    override suspend fun transition(
        ownerId: String,
        sessionId: String,
        expectedStatus: JourneyStatus,
        toStatus: JourneyStatus,
    ): JourneySession = withContext(Dispatchers.IO) {
        mutex.withLock {
            val all = store.readAll().toMutableList()
            val index = all.indexOfFirst { it.id == sessionId && it.ownerId == ownerId }
            if (index < 0) throw JourneyNotFoundException()
            val current = all[index]
            if (current.status != expectedStatus) throw JourneyConflictException()
            require(JourneySessionRules.canTransition(current.status, toStatus)) { "Invalid journey transition" }
            val updated = current.copy(status = toStatus)
            all[index] = updated
            store.writeAll(all)
            updated
        }
    }

    override suspend fun delete(ownerId: String, sessionId: String): Unit = withContext(Dispatchers.IO) {
        mutex.withLock {
            val all = store.readAll()
            if (all.none { it.id == sessionId && it.ownerId == ownerId }) throw JourneyNotFoundException()
            store.writeAll(all.filterNot { it.id == sessionId && it.ownerId == ownerId })
        }
    }
}
