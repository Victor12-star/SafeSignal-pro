package com.safesignal.shared.emergency

import kotlinx.serialization.Serializable

@Serializable
enum class EmergencyCategory {
    PERSONAL_DANGER,
    MEDICAL,
    ACCIDENT,
    THREAT_ROBBERY,
    UNSAFE_JOURNEY,
    LOST_STRANDED,
    OTHER,
}

@Serializable
data class EmergencyIncident(
    val id: String,
    val category: EmergencyCategory,
    val state: EmergencyState,
    val recipientIds: List<String>,
    val createdAtEpochMillis: Long,
    val updatedAtEpochMillis: Long,
    val sequenceNumber: Long = 0L,
) {
    init {
        require(id.isNotBlank())
        require(createdAtEpochMillis > 0L)
        require(updatedAtEpochMillis >= createdAtEpochMillis)
        require(sequenceNumber >= 0L)
    }

    val isActive: Boolean
        get() = !state.isTerminal
}
