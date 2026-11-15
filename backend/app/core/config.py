import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator, ConfigDict, Field
from pydantic_settings import BaseSettings

# Project Root Directory
_BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore", arbitrary_types_allowed=True)

    BASE_DIR: Path = _BASE_DIR
    APP_NAME: str = "Welding Quality Detection API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except Exception:
                return ["*"]
        return v or ["*"]

    # YOLO Model Settings
    MODEL_PATH: str = "runs/detect/YOLO Weld Detection project/weld_yolo_training/weights/best.pt"
    MODEL_VERSION: str = "weld-yolo-v1"
    
    # Confidence & Decision Thresholds
    CONFIDENCE_THRESHOLD: float = 0.25      # Detection threshold for YOLO inference
    DEFECT_CONFIDENCE_THRESHOLD: float = 0.50  # Defect threshold to trigger BAD status
    UNCERTAINTY_THRESHOLD: float = 0.35     # Below this, marked UNCERTAIN / MANUAL INSPECTION
    IOU_THRESHOLD: float = 0.45
    DEVICE: str = "auto"                    # "auto", "cpu", "cuda", "0"

    # Defect Class Mapping
    GOOD_CLASS_IDS: List[int] = [1]         # 1: Good Weld
    DEFECT_CLASS_IDS: List[int] = [0, 2]    # 0: Bad Weld, 2: Defect

    # Storage Paths
    UPLOAD_DIR: str = str(_BASE_DIR / "backend" / "uploads")
    ORIGINAL_DIR: str = str(_BASE_DIR / "backend" / "uploads" / "original")
    ANNOTATED_DIR: str = str(_BASE_DIR / "backend" / "uploads" / "annotated")
    MAX_FILE_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]
    ALLOWED_MIME_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{_BASE_DIR}/backend/weld_inspections.db"

settings = Settings()

# Ensure required directories exist
os.makedirs(settings.ORIGINAL_DIR, exist_ok=True)
os.makedirs(settings.ANNOTATED_DIR, exist_ok=True)
