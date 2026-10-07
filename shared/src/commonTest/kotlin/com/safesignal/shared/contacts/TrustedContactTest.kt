package com.safesignal.shared.contacts

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class TrustedContactTest {

    @Test
    fun enhancedAlertsRequireExplicitAcceptance() {
        val pending = TrustedContact(
            id = "1",
            name = "Daniel",
            phoneE164 = "+46701234567",
            group = ContactGroup.FAMILY,
            acceptanceStatus = ContactAcceptanceStatus.PENDING,
        )
        val accepted = pending.copy(acceptanceStatus = ContactAcceptanceStatus.ACCEPTED)

        assertFalse(pending.canReceiveEnhancedAlerts)
        assertTrue(accepted.canReceiveEnhancedAlerts)
    }

    @Test
    fun inactiveAcceptedContactCannotReceiveEnhancedAlerts() {
        val contact = TrustedContact(
            id = "1",
            name = "Daniel",
            phoneE164 = "+46701234567",
            group = ContactGroup.FAMILY,
            acceptanceStatus = ContactAcceptanceStatus.ACCEPTED,
            isActive = false,
        )

        assertFalse(contact.canReceiveEnhancedAlerts)
    }
}
