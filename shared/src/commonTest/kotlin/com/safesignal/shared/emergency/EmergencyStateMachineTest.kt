package com.safesignal.shared.emergency

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class EmergencyStateMachineTest {

    @Test
    fun normalEmergencyLifecycleIsAllowed() {
        var state = EmergencyState.CREATED
        state = EmergencyStateMachine.transition(state, EmergencyState.PENDING_LOCATION)
        state = EmergencyStateMachine.transition(state, EmergencyState.PENDING_DELIVERY)
        state = EmergencyStateMachine.transition(state, EmergencyState.ACTIVE)
        state = EmergencyStateMachine.transition(state, EmergencyState.PARTIALLY_DELIVERED)
        state = EmergencyStateMachine.transition(state, EmergencyState.DELIVERED)
        state = EmergencyStateMachine.transition(state, EmergencyState.ACKNOWLEDGED)
        state = EmergencyStateMachine.transition(state, EmergencyState.RESOLVED)

        assertEquals(EmergencyState.RESOLVED, state)
        assertTrue(state.isTerminal)
    }

    @Test
    fun connectionLossCanRecoverWithoutInventingDelivery() {
        var state = EmergencyState.CREATED
        state = EmergencyStateMachine.transition(state, EmergencyState.PENDING_LOCATION)
        state = EmergencyStateMachine.transition(state, EmergencyState.CONNECTION_LOST)
        state = EmergencyStateMachine.transition(state, EmergencyState.PENDING_DELIVERY)
        state = EmergencyStateMachine.transition(state, EmergencyState.ACTIVE)

        assertEquals(EmergencyState.ACTIVE, state)
        assertFalse(state.isTerminal)
    }

    @Test
    fun terminalStatesCannotTransitionToActive() {
        listOf(
            EmergencyState.RESOLVED,
            EmergencyState.CANCELLED,
            EmergencyState.FAILED,
            EmergencyState.EXPIRED,
        ).forEach { terminal ->
            assertFalse(EmergencyStateMachine.canTransition(terminal, EmergencyState.ACTIVE))
            assertFailsWith<InvalidEmergencyTransitionException> {
                EmergencyStateMachine.transition(terminal, EmergencyState.ACTIVE)
            }
        }
    }

    @Test
    fun repeatedStateIsIdempotent() {
        assertEquals(
            EmergencyState.ACTIVE,
            EmergencyStateMachine.transition(EmergencyState.ACTIVE, EmergencyState.ACTIVE),
        )
    }

    @Test
    fun createdCannotJumpStraightToAcknowledged() {
        assertFailsWith<InvalidEmergencyTransitionException> {
            EmergencyStateMachine.transition(
                EmergencyState.CREATED,
                EmergencyState.ACKNOWLEDGED,
            )
        }
    }
}
