package com.safesignal.app.journey

import com.safesignal.shared.journey.JourneySession
import com.safesignal.shared.journey.JourneyStatus
import java.io.File
import javax.crypto.KeyGenerator
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFails
import kotlin.test.assertFalse

class EncryptedJourneyFileStoreTest {
    @Test fun roundTripsWithoutPlaintext() {
        val file = File.createTempFile("ss-journey", ".enc")
        file.delete()
        try {
            val key = KeyGenerator.getInstance("AES").apply { init(256) }.generateKey()
            val store = EncryptedJourneyFileStore(file) { key }
            val record = JourneySession("session-1", "owner-1", "Local shop",
                2000L, listOf("trusted-1"), JourneyStatus.DRAFT, 1000L)
            store.writeAll(listOf(record))
            assertEquals(listOf(record), store.readAll())
            assertFalse(file.readBytes().decodeToString().contains("Local shop"))
        } finally { file.delete() }
    }

    @Test fun refusesWrongKey() {
        val file = File.createTempFile("ss-journey", ".enc")
        file.delete()
        try {
            fun key() = KeyGenerator.getInstance("AES").apply { init(256) }.generateKey()
            val first = key()
            val second = key()
            EncryptedJourneyFileStore(file) { first }.writeAll(emptyList())
            assertFails { EncryptedJourneyFileStore(file) { second }.readAll() }
        } finally { file.delete() }
    }
}
