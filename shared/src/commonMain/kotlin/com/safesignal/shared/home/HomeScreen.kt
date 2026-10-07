package com.safesignal.shared.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Button
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.safesignal.shared.country.CountrySafetyConfig
import com.safesignal.shared.design.SafeSignalColors
import com.safesignal.shared.emergency.EmergencyCategory
import com.safesignal.shared.location.LocationQualityPolicy
import com.safesignal.shared.location.LocationUiState
import kotlin.math.roundToInt
import kotlinx.coroutines.withTimeoutOrNull

private val emergencyCategories = listOf(
    "Personal Danger",
    "Medical",
    "Accident",
    "Threat",
)

@Composable
fun HomeScreen(
    country: CountrySafetyConfig,
    trustedContactCount: Int,
    protectionReady: Boolean,
    locationState: LocationUiState,
    onRequestLocation: () -> Unit,
    onStartJourney: () -> Unit,
    onActivateSos: (EmergencyCategory) -> Unit,
    sosInProgress: Boolean = false,
    sosActivated: Boolean = false,
    sosStatusMessage: String? = null,
) {
    var selectedCategory by remember { mutableStateOf(emergencyCategories.first()) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp, vertical = 18.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Header(country)

        ProtectionStatus(
            trustedContactCount = trustedContactCount,
            protectionReady = protectionReady,
            emergencyNumber = country.emergencyNumbers.firstOrNull()?.number ?: "Unavailable",
        )

        LocationStatusCard(
            state = locationState,
            onRequestLocation = onRequestLocation,
        )

        EmergencyTypeSelector(
            selectedCategory = selectedCategory,
            onCategorySelected = { selectedCategory = it },
        )

        Spacer(modifier = Modifier.weight(1f))

        SosFoundationControl(
            protectionReady = protectionReady,
            selectedCategory = selectedCategory.toEmergencyCategory(),
            sosInProgress = sosInProgress,
            sosActivated = sosActivated,
            statusMessage = sosStatusMessage,
            onActivate = onActivateSos,
        )

        Button(
            onClick = onStartJourney,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                backgroundColor = SafeSignalColors.PrimaryAction,
                contentColor = Color.White,
            ),
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "Start Safe Journey",
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "Share your trip and enable safety monitoring",
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.78f),
                )
            }
        }

        QuickTriggersStatus()
    }
}

@Composable
private fun Header(country: CountrySafetyConfig) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column {
            Text(
                text = "SafeSignal",
                color = SafeSignalColors.TextPrimary,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "Personal safety, ready when you need it",
                color = SafeSignalColors.TextSecondary,
                fontSize = 12.sp,
            )
        }

        Surface(
            color = SafeSignalColors.BackgroundSurface,
            shape = RoundedCornerShape(12.dp),
        ) {
            Text(
                text = "${country.countryCode} · ${country.countryName}",
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                color = SafeSignalColors.TextSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun ProtectionStatus(
    trustedContactCount: Int,
    protectionReady: Boolean,
    emergencyNumber: String,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = SafeSignalColors.BackgroundSurface,
        shape = RoundedCornerShape(16.dp),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(if (protectionReady) SafeSignalColors.Safe else SafeSignalColors.Warning),
                )

                Column {
                    Text(
                        text = if (protectionReady) "Protection Ready" else "Finish safety setup",
                        color = SafeSignalColors.TextPrimary,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = if (trustedContactCount == 0) {
                            "Add a trusted contact before SOS can be armed"
                        } else {
                            "$trustedContactCount trusted contacts configured"
                        },
                        color = SafeSignalColors.TextSecondary,
                        fontSize = 12.sp,
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = emergencyNumber,
                    color = SafeSignalColors.TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                )
                Text(
                    text = "Emergency",
                    color = SafeSignalColors.TextSecondary,
                    fontSize = 11.sp,
                )
            }
        }
    }
}


