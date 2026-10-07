package com.safesignal.shared.emergency

enum class EmergencyState {
    CREATED,
    PENDING_LOCATION,
    PENDING_DELIVERY,
    ACTIVE,
    PARTIALLY_DELIVERED,
    DELIVERED,
    ACKNOWLEDGED,
    CONNECTION_LOST,
    RESOLVED,
    CANCELLED,
    FAILED,
    EXPIRED;

    val isTerminal: Boolean
        get() = this == RESOLVED ||
            this == CANCELLED ||
            this == FAILED ||
            this == EXPIRED
}
