from typing import List, Dict, Any, Tuple
from backend.app.core.config import settings

class QualityEngine:
    """
    Deterministic business logic engine for welding inspection.
    Clearly separates raw YOLO detections from domain quality decisions.
    """

    def __init__(
        self,
        defect_threshold: float = settings.DEFECT_CONFIDENCE_THRESHOLD,
        uncertainty_threshold: float = settings.UNCERTAINTY_THRESHOLD,
        good_class_ids: List[int] = settings.GOOD_CLASS_IDS,
        defect_class_ids: List[int] = settings.DEFECT_CLASS_IDS
    ):
        self.defect_threshold = defect_threshold
        self.uncertainty_threshold = uncertainty_threshold
        self.good_class_ids = set(good_class_ids)
        self.defect_class_ids = set(defect_class_ids)

    def evaluate_inspection(
        self,
        raw_detections: List[Dict[str, Any]]
    ) -> Tuple[str, float, str, str, int]:
        """
        Evaluate raw model detections into a business verdict.
        
        Returns:
            Tuple of:
            - overall_status: "GOOD" | "BAD" | "UNCERTAIN"
            - quality_score: float (0.0 to 100.0)
            - decision_reason: str
            - confidence_category: "HIGH_CONFIDENCE" | "MEDIUM_CONFIDENCE" | "LOW_CONFIDENCE" | "UNCERTAIN"
            - defect_count: int
        """
        # Filter detections by category
        defect_detections = [
            d for d in raw_detections 
            if d["class_id"] in self.defect_class_ids
        ]
        good_detections = [
            d for d in raw_detections 
            if d["class_id"] in self.good_class_ids
        ]

        significant_defects = [
            d for d in defect_detections 
            if d["confidence"] >= self.defect_threshold
        ]

        max_overall_conf = max([d["confidence"] for d in raw_detections], default=0.0)
        defect_count = len(significant_defects)

        # 1. Check for Significant Defects -> BAD WELD
        if significant_defects:
            top_defect = max(significant_defects, key=lambda x: x["confidence"])
            overall_status = "BAD"
            top_conf_pct = top_defect["confidence"] * 100
            
            if len(significant_defects) == 1:
                decision_reason = (
                    f"Defect '{top_defect['class_name']}' detected with {top_conf_pct:.1f}% confidence "
                    f"(threshold: {self.defect_threshold*100:.0f}%)."
                )
            else:
                defect_names = ", ".join(sorted({d['class_name'] for d in significant_defects}))
                decision_reason = (
                    f"{len(significant_defects)} defects detected ({defect_names}). "
                    f"Primary defect '{top_defect['class_name']}' at {top_conf_pct:.1f}% confidence."
                )

            # Quality score for BAD welds (0 - 49)
            base_score = (1.0 - top_defect["confidence"]) * 45.0
            penalty = (defect_count - 1) * 5.0
            quality_score = round(max(5.0, min(48.0, base_score - penalty)), 1)
            confidence_category = self._categorize_confidence(top_defect["confidence"])

        # 2. Check for Confirmed Good Weld -> GOOD WELD
        elif good_detections and any(d["confidence"] >= self.defect_threshold for d in good_detections):
            top_good = max(good_detections, key=lambda x: x["confidence"])
            overall_status = "GOOD"
            top_conf_pct = top_good["confidence"] * 100
            decision_reason = (
                f"Acceptable weld detected with {top_conf_pct:.1f}% confidence. "
                "No critical defects detected above threshold."
            )
            # Quality score for GOOD welds (75 - 100)
            quality_score = round(75.0 + (top_good["confidence"] * 25.0), 1)
            quality_score = min(100.0, max(75.0, quality_score))
            confidence_category = self._categorize_confidence(top_good["confidence"])

        # 3. Check for Marginal / Low Confidence -> UNCERTAIN / MANUAL INSPECTION
        elif max_overall_conf < self.uncertainty_threshold or not raw_detections:
            overall_status = "UNCERTAIN"
            if not raw_detections:
                decision_reason = "No weld or defect features detected. Manual inspection required."
                quality_score = 50.0
                confidence_category = "UNCERTAIN"
            else:
                top_det = max(raw_detections, key=lambda x: x["confidence"])
                decision_reason = (
                    f"Low confidence ({top_det['confidence']*100:.1f}% for '{top_det['class_name']}'). "
                    f"Below certainty threshold of {self.uncertainty_threshold*100:.0f}%. Manual inspection required."
                )
                quality_score = 50.0
                confidence_category = "UNCERTAIN"

        # 4. Ambiguous non-conclusive detections
        else:
            top_det = max(raw_detections, key=lambda x: x["confidence"])
            if top_det["class_id"] in self.defect_class_ids:
                overall_status = "BAD"
                decision_reason = f"Potential defect '{top_det['class_name']}' at moderate confidence ({top_det['confidence']*100:.1f}%)."
                quality_score = 45.0
            else:
                overall_status = "GOOD"
                decision_reason = f"Marginal good weld at {top_det['confidence']*100:.1f}% confidence."
                quality_score = 70.0
            confidence_category = self._categorize_confidence(top_det["confidence"])

        return overall_status, quality_score, decision_reason, confidence_category, defect_count

    def _categorize_confidence(self, conf: float) -> str:
        if conf >= 0.80:
            return "HIGH_CONFIDENCE"
        elif conf >= 0.50:
            return "MEDIUM_CONFIDENCE"
        elif conf >= self.uncertainty_threshold:
            return "LOW_CONFIDENCE"
        else:
            return "UNCERTAIN"
