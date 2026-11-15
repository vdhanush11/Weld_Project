package com.welding.qualityapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.welding.qualityapp.data.local.CachedInspectionEntity
import com.welding.qualityapp.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    inspections: List<CachedInspectionEntity>,
    onSelectInspection: (CachedInspectionEntity) -> Unit,
    onNavigateBack: () -> Unit
) {
    var selectedFilter by remember { mutableStateOf("ALL") }

    val filteredList = inspections.filter {
        when (selectedFilter) {
            "GOOD" -> it.overallStatus == "GOOD"
            "BAD" -> it.overallStatus == "BAD"
            "UNCERTAIN" -> it.overallStatus == "UNCERTAIN"
            else -> true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Inspection Records", color = TextPrimary) },
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
                .padding(16.dp)
        ) {
            // Filter Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("ALL", "GOOD", "BAD", "UNCERTAIN").forEach { filter ->
                    FilterChip(
                        selected = selectedFilter == filter,
                        onClick = { selectedFilter = filter },
                        label = { Text(filter) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = CyanPrimary.copy(alpha = 0.2f),
                            selectedLabelColor = CyanPrimary
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (filteredList.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No inspection records found", color = TextSecondary)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredList) { item ->
                        HistoryCard(item = item, onClick = { onSelectInspection(item) })
                    }
                }
            }
        }
    }
}

@Composable
fun HistoryCard(
    item: CachedInspectionEntity,
    onClick: () -> Unit
) {
    val isGood = item.overallStatus == "GOOD"
    val isBad = item.overallStatus == "BAD"
    val statusColor = when {
        isGood -> GoodGreen
        isBad -> BadRed
        else -> CautionAmber
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        color = SurfaceDark
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = item.annotatedImageUrl,
                contentDescription = null,
                modifier = Modifier
                    .size(60.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color.Black),
                contentScale = ContentScale.Crop
            )

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.overallStatus,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = statusColor
                )
                Text(
                    text = "${item.defectCount} defect(s) • ${item.qualityScore}/100",
                    fontSize = 12.sp,
                    color = TextSecondary
                )
                Text(
                    text = item.timestamp.take(19).replace("T", " "),
                    fontSize = 11.sp,
                    color = TextSecondary.copy(alpha = 0.7f)
                )
            }

            Text(
                text = "${item.processingTimeMs.toInt()} ms",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = CyanPrimary
            )
        }
    }
}
