package com.safesignal.shared.emergency

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class CreateEmergencyIncidentUseCaseTest {
    @Test
    fun incidentIsSavedBeforeItIsReturned() = kotlinx.coroutines.test.runTest {
        val repository = RecordingRepository()
        val useCase = CreateEmergencyIncidentUseCase(
            repository = repository,
            idProvider = { "incident-123" },
            nowEpochMillis = { 10_000L },
        )

        val incident = useCase.execute(
            category = EmergencyCategory.PERSONAL_DANGER,
            recipientIds = listOf("c1", "c1", "c2"),
        )

        assertEquals(listOf("save", "getById"), repository.calls)
        assertEquals(listOf("c1", "c2"), incident.recipientIds)
        assertEquals(EmergencyState.CREATED, incident.state)
    }

    @Test
    fun saveFailureStopsTheFlow() = kotlinx.coroutines.test.runTest {
        val repository = RecordingRepository(failOnSave = true)
        val useCase = CreateEmergencyIncidentUseCase(
            repository = repository,
            idProvider = { "incident-123" },
            nowEpochMillis = { 10_000L },
        )

        assertFailsWith<IllegalStateException> {
            useCase.execute(
                category = EmergencyCategory.MEDICAL,
                recipientIds = listOf("c1"),
            )
        }

        assertEquals(listOf("save"), repository.calls)
    }

    /**
     * An acknowledged write is insufficient for emergency durability if the
     * incident cannot be read back. Never report successful creation in this case.
     */
    @Test
    fun missingReadbackAfterSaveFailsClosed() = kotlinx.coroutines.test.runTest {
        val repository = RecordingRepository(loseSavedIncidentOnRead = true)
        val useCase = CreateEmergencyIncidentUseCase(
            repository = repository,
            idProvider = { "incident-123" },
            nowEpochMillis = { 10_000L },
        )

        assertFailsWith<IllegalStateException> {
            useCase.execute(
                category = EmergencyCategory.PERSONAL_DANGER,
                recipientIds = listOf("c1"),
            )
        }
        assertEquals(listOf("save", "getById"), repository.calls)
    }

    /** A readback with changed emergency recipients must not be accepted. */
    @Test
    fun corruptedReadbackAfterSaveFailsClosed() = kotlinx.coroutines.test.runTest {
        val repository = RecordingRepository(corruptSavedRecipientsOnRead = true)
        val useCase = CreateEmergencyIncidentUseCase(
            repository = repository,
            idProvider = { "incident-123" },
            nowEpochMillis = { 10_000L },
        )

        assertFailsWith<IllegalStateException> {
            useCase.execute(
                category = EmergencyCategory.PERSONAL_DANGER,
                recipientIds = listOf("c1", "c2"),
            )
        }
        assertEquals(listOf("save", "getById"), repository.calls)
    }

    private class RecordingRepository(
        private val failOnSave: Boolean = false,
        private val loseSavedIncidentOnRead: Boolean = false,
        private val corruptSavedRecipientsOnRead: Boolean = false,
    ) : EmergencyIncidentRepository {
        val calls = mutableListOf<String>()
        private var saved: EmergencyIncident? = null

        override suspend fun getAll(): List<EmergencyIncident> =
            listOfNotNull(saved)

        override suspend fun save(incident: EmergencyIncident) {
            calls += "save"
            if (failOnSave) error("disk unavailable")
            saved = incident
        }

        override suspend fun getById(id: String): EmergencyIncident? {
            calls += "getById"
            if (loseSavedIncidentOnRead) return null
            val incident = saved?.takeIf { it.id == id } ?: return null
            return if (corruptSavedRecipientsOnRead) {
                incident.copy(recipientIds = listOf("unintended-recipient"))
            } else incident
        }

        override suspend fun delete(id: String) {
            saved = null
        }
    }
}
