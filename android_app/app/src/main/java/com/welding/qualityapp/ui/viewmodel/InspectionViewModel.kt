package com.welding.qualityapp.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.welding.qualityapp.data.api.InspectionResponseDto
import com.welding.qualityapp.data.api.RetrofitClient
import com.welding.qualityapp.data.local.CachedInspectionEntity
import com.welding.qualityapp.data.local.InspectionDatabase
import com.welding.qualityapp.data.repository.InspectionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

sealed interface InspectionUiState {
    object Idle : InspectionUiState
    object Loading : InspectionUiState
    data class Success(val inspection: InspectionResponseDto) : InspectionUiState
    data class Error(val message: String) : InspectionUiState
}

class InspectionViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: InspectionRepository

    private val _uiState = MutableStateFlow<InspectionUiState>(InspectionUiState.Idle)
    val uiState: StateFlow<InspectionUiState> = _uiState.asStateFlow()

    private val _history = MutableStateFlow<List<CachedInspectionEntity>>(emptyList())
    val history: StateFlow<List<CachedInspectionEntity>> = _history.asStateFlow()

    init {
        val db = InspectionDatabase.getDatabase(application)
        repository = InspectionRepository(RetrofitClient.getService(), db.inspectionDao())

        viewModelScope.launch {
            repository.cachedInspections.collect { list ->
                _history.value = list
            }
        }
    }

    fun inspectImage(imageFile: File, deviceId: String? = "ANDROID-DEVICE", notes: String? = null) {
        _uiState.value = InspectionUiState.Loading
        viewModelScope.launch {
            val result = repository.inspectImageFile(imageFile, deviceId, notes)
            result.onSuccess { inspection ->
                _uiState.value = InspectionUiState.Success(inspection)
            }.onFailure { error ->
                _uiState.value = InspectionUiState.Error(error.localizedMessage ?: "Inspection failed.")
            }
        }
    }

    fun resetState() {
        _uiState.value = InspectionUiState.Idle
    }

    fun setInspection(inspection: InspectionResponseDto) {
        _uiState.value = InspectionUiState.Success(inspection)
    }
}
