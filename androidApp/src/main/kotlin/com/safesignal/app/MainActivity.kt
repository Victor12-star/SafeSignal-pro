package com.safesignal.app

import android.Manifest
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import com.safesignal.app.backend.AndroidBackendProvider
import com.safesignal.app.contacts.AndroidEncryptedTrustedContactRepository
import com.safesignal.app.emergency.AndroidEncryptedEmergencyIncidentRepository
import com.safesignal.app.journey.AndroidEncryptedJourneySessionRepository
import com.safesignal.app.location.AndroidLocationClient
import com.safesignal.shared.SafeSignalApp
import com.safesignal.shared.auth.AuthenticationCallbackPolicy
import com.safesignal.shared.auth.AuthenticationSessionRepository
import com.safesignal.shared.auth.AuthenticationState
import com.safesignal.shared.auth.SupabaseAuthenticationSessionRepository
import com.safesignal.shared.emergency.CreateEmergencyIncidentUseCase
import com.safesignal.shared.emergency.EmergencyCategory
import com.safesignal.shared.emergency.EmergencyIncidentRepository
import com.safesignal.shared.emergency.EmergencyState
import com.safesignal.shared.emergency.TransitionEmergencyIncidentUseCase
import com.safesignal.shared.journey.JourneySession
import com.safesignal.shared.journey.JourneyStatus
import com.safesignal.shared.location.LocationQualityPolicy
import com.safesignal.shared.location.LocationUiState
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.handleDeeplinks
import io.github.jan.supabase.auth.status.SessionStatus
import java.util.UUID
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private val backendProvider by lazy { AndroidBackendProvider() }
    private var foregroundSessionRevision by mutableIntStateOf(0)

    override fun onResume() {
        super.onResume()
        // Revalidate an existing session whenever the app returns to the foreground.
        foregroundSessionRevision++
    }

    private fun handleAuthenticationCallback(callbackIntent: Intent) {
        // Never log callback URLs: they may carry credentials or one-time codes.
        if (callbackIntent.action != Intent.ACTION_VIEW) return
        val uri = callbackIntent.data ?: return
        // Central policy prevents the Android entry point and future platforms
        // from silently drifting apart on which authentication URLs are trusted.
        if (!AuthenticationCallbackPolicy.isAllowed(uri.scheme, uri.host, uri.path)) return
        // Processing the callback may be asynchronous. The SDK session-status collector
        // below triggers verification when authentication actually changes; checking
        // immediately here could display SignedOut while login is still completing.
        // Never let a backend failure block the SOS screen.
        runCatching {
            backendProvider.client?.handleDeeplinks(callbackIntent)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleAuthenticationCallback(intent)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleAuthenticationCallback(intent)
        enableEdgeToEdge()

        val trustedContactRepository = AndroidEncryptedTrustedContactRepository(
            applicationContext,
        )
        val emergencyIncidentRepository = AndroidEncryptedEmergencyIncidentRepository(
            applicationContext,
        )
        val locationClient = AndroidLocationClient(applicationContext)
        val journeyRepository = AndroidEncryptedJourneySessionRepository(applicationContext)
        // A missing or unavailable backend must never prevent the SOS interface from opening.
        val authenticationRepository = runCatching {
            backendProvider.client?.let(::SupabaseAuthenticationSessionRepository)
        }.getOrNull()

        setContent {
            SafeSignalAndroidApp(
                trustedContactRepository = trustedContactRepository,
                emergencyIncidentRepository = emergencyIncidentRepository,
                locationClient = locationClient,
                journeyRepository = journeyRepository,
                authenticationRepository = authenticationRepository,
                authClient = runCatching { backendProvider.client }.getOrNull(),
                sessionRefreshRevision = foregroundSessionRevision,
            )
        }
    }
}

