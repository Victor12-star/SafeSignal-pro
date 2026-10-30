package com.safesignal.shared.journey

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class JourneySessionRulesTest {
    @Test fun onlyAllowedTransitions() {
        assertTrue(JourneySessionRules.canTransition(JourneyStatus.DRAFT, JourneyStatus.ACTIVE))
        assertTrue(JourneySessionRules.canTransition(JourneyStatus.CHECK_IN_DUE, JourneyStatus.SAFE))
        assertFalse(JourneySessionRules.canTransition(JourneyStatus.DRAFT, JourneyStatus.ESCALATED))
        assertFalse(JourneySessionRules.canTransition(JourneyStatus.SAFE, JourneyStatus.ACTIVE))
        assertFalse(JourneySessionRules.canTransition(JourneyStatus.CANCELLED, JourneyStatus.ACTIVE))
    }

    @Test fun requiresOwnerAndDesignatedContacts() {
        val session = JourneySession("j1", "", "Shop", 200L, emptyList(), JourneyStatus.DRAFT, 100L)
        assertTrue(JourneySessionRules.validate(session).isNotEmpty())
    }

    @Test fun acceptsValidDraft() {
        val session = JourneySession("j1", "person1", "Shop", 200L, listOf("trusted1"), JourneyStatus.DRAFT, 100L)
        assertTrue(JourneySessionRules.validate(session).isEmpty())
        assertFalse(session.isMonitoring)
    }

    @Test fun rejectsDuplicatesAndInvalidTimes() {
        val session = JourneySession("j1", "person1", "Shop", 100L, listOf("a","a"), JourneyStatus.DRAFT, 100L, 50L)
        assertTrue(JourneySessionRules.validate(session).size >= 3)
    }

    @Test fun resolvedJourneyIsNotMonitoring() {
        val session = JourneySession("j1", "person1", "Shop", 200L, listOf("trusted1"), JourneyStatus.SAFE, 100L)
        assertFalse(session.isMonitoring)
    }
}
