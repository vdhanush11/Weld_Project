package com.welding.qualityapp.data.api

import com.google.gson.annotations.SerializedName

data class BoundingBoxDto(
    @SerializedName("x1") val x1: Float,
    @SerializedName("y1") val y1: Float,
    @SerializedName("x2") val x2: Float,
    @SerializedName("y2") val y2: Float,
    @SerializedName("norm_x1") val normX1: Float? = 0f,
    @SerializedName("norm_y1") val normY1: Float? = 0f,
    @SerializedName("norm_x2") val normX2: Float? = 0f,
    @SerializedName("norm_y2") val normY2: Float? = 0f
)

data class DetectionDto(
    @SerializedName("class_name") val className: String,
    @SerializedName("class_id") val classId: Int,
    @SerializedName("confidence") val confidence: Float,
    @SerializedName("is_defect") val isDefect: Boolean,
    @SerializedName("bbox") val bbox: BoundingBoxDto
)

data class InspectionResponseDto(
    @SerializedName("inspection_id") val inspectionId: String,
    @SerializedName("timestamp") val timestamp: String,
    @SerializedName("original_image_url") val originalImageUrl: String,
    @SerializedName("annotated_image_url") val annotatedImageUrl: String,
    @SerializedName("original_filename") val originalFilename: String?,
    @SerializedName("image_width") val imageWidth: Int,
    @SerializedName("image_height") val imageHeight: Int,
    @SerializedName("overall_status") val overallStatus: String, // GOOD, BAD, UNCERTAIN
    @SerializedName("quality_score") val qualityScore: Float,
    @SerializedName("decision_reason") val decisionReason: String,
    @SerializedName("confidence_category") val confidenceCategory: String,
    @SerializedName("model_version") val modelVersion: String,
    @SerializedName("defect_count") val defectCount: Int,
    @SerializedName("processing_time_ms") val processingTimeMs: Float,
    @SerializedName("detections") val detections: List<DetectionDto> = emptyList()
)

data class InspectionHistoryDto(
    @SerializedName("total") val total: Int,
    @SerializedName("page") val page: Int,
    @SerializedName("limit") val limit: Int,
    @SerializedName("total_pages") val totalPages: Int,
    @SerializedName("items") val items: List<InspectionResponseDto> = emptyList()
)
