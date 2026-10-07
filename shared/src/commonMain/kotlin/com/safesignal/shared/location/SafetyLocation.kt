package com.safesignal.shared.location

data class SafetyLocation(
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Float,
    val capturedAtEpochMillis: Long,
    val isPrecisePermission: Boolean,
)

sealed interface LocationUiState {
    data object NotRequested : LocationUiState
    data object Loading : LocationUiState
    data object PermissionDenied : LocationUiState
    data object ServicesDisabled : LocationUiState
    data class Available(val location: SafetyLocation) : LocationUiState
    data class Error(val message: String) : LocationUiState
}

object LocationQualityPolicy {
    fun qualityLabel(location: SafetyLocation): String = when {
        !location.isPrecisePermission -> "Approximate"
        location.accuracyMeters <= 25f -> "Good"
        location.accuracyMeters <= 100f -> "Fair"
        else -> "Low accuracy"
    }

    fun isUsableForEmergency(location: SafetyLocation): Boolean =
        location.accuracyMeters.isFinite() &&
            location.accuracyMeters > 0f &&
            location.accuracyMeters <= 5_000f &&
            location.latitude in -90.0..90.0 &&
            location.longitude in -180.0..180.0
}
