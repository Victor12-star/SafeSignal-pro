package com.safesignal.app.emergency

import com.safesignal.shared.emergency.EmergencyCategory
import com.safesignal.shared.emergency.EmergencyIncident
import com.safesignal.shared.emergency.EmergencyState
import java.io.File
import javax.crypto.spec.SecretKeySpec
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFails
import kotlin.test.assertFalse

class EncryptedEmergencyFileStoreTest {
    private val key = SecretKeySpec(ByteArray(32) { 7 }, "AES")

    @Test
    fun roundTripPreservesIncident() {
        val file = tempStoreFile()
        val store = EncryptedEmergencyFileStore(file = file, keyProvider = { key })
        val expected = listOf(sampleIncident())

        store.writeAll(expected)

        val reopened = EncryptedEmergencyFileStore(
            file = file,
            keyProvider = { key },
        )
        assertEquals(expected, reopened.readAll())
        file.parentFile?.deleteRecursively()
    }

    @Test
    fun encryptedFileDoesNotExposePlaintext() {
        val file = tempStoreFile()
        val store = EncryptedEmergencyFileStore(file = file, keyProvider = { key })
        val incident = sampleIncident()

        store.writeAll(listOf(incident))

        val raw = file.readBytes().decodeToString()
        assertFalse(raw.contains(incident.id))
        assertFalse(raw.contains("MEDICAL"))
        file.parentFile?.deleteRecursively()
    }

    @Test
    fun tamperedCiphertextIsRejected() {
        val file = tempStoreFile()
        val store = EncryptedEmergencyFileStore(file = file, keyProvider = { key })
        store.writeAll(listOf(sampleIncident()))

        val bytes = file.readBytes()
        bytes[bytes.lastIndex] = (bytes.last().toInt() + 1).toByte()
        file.writeBytes(bytes)

        assertFails { store.readAll() }
        file.parentFile?.deleteRecursively()
    }

    /** An incorrect encryption key must never expose or silently reset emergency records. */
    @Test
    fun incorrectEncryptionKeyCannotReadOrChangeSavedIncidents() {
        val file = tempStoreFile()
        try {
            val originalStore = EncryptedEmergencyFileStore(file = file, keyProvider = { key })
            val expected = listOf(sampleIncident())
            originalStore.writeAll(expected)
            val originalBytes = file.readBytes()

            val wrongKey = SecretKeySpec(ByteArray(32) { 8 }, "AES")
            val wrongKeyStore = EncryptedEmergencyFileStore(file = file, keyProvider = { wrongKey })
            assertFails { wrongKeyStore.readAll() }

            assertEquals(originalBytes.toList(), file.readBytes().toList())
            assertEquals(expected, originalStore.readAll())
        } finally {
            file.parentFile?.deleteRecursively()
        }
    }

    /** Unexpected bytes after an encrypted SOS record indicate tampering or corruption. */
    @Test
    fun trailingBytesAreRejectedWithoutChangingEncryptedStore() {
        val file = tempStoreFile()
        try {
            val store = EncryptedEmergencyFileStore(file = file, keyProvider = { key })
            store.writeAll(listOf(sampleIncident()))
            val corrupted = file.readBytes() + byteArrayOf(0x42)
            file.writeBytes(corrupted)

            assertFails { store.readAll() }
            assertEquals(corrupted.toList(), file.readBytes().toList())
        } finally {
            file.parentFile?.deleteRecursively()
        }
    }

    /** A partially written encrypted incident file must never look like an empty store. */
    @Test
    fun truncatedCiphertextIsRejectedWithoutErasingOriginalBytes() {
        val file = tempStoreFile()
        try {
            val store = EncryptedEmergencyFileStore(file = file, keyProvider = { key })
            store.writeAll(listOf(sampleIncident()))
            val original = file.readBytes()
            val truncated = original.copyOf(original.size - 1)
            file.writeBytes(truncated)

            assertFails { store.readAll() }
            assertEquals(truncated.toList(), file.readBytes().toList())
        } finally {
            file.parentFile?.deleteRecursively()
        }
    }

    /** An invalid file header must not be accepted as an empty or valid SOS store. */
    @Test
    fun corruptedHeaderIsRejectedWithoutChangingStoredBytes() {
        val file = tempStoreFile()
        try {
            val store = EncryptedEmergencyFileStore(file = file, keyProvider = { key })
            store.writeAll(listOf(sampleIncident()))
            val corrupted = file.readBytes()
            corrupted[0] = (corrupted[0].toInt() xor 0x01).toByte()
            file.writeBytes(corrupted)

            assertFails { store.readAll() }
            assertEquals(corrupted.toList(), file.readBytes().toList())
        } finally {
            file.parentFile?.deleteRecursively()
        }
    }

