package com.safesignal.shared.contacts

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class TrustedContactValidatorTest {

    @Test
    fun validatesAndNormalizesContact() {
        val result = TrustedContactValidator.validate(
            name = "  Daniel  ",
            rawPhone = "070 123 45 67",
            callingCode = "+46",
        )

        assertTrue(result.isValid)
        assertEquals("Daniel", result.normalizedName)
        assertEquals("+46701234567", result.normalizedPhoneE164)
    }

    @Test
    fun rejectsBlankName() {
        val result = TrustedContactValidator.validate(
            name = "   ",
            rawPhone = "070 123 45 67",
            callingCode = "+46",
        )

        assertFalse(result.isValid)
        assertTrue(result.errors.contains("Name is required"))
    }
}
