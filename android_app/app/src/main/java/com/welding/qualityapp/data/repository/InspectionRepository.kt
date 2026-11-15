package com.welding.qualityapp.data.repository

import com.welding.qualityapp.data.api.InspectionApiService
import com.welding.qualityapp.data.api.InspectionResponseDto
import com.welding.qualityapp.data.local.CachedInspectionEntity
import com.welding.qualityapp.data.local.InspectionDao
import kotlinx.coroutines.flow.Flow
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class InspectionRepository(
    private val apiService: InspectionApiService,
    private val dao: InspectionDao
) {
    val cachedInspections: Flow<List<CachedInspectionEntity>> = dao.getAllInspections()

    suspend fun inspectImageFile(
        file: File,
        deviceId: String? = null,
        notes: String? = null
    ): Result<InspectionResponseDto> {
        return try {
            val reqFile = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("file", file.name, reqFile)
            val devIdBody = deviceId?.toRequestBody("text/plain".toMediaTypeOrNull())
            val notesBody = notes?.toRequestBody("text/plain".toMediaTypeOrNull())

            val response = apiService.uploadAndInspect(body, devIdBody, notesBody)
            if (response.isSuccessful && response.body() != null) {
                val result = response.body()!!
                // Cache to Room
                dao.insertInspection(
                    CachedInspectionEntity(
                        id = result.inspectionId,
                        timestamp = result.timestamp,
                        originalImageUrl = result.originalImageUrl,
                        annotatedImageUrl = result.annotatedImageUrl,
                        overallStatus = result.overallStatus,
                        qualityScore = result.qualityScore,
                        decisionReason = result.decisionReason,
                        confidenceCategory = result.confidenceCategory,
                        defectCount = result.defectCount,
                        modelVersion = result.modelVersion,
                        processingTimeMs = result.processingTimeMs
                    )
                )
                Result.success(result)
            } else {
                Result.failure(Exception("Server returned error: ${response.code()} ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getRemoteHistory(status: String? = null): Result<List<InspectionResponseDto>> {
        return try {
            val response = apiService.getHistory(status = status)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.items)
            } else {
                Result.failure(Exception("Failed to fetch remote history."))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