    /** A tampered version byte must not cause silent acceptance or data loss. */
    @Test
    fun unsupportedEncryptedStoreVersionIsRejectedWithoutChangingFile() {
        val file = tempStoreFile()
        try {
            val store = EncryptedEmergencyFileStore(file = file, keyProvider = { key })
            store.writeAll(listOf(sampleIncident()))
            val corrupted = file.readBytes()
            // Four magic bytes precede the format version byte.
            corrupted[4] = 0x7f.toByte()
            file.writeBytes(corrupted)

            assertFails { store.readAll() }
            assertEquals(corrupted.toList(), file.readBytes().toList())
        } finally {
            file.parentFile?.deleteRecursively()
        }
    }

    /** Invalid IV lengths must be rejected before attempting SOS record decryption. */
    @Test
    fun malformedInitializationVectorLengthIsRejectedWithoutChangingFile() {
        val file = tempStoreFile()
        try {
            val store = EncryptedEmergencyFileStore(file = file, keyProvider = { key })
            store.writeAll(listOf(sampleIncident()))
            val corrupted = file.readBytes()
            // Header layout: four magic bytes, one version byte, then one IV-length byte.
            corrupted[5] = 0x01.toByte()
            file.writeBytes(corrupted)

            assertFails { store.readAll() }
            assertEquals(corrupted.toList(), file.readBytes().toList())
        } finally {
            file.parentFile?.deleteRecursively()
        }
    }

    /** Invalid ciphertext lengths must fail before allocating or decrypting SOS data. */
    @Test
    fun zeroCiphertextLengthIsRejectedWithoutChangingFile() {
        val file = tempStoreFile()
        try {
            val store = EncryptedEmergencyFileStore(file = file, keyProvider = { key })
            store.writeAll(listOf(sampleIncident()))
            val corrupted = file.readBytes()
            val ivLength = corrupted[5].toInt() and 0xff
            val ciphertextLengthOffset = 6 + ivLength
            // DataInputStream reads this four-byte field in big-endian order.
            for (index in ciphertextLengthOffset until ciphertextLengthOffset + 4) {
                corrupted[index] = 0
            }
            file.writeBytes(corrupted)

            assertFails { store.readAll() }
            assertEquals(corrupted.toList(), file.readBytes().toList())
        } finally {
            file.parentFile?.deleteRecursively()
        }
    }

    /** Oversized ciphertext metadata must fail before allocating emergency payload memory. */
    @Test
    fun oversizedCiphertextLengthIsRejectedWithoutChangingFile() {
        val file = tempStoreFile()
        try {
            val store = EncryptedEmergencyFileStore(file = file, keyProvider = { key })
            store.writeAll(listOf(sampleIncident()))
            val corrupted = file.readBytes()
            val ivLength = corrupted[5].toInt() and 0xff
            val sizeOffset = 6 + ivLength
            // 0x7fffffff is larger than the store's permitted 4 MiB ciphertext limit.
            corrupted[sizeOffset] = 0x7f.toByte()
            corrupted[sizeOffset + 1] = 0xff.toByte()
            corrupted[sizeOffset + 2] = 0xff.toByte()
            corrupted[sizeOffset + 3] = 0xff.toByte()
            file.writeBytes(corrupted)

            assertFails { store.readAll() }
            assertEquals(corrupted.toList(), file.readBytes().toList())
        } finally {
            file.parentFile?.deleteRecursively()
        }
    }

    /** Negative ciphertext length metadata must fail without touching saved SOS bytes. */
    @Test
    fun negativeCiphertextLengthIsRejectedWithoutChangingFile() {
        val file = tempStoreFile()
        try {
            val store = EncryptedEmergencyFileStore(file = file, keyProvider = { key })
            store.writeAll(listOf(sampleIncident()))
            val corrupted = file.readBytes()
            val ivLength = corrupted[5].toInt() and 0xff
            val sizeOffset = 6 + ivLength
            // -1 in a signed, big-endian four-byte length field.
            for (index in sizeOffset until sizeOffset + 4) {
                corrupted[index] = 0xff.toByte()
            }
            file.writeBytes(corrupted)

            assertFails { store.readAll() }
            assertEquals(corrupted.toList(), file.readBytes().toList())
        } finally {
            file.parentFile?.deleteRecursively()
        }
    }

    private fun sampleIncident() = EmergencyIncident(
        id = "incident-123",
        category = EmergencyCategory.MEDICAL,
        state = EmergencyState.CREATED,
        recipientIds = listOf("contact-1"),
        createdAtEpochMillis = 1_000L,
        updatedAtEpochMillis = 1_000L,
    )

    private fun tempStoreFile(): File {
        val directory = kotlin.io.path.createTempDirectory("safesignal-incident-test").toFile()
        return File(directory, "incidents.enc")
    }
}
