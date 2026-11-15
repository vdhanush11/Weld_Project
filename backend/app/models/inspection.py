from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Image Paths & Meta
    original_image_path = Column(String(255), nullable=False)
    annotated_image_path = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=True)
    image_width = Column(Integer, nullable=False, default=0)
    image_height = Column(Integer, nullable=False, default=0)
    
    # Inspection Verdicts
    overall_status = Column(String(20), nullable=False, index=True)  # "GOOD", "BAD", "UNCERTAIN"
    quality_score = Column(Float, nullable=False, default=0.0)       # 0.0 - 100.0
    decision_reason = Column(String(500), nullable=False)
    confidence_category = Column(String(30), nullable=False)        # "HIGH_CONFIDENCE", "MEDIUM_CONFIDENCE", "LOW_CONFIDENCE", "UNCERTAIN"
    
    # Model & Performance
    model_version = Column(String(50), nullable=False, default="weld-yolo-v1")
    defect_count = Column(Integer, nullable=False, default=0)
    processing_time_ms = Column(Float, nullable=False, default=0.0)
    
    # Device / User info
    device_id = Column(String(100), nullable=True)
    notes = Column(String(500), nullable=True)

    # Detections relationship
    detections = relationship("Detection", back_populates="inspection", cascade="all, delete-orphan", lazy="selectin")

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    
    class_id = Column(Integer, nullable=False)
    class_name = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    is_defect = Column(Integer, nullable=False, default=0)  # 1 for defect, 0 for good
    
    # Bounding Box Coordinates (pixels)
    x1 = Column(Float, nullable=False)
    y1 = Column(Float, nullable=False)
    x2 = Column(Float, nullable=False)
    y2 = Column(Float, nullable=False)
    
    # Normalized Bounding Box Coordinates (0.0 to 1.0)
    norm_x1 = Column(Float, nullable=False, default=0.0)
    norm_y1 = Column(Float, nullable=False, default=0.0)
    norm_x2 = Column(Float, nullable=False, default=0.0)
    norm_y2 = Column(Float, nullable=False, default=0.0)

    inspection = relationship("Inspection", back_populates="detections")
