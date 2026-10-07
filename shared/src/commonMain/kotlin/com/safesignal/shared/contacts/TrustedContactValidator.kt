package com.safesignal.shared.contacts

data class ContactValidationResult(
    val normalizedName: String? = null,
    val normalizedPhoneE164: String? = null,
    val errors: List<String> = emptyList(),
) {
    val isValid: Boolean
        get() = errors.isEmpty() &&
            normalizedName != null &&
            normalizedPhoneE164 != null
}

object TrustedContactValidator {

    fun validate(
        name: String,
        rawPhone: String,
        callingCode: String,
    ): ContactValidationResult {
        val errors = mutableListOf<String>()
        val normalizedName = name.trim()

        if (normalizedName.isBlank()) {
            errors += "Name is required"
        } else if (normalizedName.length > 80) {
            errors += "Name must be 80 characters or fewer"
        }

        val phoneResult = PhoneNumberNormalizer.normalize(
            rawPhone = rawPhone,
            callingCode = callingCode,
        )

        val normalizedPhone = when (phoneResult) {
            is PhoneNumberValidationResult.Valid -> phoneResult.e164
            is PhoneNumberValidationResult.Invalid -> {
                errors += phoneResult.reason
                null
            }
        }

        return ContactValidationResult(
            normalizedName = normalizedName.takeIf { it.isNotBlank() && it.length <= 80 },
            normalizedPhoneE164 = normalizedPhone,
            errors = errors,
        )
    }
}
