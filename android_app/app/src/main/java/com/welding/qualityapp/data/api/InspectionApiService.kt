package com.welding.qualityapp.data.api

import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.RequestBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

interface InspectionApiService {

    @Multipart
    @POST("api/v1/inspections")
    suspend fun uploadAndInspect(
        @Part file: MultipartBody.Part,
        @Part("device_id") deviceId: RequestBody? = null,
        @Part("notes") notes: RequestBody? = null
    ): Response<InspectionResponseDto>

    @GET("api/v1/inspections")
    suspend fun getHistory(
        @Query("status") status: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("sort") sort: String = "desc"
    ): Response<InspectionHistoryDto>

    @GET("api/v1/inspections/{id}")
    suspend fun getInspectionById(
        @Path("id") id: String
    ): Response<InspectionResponseDto>

    @DELETE("api/v1/inspections/{id}")
    suspend fun deleteInspection(
        @Path("id") id: String
    ): Response<Unit>
}

object RetrofitClient {
    // 10.0.2.2 points to localhost on Android Emulator; adjust for physical device WiFi IP
    var baseUrl: String = "http://10.0.2.2:8000/"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    fun getService(): InspectionApiService {
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(InspectionApiService::class.java)
    }
}
