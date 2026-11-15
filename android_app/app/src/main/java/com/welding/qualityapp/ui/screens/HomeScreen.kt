package com.welding.qualityapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.welding.qualityapp.ui.theme.*

@Composable
fun HomeScreen(
    onNavigateToCamera: () -> Unit,
    onNavigateToUpload: () -> Unit,
    onNavigateToHistory: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(32.dp))

        // Hero Logo & Title
        Text(
            text = "WELD-AI",
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold,
            color = CyanPrimary
        )
        Text(
            text = "INDUSTRIAL QUALITY INSPECTION",
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            color = TextSecondary,
            letterSpacing = 2.sp
        )

        Spacer(modifier = Modifier.height(48.dp))

        // Action Cards
        MenuCard(
            title = "Capture Welding Image",
            subtitle = "Live CameraX Viewfinder & Snap",
            icon = Icons.Default.CameraAlt,
            accentColor = CyanPrimary,
            onClick = onNavigateToCamera
        )

        Spacer(modifier = Modifier.height(16.dp))

        MenuCard(
            title = "Upload from Gallery",
            subtitle = "Select high-res welding specimen",
            icon = Icons.Default.Image,
            accentColor = GoodGreen,
            onClick = onNavigateToUpload
        )

        Spacer(modifier = Modifier.height(16.dp))

        MenuCard(
            title = "Inspection History",
            subtitle = "Review past inspection records & logs",
            icon = Icons.Default.History,
            accentColor = CautionAmber,
            onClick = onNavigateToHistory
        )

        Spacer(modifier = Modifier.weight(1f))

        Text(
            text = "YOLO WELD DEFECT SYSTEM // v1.0",
            fontSize = 11.sp,
            color = TextSecondary
        )
        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
fun MenuCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    accentColor: Color,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        color = SurfaceDark,
        tonalElevation = 4.dp
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .background(accentColor.copy(alpha = 0.15f), shape = RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(28.dp)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column {
                Text(
                    text = title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = subtitle,
                    fontSize = 13.sp,
                    color = TextSecondary
                )
            }
        }
    }
}
