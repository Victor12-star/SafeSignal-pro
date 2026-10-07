package com.safesignal.shared.emergency

class CreateEmergencyIncidentUseCase(
    private val repository: EmergencyIncidentRepository,
    private val idProvider: () -> String,
    private val nowEpochMillis: () -> Long,
) {
    suspend fun execute(
        category: EmergencyCategory,
        recipientIds: List<String>,
    ): EmergencyIncident {
        val now = nowEpochMillis()
        val incident = EmergencyIncident(
            id = idProvider(),
            category = category,
            state = EmergencyState.CREATED,
            recipientIds = recipientIds.distinct(),
            createdAtEpochMillis = now,
            updatedAtEpochMillis = now,
        )

        repository.save(incident)

        return repository.getById(incident.id)
            ?: error("Emergency incident was not durably saved")
    }
}
