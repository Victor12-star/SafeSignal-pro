package com.safesignal.shared.navigation

enum class AppDestination(
    val label: String,
    val accessibilityLabel: String,
) {
    SOS(
        label = "SOS",
        accessibilityLabel = "SOS home",
    ),
    JOURNEY(
        label = "Journey",
        accessibilityLabel = "Safe Journey",
    ),
    CONTACTS(
        label = "Contacts",
        accessibilityLabel = "Trusted Contacts",
    ),
    SETTINGS(
        label = "Settings",
        accessibilityLabel = "Settings",
    ),
}
