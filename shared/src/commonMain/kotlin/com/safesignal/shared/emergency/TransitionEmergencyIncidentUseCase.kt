package com.safesignal.shared.emergency

class TransitionEmergencyIncidentUseCase(
    private val repository: EmergencyIncidentRepository,
) {
    suspend fun execute(
        incidentId: String,
        to: EmergencyState,
        updatedAtEpochMillis: Long,
    ): EmergencyIncident {
        val current = repository.getById(incidentId)
            ?: error("Emergency incident not found")

        val nextState = EmergencyStateMachine.transition(current.state, to)
        val updated = current.copy(
            state = nextState,
            updatedAtEpochMillis = updatedAtEpochMillis,
            sequenceNumber = if (nextState == current.state) {
                current.sequenceNumber
            } else {
                current.sequenceNumber + 1L
            },
        )

        repository.save(updated)

        return repository.getById(updated.id)
            ?: error("Emergency incident transition was not durably saved")
    }
}
