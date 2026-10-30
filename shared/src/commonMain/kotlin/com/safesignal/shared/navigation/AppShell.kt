package com.safesignal.shared.navigation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Surface
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
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
        topBar = {
            ScreenSwitcher(selectedDestination, onDestinationSelected)
        },
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
        modifier = Modifier.navigationBarsPadding(),
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

/** Always-visible secondary route into each screen on devices with obscured bottom bars. */
@Composable
private fun ScreenSwitcher(
    selectedDestination: AppDestination,
    onDestinationSelected: (AppDestination) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        AppDestination.entries.forEach { destination ->
            val selected = destination == selectedDestination
            Surface(
                modifier = Modifier.weight(1f).height(46.dp).clickable { onDestinationSelected(destination) },
                shape = RoundedCornerShape(14.dp),
                color = if (selected) SafeSignalColors.PrimaryAction else SafeSignalColors.CardSurface,
                elevation = if (selected) 2.dp else 0.dp,
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = destination.label,
                        color = if (selected) Color.White else SafeSignalColors.TextSecondary,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                    )
                }
            }
        }
    }
}
