from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, ConfigDict

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    norm_x1: Optional[float] = 0.0
    norm_y1: Optional[float] = 0.0
    norm_x2: Optional[float] = 0.0
    norm_y2: Optional[float] = 0.0

class DetectionOut(BaseModel):
    class_name: str
    class_id: int
    confidence: float
    is_defect: bool
    bbox: BoundingBox

class InspectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    inspection_id: str
    timestamp: datetime
    original_image_url: str
    annotated_image_url: str
    original_filename: Optional[str] = None
    image_width: int
    image_height: int
    overall_status: str  # "GOOD", "BAD", "UNCERTAIN"
    quality_score: float  # 0 - 100
    decision_reason: str
    confidence_category: str  # "HIGH_CONFIDENCE", "MEDIUM_CONFIDENCE", "LOW_CONFIDENCE", "UNCERTAIN"
    model_version: str
    defect_count: int
    processing_time_ms: float
    detections: List[DetectionOut] = []

class InspectionListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    inspection_id: str
    timestamp: datetime
    original_image_url: str
    annotated_image_url: str
    overall_status: str
    quality_score: float
    defect_count: int
    confidence_category: str
    model_version: str
    processing_time_ms: float

class InspectionHistoryResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    items: List[InspectionListItem]

class DefectClassCount(BaseModel):
    class_name: str
    count: int
    percentage: float

class InspectionStatsResponse(BaseModel):
    total_inspections: int
    good_count: int
    bad_count: int
    uncertain_count: int
    defect_rate_percent: float
    avg_quality_score: float
    avg_processing_time_ms: float
    defect_distribution: List[DefectClassCount]

class ThresholdConfigUpdate(BaseModel):
    defect_confidence_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    uncertainty_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    confidence_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)

class ThresholdConfigResponse(BaseModel):
    defect_confidence_threshold: float
    uncertainty_threshold: float
    confidence_threshold: float
    iou_threshold: float

class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    model_path: str
    device: str
    loaded: bool
    classes: Dict[int, str]
    thresholds: ThresholdConfigResponse
    safety_disclaimer: str
