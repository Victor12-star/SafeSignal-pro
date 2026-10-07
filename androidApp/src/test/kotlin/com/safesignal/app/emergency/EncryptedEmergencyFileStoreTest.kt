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
        val store = EncryptedEmergencyFileStore(file) { key }
        val expected = listOf(sampleIncident())

        store.writeAll(expected)

        assertEquals(expected, store.readAll())
        file.parentFile?.deleteRecursively()
    }

    @Test
    fun encryptedFileDoesNotExposePlaintext() {
        val file = tempStoreFile()
        val store = EncryptedEmergencyFileStore(file) { key }
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
        val store = EncryptedEmergencyFileStore(file) { key }
        store.writeAll(listOf(sampleIncident()))

        val bytes = file.readBytes()
        bytes[bytes.lastIndex] = (bytes.last().toInt() + 1).toByte()
        file.writeBytes(bytes)

        assertFails { store.readAll() }
        file.parentFile?.deleteRecursively()
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
