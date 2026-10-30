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
import com.safesignal.shared.auth.AuthenticationState
import com.safesignal.shared.contacts.ContactGroup
import com.safesignal.shared.contacts.InMemoryTrustedContactRepository
import com.safesignal.shared.contacts.TrustedContact
import com.safesignal.shared.contacts.TrustedContactRepository
import com.safesignal.shared.contacts.TrustedContactsScreen
import com.safesignal.shared.country.CountrySafetyConfigs
import com.safesignal.shared.design.SafeSignalColors
import com.safesignal.shared.design.SafeSignalTheme
import com.safesignal.shared.emergency.EmergencyCategory
import com.safesignal.shared.home.HomeScreen
import com.safesignal.shared.journey.JourneySession
import com.safesignal.shared.journey.JourneyStatus
import com.safesignal.shared.journey.SafeJourneyScreen
import com.safesignal.shared.navigation.AppDestination
import com.safesignal.shared.navigation.AppShell
import com.safesignal.shared.location.LocationUiState
import kotlinx.coroutines.launch

@Composable
fun SafeSignalApp(
    trustedContactRepository: TrustedContactRepository? = null,
    locationState: LocationUiState = LocationUiState.NotRequested,
    onRequestLocation: () -> Unit = {},
    onActivateSos: (EmergencyCategory, List<String>) -> Unit = { _, _ -> },
    sosInProgress: Boolean = false,
    sosActivated: Boolean = false,
    sosStatusMessage: String? = null,
    authenticationState: AuthenticationState = AuthenticationState.SignedOut,
    onSaveJourneyDraft: suspend (String, String, List<String>, String) -> Unit = { _, _, _, _ -> },
    onLoadJourneyDrafts: suspend (String) -> List<JourneySession> = { emptyList() },
    onDeleteJourneyDraft: suspend (String, String) -> Unit = { _, _ -> },
) {
    var destination by remember { mutableStateOf(AppDestination.SOS) }
    var journeyDestination by remember { mutableStateOf("") }
    var journeyDuration by remember { mutableStateOf("") }
    var journeySaving by remember { mutableStateOf(false) }
    var journeyDraftMessage by remember { mutableStateOf<String?>(null) }
    var draftsLoading by remember { mutableStateOf(false) }
    var deletingDraftId by remember { mutableStateOf<String?>(null) }
    var savedDrafts by remember { mutableStateOf<List<JourneySession>>(emptyList()) }
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

    val currentJourneyOwner = (authenticationState as? AuthenticationState.SignedIn)?.userId
    LaunchedEffect(currentJourneyOwner) {
        savedDrafts = emptyList()
        journeyDraftMessage = null
        if (currentJourneyOwner != null) {
            draftsLoading = true
            runCatching { onLoadJourneyDrafts(currentJourneyOwner) }
                .onSuccess { loaded ->
                    savedDrafts = loaded.filter { it.ownerId == currentJourneyOwner && it.status == JourneyStatus.DRAFT }
                }
                .onFailure { journeyDraftMessage = "Could not load encrypted drafts. Please retry." }
            draftsLoading = false
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
                    trustedContactCount = contacts.count { it.isActive },
                    protectionReady = contactsLoaded && contacts.any { it.isActive },
                    locationState = locationState,
                    onRequestLocation = onRequestLocation,
                    onStartJourney = { destination = AppDestination.JOURNEY },
                    onActivateSos = { category ->
                        onActivateSos(
                            category,
                            contacts.filter { it.isActive }.map { it.id },
                        )
                    },
                    sosInProgress = sosInProgress,
                    sosActivated = sosActivated,
                    sosStatusMessage = sosStatusMessage,
                )

                AppDestination.JOURNEY -> SafeJourneyScreen(
                    destination = journeyDestination,
                    onDestinationChange = { journeyDestination = it },
                    durationMinutes = journeyDuration,
                    onDurationChange = { journeyDuration = it },
                    selectedContactCount = contacts.count { it.isActive },
                    onOpenContacts = { destination = AppDestination.CONTACTS },
                    onRequestLocation = onRequestLocation,
                    canSaveDraft = authenticationState is AuthenticationState.SignedIn && contactsLoaded && storageMessage == null,
                    draftSaving = journeySaving,
                    draftStatusMessage = journeyDraftMessage,
                    savedDrafts = savedDrafts,
                    draftsLoading = draftsLoading,
                    deletingDraftId = deletingDraftId,
                    onDeleteDraft = { draftId ->
                        val owner = currentJourneyOwner
                        if (owner != null && deletingDraftId == null &&
                            savedDrafts.any { it.id == draftId && it.ownerId == owner && it.status == JourneyStatus.DRAFT }
                        ) {
                            deletingDraftId = draftId
                            scope.launch {
                                runCatching { onDeleteJourneyDraft(owner, draftId) }
                                    .onSuccess {
                                        if ((authenticationState as? AuthenticationState.SignedIn)?.userId == owner) {
                                            savedDrafts = savedDrafts.filterNot { it.id == draftId && it.ownerId == owner }
                                            journeyDraftMessage = "Draft deleted from encrypted storage."
                                        }
                                    }
                                    .onFailure { journeyDraftMessage = "Could not delete draft securely. Please retry." }
                                deletingDraftId = null
                            }
                        }
                    },
                    onRefreshDrafts = {
                        val owner = currentJourneyOwner
                        if (owner != null && !draftsLoading) {
                            draftsLoading = true
                            scope.launch {
                                runCatching { onLoadJourneyDrafts(owner) }
                                    .onSuccess { loaded ->
                                        if ((authenticationState as? AuthenticationState.SignedIn)?.userId == owner) {
                                            savedDrafts = loaded.filter { it.ownerId == owner && it.status == JourneyStatus.DRAFT }
                                            journeyDraftMessage = null
                                        }
                                    }
                                    .onFailure { journeyDraftMessage = "Could not load encrypted drafts. Please retry." }
                                draftsLoading = false
                            }
                        }
                    },
                    onSaveDraft = {
                        val signedIn = authenticationState as? AuthenticationState.SignedIn
                        val activeIds = contacts.filter { it.isActive }.map { it.id }
                        val savedDestination = journeyDestination.trim()
                        val savedDuration = journeyDuration
                        if (signedIn == null || activeIds.isEmpty() || journeySaving ||
                            !com.safesignal.shared.journey.JourneyDraftValidator.validate(savedDestination, savedDuration).isValid
                        ) {
                            journeyDraftMessage = "Sign in, enter valid details and add a trusted contact before saving."
                        } else {
                            journeySaving = true
                            journeyDraftMessage = null
                            scope.launch {
                                runCatching {
                                    onSaveJourneyDraft(signedIn.userId, savedDestination, activeIds, savedDuration)
                                }.onSuccess {
                                    journeyDraftMessage = "Private draft saved on this device. Location sharing is not active."
                                    if ((authenticationState as? AuthenticationState.SignedIn)?.userId == signedIn.userId) {
                                        runCatching { onLoadJourneyDrafts(signedIn.userId) }
                                            .onSuccess { loaded ->
                                                savedDrafts = loaded.filter { it.ownerId == signedIn.userId && it.status == JourneyStatus.DRAFT }
                                            }
                                    }
                                }.onFailure {
                                    journeyDraftMessage = "Could not save draft securely. Please retry; tracking was not started."
                                }
                                journeySaving = false
                            }
                        }
                    },
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
                    authenticationState = authenticationState,
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
    authenticationState: AuthenticationState? = null,
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
            if (authenticationState != null) {
                Text(
                    text = when (authenticationState) {
                        AuthenticationState.Checking -> "Account: Checking session"
                        AuthenticationState.SignedOut -> "Account: Not signed in"
                        is AuthenticationState.SignedIn -> "Account: Signed in"
                        is AuthenticationState.Error -> "Account: Unable to verify session"
                    },
                    color = SafeSignalColors.TextSecondary,
                    fontSize = 14.sp,
                )
            }
        }
    }
}
