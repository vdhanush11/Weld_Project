import time
from datetime import datetime, timezone
import torch
from fastapi import APIRouter, HTTPException, status
from backend.app.core.config import settings
from backend.app.schemas.inspection import (
    ModelInfoResponse,
    ThresholdConfigResponse,
    ThresholdConfigUpdate
)
from backend.app.services.yolo_service import yolo_service
from backend.app.services.inspection_service import inspection_service

router = APIRouter()
START_TIME = time.time()

SAFETY_DISCLAIMER = (
    "AI Welding Inspection System is designed for quality assistance and anomaly triaging. "
    "Predictions marked 'UNCERTAIN' or 'BAD' in critical structural applications must be "
    "verified by a certified welding inspector (CWI) in accordance with AWS/ISO standards."
)

@router.get(
    "/health",
    summary="System health status",
    description="Check backend server, database connectivity, model load status, and GPU availability."
)
async def health_check():
    uptime_seconds = round(time.time() - START_TIME, 1)
    cuda_available = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_available else "CPU"

    return {
        "status": "healthy" if yolo_service.is_loaded else "degraded",
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": uptime_seconds,
        "model_loaded": yolo_service.is_loaded,
        "model_version": settings.MODEL_VERSION,
        "device": yolo_service.device,
        "hardware": device_name,
        "cuda_available": cuda_available
    }

@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    summary="Get active YOLO model metadata",
    description="Returns model version, class names, active confidence thresholds, and ML safety notices."
)
async def get_model_info():
    thresholds = ThresholdConfigResponse(
        defect_confidence_threshold=settings.DEFECT_CONFIDENCE_THRESHOLD,
        uncertainty_threshold=settings.UNCERTAINTY_THRESHOLD,
        confidence_threshold=settings.CONFIDENCE_THRESHOLD,
        iou_threshold=settings.IOU_THRESHOLD
    )

    return ModelInfoResponse(
        model_name="YOLO Welding Quality Detector",
        model_version=settings.MODEL_VERSION,
        model_path=settings.MODEL_PATH,
        device=yolo_service.device,
        loaded=yolo_service.is_loaded,
        classes=yolo_service.classes,
        thresholds=thresholds,
        safety_disclaimer=SAFETY_DISCLAIMER
    )

@router.post(
    "/config/thresholds",
    response_model=ThresholdConfigResponse,
    summary="Dynamically update decision thresholds",
    description="Update defect confidence, uncertainty, or YOLO detection confidence thresholds in runtime."
)
async def update_thresholds(payload: ThresholdConfigUpdate):
    if payload.defect_confidence_threshold is not None:
        settings.DEFECT_CONFIDENCE_THRESHOLD = payload.defect_confidence_threshold
        inspection_service.quality_engine.defect_threshold = payload.defect_confidence_threshold

    if payload.uncertainty_threshold is not None:
        settings.UNCERTAINTY_THRESHOLD = payload.uncertainty_threshold
        inspection_service.quality_engine.uncertainty_threshold = payload.uncertainty_threshold

    if payload.confidence_threshold is not None:
        settings.CONFIDENCE_THRESHOLD = payload.confidence_threshold

    return ThresholdConfigResponse(
        defect_confidence_threshold=settings.DEFECT_CONFIDENCE_THRESHOLD,
        uncertainty_threshold=settings.UNCERTAINTY_THRESHOLD,
        confidence_threshold=settings.CONFIDENCE_THRESHOLD,
        iou_threshold=settings.IOU_THRESHOLD
    )
