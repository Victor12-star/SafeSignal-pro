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

        // A later SOS transition must not move the durable incident timeline backwards.
        require(updatedAtEpochMillis >= current.updatedAtEpochMillis) {
            "Emergency incident transition timestamp predates the current update"
        }

        val nextState = EmergencyStateMachine.transition(current.state, to)
        val updated = current.copy(
            state = nextState,
            updatedAtEpochMillis = updatedAtEpochMillis,
            sequenceNumber = if (nextState == current.state) {
                current.sequenceNumber
            } else {
                // Do not wrap a saturated SOS sequence number to a negative value.
                check(current.sequenceNumber < Long.MAX_VALUE) { "Emergency incident sequence number exhausted" }
                current.sequenceNumber + 1L
            },
        )

        repository.save(updated)

        val persisted = repository.getById(updated.id)
            ?: error("Emergency incident transition was not durably saved")

        // A record may exist but contain an older or corrupted SOS transition.
        // Confirm the exact state, sequence and incident details before reporting success.
        check(persisted == updated) { "Emergency incident transition readback did not match saved record" }
        return persisted
    }
}
