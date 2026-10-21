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

    /** A stale readback must not be mistaken for a completed SOS transition. */
    @Test
    fun staleReadbackAfterTransitionFailsClosed() = runTest {
        val repository = FakeRepository(sampleIncident(), returnStaleReadbackAfterSave = true)
        val useCase = TransitionEmergencyIncidentUseCase(repository)

        assertFailsWith<IllegalStateException> {
            useCase.execute(
                incidentId = "incident-1",
                to = EmergencyState.PENDING_LOCATION,
                updatedAtEpochMillis = 2_000L,
            )
        }
        assertEquals(1, repository.saveCount)
    }

    /** A transition cannot be confirmed if its newly stored incident disappears. */
    @Test
    fun missingReadbackAfterTransitionFailsClosed() = runTest {
        val repository = FakeRepository(sampleIncident(), loseReadbackAfterSave = true)
        val useCase = TransitionEmergencyIncidentUseCase(repository)

        assertFailsWith<IllegalStateException> {
            useCase.execute(
                incidentId = "incident-1",
                to = EmergencyState.PENDING_LOCATION,
                updatedAtEpochMillis = 2_000L,
            )
        }
        assertEquals(1, repository.saveCount)
    }

    /** Sequence rollover must stop an SOS transition before it is persisted. */
    @Test
    fun saturatedSequenceNumberRejectsTransitionBeforeSave() = runTest {
        val repository = FakeRepository(sampleIncident().copy(sequenceNumber = Long.MAX_VALUE))
        val useCase = TransitionEmergencyIncidentUseCase(repository)

        assertFailsWith<IllegalStateException> {
            useCase.execute(
                incidentId = "incident-1",
                to = EmergencyState.PENDING_LOCATION,
                updatedAtEpochMillis = 2_000L,
            )
        }
        assertEquals(0, repository.saveCount)
    }

    /** An out-of-order timestamp must be rejected before any state is saved. */
    @Test
    fun olderTransitionTimestampIsRejectedBeforeSave() = runTest {
        val repository = FakeRepository(sampleIncident().copy(updatedAtEpochMillis = 3_000L))
        val useCase = TransitionEmergencyIncidentUseCase(repository)

        assertFailsWith<IllegalArgumentException> {
            useCase.execute(
                incidentId = "incident-1",
                to = EmergencyState.PENDING_LOCATION,
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
        private val returnStaleReadbackAfterSave: Boolean = false,
        private val loseReadbackAfterSave: Boolean = false,
    ) : EmergencyIncidentRepository {
        private var incident: EmergencyIncident? = initial
        private val originalIncident: EmergencyIncident = initial
        var saveCount = 0

        override suspend fun getAll(): List<EmergencyIncident> =
            listOfNotNull(incident)

        override suspend fun save(incident: EmergencyIncident) {
            saveCount += 1
            this.incident = incident
        }

        override suspend fun getById(id: String): EmergencyIncident? =
            (if (loseReadbackAfterSave && saveCount > 0) null
             else if (returnStaleReadbackAfterSave && saveCount > 0) originalIncident
             else incident)?.takeIf { it.id == id }

        override suspend fun delete(id: String) {
            incident = null
        }
    }
}
