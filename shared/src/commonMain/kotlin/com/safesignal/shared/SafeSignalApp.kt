package com.safesignal.shared

import androidx.compose.runtime.Composable
import com.safesignal.shared.country.CountrySafetyConfigs
import com.safesignal.shared.design.SafeSignalTheme
import com.safesignal.shared.home.HomeScreen

@Composable
fun SafeSignalApp() {
    SafeSignalTheme {
        HomeScreen(
            country = CountrySafetyConfigs.Sweden,
            trustedContactCount = 0,
            protectionReady = false,
            onStartJourney = {},
            onOpenContacts = {},
        )
    }
}
