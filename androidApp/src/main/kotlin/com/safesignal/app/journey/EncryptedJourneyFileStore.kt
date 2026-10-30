package com.safesignal.app.journey

import com.safesignal.shared.journey.JourneySession
import com.safesignal.shared.journey.JourneyStatus
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.DataInputStream
import java.io.DataOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.file.AtomicMoveNotSupportedException
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json

@Serializable
private data class StoredJourney(
    val id: String,
    val ownerId: String,
    val destination: String,
    val expectedArrivalEpochMillis: Long,
    val trustedContactIds: List<String>,
    val status: String,
    val createdAtEpochMillis: Long,
    val lastLocationEpochMillis: Long?,
) {
    fun toDomain() = JourneySession(
        id, ownerId, destination, expectedArrivalEpochMillis, trustedContactIds,
        JourneyStatus.valueOf(status), createdAtEpochMillis, lastLocationEpochMillis,
    )
}

internal class EncryptedJourneyFileStore(
    private val file: File,
    private val keyProvider: () -> SecretKey,
) {
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    fun readAll(): List<JourneySession> {
        if (!file.exists()) return emptyList()
        val (iv, ciphertext) = DataInputStream(BufferedInputStream(FileInputStream(file))).use { input ->
            require(input.readInt() == MAGIC) { "Invalid journey file" }
            require(input.readUnsignedByte() == VERSION) { "Unsupported journey file version" }
            val ivLength = input.readUnsignedByte()
            require(ivLength == 12) { "Invalid journey nonce" }
            val iv = ByteArray(ivLength).also(input::readFully)
            val ciphertextLength = input.readInt()
            require(ciphertextLength in 16..MAX_CIPHERTEXT) { "Invalid journey ciphertext size" }
            val ciphertext = ByteArray(ciphertextLength).also(input::readFully)
            require(input.read() == -1) { "Trailing journey bytes" }
            iv to ciphertext
        }
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, keyProvider(), GCMParameterSpec(128, iv))
        cipher.updateAAD(AAD)
        val decoded = json.decodeFromString<List<StoredJourney>>(cipher.doFinal(ciphertext).decodeToString())
        return decoded.map { it.toDomain() }
    }

    fun writeAll(sessions: List<JourneySession>) {
        file.parentFile?.mkdirs()
        val stored = sessions.map {
            StoredJourney(
                it.id, it.ownerId, it.destination, it.expectedArrivalEpochMillis,
                it.trustedContactIds, it.status.name, it.createdAtEpochMillis, it.lastLocationEpochMillis,
            )
        }
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, keyProvider())
        cipher.updateAAD(AAD)
        val ciphertext = cipher.doFinal(json.encodeToString(stored).encodeToByteArray())
        require(ciphertext.size <= MAX_CIPHERTEXT) { "Journey data too large" }
        val temp = File(file.parentFile, file.name + ".tmp")
        DataOutputStream(BufferedOutputStream(FileOutputStream(temp))).use { output ->
            output.writeInt(MAGIC)
            output.writeByte(VERSION)
            output.writeByte(cipher.iv.size)
            output.write(cipher.iv)
            output.writeInt(ciphertext.size)
            output.write(ciphertext)
            output.flush()
        }
        try {
            Files.move(temp.toPath(), file.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
        } catch (_: AtomicMoveNotSupportedException) {
            Files.move(temp.toPath(), file.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }
    }

    private companion object {
        const val MAGIC = 0x53534A31
        const val VERSION = 1
        const val MAX_CIPHERTEXT = 4_194_304
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        val AAD = "SafeSignalJourneySessions:v1".encodeToByteArray()
    }
}
