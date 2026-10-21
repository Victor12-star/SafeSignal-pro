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

        val persisted = repository.getById(incident.id)
            ?: error("Emergency incident was not durably saved")

        // A successful lookup alone does not prove the stored SOS details survived.
        // Never report a different category, recipient list, or state as a saved incident.
        check(persisted == incident) { "Emergency incident readback did not match saved record" }
        return persisted
    }
}
