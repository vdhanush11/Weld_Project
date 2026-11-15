package com.welding.qualityapp.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val BgDark = Color(0xFF070B13)
val SurfaceDark = Color(0xFF0F172A)
val CyanPrimary = Color(0xFF38BDF8)
val GoodGreen = Color(0xFF10B981)
val BadRed = Color(0xFFF43F5E)
val CautionAmber = Color(0xFFF59E0B)
val TextPrimary = Color(0xFFF8FAFC)
val TextSecondary = Color(0xFF94A3B8)

private val DarkColorScheme = darkColorScheme(
    primary = CyanPrimary,
    onPrimary = Color.Black,
    secondary = GoodGreen,
    onSecondary = Color.Black,
    background = BgDark,
    surface = SurfaceDark,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    error = BadRed
)

@Composable
fun WeldingQualityAppTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
