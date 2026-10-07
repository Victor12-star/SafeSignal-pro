package com.safesignal.app.contacts

import android.content.Context
import com.safesignal.app.security.AndroidKeystoreKeyProvider
import com.safesignal.app.security.EncryptedContactFileStore
import com.safesignal.shared.contacts.ContactAcceptanceStatus
import com.safesignal.shared.contacts.ContactGroup
import com.safesignal.shared.contacts.TrustedContact
import com.safesignal.shared.contacts.TrustedContactRepository
import java.io.File
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

class AndroidEncryptedTrustedContactRepository(
    context: Context,
) : TrustedContactRepository {
    private val mutex = Mutex()
    private val store = EncryptedContactFileStore(
        file = File(
            context.applicationContext.filesDir,
            "trusted_contacts.v1.enc",
        ),
        keyProvider = AndroidKeystoreKeyProvider::getOrCreate,
    )

    override suspend fun getAll(): List<TrustedContact> = withContext(Dispatchers.IO) {
        mutex.withLock {
            store.readContacts()
        }
    }

    override suspend fun add(
        name: String,
        phoneE164: String,
        group: ContactGroup,
    ): TrustedContact = withContext(Dispatchers.IO) {
        mutex.withLock {
            val existing = store.readContacts()
            val contact = TrustedContact(
                id = UUID.randomUUID().toString(),
                name = name,
                phoneE164 = phoneE164,
                group = group,
                acceptanceStatus = ContactAcceptanceStatus.PENDING,
            )
            store.writeContacts(existing + contact)
            contact
        }
    }

    override suspend fun remove(id: String) {
        withContext(Dispatchers.IO) {
            mutex.withLock {
                val updated = store.readContacts().filterNot { it.id == id }
                store.writeContacts(updated)
            }
        }
    }
}
