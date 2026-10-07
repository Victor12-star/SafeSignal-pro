package com.safesignal.app.emergency

import com.safesignal.shared.emergency.EmergencyIncident
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
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

internal class EncryptedEmergencyFileStore(
    private val file: File,
    private val keyProvider: () -> SecretKey,
    private val json: Json = Json { ignoreUnknownKeys = true; encodeDefaults = true },
) {
    fun readAll(): List<EmergencyIncident> {
        if (!file.exists()) return emptyList()

        val payload = DataInputStream(BufferedInputStream(FileInputStream(file))).use { input ->
            require(input.readInt() == MAGIC) { "Invalid emergency store header" }
            require(input.readUnsignedByte() == VERSION) { "Unsupported emergency store version" }

            val ivSize = input.readUnsignedByte()
            require(ivSize in 12..32) { "Invalid emergency store IV" }
            val iv = ByteArray(ivSize)
            input.readFully(iv)

            val cipherSize = input.readInt()
            require(cipherSize in 1..MAX_CIPHERTEXT_BYTES) { "Invalid emergency store size" }
            val ciphertext = ByteArray(cipherSize)
            input.readFully(ciphertext)
            require(input.read() == -1) { "Unexpected emergency store data" }

            iv to ciphertext
        }

        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, keyProvider(), GCMParameterSpec(GCM_TAG_BITS, payload.first))
        cipher.updateAAD(AAD)
        return json.decodeFromString(cipher.doFinal(payload.second).decodeToString())
    }

    fun writeAll(incidents: List<EmergencyIncident>) {
        file.parentFile?.mkdirs()

        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, keyProvider())
        cipher.updateAAD(AAD)

        val ciphertext = cipher.doFinal(json.encodeToString(incidents).encodeToByteArray())
        require(ciphertext.size <= MAX_CIPHERTEXT_BYTES) { "Emergency store exceeds size limit" }

        val temp = File(file.parentFile, file.name + ".tmp")
        val stream = FileOutputStream(temp)

        DataOutputStream(BufferedOutputStream(stream)).use { output ->
            output.writeInt(MAGIC)
            output.writeByte(VERSION)
            output.writeByte(cipher.iv.size)
            output.write(cipher.iv)
            output.writeInt(ciphertext.size)
            output.write(ciphertext)
            output.flush()
            stream.fd.sync()
        }

        try {
            Files.move(
                temp.toPath(),
                file.toPath(),
                StandardCopyOption.ATOMIC_MOVE,
                StandardCopyOption.REPLACE_EXISTING,
            )
        } catch (_: AtomicMoveNotSupportedException) {
            Files.move(temp.toPath(), file.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }
    }

    private companion object {
        const val MAGIC = 0x53534549
        const val VERSION = 1
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val GCM_TAG_BITS = 128
        const val MAX_CIPHERTEXT_BYTES = 4_194_304
        val AAD = "SafeSignalEmergencyIncidents:v1".encodeToByteArray()
    }
}