@Composable
private fun SafeSignalAndroidApp(
    trustedContactRepository: AndroidEncryptedTrustedContactRepository,
    emergencyIncidentRepository: EmergencyIncidentRepository,
    locationClient: AndroidLocationClient,
    journeyRepository: AndroidEncryptedJourneySessionRepository,
    authenticationRepository: AuthenticationSessionRepository?,
    authClient: SupabaseClient?,
    sessionRefreshRevision: Int,
) {
    var locationState by remember {
        mutableStateOf<LocationUiState>(LocationUiState.NotRequested)
    }
    var sosInProgress by remember { mutableStateOf(false) }
    var activeIncidentId by remember { mutableStateOf<String?>(null) }
    var sosStatusMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    var authStatusRevision by remember { mutableIntStateOf(0) }

    // The deep-link handler can return before Supabase finishes updating its session.
    // React to the SDK status stream so successful callbacks also trigger verification.
    LaunchedEffect(authClient) {
        authClient?.auth?.sessionStatus?.collect { status ->
            if (status is SessionStatus.Authenticated ||
                status is SessionStatus.NotAuthenticated ||
                status is SessionStatus.RefreshFailure
            ) {
                authStatusRevision++
            }
        }
    }
    var authenticationState by remember {
        mutableStateOf<AuthenticationState>(AuthenticationState.Checking)
    }

    // Session restoration runs independently of SOS, contacts, and location startup.
    // Foreground resumes and confirmed SDK status changes both re-check the session.
    // Keep this independent of SOS: sign-in is not a prerequisite for emergency use.
    LaunchedEffect(authenticationRepository, sessionRefreshRevision, authStatusRevision) {
        authenticationState = AuthenticationState.Checking
        authenticationState = if (authenticationRepository == null) {
            AuthenticationState.SignedOut
        } else {
            authenticationRepository.restoreSession()
        }
    }

    val createEmergencyIncident = remember(emergencyIncidentRepository) {
        CreateEmergencyIncidentUseCase(
            repository = emergencyIncidentRepository,
            idProvider = { UUID.randomUUID().toString() },
            nowEpochMillis = System::currentTimeMillis,
        )
    }
    val transitionEmergencyIncident = remember(emergencyIncidentRepository) {
        TransitionEmergencyIncidentUseCase(emergencyIncidentRepository)
    }

    LaunchedEffect(emergencyIncidentRepository) {
        runCatching {
            emergencyIncidentRepository.getAll()
                .filter { it.isActive }
                .maxByOrNull { it.updatedAtEpochMillis }
        }.onSuccess { recovered ->
            if (recovered != null) {
                activeIncidentId = recovered.id
                sosStatusMessage =
                    "An emergency incident was recovered from this device and is still active."
            }
        }.onFailure {
            sosStatusMessage =
                "Emergency history could not be read securely. Do not rely on SOS until storage is available."
        }
    }

    fun fetchLocation() {
        if (!locationClient.isLocationEnabled()) {
            locationState = LocationUiState.ServicesDisabled
            if (activeIncidentId != null) {
                sosStatusMessage =
                    "Emergency saved. Device location services are off; location is still pending."
            }
            return
        }

        locationState = LocationUiState.Loading
        scope.launch {
            runCatching {
                locationClient.getCurrentLocation()
            }.onSuccess { location ->
                locationState = when {
                    location == null -> LocationUiState.Error(
                        "A current location could not be obtained. Try again outdoors or near a window.",
                    )

                    !LocationQualityPolicy.isUsableForEmergency(location) ->
                        LocationUiState.Error(
                            "The available location is too inaccurate to rely on yet. Try again.",
                        )

                    else -> LocationUiState.Available(location)
                }

                if (activeIncidentId != null) {
                    sosStatusMessage = when (locationState) {
                        is LocationUiState.Available ->
                            "Emergency saved. Current location acquired; delivery is not started yet."

                        else ->
                            "Emergency saved. Location is still pending and can be retried."
                    }
                }
            }.onFailure {
                locationState = LocationUiState.Error(
                    "Location could not be read. Check location settings and try again.",
                )
                if (activeIncidentId != null) {
                    sosStatusMessage =
                        "Emergency saved. Location could not be read yet and remains pending."
                }
            }
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions(),
    ) { grants ->
        val allowed =
            grants[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true

        if (allowed) {
            fetchLocation()
        } else {
            locationState = LocationUiState.PermissionDenied
            if (activeIncidentId != null) {
                sosStatusMessage =
                    "Emergency saved. Location permission was not granted; location remains pending."
            }
        }
    }

    fun requestLocationAfterSave() {
        if (locationClient.hasAnyLocationPermission()) {
            fetchLocation()
        } else {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                ),
            )
        }
    }

    SafeSignalApp(
        trustedContactRepository = trustedContactRepository,
        locationState = locationState,
        onRequestLocation = {
            if (locationClient.hasAnyLocationPermission()) {
                fetchLocation()
            } else {
                permissionLauncher.launch(
                    arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                    ),
                )
            }
        },
        onActivateSos = { category: EmergencyCategory, recipientIds: List<String> ->
            if (sosInProgress || activeIncidentId != null) {
                return@SafeSignalApp
            }

            sosInProgress = true
            sosStatusMessage = "Saving emergency securely before location starts…"

            scope.launch {
                runCatching {
                    val created = createEmergencyIncident.execute(
                        category = category,
                        recipientIds = recipientIds,
                    )
                    transitionEmergencyIncident.execute(
                        incidentId = created.id,
                        to = EmergencyState.PENDING_LOCATION,
                        updatedAtEpochMillis = System.currentTimeMillis(),
                    )
                }.onSuccess { pending ->
                    activeIncidentId = pending.id
                    sosInProgress = false
                    sosStatusMessage =
                        "Emergency saved securely. Getting current location…"
                    requestLocationAfterSave()
                }.onFailure {
                    sosInProgress = false
                    sosStatusMessage =
                        "SOS was not started because the emergency could not be saved securely. Try again."
                }
            }
        },
        sosInProgress = sosInProgress,
        sosActivated = activeIncidentId != null,
        sosStatusMessage = sosStatusMessage,
        authenticationState = authenticationState,
        onDeleteJourneyDraft = { ownerId, draftId ->
            val currentOwner = (authenticationState as? AuthenticationState.SignedIn)?.userId
            require(!currentOwner.isNullOrBlank() && currentOwner == ownerId) {
                "Authenticated journey owner required"
            }
            val draft = journeyRepository.getById(currentOwner, draftId)
                ?: throw IllegalArgumentException("Draft not found for signed-in owner")
            require(draft.status == JourneyStatus.DRAFT) { "Only drafts can be deleted here" }
            journeyRepository.delete(currentOwner, draftId)
        },
        onLoadJourneyDrafts = { ownerId ->
            val currentOwner = (authenticationState as? AuthenticationState.SignedIn)?.userId
            require(!currentOwner.isNullOrBlank() && currentOwner == ownerId) {
                "Authenticated journey owner required"
            }
            journeyRepository.getAllForOwner(currentOwner)
                .filter { it.status == JourneyStatus.DRAFT }
        },
        onSaveJourneyDraft = { ownerId, journeyDestination, contactIds, durationMinutes ->
            // Verify the owner again when saving; do not accept an arbitrary UI-supplied owner.
            val currentOwner = (authenticationState as? AuthenticationState.SignedIn)?.userId
            require(!currentOwner.isNullOrBlank() && currentOwner == ownerId) {
                "Authenticated journey owner required"
            }
            val duration = durationMinutes.toLongOrNull()
                ?: throw IllegalArgumentException("Invalid duration")
            require(duration in 1..1440) { "Invalid duration" }
            val now = System.currentTimeMillis()
            journeyRepository.save(
                JourneySession(
                    id = UUID.randomUUID().toString(),
                    ownerId = currentOwner,
                    destination = journeyDestination,
                    expectedArrivalEpochMillis = now + duration * 60_000L,
                    trustedContactIds = contactIds,
                    status = JourneyStatus.DRAFT,
                    createdAtEpochMillis = now,
                ),
            )
        },
    )
}
