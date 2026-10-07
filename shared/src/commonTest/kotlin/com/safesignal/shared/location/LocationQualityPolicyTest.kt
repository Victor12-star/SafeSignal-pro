package com.safesignal.shared.location

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class LocationQualityPolicyTest {
    @Test
    fun preciseAccurateLocationIsGoodAndUsable() {
        val location = SafetyLocation(
            latitude = 59.3293,
            longitude = 18.0686,
            accuracyMeters = 12f,
            capturedAtEpochMillis = 1L,
            isPrecisePermission = true,
        )

        assertEquals("Good", LocationQualityPolicy.qualityLabel(location))
        assertTrue(LocationQualityPolicy.isUsableForEmergency(location))
    }

    @Test
    fun approximatePermissionIsReportedHonestly() {
        val location = SafetyLocation(
            latitude = 59.3,
            longitude = 18.0,
            accuracyMeters = 800f,
            capturedAtEpochMillis = 1L,
            isPrecisePermission = false,
        )

        assertEquals("Approximate", LocationQualityPolicy.qualityLabel(location))
        assertTrue(LocationQualityPolicy.isUsableForEmergency(location))
    }

    @Test
    fun invalidOrExtremelyInaccurateLocationIsRejected() {
        val location = SafetyLocation(
            latitude = 200.0,
            longitude = 18.0,
            accuracyMeters = 8_000f,
            capturedAtEpochMillis = 1L,
            isPrecisePermission = true,
        )

        assertFalse(LocationQualityPolicy.isUsableForEmergency(location))
    }
}
