package com.safesignal.shared.design

import androidx.compose.material.MaterialTheme
import androidx.compose.material.Shapes
import androidx.compose.material.Typography
import androidx.compose.material.lightColors
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

object SafeSignalColors {
    val BackgroundPrimary = Color(0xFFFFFFFF)
    val BackgroundSurface = Color(0xFFF6F8FC)
    val CardSurface = Color(0xFFEDF2F8)
    val TextPrimary = Color(0xFF142238)
    val TextSecondary = Color(0xFF52647A)
    val PrimaryAction = Color(0xFF2F80ED)
    val Safe = Color(0xFF20C997)
    val Emergency = Color(0xFFE94A5A)
    val Warning = Color(0xFFF2B84B)
}

private val SafeSignalLightColors = lightColors(
    primary = SafeSignalColors.PrimaryAction,
    primaryVariant = Color(0xFF2468BE),
    secondary = SafeSignalColors.Safe,
    background = SafeSignalColors.BackgroundPrimary,
    surface = SafeSignalColors.BackgroundSurface,
    error = SafeSignalColors.Emergency,
    onPrimary = Color.White,
    onSecondary = Color(0xFF04110C),
    onBackground = SafeSignalColors.TextPrimary,
    onSurface = SafeSignalColors.TextPrimary,
    onError = Color.White,
)

@Composable
fun SafeSignalTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colors = SafeSignalLightColors,
        typography = Typography(),
        shapes = Shapes(),
        content = content,
    )
}
