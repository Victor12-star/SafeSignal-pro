package com.safesignal.shared.contacts

sealed interface PhoneNumberValidationResult {
    data class Valid(val e164: String) : PhoneNumberValidationResult
    data class Invalid(val reason: String) : PhoneNumberValidationResult
}

object PhoneNumberNormalizer {

    private val removableCharacters = setOf(' ', '-', '(', ')', '.')

    fun normalize(
        rawPhone: String,
        callingCode: String,
    ): PhoneNumberValidationResult {
        val trimmed = rawPhone.trim()
        if (trimmed.isEmpty()) {
            return PhoneNumberValidationResult.Invalid("Phone number is required")
        }

        if (trimmed.any { it.isLetter() }) {
            return PhoneNumberValidationResult.Invalid("Phone number cannot contain letters")
        }

        val compact = buildString {
            trimmed.forEach { char ->
                if (char !in removableCharacters) append(char)
            }
        }

        val international = when {
            compact.startsWith("+") -> compact
            compact.startsWith("00") -> "+" + compact.drop(2)
            else -> {
                val cleanCallingCode = callingCode.trim()
                if (!cleanCallingCode.startsWith("+") ||
                    cleanCallingCode.drop(1).any { !it.isDigit() }
                ) {
                    return PhoneNumberValidationResult.Invalid("Invalid country calling code")
                }

                val localDigits = compact.dropWhile { it == '0' }
                cleanCallingCode + localDigits
            }
        }

        if (international.count { it == '+' } != 1 || !international.startsWith("+")) {
            return PhoneNumberValidationResult.Invalid("Use a valid international phone number")
        }

        val digits = international.drop(1)
        if (digits.any { !it.isDigit() }) {
            return PhoneNumberValidationResult.Invalid("Phone number contains unsupported characters")
        }

        if (digits.length !in 8..15) {
            return PhoneNumberValidationResult.Invalid("Phone number must contain 8 to 15 digits")
        }

        if (digits.startsWith("0")) {
            return PhoneNumberValidationResult.Invalid("International phone number cannot start with zero")
        }

        return PhoneNumberValidationResult.Valid("+" + digits)
    }
}
