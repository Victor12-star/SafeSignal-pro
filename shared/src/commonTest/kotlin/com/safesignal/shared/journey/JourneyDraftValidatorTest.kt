package com.safesignal.shared.journey

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class JourneyDraftValidatorTest {
    @Test fun normalizesValidDraft() {
        val result = JourneyDraftValidator.validate("  Stockholm  ", "30")
        assertTrue(result.isValid)
        assertEquals("Stockholm", result.destination)
        assertEquals(30, result.durationMinutes)
    }

    @Test fun rejectsBlankDestination() {
        assertFalse(JourneyDraftValidator.validate("  ", "30").isValid)
    }

    @Test fun rejectsUnboundedDestination() {
        assertFalse(JourneyDraftValidator.validate("a".repeat(121), "30").isValid)
    }

    @Test fun rejectsInvalidDuration() {
        listOf("", "0", "-1", "1441", "abc", "999999999999999").forEach {
            assertFalse(JourneyDraftValidator.validate("Home", it).isValid)
        }
    }
}
