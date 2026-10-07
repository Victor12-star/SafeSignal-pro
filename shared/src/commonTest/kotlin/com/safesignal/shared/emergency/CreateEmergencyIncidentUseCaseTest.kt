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

    private class RecordingRepository(
        private val failOnSave: Boolean = false,
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
            return saved?.takeIf { it.id == id }
        }

        override suspend fun delete(id: String) {
            saved = null
        }
    }
}
