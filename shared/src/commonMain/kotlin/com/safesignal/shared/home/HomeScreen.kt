package com.safesignal.shared.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
    onStartJourney: () -> Unit,
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

        EmergencyTypeSelector(
            selectedCategory = selectedCategory,
            onCategorySelected = { selectedCategory = it },
        )

        Spacer(modifier = Modifier.weight(1f))

        SosFoundationControl(protectionReady)

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
private fun SosFoundationControl(protectionReady: Boolean) {
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
                    if (protectionReady) SafeSignalColors.Emergency else Color(0xFF6D3540),
                )
                .semantics {
                    role = Role.Button
                    contentDescription = if (protectionReady) {
                        "Hold for SOS"
                    } else {
                        "SOS unavailable until safety setup is complete"
                    }
                },
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "HOLD FOR",
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
                    text = "2 seconds",
                    color = Color.White.copy(alpha = 0.82f),
                    fontSize = 12.sp,
                )
            }
        }

        Text(
            text = if (protectionReady) {
                "Silent alert with haptic confirmation"
            } else {
                "SOS remains inactive until trusted-contact setup is complete"
            },
            color = SafeSignalColors.TextSecondary,
            fontSize = 12.sp,
            textAlign = TextAlign.Center,
        )
    }
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
