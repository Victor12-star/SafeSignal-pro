package com.safesignal.shared.emergency

class InvalidEmergencyTransitionException(
    from: EmergencyState,
    to: EmergencyState,
) : IllegalStateException("Invalid emergency transition: $from -> $to")

object EmergencyStateMachine {

    private val allowedTransitions: Map<EmergencyState, Set<EmergencyState>> = mapOf(
        EmergencyState.CREATED to setOf(
            EmergencyState.PENDING_LOCATION,
            EmergencyState.PENDING_DELIVERY,
            EmergencyState.CANCELLED,
            EmergencyState.FAILED,
        ),
        EmergencyState.PENDING_LOCATION to setOf(
            EmergencyState.PENDING_DELIVERY,
            EmergencyState.CONNECTION_LOST,
            EmergencyState.CANCELLED,
            EmergencyState.FAILED,
        ),
        EmergencyState.PENDING_DELIVERY to setOf(
            EmergencyState.ACTIVE,
            EmergencyState.PARTIALLY_DELIVERED,
            EmergencyState.DELIVERED,
            EmergencyState.CONNECTION_LOST,
            EmergencyState.CANCELLED,
            EmergencyState.FAILED,
        ),
        EmergencyState.ACTIVE to setOf(
            EmergencyState.PARTIALLY_DELIVERED,
            EmergencyState.DELIVERED,
            EmergencyState.ACKNOWLEDGED,
            EmergencyState.CONNECTION_LOST,
            EmergencyState.RESOLVED,
            EmergencyState.CANCELLED,
            EmergencyState.FAILED,
            EmergencyState.EXPIRED,
        ),
        EmergencyState.PARTIALLY_DELIVERED to setOf(
            EmergencyState.DELIVERED,
            EmergencyState.ACKNOWLEDGED,
            EmergencyState.CONNECTION_LOST,
            EmergencyState.RESOLVED,
            EmergencyState.CANCELLED,
            EmergencyState.FAILED,
            EmergencyState.EXPIRED,
        ),
        EmergencyState.DELIVERED to setOf(
            EmergencyState.ACKNOWLEDGED,
            EmergencyState.CONNECTION_LOST,
            EmergencyState.RESOLVED,
            EmergencyState.CANCELLED,
            EmergencyState.FAILED,
            EmergencyState.EXPIRED,
        ),
        EmergencyState.ACKNOWLEDGED to setOf(
            EmergencyState.CONNECTION_LOST,
            EmergencyState.RESOLVED,
            EmergencyState.FAILED,
            EmergencyState.EXPIRED,
        ),
        EmergencyState.CONNECTION_LOST to setOf(
            EmergencyState.PENDING_DELIVERY,
            EmergencyState.ACTIVE,
            EmergencyState.PARTIALLY_DELIVERED,
            EmergencyState.DELIVERED,
            EmergencyState.ACKNOWLEDGED,
            EmergencyState.RESOLVED,
            EmergencyState.CANCELLED,
            EmergencyState.FAILED,
            EmergencyState.EXPIRED,
        ),
        EmergencyState.RESOLVED to emptySet(),
        EmergencyState.CANCELLED to emptySet(),
        EmergencyState.FAILED to emptySet(),
        EmergencyState.EXPIRED to emptySet(),
    )

    fun canTransition(
        from: EmergencyState,
        to: EmergencyState,
    ): Boolean {
        if (from == to) return true
        return allowedTransitions[from]?.contains(to) == true
    }

    fun transition(
        from: EmergencyState,
        to: EmergencyState,
    ): EmergencyState {
        if (!canTransition(from, to)) {
            throw InvalidEmergencyTransitionException(from, to)
        }

        return to
    }
}
