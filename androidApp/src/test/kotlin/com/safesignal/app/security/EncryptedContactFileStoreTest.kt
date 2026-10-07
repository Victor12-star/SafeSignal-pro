package com.safesignal.app.security

import com.safesignal.shared.contacts.ContactAcceptanceStatus
import com.safesignal.shared.contacts.ContactGroup
import com.safesignal.shared.contacts.TrustedContact
import java.io.File
import javax.crypto.spec.SecretKeySpec
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFails
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class EncryptedContactFileStoreTest {
    private val key = SecretKeySpec(
        ByteArray(32) { index -> (index + 1).toByte() },
        "AES",
    )

    @Test
    fun roundTripPreservesContacts() {
        val file = tempStoreFile()
        val store = EncryptedContactFileStore(
            file = file,
            keyProvider = { key },
        )
        val expected = listOf(sampleContact())

        store.writeContacts(expected)

        assertEquals(expected, store.readContacts())
        file.delete()
    }

    @Test
    fun encryptedFileDoesNotContainContactPlaintext() {
        val file = tempStoreFile()
        val store = EncryptedContactFileStore(
            file = file,
            keyProvider = { key },
        )
        val contact = sampleContact()

        store.writeContacts(listOf(contact))

        val raw = file.readBytes().decodeToString()
        assertFalse(raw.contains(contact.name))
        assertFalse(raw.contains(contact.phoneE164))
        assertTrue(file.length() > 0L)
        file.delete()
    }

    @Test
    fun tamperingCausesAuthenticatedDecryptionFailure() {
        val file = tempStoreFile()
        val store = EncryptedContactFileStore(
            file = file,
            keyProvider = { key },
        )
        store.writeContacts(listOf(sampleContact()))

        val bytes = file.readBytes()
        bytes[bytes.lastIndex] = (bytes.last() xor 0x01)
        file.writeBytes(bytes)

        assertFails {
            store.readContacts()
        }
        file.delete()
    }

    private fun sampleContact() = TrustedContact(
        id = "contact-1",
        name = "Daniel Example",
        phoneE164 = "+46701234567",
        group = ContactGroup.FAMILY,
        acceptanceStatus = ContactAcceptanceStatus.PENDING,
    )

    private fun tempStoreFile(): File {
        val directory = kotlin.io.path.createTempDirectory("safesignal-contact-test").toFile()
        return File(directory, "contacts.enc")
    }
}

private infix fun Byte.xor(other: Int): Byte = (toInt() xor other).toByte()
