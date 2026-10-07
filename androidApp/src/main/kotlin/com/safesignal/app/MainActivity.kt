package com.safesignal.app

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import com.safesignal.app.contacts.AndroidEncryptedTrustedContactRepository
import com.safesignal.app.location.AndroidLocationClient
import com.safesignal.shared.SafeSignalApp
import com.safesignal.shared.location.LocationQualityPolicy
import com.safesignal.shared.location.LocationUiState
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val trustedContactRepository = AndroidEncryptedTrustedContactRepository(
            applicationContext,
        )
        val locationClient = AndroidLocationClient(applicationContext)

        setContent {
            SafeSignalAndroidApp(
                trustedContactRepository = trustedContactRepository,
                locationClient = locationClient,
            )
        }
    }
}

@Composable
private fun SafeSignalAndroidApp(
    trustedContactRepository: AndroidEncryptedTrustedContactRepository,
    locationClient: AndroidLocationClient,
) {
    var locationState by remember {
        mutableStateOf<LocationUiState>(LocationUiState.NotRequested)
    }
    val scope = rememberCoroutineScope()

    fun fetchLocation() {
        if (!locationClient.isLocationEnabled()) {
            locationState = LocationUiState.ServicesDisabled
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
            }.onFailure {
                locationState = LocationUiState.Error(
                    "Location could not be read. Check location settings and try again.",
                )
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
    )
}
