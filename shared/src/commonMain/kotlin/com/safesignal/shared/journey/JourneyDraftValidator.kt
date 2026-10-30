package com.safesignal.shared.journey

data class JourneyDraftValidation(
    val destination: String?,
    val durationMinutes: Int?,
    val errors: List<String>,
) {
    val isValid: Boolean get() = errors.isEmpty() && destination != null && durationMinutes != null
}

/** Validation only: a valid draft does not imply that monitoring has started. */
object JourneyDraftValidator {
    fun validate(destination: String, durationMinutes: String): JourneyDraftValidation {
        val errors = mutableListOf<String>()
        val normalizedDestination = destination.trim()
        if (normalizedDestination.isBlank()) errors += "Destination is required"
        else if (normalizedDestination.length > 120) errors += "Destination must be 120 characters or fewer"

        val parsed = durationMinutes.toIntOrNull()
        if (parsed == null || parsed !in 1..1440) errors += "Duration must be between 1 and 1440 minutes"

        return JourneyDraftValidation(
            destination = normalizedDestination.takeIf { it.isNotBlank() && it.length <= 120 },
            durationMinutes = parsed?.takeIf { it in 1..1440 },
            errors = errors,
        )
    }
}
