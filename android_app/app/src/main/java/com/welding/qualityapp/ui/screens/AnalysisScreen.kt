package com.welding.qualityapp.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.welding.qualityapp.data.api.InspectionResponseDto
import com.welding.qualityapp.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnalysisScreen(
    inspection: InspectionResponseDto,
    onNavigateBack: () -> Unit
) {
    val isGood = inspection.overallStatus == "GOOD"
    val isBad = inspection.overallStatus == "BAD"
    val statusColor = when {
        isGood -> GoodGreen
        isBad -> BadRed
        else -> CautionAmber
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Inspection Results", color = TextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceDark)
            )
        },
        containerColor = BgDark
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Overall Status Banner
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = statusColor.copy(alpha = 0.15f),
                border = androidx.compose.foundation.BorderStroke(1.dp, statusColor.copy(alpha = 0.5f))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (isGood) Icons.Default.CheckCircle else Icons.Default.Warning,
                        contentDescription = null,
                        tint = statusColor,
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(
                            text = when (inspection.overallStatus) {
                                "GOOD" -> "GOOD WELD"
                                "BAD" -> "DEFECT DETECTED"
                                else -> "UNCERTAIN (MANUAL REVIEW)"
                            },
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                        Text(
                            text = inspection.decisionReason,
                            fontSize = 13.sp,
                            color = TextPrimary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Annotated Image with Bounding Box Canvas Overlay
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp)
                    .background(Color.Black, shape = RoundedCornerShape(12.dp))
            ) {
                AsyncImage(
                    model = inspection.annotatedImageUrl,
                    contentDescription = "Annotated Weld",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
                )

                // Custom Compose Canvas to ensure bounding boxes render crisply
                Canvas(modifier = Modifier.fillMaxSize()) {
                    inspection.detections.forEach { det ->
                        val boxColor = if (det.isDefect) BadRed else GoodGreen
                        val normX1 = det.bbox.normX1 ?: 0f
                        val normY1 = det.bbox.normY1 ?: 0f
                        val normX2 = det.bbox.normX2 ?: 1f
                        val normY2 = det.bbox.normY2 ?: 1f

                        val left = normX1 * size.width
                        val top = normY1 * size.height
                        val width = (normX2 - normX1) * size.width
                        val height = (normY2 - normY1) * size.height

                        drawRect(
                            color = boxColor,
                            topLeft = Offset(left, top),
                            size = Size(width, height),
                            style = Stroke(width = 3.dp.toPx())
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Score and Telemetry Card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = SurfaceDark
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("QUALITY SCORE", fontSize = 11.sp, color = TextSecondary)
                        Text(
                            "${inspection.qualityScore} / 100",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("LATENCY / MODEL", fontSize = 11.sp, color = TextSecondary)
                        Text(
                            "${inspection.processingTimeMs} ms • ${inspection.modelVersion}",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = CyanPrimary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Detections List
            Text("Detected Defects & Features (${inspection.detections.size})", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Spacer(modifier = Modifier.height(8.dp))

            inspection.detections.forEach { det ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    shape = RoundedCornerShape(8.dp),
                    color = SurfaceDark
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(det.className, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Text(if (det.isDefect) "Defect Category" else "Acceptable Feature", fontSize = 11.sp, color = if (det.isDefect) BadRed else GoodGreen)
                        }
                        Text(
                            "${(det.confidence * 100).toInt()}%",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (det.isDefect) BadRed else GoodGreen
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = onNavigateBack,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("Back to Home", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        }
    }
}
