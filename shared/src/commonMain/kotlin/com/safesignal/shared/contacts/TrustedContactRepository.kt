package com.safesignal.shared.contacts

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

interface TrustedContactRepository {
    suspend fun getAll(): List<TrustedContact>

    suspend fun add(
        name: String,
        phoneE164: String,
        group: ContactGroup,
    ): TrustedContact

    suspend fun remove(id: String)
}

class InMemoryTrustedContactRepository : TrustedContactRepository {
    private val mutex = Mutex()
    private val contacts = mutableListOf<TrustedContact>()
    private var nextId = 1L

    override suspend fun getAll(): List<TrustedContact> = mutex.withLock {
        contacts.toList()
    }

    override suspend fun add(
        name: String,
        phoneE164: String,
        group: ContactGroup,
    ): TrustedContact = mutex.withLock {
        val contact = TrustedContact(
            id = "memory-contact-${nextId++}",
            name = name,
            phoneE164 = phoneE164,
            group = group,
            acceptanceStatus = ContactAcceptanceStatus.PENDING,
        )
        contacts += contact
        contact
    }

    override suspend fun remove(id: String) {
        mutex.withLock {
            contacts.removeAll { it.id == id }
        }
    }
}
