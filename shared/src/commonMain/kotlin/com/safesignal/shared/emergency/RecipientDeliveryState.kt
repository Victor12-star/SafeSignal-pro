package com.safesignal.shared.emergency

enum class RecipientDeliveryState {
    CREATED,
    QUEUED,
    SENDING,
    PUSH_SENT,
    SMS_SENT,
    DELIVERED,
    ACKNOWLEDGED,
    RETRYING,
    FAILED,
    UNAVAILABLE;

    val isTransportConfirmed: Boolean
        get() = this == DELIVERED || this == ACKNOWLEDGED

    val isRecipientAcknowledged: Boolean
        get() = this == ACKNOWLEDGED

    val isFinalFailure: Boolean
        get() = this == FAILED || this == UNAVAILABLE
}

class InvalidRecipientDeliveryTransitionException(
    from: RecipientDeliveryState,
    to: RecipientDeliveryState,
) : IllegalStateException("Invalid recipient delivery transition: $from -> $to")

object RecipientDeliveryStateMachine {

    private val allowedTransitions: Map<RecipientDeliveryState, Set<RecipientDeliveryState>> = mapOf(
        RecipientDeliveryState.CREATED to setOf(
            RecipientDeliveryState.QUEUED,
            RecipientDeliveryState.SENDING,
            RecipientDeliveryState.UNAVAILABLE,
            RecipientDeliveryState.FAILED,
        ),
        RecipientDeliveryState.QUEUED to setOf(
            RecipientDeliveryState.SENDING,
            RecipientDeliveryState.RETRYING,
            RecipientDeliveryState.UNAVAILABLE,
            RecipientDeliveryState.FAILED,
        ),
        RecipientDeliveryState.SENDING to setOf(
            RecipientDeliveryState.PUSH_SENT,
            RecipientDeliveryState.SMS_SENT,
            RecipientDeliveryState.DELIVERED,
            RecipientDeliveryState.RETRYING,
            RecipientDeliveryState.UNAVAILABLE,
            RecipientDeliveryState.FAILED,
        ),
        RecipientDeliveryState.PUSH_SENT to setOf(
            RecipientDeliveryState.DELIVERED,
            RecipientDeliveryState.ACKNOWLEDGED,
            RecipientDeliveryState.RETRYING,
            RecipientDeliveryState.FAILED,
        ),
        RecipientDeliveryState.SMS_SENT to setOf(
            RecipientDeliveryState.DELIVERED,
            RecipientDeliveryState.ACKNOWLEDGED,
            RecipientDeliveryState.RETRYING,
            RecipientDeliveryState.FAILED,
        ),
        RecipientDeliveryState.DELIVERED to setOf(
            RecipientDeliveryState.ACKNOWLEDGED,
            RecipientDeliveryState.RETRYING,
            RecipientDeliveryState.FAILED,
        ),
        RecipientDeliveryState.ACKNOWLEDGED to emptySet(),
        RecipientDeliveryState.RETRYING to setOf(
            RecipientDeliveryState.SENDING,
            RecipientDeliveryState.PUSH_SENT,
            RecipientDeliveryState.SMS_SENT,
            RecipientDeliveryState.DELIVERED,
            RecipientDeliveryState.ACKNOWLEDGED,
            RecipientDeliveryState.UNAVAILABLE,
            RecipientDeliveryState.FAILED,
        ),
        RecipientDeliveryState.FAILED to setOf(
            RecipientDeliveryState.RETRYING,
        ),
        RecipientDeliveryState.UNAVAILABLE to emptySet(),
    )

    fun canTransition(
        from: RecipientDeliveryState,
        to: RecipientDeliveryState,
    ): Boolean {
        if (from == to) return true
        return allowedTransitions[from]?.contains(to) == true
    }

    fun transition(
        from: RecipientDeliveryState,
        to: RecipientDeliveryState,
    ): RecipientDeliveryState {
        if (!canTransition(from, to)) {
            throw InvalidRecipientDeliveryTransitionException(from, to)
        }

        return to
    }
}
