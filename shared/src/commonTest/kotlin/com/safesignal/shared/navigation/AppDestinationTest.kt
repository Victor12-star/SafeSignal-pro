package com.safesignal.shared.navigation

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class AppDestinationTest {

    @Test
    fun bottomNavigationUsesApprovedV1OrderAndLabels() {
        assertEquals(
            listOf("SOS", "Journey", "Contacts", "Settings"),
            AppDestination.entries.map { it.label },
        )
    }

    @Test
    fun accessibilityLabelsAreNeverBlank() {
        AppDestination.entries.forEach { destination ->
            assertTrue(
                destination.accessibilityLabel.isNotBlank(),
                "Accessibility label must not be blank for $destination",
            )
        }
    }
}
