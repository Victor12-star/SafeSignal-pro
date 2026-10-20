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
import com.safesignal.app.location.AndroidLocationClient
import com.safesignal.shared.SafeSignalApp
import com.safesignal.shared.auth.AuthenticationSessionRepository
import com.safesignal.shared.auth.AuthenticationState
import com.safesignal.shared.auth.SupabaseAuthenticationSessionRepository
import com.safesignal.shared.emergency.CreateEmergencyIncidentUseCase
import com.safesignal.shared.emergency.EmergencyCategory
import com.safesignal.shared.emergency.EmergencyIncidentRepository
import com.safesignal.shared.emergency.EmergencyState
import com.safesignal.shared.emergency.TransitionEmergencyIncidentUseCase
import com.safesignal.shared.location.LocationQualityPolicy
import com.safesignal.shared.location.LocationUiState
import io.github.jan.supabase.auth.handleDeeplinks
import java.util.UUID
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private val backendProvider by lazy { AndroidBackendProvider() }
    private var foregroundSessionRevision by mutableIntStateOf(0)
    private var callbackSessionRevision by mutableIntStateOf(0)

    override fun onResume() {
        super.onResume()
        // Revalidate an existing session whenever the app returns to the foreground.
        foregroundSessionRevision++
    }

    private fun handleAuthenticationCallback(callbackIntent: Intent) {
        // Never log callback URLs: they may carry credentials or one-time codes.
        if (callbackIntent.action != Intent.ACTION_VIEW ||
            callbackIntent.data?.scheme != "https" ||
            callbackIntent.data?.host != "auth.vikwora.com" ||
            callbackIntent.data?.path != "/login-callback"
        ) return
        // Callback handling can arrive through onNewIntent while the activity stays resumed.
        // Schedule a fresh server-backed session check without gating the SOS interface.
        runCatching {
            backendProvider.client?.handleDeeplinks(callbackIntent)
        }
        callbackSessionRevision++
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
        // A missing or unavailable backend must never prevent the SOS interface from opening.
        val authenticationRepository = runCatching {
            backendProvider.client?.let(::SupabaseAuthenticationSessionRepository)
        }.getOrNull()

        setContent {
            SafeSignalAndroidApp(
                trustedContactRepository = trustedContactRepository,
                emergencyIncidentRepository = emergencyIncidentRepository,
                locationClient = locationClient,
                authenticationRepository = authenticationRepository,
                sessionRefreshRevision = foregroundSessionRevision,
                callbackRefreshRevision = callbackSessionRevision,
            )
        }
    }
}

@Composable
private fun SafeSignalAndroidApp(
    trustedContactRepository: AndroidEncryptedTrustedContactRepository,
    emergencyIncidentRepository: EmergencyIncidentRepository,
    locationClient: AndroidLocationClient,
    authenticationRepository: AuthenticationSessionRepository?,
    sessionRefreshRevision: Int,
    callbackRefreshRevision: Int,
) {
    var locationState by remember {
        mutableStateOf<LocationUiState>(LocationUiState.NotRequested)
    }
    var sosInProgress by remember { mutableStateOf(false) }
    var activeIncidentId by remember { mutableStateOf<String?>(null) }
    var sosStatusMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    var authenticationState by remember {
        mutableStateOf<AuthenticationState>(AuthenticationState.Checking)
    }

    // Session restoration runs independently of SOS, contacts, and location startup.
    LaunchedEffect(authenticationRepository, sessionRefreshRevision, callbackRefreshRevision) {
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
    )
}
