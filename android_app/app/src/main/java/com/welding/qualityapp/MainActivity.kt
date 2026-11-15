package com.welding.qualityapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.welding.qualityapp.data.api.InspectionResponseDto
import com.welding.qualityapp.ui.screens.*
import com.welding.qualityapp.ui.theme.CyanPrimary
import com.welding.qualityapp.ui.theme.WeldingQualityAppTheme
import com.welding.qualityapp.ui.viewmodel.InspectionUiState
import com.welding.qualityapp.ui.viewmodel.InspectionViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: InspectionViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            WeldingQualityAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    val uiState by viewModel.uiState.collectAsState()
                    val historyList by viewModel.history.collectAsState()

                    // Observe Successful Inspection
                    LaunchedEffect(uiState) {
                        if (uiState is InspectionUiState.Success) {
                            navController.navigate("analysis")
                        }
                    }

                    Box(modifier = Modifier.fillMaxSize()) {
                        NavHost(navController = navController, startDestination = "home") {
                            composable("home") {
                                HomeScreen(
                                    onNavigateToCamera = { navController.navigate("camera") },
                                    onNavigateToUpload = { navController.navigate("upload") },
                                    onNavigateToHistory = { navController.navigate("history") }
                                )
                            }

                            composable("camera") {
                                CameraScreen(
                                    onImageCaptured = { file ->
                                        viewModel.inspectImage(file)
                                    },
                                    onNavigateBack = { navController.popBackStack() }
                                )
                            }

                            composable("upload") {
                                UploadScreen(
                                    onImageSelected = { file ->
                                        viewModel.inspectImage(file)
                                    },
                                    onNavigateBack = { navController.popBackStack() }
                                )
                            }

                            composable("analysis") {
                                val state = uiState
                                if (state is InspectionUiState.Success) {
                                    AnalysisScreen(
                                        inspection = state.inspection,
                                        onNavigateBack = {
                                            viewModel.resetState()
                                            navController.popBackStack("home", inclusive = false)
                                        }
                                    )
                                }
                            }

                            composable("history") {
                                HistoryScreen(
                                    inspections = historyList,
                                    onSelectInspection = { entity ->
                                        // Navigate to full view
                                        val dto = InspectionResponseDto(
                                            inspectionId = entity.id,
                                            timestamp = entity.timestamp,
                                            originalImageUrl = entity.originalImageUrl,
                                            annotatedImageUrl = entity.annotatedImageUrl,
                                            originalFilename = null,
                                            imageWidth = 640,
                                            imageHeight = 640,
                                            overallStatus = entity.overallStatus,
                                            qualityScore = entity.qualityScore,
                                            decisionReason = entity.decisionReason,
                                            confidenceCategory = entity.confidenceCategory,
                                            modelVersion = entity.modelVersion,
                                            defectCount = entity.defectCount,
                                            processingTimeMs = entity.processingTimeMs,
                                            detections = emptyList()
                                        )
                                        viewModel.setInspection(dto)
                                        navController.navigate("analysis")
                                    },
                                    onNavigateBack = { navController.popBackStack() }
                                )
                            }
                        }

                        // Loading Indicator
                        if (uiState is InspectionUiState.Loading) {
                            Surface(
                                modifier = Modifier.fillMaxSize(),
                                color = androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.7f)
                            ) {
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(color = CyanPrimary)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
