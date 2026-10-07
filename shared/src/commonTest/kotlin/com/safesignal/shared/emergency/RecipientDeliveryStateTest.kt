package com.safesignal.shared.emergency

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class RecipientDeliveryStateTest {

    @Test
    fun sentIsNotTheSameAsDeliveredOrAcknowledged() {
        assertFalse(RecipientDeliveryState.PUSH_SENT.isTransportConfirmed)
        assertFalse(RecipientDeliveryState.SMS_SENT.isTransportConfirmed)
        assertFalse(RecipientDeliveryState.PUSH_SENT.isRecipientAcknowledged)
        assertFalse(RecipientDeliveryState.SMS_SENT.isRecipientAcknowledged)

        assertTrue(RecipientDeliveryState.DELIVERED.isTransportConfirmed)
        assertFalse(RecipientDeliveryState.DELIVERED.isRecipientAcknowledged)

        assertTrue(RecipientDeliveryState.ACKNOWLEDGED.isTransportConfirmed)
        assertTrue(RecipientDeliveryState.ACKNOWLEDGED.isRecipientAcknowledged)
    }

    @Test
    fun acknowledgedCannotMoveBackToSent() {
        assertFailsWith<InvalidRecipientDeliveryTransitionException> {
            RecipientDeliveryStateMachine.transition(
                RecipientDeliveryState.ACKNOWLEDGED,
                RecipientDeliveryState.PUSH_SENT,
            )
        }
    }

    @Test
    fun failedDeliveryCanRetry() {
        assertTrue(
            RecipientDeliveryStateMachine.canTransition(
                RecipientDeliveryState.FAILED,
                RecipientDeliveryState.RETRYING,
            ),
        )
    }

    @Test
    fun unavailableRecipientIsTerminal() {
        assertFalse(
            RecipientDeliveryStateMachine.canTransition(
                RecipientDeliveryState.UNAVAILABLE,
                RecipientDeliveryState.SENDING,
            ),
        )
    }
}
