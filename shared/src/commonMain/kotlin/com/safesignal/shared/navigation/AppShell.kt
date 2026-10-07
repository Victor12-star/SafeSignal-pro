package com.safesignal.shared.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.BottomNavigation
import androidx.compose.material.BottomNavigationItem
import androidx.compose.material.Icon
import androidx.compose.material.Scaffold
import androidx.compose.material.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.safesignal.shared.design.SafeSignalColors

@Composable
fun AppShell(
    selectedDestination: AppDestination,
    onDestinationSelected: (AppDestination) -> Unit,
    content: @Composable () -> Unit,
) {
    Scaffold(
        backgroundColor = SafeSignalColors.BackgroundPrimary,
        bottomBar = {
            SafeSignalBottomNavigation(
                selectedDestination = selectedDestination,
                onDestinationSelected = onDestinationSelected,
            )
        },
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
        ) {
            content()
        }
    }
}

@Composable
private fun SafeSignalBottomNavigation(
    selectedDestination: AppDestination,
    onDestinationSelected: (AppDestination) -> Unit,
) {
    BottomNavigation(
        backgroundColor = SafeSignalColors.BackgroundSurface,
        contentColor = SafeSignalColors.TextSecondary,
    ) {
        AppDestination.entries.forEach { destination ->
            val selected = destination == selectedDestination
            BottomNavigationItem(
                selected = selected,
                onClick = { onDestinationSelected(destination) },
                icon = {
                    Icon(
                        imageVector = destination.icon(),
                        contentDescription = null,
                    )
                },
                label = {
                    Text(destination.label)
                },
                selectedContentColor = if (destination == AppDestination.SOS) {
                    SafeSignalColors.Emergency
                } else {
                    SafeSignalColors.PrimaryAction
                },
                unselectedContentColor = SafeSignalColors.TextSecondary,
                modifier = Modifier.semantics {
                    contentDescription = destination.accessibilityLabel
                },
            )
        }
    }
}

private fun AppDestination.icon(): ImageVector = when (this) {
    AppDestination.SOS -> Icons.Filled.Warning
    AppDestination.JOURNEY -> Icons.Filled.DirectionsWalk
    AppDestination.CONTACTS -> Icons.Filled.People
    AppDestination.SETTINGS -> Icons.Filled.Settings
}
