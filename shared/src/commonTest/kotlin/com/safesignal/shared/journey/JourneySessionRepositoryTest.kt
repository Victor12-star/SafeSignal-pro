package com.safesignal.shared.journey

import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class JourneySessionRepositoryTest {
    private fun session() = JourneySession("journey-1", "owner-1", "Store", 200, listOf("contact-1"), JourneyStatus.DRAFT, 100)

    @Test fun isolatesOwners() = runTest {
        val repo = InMemoryJourneySessionRepository()
        repo.save(session())
        assertNull(repo.getById("owner-2", "journey-1"))
        assertEquals(0, repo.getAllForOwner("owner-2").size)
        assertFailsWith<JourneyNotFoundException> { repo.delete("owner-2", "journey-1") }
        assertFailsWith<IllegalArgumentException> { repo.save(session().copy(ownerId = "owner-2")) }
    }

    @Test fun transitionsMustMatchCurrentState() = runTest {
        val repo = InMemoryJourneySessionRepository()
        repo.save(session())
        repo.transition("owner-1", "journey-1", JourneyStatus.DRAFT, JourneyStatus.ACTIVE)
        assertFailsWith<JourneyConflictException> {
            repo.transition("owner-1", "journey-1", JourneyStatus.DRAFT, JourneyStatus.SAFE)
        }
        assertEquals(JourneyStatus.ACTIVE, repo.getById("owner-1", "journey-1")?.status)
    }

    @Test fun rejectsInvalidSession() = runTest {
        val repo = InMemoryJourneySessionRepository()
        assertFailsWith<IllegalArgumentException> { repo.save(session().copy(trustedContactIds = emptyList())) }
    }
}
