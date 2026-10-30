package com.safesignal.shared.journey

/** Domain contract only. No background tracking or outbound notifications are implied. */
enum class JourneyStatus {
    DRAFT, ACTIVE, CHECK_IN_DUE, ESCALATION_PENDING, ESCALATED, SAFE, CANCELLED
}

data class JourneySession(
    val id: String,
    val ownerId: String,
    val destination: String,
    val expectedArrivalEpochMillis: Long,
    val trustedContactIds: List<String>,
    val status: JourneyStatus,
    val createdAtEpochMillis: Long,
    val lastLocationEpochMillis: Long? = null,
) {
    val isMonitoring: Boolean get() = status in setOf(
        JourneyStatus.ACTIVE, JourneyStatus.CHECK_IN_DUE, JourneyStatus.ESCALATION_PENDING,
    )
}

object JourneySessionRules {
    fun canTransition(from: JourneyStatus, to: JourneyStatus): Boolean = when (from) {
        JourneyStatus.DRAFT -> to == JourneyStatus.ACTIVE || to == JourneyStatus.CANCELLED
        JourneyStatus.ACTIVE -> to == JourneyStatus.CHECK_IN_DUE || to == JourneyStatus.SAFE || to == JourneyStatus.CANCELLED
        JourneyStatus.CHECK_IN_DUE -> to == JourneyStatus.ESCALATION_PENDING || to == JourneyStatus.SAFE || to == JourneyStatus.CANCELLED
        JourneyStatus.ESCALATION_PENDING -> to == JourneyStatus.ESCALATED || to == JourneyStatus.SAFE || to == JourneyStatus.CANCELLED
        JourneyStatus.ESCALATED -> to == JourneyStatus.SAFE || to == JourneyStatus.CANCELLED
        JourneyStatus.SAFE, JourneyStatus.CANCELLED -> false
    }

    fun validate(session: JourneySession): List<String> = buildList {
        if (session.id.isBlank()) add("Session identifier is required")
        if (session.ownerId.isBlank()) add("Journey owner is required")
        if (session.destination.isBlank()) add("Destination is required")
        if (session.expectedArrivalEpochMillis <= session.createdAtEpochMillis) add("Expected arrival must be after creation")
        if (session.trustedContactIds.isEmpty() || session.trustedContactIds.any { it.isBlank() }) add("At least one trusted contact is required")
        if (session.trustedContactIds.distinct().size != session.trustedContactIds.size) add("Duplicate trusted contacts are not allowed")
        if (session.lastLocationEpochMillis != null && session.lastLocationEpochMillis < session.createdAtEpochMillis) add("Location timestamp predates journey")
    }
}
