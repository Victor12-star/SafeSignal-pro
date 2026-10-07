package com.safesignal.shared.contacts

import kotlinx.serialization.Serializable

@Serializable
enum class ContactGroup(val displayName: String) {
    FAMILY("Family"),
    FRIENDS("Friends"),
    PARTNER("Partner"),
    NEIGHBOUR("Neighbour"),
    MEDICAL("Medical"),
    WORK("Work"),
    CUSTOM("Custom"),
}

@Serializable
enum class ContactAcceptanceStatus {
    PENDING,
    ACCEPTED,
    DECLINED,
    BLOCKED,
}

@Serializable
data class TrustedContact(
    val id: String,
    val name: String,
    val phoneE164: String,
    val group: ContactGroup,
    val acceptanceStatus: ContactAcceptanceStatus = ContactAcceptanceStatus.PENDING,
    val isActive: Boolean = true,
) {
    val canReceiveEnhancedAlerts: Boolean
        get() = isActive && acceptanceStatus == ContactAcceptanceStatus.ACCEPTED
}
