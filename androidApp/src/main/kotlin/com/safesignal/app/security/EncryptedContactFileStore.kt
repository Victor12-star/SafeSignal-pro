package com.safesignal.app.security

import com.safesignal.shared.contacts.TrustedContact
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

internal class EncryptedContactFileStore(
    private val file: File,
    private val keyProvider: () -> SecretKey,
    private val json: Json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    },
) {
    fun readContacts(): List<TrustedContact> {
        if (!file.exists()) return emptyList()

        val payload = DataInputStream(
            BufferedInputStream(FileInputStream(file)),
        ).use { input ->
            val magic = input.readInt()
            require(magic == MAGIC) { "Invalid trusted-contact store header" }

            val version = input.readUnsignedByte()
            require(version == VERSION) { "Unsupported trusted-contact store version" }

            val ivSize = input.readUnsignedByte()
            require(ivSize in 12..32) { "Invalid trusted-contact store IV" }

            val iv = ByteArray(ivSize)
            input.readFully(iv)

            val cipherSize = input.readInt()
            require(cipherSize in 1..MAX_CIPHERTEXT_BYTES) { "Invalid trusted-contact store size" }

            val ciphertext = ByteArray(cipherSize)
            input.readFully(ciphertext)

            require(input.read() == -1) { "Unexpected trusted-contact store data" }

            EncryptedPayload(iv = iv, ciphertext = ciphertext)
        }

        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(
            Cipher.DECRYPT_MODE,
            keyProvider(),
            GCMParameterSpec(GCM_TAG_BITS, payload.iv),
        )
        cipher.updateAAD(AAD)

        val plaintext = cipher.doFinal(payload.ciphertext)
        return json.decodeFromString(plaintext.decodeToString())
    }

    fun writeContacts(contacts: List<TrustedContact>) {
        file.parentFile?.mkdirs()

        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, keyProvider())
        cipher.updateAAD(AAD)

        val plaintext = json.encodeToString(contacts).encodeToByteArray()
        val ciphertext = cipher.doFinal(plaintext)
        val iv = cipher.iv

        require(ciphertext.size <= MAX_CIPHERTEXT_BYTES) {
            "Trusted-contact store exceeds size limit"
        }

        val tempFile = File(file.parentFile, file.name + ".tmp")
        val fileStream = FileOutputStream(tempFile)

        DataOutputStream(
            BufferedOutputStream(fileStream),
        ).use { output ->
            output.writeInt(MAGIC)
            output.writeByte(VERSION)
            output.writeByte(iv.size)
            output.write(iv)
            output.writeInt(ciphertext.size)
            output.write(ciphertext)
            output.flush()
            fileStream.fd.sync()
        }

        try {
            Files.move(
                tempFile.toPath(),
                file.toPath(),
                StandardCopyOption.ATOMIC_MOVE,
                StandardCopyOption.REPLACE_EXISTING,
            )
        } catch (_: AtomicMoveNotSupportedException) {
            Files.move(
                tempFile.toPath(),
                file.toPath(),
                StandardCopyOption.REPLACE_EXISTING,
            )
        }
    }

    private data class EncryptedPayload(
        val iv: ByteArray,
        val ciphertext: ByteArray,
    )

    private companion object {
        const val MAGIC = 0x53534354
        const val VERSION = 1
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val GCM_TAG_BITS = 128
        const val MAX_CIPHERTEXT_BYTES = 1_048_576
        val AAD = "SafeSignalTrustedContacts:v1".encodeToByteArray()
    }
}
