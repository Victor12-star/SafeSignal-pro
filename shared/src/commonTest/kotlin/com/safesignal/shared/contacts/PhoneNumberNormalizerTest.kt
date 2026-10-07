package com.safesignal.shared.contacts

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class PhoneNumberNormalizerTest {

    @Test
    fun normalizesSwedishLocalMobileNumber() {
        val result = PhoneNumberNormalizer.normalize("070 123 45 67", "+46")
        assertEquals(
            "+46701234567",
            assertIs<PhoneNumberValidationResult.Valid>(result).e164,
        )
    }

    @Test
    fun normalizesNigerianLocalMobileNumber() {
        val result = PhoneNumberNormalizer.normalize("0803 123 4567", "+234")
        assertEquals(
            "+2348031234567",
            assertIs<PhoneNumberValidationResult.Valid>(result).e164,
        )
    }

    @Test
    fun keepsAlreadyInternationalNumber() {
        val result = PhoneNumberNormalizer.normalize("+46 70 123 45 67", "+234")
        assertEquals(
            "+46701234567",
            assertIs<PhoneNumberValidationResult.Valid>(result).e164,
        )
    }

    @Test
    fun convertsDoubleZeroInternationalPrefix() {
        val result = PhoneNumberNormalizer.normalize("0046 70 123 45 67", "+234")
        assertEquals(
            "+46701234567",
            assertIs<PhoneNumberValidationResult.Valid>(result).e164,
        )
    }

    @Test
    fun rejectsLettersAndTooShortNumbers() {
        assertIs<PhoneNumberValidationResult.Invalid>(
            PhoneNumberNormalizer.normalize("070ABC123", "+46"),
        )
        assertIs<PhoneNumberValidationResult.Invalid>(
            PhoneNumberNormalizer.normalize("123", "+46"),
        )
    }
}