@Composable
private fun LocationStatusCard(
    state: LocationUiState,
    onRequestLocation: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = SafeSignalColors.BackgroundSurface,
        shape = RoundedCornerShape(16.dp),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = "Location",
                    color = SafeSignalColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                )

                when (state) {
                    LocationUiState.NotRequested -> {
                        Text(
                            text = "Not checked yet. SafeSignal only asks when you choose to use location.",
                            color = SafeSignalColors.TextSecondary,
                            fontSize = 12.sp,
                        )
                    }

                    LocationUiState.Loading -> {
                        Text(
                            text = "Getting your current location…",
                            color = SafeSignalColors.TextSecondary,
                            fontSize = 12.sp,
                        )
                    }

                    LocationUiState.PermissionDenied -> {
                        Text(
                            text = "Location permission was not granted.",
                            color = SafeSignalColors.Warning,
                            fontSize = 12.sp,
                        )
                    }

                    LocationUiState.ServicesDisabled -> {
                        Text(
                            text = "Device location services are turned off.",
                            color = SafeSignalColors.Warning,
                            fontSize = 12.sp,
                        )
                    }

                    is LocationUiState.Error -> {
                        Text(
                            text = state.message,
                            color = SafeSignalColors.Warning,
                            fontSize = 12.sp,
                        )
                    }

                    is LocationUiState.Available -> {
                        val location = state.location
                        val latitude = ((location.latitude * 10_000.0).roundToInt() / 10_000.0)
                        val longitude = ((location.longitude * 10_000.0).roundToInt() / 10_000.0)
                        val accuracy = location.accuracyMeters.roundToInt()

                        Text(
                            text = "${LocationQualityPolicy.qualityLabel(location)} · ±${accuracy} m",
                            color = if (location.isPrecisePermission) {
                                SafeSignalColors.Safe
                            } else {
                                SafeSignalColors.Warning
                            },
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = "$latitude, $longitude",
                            color = SafeSignalColors.TextSecondary,
                            fontSize = 11.sp,
                        )
                    }
                }
            }

            Button(
                onClick = onRequestLocation,
                enabled = state !is LocationUiState.Loading,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = SafeSignalColors.PrimaryAction,
                    contentColor = Color.White,
                    disabledBackgroundColor = SafeSignalColors.CardSurface,
                    disabledContentColor = SafeSignalColors.TextSecondary,
                ),
            ) {
                Text(
                    text = if (state is LocationUiState.Available) "Refresh" else "Check",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}

@Composable
private fun EmergencyTypeSelector(
    selectedCategory: String,
    onCategorySelected: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(
            text = "Emergency type",
            color = SafeSignalColors.TextSecondary,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
        )

        emergencyCategories.chunked(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                row.forEach { category ->
                    CategoryChip(
                        text = category,
                        selected = selectedCategory == category,
                        onClick = { onCategorySelected(category) },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}

@Composable
private fun CategoryChip(
    text: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val borderColor = if (selected) SafeSignalColors.Emergency else Color(0xFF24364D)
    val background = if (selected) Color(0xFF2A1822) else SafeSignalColors.BackgroundSurface

    Surface(
        modifier = modifier
            .height(48.dp)
            .border(1.dp, borderColor, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .semantics {
                role = Role.Button
                contentDescription = "$text emergency type"
            },
        color = background,
        shape = RoundedCornerShape(12.dp),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = text,
                color = if (selected) Color.White else SafeSignalColors.TextSecondary,
                fontSize = 12.sp,
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
            )
        }
    }
}

@Composable
private fun SosFoundationControl(
    protectionReady: Boolean,
    selectedCategory: EmergencyCategory,
    sosInProgress: Boolean,
    sosActivated: Boolean,
    statusMessage: String?,
    onActivate: (EmergencyCategory) -> Unit,
) {
    val haptics = LocalHapticFeedback.current
    val enabled = protectionReady && !sosInProgress && !sosActivated

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            modifier = Modifier
                .size(184.dp)
                .clip(CircleShape)
                .background(
                    if (enabled) SafeSignalColors.Emergency else Color(0xFF6D3540),
                )
                .pointerInput(enabled, selectedCategory) {
                    if (!enabled) return@pointerInput

                    awaitEachGesture {
                        awaitFirstDown(requireUnconsumed = false)

                        val releasedEarly = withTimeoutOrNull(2_000L) {
                            waitForUpOrCancellation()
                        } != null

                        if (!releasedEarly) {
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            onActivate(selectedCategory)
                            waitForUpOrCancellation()
                        }
                    }
                }
                .semantics {
                    role = Role.Button
                    contentDescription = when {
                        sosActivated -> "SOS incident active"
                        sosInProgress -> "SOS activation in progress"
                        protectionReady -> "Hold for SOS for 2 seconds"
                        else -> "SOS unavailable until safety setup is complete"
                    }
                },
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = when {
                        sosActivated -> "INCIDENT"
                        sosInProgress -> "SAVING"
                        else -> "HOLD FOR"
                    },
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = "SOS",
                    color = Color.White,
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = when {
                        sosActivated -> "Active"
                        sosInProgress -> "Please wait"
                        else -> "2 seconds"
                    },
                    color = Color.White.copy(alpha = 0.82f),
                    fontSize = 12.sp,
                )
            }
        }

        Text(
            text = statusMessage ?: if (protectionReady) {
                "Release early to cancel. A completed hold is saved before location starts."
            } else {
                "SOS remains inactive until trusted-contact setup is complete"
            },
            color = if (statusMessage != null) SafeSignalColors.Warning else SafeSignalColors.TextSecondary,
            fontSize = 12.sp,
            textAlign = TextAlign.Center,
        )
    }
}

private fun String.toEmergencyCategory(): EmergencyCategory = when (this) {
    "Medical" -> EmergencyCategory.MEDICAL
    "Accident" -> EmergencyCategory.ACCIDENT
    "Threat" -> EmergencyCategory.THREAT_ROBBERY
    else -> EmergencyCategory.PERSONAL_DANGER
}

@Composable
private fun QuickTriggersStatus() {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = "Quick Triggers",
            color = SafeSignalColors.TextSecondary,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
        )

        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = SafeSignalColors.BackgroundSurface,
            shape = RoundedCornerShape(14.dp),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text(
                        text = "Shake to SOS",
                        color = SafeSignalColors.TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = "Motion trigger is not configured yet",
                        color = SafeSignalColors.TextSecondary,
                        fontSize = 12.sp,
                    )
                }
                Text(
                    text = "Off",
                    color = SafeSignalColors.TextSecondary,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}
