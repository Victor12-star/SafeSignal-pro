package com.safesignal.shared.emergency

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlinx.coroutines.test.runTest

class TransitionEmergencyIncidentUseCaseTest {
    @Test
    fun validTransitionIsPersisted() = runTest {
        val repository = FakeRepository(sampleIncident())
        val useCase = TransitionEmergencyIncidentUseCase(repository)

        val result = useCase.execute(
            incidentId = "incident-1",
            to = EmergencyState.PENDING_LOCATION,
            updatedAtEpochMillis = 2_000L,
        )

        assertEquals(EmergencyState.PENDING_LOCATION, result.state)
        assertEquals(1L, result.sequenceNumber)
        assertEquals(2_000L, result.updatedAtEpochMillis)
    }

    @Test
    fun invalidTransitionIsRejectedBeforeSave() = runTest {
        val repository = FakeRepository(sampleIncident())
        val useCase = TransitionEmergencyIncidentUseCase(repository)

        assertFailsWith<InvalidEmergencyTransitionException> {
            useCase.execute(
                incidentId = "incident-1",
                to = EmergencyState.ACKNOWLEDGED,
                updatedAtEpochMillis = 2_000L,
            )
        }

        assertEquals(0, repository.saveCount)
    }

    private fun sampleIncident() = EmergencyIncident(
        id = "incident-1",
        category = EmergencyCategory.PERSONAL_DANGER,
        state = EmergencyState.CREATED,
        recipientIds = listOf("contact-1"),
        createdAtEpochMillis = 1_000L,
        updatedAtEpochMillis = 1_000L,
    )

    private class FakeRepository(
        initial: EmergencyIncident,
    ) : EmergencyIncidentRepository {
        private var incident: EmergencyIncident? = initial
        var saveCount = 0

        override suspend fun getAll(): List<EmergencyIncident> =
            listOfNotNull(incident)

        override suspend fun save(incident: EmergencyIncident) {
            saveCount += 1
            this.incident = incident
        }

        override suspend fun getById(id: String): EmergencyIncident? =
            incident?.takeIf { it.id == id }

        override suspend fun delete(id: String) {
            incident = null
        }
    }
}
