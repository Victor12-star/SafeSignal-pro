package com.safesignal.shared.emergency

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFails

class EmergencyIncidentTest {
    @Test
    fun incidentStartsWithValidDurableFields() {
        val incident = EmergencyIncident(
            id = "incident-1",
            category = EmergencyCategory.MEDICAL,
            state = EmergencyState.CREATED,
            recipientIds = listOf("c1", "c2"),
            createdAtEpochMillis = 1_000L,
            updatedAtEpochMillis = 1_000L,
        )

        assertEquals(EmergencyState.CREATED, incident.state)
        assertEquals(0L, incident.sequenceNumber)
    }

    @Test
    fun invalidTimeOrderingIsRejected() {
        assertFails {
            EmergencyIncident(
                id = "incident-1",
                category = EmergencyCategory.MEDICAL,
                state = EmergencyState.CREATED,
                recipientIds = emptyList(),
                createdAtEpochMillis = 2_000L,
                updatedAtEpochMillis = 1_000L,
            )
        }
    }
}
