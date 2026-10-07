package com.safesignal.shared

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.safesignal.shared.contacts.ContactAcceptanceStatus
import com.safesignal.shared.contacts.ContactGroup
import com.safesignal.shared.contacts.TrustedContact
import com.safesignal.shared.contacts.TrustedContactsScreen
import com.safesignal.shared.country.CountrySafetyConfigs
import com.safesignal.shared.design.SafeSignalColors
import com.safesignal.shared.design.SafeSignalTheme
import com.safesignal.shared.home.HomeScreen
import com.safesignal.shared.navigation.AppDestination
import com.safesignal.shared.navigation.AppShell

@Composable
fun SafeSignalApp() {
    var destination by remember { mutableStateOf(AppDestination.SOS) }
    val contacts = remember { mutableStateListOf<TrustedContact>() }
    var nextContactNumber by remember { mutableStateOf(1) }

    SafeSignalTheme {
        AppShell(
            selectedDestination = destination,
            onDestinationSelected = { destination = it },
        ) {
            when (destination) {
                AppDestination.SOS -> HomeScreen(
                    country = CountrySafetyConfigs.Sweden,
                    trustedContactCount = contacts.size,
                    protectionReady = false,
                    onStartJourney = { destination = AppDestination.JOURNEY },
                )

                AppDestination.JOURNEY -> FoundationScreen(
                    title = "Safe Journey",
                    description = "Journey setup will be connected in its own tested production slice.",
                )

                AppDestination.CONTACTS -> TrustedContactsScreen(
                    contacts = contacts,
                    defaultCallingCode = CountrySafetyConfigs.Sweden.callingCode,
                    onAddContact = { name, phoneE164, group ->
                        contacts += TrustedContact(
                            id = "session-contact-" + nextContactNumber,
                            name = name,
                            phoneE164 = phoneE164,
                            group = group,
                            acceptanceStatus = ContactAcceptanceStatus.PENDING,
                        )
                        nextContactNumber += 1
                    },
                    onRemoveContact = { id ->
                        contacts.removeAll { it.id == id }
                    },
                )

                AppDestination.SETTINGS -> FoundationScreen(
                    title = "Settings",
                    description = "Privacy, region, language and accessibility settings will live here.",
                )
            }
        }
    }
}

@Composable
private fun FoundationScreen(
    title: String,
    description: String,
) {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = SafeSignalColors.BackgroundPrimary,
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 32.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                text = title,
                color = SafeSignalColors.TextPrimary,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = description,
                color = SafeSignalColors.TextSecondary,
                fontSize = 14.sp,
                lineHeight = 20.sp,
            )
        }
    }
}
