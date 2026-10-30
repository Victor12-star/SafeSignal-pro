package com.safesignal.shared.journey

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Button
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.Card
import androidx.compose.material.OutlinedTextField
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.safesignal.shared.design.SafeSignalColors

/** Setup-only view. Journey tracking and alerts are not available yet. */
@Composable
fun SafeJourneyScreen(
    destination: String,
    onDestinationChange: (String) -> Unit,
    durationMinutes: String,
    onDurationChange: (String) -> Unit,
    selectedContactCount: Int,
    onOpenContacts: () -> Unit,
    onRequestLocation: () -> Unit,
    canSaveDraft: Boolean = false,
    draftSaving: Boolean = false,
    draftStatusMessage: String? = null,
    onSaveDraft: () -> Unit = {},
    savedDrafts: List<JourneySession> = emptyList(),
    draftsLoading: Boolean = false,
    onRefreshDrafts: () -> Unit = {},
) {
    val validation = JourneyDraftValidator.validate(destination, durationMinutes)
    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Text("Safe Journey", color = SafeSignalColors.TextPrimary, fontSize = 26.sp, fontWeight = FontWeight.Bold)
        Text(
            "Prepare a journey and choose people you trust. Live tracking, countdowns and automatic alerts are not active yet.",
            color = SafeSignalColors.TextSecondary,
            fontSize = 14.sp,
        )
        Card(backgroundColor = SafeSignalColors.BackgroundSurface, elevation = 0.dp) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("Journey setup", color = SafeSignalColors.TextPrimary, fontWeight = FontWeight.Bold)
                OutlinedTextField(
                    value = destination,
                    onValueChange = { if (it.length <= 120) onDestinationChange(it) },
                    label = { Text("Destination") },
                    placeholder = { Text("Where are you going?") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = durationMinutes,
                    onValueChange = { value -> if (value.length <= 4 && value.all(Char::isDigit)) onDurationChange(value) },
                    label = { Text("Estimated duration (minutes)") },
                    placeholder = { Text("e.g. 30") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Text(
                    if (validation.isValid) "Journey details valid. Monitoring is not active."
                    else validation.errors.joinToString(". "),
                    color = if (validation.isValid) SafeSignalColors.Safe else SafeSignalColors.TextSecondary,
                )
            }
        }
        Card(backgroundColor = SafeSignalColors.BackgroundSurface, elevation = 0.dp) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Trusted contacts", color = SafeSignalColors.TextPrimary, fontWeight = FontWeight.Bold)
                Text(
                    "$selectedContactCount active contact(s) available. Journey-specific contact selection and notification consent are not connected yet.",
                    color = SafeSignalColors.TextSecondary,
                )
                Button(
                    onClick = onOpenContacts,
                    colors = ButtonDefaults.buttonColors(backgroundColor = SafeSignalColors.PrimaryAction, contentColor = Color.White),
                ) { Text("Manage contacts") }
            }
        }
        Card(backgroundColor = SafeSignalColors.BackgroundSurface, elevation = 0.dp) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Location", color = SafeSignalColors.TextPrimary, fontWeight = FontWeight.Bold)
                Text("Location is requested only when you choose. No journey tracking starts from this screen.", color = SafeSignalColors.TextSecondary)
                Button(
                    onClick = onRequestLocation,
                    colors = ButtonDefaults.buttonColors(backgroundColor = SafeSignalColors.PrimaryAction, contentColor = Color.White),
                ) { Text("Check current location") }
            }
        }
        Button(
            onClick = onSaveDraft,
            enabled = validation.isValid && selectedContactCount > 0 && canSaveDraft && !draftSaving,
            colors = ButtonDefaults.buttonColors(backgroundColor = SafeSignalColors.PrimaryAction, contentColor = Color.White),
        ) { Text(if (draftSaving) "Saving draft…" else "Save journey draft") }
        Text(draftStatusMessage ?: "Sign in and add an active trusted contact to save a private draft. Saving does not start tracking.", color = SafeSignalColors.TextSecondary)
        Card(backgroundColor = SafeSignalColors.BackgroundSurface, elevation = 0.dp) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Saved drafts on this device", color = SafeSignalColors.TextPrimary, fontWeight = FontWeight.Bold)
                Button(
                    onClick = onRefreshDrafts,
                    enabled = canSaveDraft && !draftsLoading,
                    colors = ButtonDefaults.buttonColors(backgroundColor = SafeSignalColors.PrimaryAction, contentColor = Color.White),
                ) { Text(if (draftsLoading) "Loading…" else "Refresh saved drafts") }
                if (savedDrafts.isEmpty()) {
                    Text("No saved drafts loaded for this signed-in account.", color = SafeSignalColors.TextSecondary)
                } else {
                    savedDrafts.filter { it.status == JourneyStatus.DRAFT }.forEach { draft ->
                        Text(draft.destination + " — saved draft only (tracking off)", color = SafeSignalColors.TextPrimary)
                    }
                }
            }
        }
        Text("Journey monitoring not available yet", color = SafeSignalColors.Emergency, fontWeight = FontWeight.Bold)
        Text(
            "Drafts can be saved securely on this device when signed in. Starting a journey, sharing location, checking in, sending overdue alerts, and the I’m Safe action are not implemented yet.",
            color = SafeSignalColors.TextSecondary,
        )
    }
}
