package com.safesignal.shared

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.safesignal.shared.contacts.ContactGroup
import com.safesignal.shared.contacts.InMemoryTrustedContactRepository
import com.safesignal.shared.contacts.TrustedContact
import com.safesignal.shared.contacts.TrustedContactRepository
import com.safesignal.shared.contacts.TrustedContactsScreen
import com.safesignal.shared.country.CountrySafetyConfigs
import com.safesignal.shared.design.SafeSignalColors
import com.safesignal.shared.design.SafeSignalTheme
import com.safesignal.shared.home.HomeScreen
import com.safesignal.shared.navigation.AppDestination
import com.safesignal.shared.navigation.AppShell
import com.safesignal.shared.location.LocationUiState
import kotlinx.coroutines.launch

@Composable
fun SafeSignalApp(
    trustedContactRepository: TrustedContactRepository? = null,
    locationState: LocationUiState = LocationUiState.NotRequested,
    onRequestLocation: () -> Unit = {},
) {
    var destination by remember { mutableStateOf(AppDestination.SOS) }
    val repository = remember(trustedContactRepository) {
        trustedContactRepository ?: InMemoryTrustedContactRepository()
    }
    val contacts = remember { mutableStateListOf<TrustedContact>() }
    var storageMessage by remember { mutableStateOf<String?>(null) }
    var contactsLoaded by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(repository) {
        runCatching {
            repository.getAll()
        }.onSuccess { persisted ->
            contacts.clear()
            contacts.addAll(persisted)
            contactsLoaded = true
            storageMessage = null
        }.onFailure {
            contactsLoaded = true
            storageMessage = "Trusted contacts could not be loaded securely. Try again before relying on SOS."
        }
    }

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
                    locationState = locationState,
                    onRequestLocation = onRequestLocation,
                    onStartJourney = { destination = AppDestination.JOURNEY },
                )

                AppDestination.JOURNEY -> FoundationScreen(
                    title = "Safe Journey",
                    description = "Journey setup will be connected in its own tested production slice.",
                )

                AppDestination.CONTACTS -> TrustedContactsScreen(
                    contacts = contacts,
                    defaultCallingCode = CountrySafetyConfigs.Sweden.callingCode,
                    storageMessage = storageMessage,
                    isLoading = !contactsLoaded,
                    onAddContact = { name, phoneE164, group ->
                        persistContact(
                            repository = repository,
                            name = name,
                            phoneE164 = phoneE164,
                            group = group,
                            scope = scope,
                            onSuccess = { contact ->
                                contacts += contact
                                storageMessage = null
                            },
                            onFailure = {
                                storageMessage = "Contact was not saved. Check the device and try again."
                            },
                        )
                    },
                    onRemoveContact = { id ->
                        scope.launch {
                            runCatching {
                                repository.remove(id)
                            }.onSuccess {
                                contacts.removeAll { it.id == id }
                                storageMessage = null
                            }.onFailure {
                                storageMessage = "Contact could not be removed securely. Try again."
                            }
                        }
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

private fun persistContact(
    repository: TrustedContactRepository,
    name: String,
    phoneE164: String,
    group: ContactGroup,
    scope: kotlinx.coroutines.CoroutineScope,
    onSuccess: (TrustedContact) -> Unit,
    onFailure: () -> Unit,
) {
    scope.launch {
        runCatching {
            repository.add(
                name = name,
                phoneE164 = phoneE164,
                group = group,
            )
        }.onSuccess(onSuccess)
            .onFailure { onFailure() }
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
