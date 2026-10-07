package com.safesignal.app.emergency

import android.content.Context
import com.safesignal.app.security.EmergencyKeystoreKeyProvider
import com.safesignal.shared.emergency.EmergencyIncident
import com.safesignal.shared.emergency.EmergencyIncidentRepository
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

class AndroidEncryptedEmergencyIncidentRepository(
    context: Context,
) : EmergencyIncidentRepository {
    private val mutex = Mutex()
    private val store = EncryptedEmergencyFileStore(
        file = File(context.applicationContext.filesDir, "emergency_incidents.v1.enc"),
        keyProvider = EmergencyKeystoreKeyProvider::getOrCreate,
    )

    override suspend fun getAll(): List<EmergencyIncident> = withContext(Dispatchers.IO) {
        mutex.withLock { store.readAll() }
    }

    override suspend fun save(incident: EmergencyIncident) {
        withContext(Dispatchers.IO) {
            mutex.withLock {
                val current = store.readAll().toMutableList()
                val index = current.indexOfFirst { it.id == incident.id }
                if (index >= 0) current[index] = incident else current += incident
                store.writeAll(current)
            }
        }
    }

    override suspend fun getById(id: String): EmergencyIncident? = withContext(Dispatchers.IO) {
        mutex.withLock { store.readAll().firstOrNull { it.id == id } }
    }

    override suspend fun delete(id: String) {
        withContext(Dispatchers.IO) {
            mutex.withLock {
                store.writeAll(store.readAll().filterNot { it.id == id })
            }
        }
    }
}
