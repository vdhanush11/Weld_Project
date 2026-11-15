import pytest
from backend.app.services.quality_engine import QualityEngine

def test_quality_engine_detects_defect():
    engine = QualityEngine(defect_threshold=0.50, uncertainty_threshold=0.35)
    
    # Raw detections simulating Porosity / Slag defect
    detections = [
        {
            "class_id": 0,  # Bad Weld
            "class_name": "Bad Weld",
            "confidence": 0.92,
            "is_defect": True,
            "bbox": {"x1": 100, "y1": 100, "x2": 200, "y2": 200}
        }
    ]
    
    status, score, reason, conf_cat, defect_count = engine.evaluate_inspection(detections)
    
    assert status == "BAD"
    assert defect_count == 1
    assert conf_cat == "HIGH_CONFIDENCE"
    assert score <= 49.0
    assert "Bad Weld" in reason
    assert "92.0%" in reason

def test_quality_engine_detects_good_weld():
    engine = QualityEngine(defect_threshold=0.50, uncertainty_threshold=0.35)
    
    # Raw detections simulating Good Weld
    detections = [
        {
            "class_id": 1,  # Good Weld
            "class_name": "Good Weld",
            "confidence": 0.88,
            "is_defect": False,
            "bbox": {"x1": 50, "y1": 50, "x2": 400, "y2": 300}
        }
    ]
    
    status, score, reason, conf_cat, defect_count = engine.evaluate_inspection(detections)
    
    assert status == "GOOD"
    assert defect_count == 0
    assert conf_cat == "HIGH_CONFIDENCE"
    assert score >= 75.0
    assert "Acceptable weld" in reason

def test_quality_engine_handles_uncertain_prediction():
    engine = QualityEngine(defect_threshold=0.50, uncertainty_threshold=0.35)
    
    # Very low confidence prediction
    detections = [
        {
            "class_id": 2,  # Defect
            "class_name": "Defect",
            "confidence": 0.28,  # Below uncertainty threshold (0.35)
            "is_defect": True,
            "bbox": {"x1": 10, "y1": 10, "x2": 50, "y2": 50}
        }
    ]
    
    status, score, reason, conf_cat, defect_count = engine.evaluate_inspection(detections)
    
    assert status == "UNCERTAIN"
    assert conf_cat == "UNCERTAIN"
    assert score == 50.0
    assert "Manual inspection required" in reason

def test_quality_engine_handles_empty_detections():
    engine = QualityEngine(defect_threshold=0.50, uncertainty_threshold=0.35)
    
    status, score, reason, conf_cat, defect_count = engine.evaluate_inspection([])
    
    assert status == "UNCERTAIN"
    assert conf_cat == "UNCERTAIN"
    assert defect_count == 0
    assert score == 50.0
