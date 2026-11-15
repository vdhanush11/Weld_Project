import os
import time
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional, Union
import cv2
import numpy as np
import torch
from ultralytics import YOLO
from backend.app.core.config import settings

logger = logging.getLogger("weld_app.yolo")

class YOLOService:
    _instance: Optional["YOLOService"] = None
    _model: Optional[YOLO] = None
    _device: str = "cpu"
    _classes: Dict[int, str] = {}
    _loaded: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(YOLOService, cls).__new__(cls)
        return cls._instance

    def initialize(self, model_path: Optional[str] = None):
        """Load YOLO model weights, detect hardware, and execute warmup."""
        path = model_path or settings.MODEL_PATH
        
        # Resolve path relative to project root if needed
        model_file = Path(path)
        if not model_file.is_absolute():
            model_file = settings.BASE_DIR / path

        if not model_file.exists():
            logger.error("YOLO Model weights file not found at: %s", model_file)
            # Try searching in runs/detect
            fallback_pattern = list(settings.BASE_DIR.glob("**/best.pt"))
            if fallback_pattern:
                model_file = fallback_pattern[0]
                logger.info("Found fallback model weights at: %s", model_file)
            else:
                logger.warning("No best.pt weights found. Creating placeholder model wrapper.")

        # Determine target device
        if settings.DEVICE.lower() == "auto":
            self._device = "cuda:0" if torch.cuda.is_available() else "cpu"
        else:
            self._device = settings.DEVICE

        logger.info("Loading YOLO model from %s on device [%s]", model_file, self._device)
        try:
            self._model = YOLO(str(model_file))
            if hasattr(self._model, "names") and self._model.names:
                self._classes = {int(k): str(v) for k, v in self._model.names.items()}
            else:
                # Default classes from data.yaml
                self._classes = {0: "Bad Weld", 1: "Good Weld", 2: "Defect"}

            # Warmup inference
            dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)
            _ = self._model(dummy_img, device=self._device, verbose=False)
            self._loaded = True
            logger.info("YOLO Model successfully loaded and warmed up with classes: %s", self._classes)
        except Exception as e:
            logger.error("Failed to load YOLO model: %s", str(e), exc_info=True)
            self._loaded = False
            self._classes = {0: "Bad Weld", 1: "Good Weld", 2: "Defect"}

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def classes(self) -> Dict[int, str]:
        return self._classes

    @property
    def device(self) -> str:
        return self._device

    def predict(
        self,
        image_input: Union[str, np.ndarray, bytes],
        conf_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None
    ) -> Tuple[List[Dict[str, Any]], np.ndarray, float, int, int]:
        """
        Run inference on image.
        
        Returns:
            Tuple of:
            - detections: List of detection dicts with pixel & normalized coordinates
            - annotated_image: np.ndarray BGR image with drawn bounding boxes & badges
            - processing_time_ms: float latency in milliseconds
            - width: int image width
            - height: int image height
        """
        if not self._loaded or self._model is None:
            raise RuntimeError("YOLO Model is not loaded. Call initialize() first.")

        # Decode image if bytes
        if isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif isinstance(image_input, str):
            image = cv2.imread(image_input)
        else:
            image = image_input.copy()

        if image is None:
            raise ValueError("Unable to decode input image.")

        orig_h, orig_w = image.shape[:2]
        conf = conf_threshold if conf_threshold is not None else settings.CONFIDENCE_THRESHOLD
        iou = iou_threshold if iou_threshold is not None else settings.IOU_THRESHOLD

        # Run inference and measure latency
        start_time = time.perf_counter()
        results = self._model(
            image,
            conf=conf,
            iou=iou,
            device=self._device,
            verbose=False
        )
        end_time = time.perf_counter()
        processing_time_ms = round((end_time - start_time) * 1000.0, 2)

        detections: List[Dict[str, Any]] = []
        annotated_image = image.copy()

        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for box in boxes:
                x1, y1, x2, y2 = map(float, box.xyxy[0].cpu().numpy())
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())
                class_name = self._classes.get(class_id, f"Class {class_id}")
                is_defect = class_id in settings.DEFECT_CLASS_IDS

                # Pixel bounding box
                px1, py1, px2, py2 = max(0, int(x1)), max(0, int(y1)), min(orig_w, int(x2)), min(orig_h, int(y2))
                
                # Normalized bounding box
                norm_x1 = round(px1 / orig_w, 4)
                norm_y1 = round(py1 / orig_h, 4)
                norm_x2 = round(px2 / orig_w, 4)
                norm_y2 = round(py2 / orig_h, 4)

                detections.append({
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": round(confidence, 4),
                    "is_defect": is_defect,
                    "bbox": {
                        "x1": px1,
                        "y1": py1,
                        "x2": px2,
                        "y2": py2,
                        "norm_x1": norm_x1,
                        "norm_y1": norm_y1,
                        "norm_x2": norm_x2,
                        "norm_y2": norm_y2
                    }
                })

                # Visual annotation on annotated_image
                if is_defect:
                    color = (0, 0, 230)      # Bright Red for defects (BGR)
                    badge_color = (0, 0, 180)
                else:
                    color = (0, 200, 0)      # Emerald Green for good welds (BGR)
                    badge_color = (0, 160, 0)

                # Draw bounding box
                cv2.rectangle(annotated_image, (px1, py1), (px2, py2), color, 3)

                # Draw semi-transparent header badge for label
                label_text = f"{class_name} {confidence*100:.1f}%"
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.6
                thickness = 2
                (text_w, text_h), baseline = cv2.getTextSize(label_text, font, font_scale, thickness)

                badge_y1 = max(0, py1 - text_h - 10)
                badge_y2 = py1
                badge_x1 = px1
                badge_x2 = min(orig_w, px1 + text_w + 12)

                # Draw badge background
                cv2.rectangle(annotated_image, (badge_x1, badge_y1), (badge_x2, badge_y2), badge_color, -1)
                cv2.putText(
                    annotated_image,
                    label_text,
                    (badge_x1 + 6, badge_y2 - 6),
                    font,
                    font_scale,
                    (255, 255, 255),
                    thickness,
                    cv2.LINE_AA
                )

        return detections, annotated_image, processing_time_ms, orig_w, orig_h

# Global singleton instance
yolo_service = YOLOService()
