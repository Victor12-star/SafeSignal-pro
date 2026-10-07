package com.safesignal.app.location

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
import androidx.core.content.ContextCompat
import com.safesignal.shared.location.SafetyLocation
import kotlin.coroutines.resume
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull

class AndroidLocationClient(
    context: Context,
) {
    private val appContext = context.applicationContext
    private val locationManager =
        appContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager

    fun hasAnyLocationPermission(): Boolean =
        hasFinePermission() || hasCoarsePermission()

    fun hasFinePermission(): Boolean =
        ContextCompat.checkSelfPermission(
            appContext,
            Manifest.permission.ACCESS_FINE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED

    fun hasCoarsePermission(): Boolean =
        ContextCompat.checkSelfPermission(
            appContext,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED

    fun isLocationEnabled(): Boolean =
        locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
            locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

    suspend fun getCurrentLocation(
        timeoutMillis: Long = 12_000L,
    ): SafetyLocation? {
        if (!hasAnyLocationPermission() || !isLocationEnabled()) return null

        val providers = buildList {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                add(LocationManager.GPS_PROVIDER)
            }
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                add(LocationManager.NETWORK_PROVIDER)
            }
        }

        if (providers.isEmpty()) return null

        return withTimeoutOrNull(timeoutMillis) {
            requestSingleLocation(providers.first())
        } ?: bestLastKnownLocation(providers)
    }

    @Suppress("DEPRECATION")
    private suspend fun requestSingleLocation(provider: String): SafetyLocation? =
        suspendCancellableCoroutine { continuation ->
            val listener = object : LocationListener {
                override fun onLocationChanged(location: Location) {
                    locationManager.removeUpdates(this)
                    if (continuation.isActive) {
                        continuation.resume(location.toSafetyLocation())
                    }
                }

                override fun onProviderDisabled(provider: String) {
                    locationManager.removeUpdates(this)
                    if (continuation.isActive) {
                        continuation.resume(null)
                    }
                }

                override fun onProviderEnabled(provider: String) = Unit

                @Deprecated("Deprecated in Android framework")
                override fun onStatusChanged(
                    provider: String?,
                    status: Int,
                    extras: Bundle?,
                ) = Unit
            }

            try {
                locationManager.requestSingleUpdate(
                    provider,
                    listener,
                    Looper.getMainLooper(),
                )
            } catch (_: SecurityException) {
                continuation.resume(null)
            } catch (_: IllegalArgumentException) {
                continuation.resume(null)
            }

            continuation.invokeOnCancellation {
                locationManager.removeUpdates(listener)
            }
        }

    private fun bestLastKnownLocation(
        providers: List<String>,
    ): SafetyLocation? = providers
        .mapNotNull { provider ->
            try {
                locationManager.getLastKnownLocation(provider)
            } catch (_: SecurityException) {
                null
            }
        }
        .maxByOrNull { it.time }
        ?.toSafetyLocation()

    private fun Location.toSafetyLocation(): SafetyLocation =
        SafetyLocation(
            latitude = latitude,
            longitude = longitude,
            accuracyMeters = if (hasAccuracy()) accuracy else Float.POSITIVE_INFINITY,
            capturedAtEpochMillis = time,
            isPrecisePermission = hasFinePermission(),
        )
}
