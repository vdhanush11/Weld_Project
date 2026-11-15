"""
Standalone CLI Prediction Script for Welding Quality Inspection.
Usage:
    python scripts/predict.py --source "datasets/The Welding Defect Dataset/train/images/Slag-inclusion-welding-images_10_jpeg_jpg.rf.fabe6926703c8e26c2bd865286c3beb3.jpg"
"""
import os
import sys
import json
import time
import argparse
from pathlib import Path
import cv2
import numpy as np
from ultralytics import YOLO

# Add root directory to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.services.quality_engine import QualityEngine

def parse_args():
    parser = argparse.ArgumentParser(description="Run YOLO Welding Quality Prediction")
    parser.add_argument("--source", type=str, required=True, help="Path to input welding image")
    parser.add_argument(
        "--weights",
        type=str,
        default="runs/detect/YOLO Weld Detection project/weld_yolo_training/weights/best.pt",
        help="Path to YOLO weights"
    )
    parser.add_argument("--conf", type=float, default=0.25, help="Detection confidence threshold")
    parser.add_argument("--defect-thresh", type=float, default=0.50, help="Defect decision threshold")
    parser.add_argument("--uncertainty-thresh", type=float, default=0.35, help="Uncertainty threshold")
    parser.add_argument("--output-dir", type=str, default="runs/predictions", help="Directory to save output")
    parser.add_argument("--save-json", action="store_true", default=True, help="Save structured prediction JSON")
    parser.add_argument("--view", action="store_true", help="Display annotated image in OpenCV window")
    return parser.parse_args()

def main():
    args = parse_args()
    input_path = Path(args.source)
    if not input_path.exists():
        print(f"Error: Input file not found at '{args.source}'")
        sys.exit(1)

    weights_path = Path(args.weights)
    if not weights_path.is_absolute():
        weights_path = ROOT_DIR / weights_path

    if not weights_path.exists():
        print(f"Error: Weights not found at '{weights_path}'")
        sys.exit(1)

    print(f"Loading model from: {weights_path}")
    model = YOLO(str(weights_path))
    class_names = {int(k): str(v) for k, v in model.names.items()} if hasattr(model, "names") else {0: "Bad Weld", 1: "Good Weld", 2: "Defect"}

    image = cv2.imread(str(input_path))
    if image is None:
        print(f"Error: Could not decode image at '{input_path}'")
        sys.exit(1)

    orig_h, orig_w = image.shape[:2]

    # Run inference & measure latency
    start = time.perf_counter()
    results = model(image, conf=args.conf, verbose=False)
    elapsed_ms = round((time.perf_counter() - start) * 1000.0, 2)

    # Process detections
    raw_detections = []
    annotated_img = image.copy()
    defect_ids = {0, 2}  # 0: Bad Weld, 2: Defect

    for r in results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
            confidence = float(box.conf[0].cpu().numpy())
            class_id = int(box.cls[0].cpu().numpy())
            class_name = class_names.get(class_id, f"Class {class_id}")
            is_defect = class_id in defect_ids

            raw_detections.append({
                "class_id": class_id,
                "class_name": class_name,
                "confidence": round(confidence, 4),
                "is_defect": is_defect,
                "bbox": {
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "norm_x1": round(x1 / orig_w, 4), "norm_y1": round(y1 / orig_h, 4),
                    "norm_x2": round(x2 / orig_w, 4), "norm_y2": round(y2 / orig_h, 4)
                }
            })

            color = (0, 0, 230) if is_defect else (0, 200, 0)
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 3)
            label = f"{class_name} {confidence*100:.1f}%"
            cv2.putText(annotated_img, label, (x1, max(20, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    # Business Quality Decision
    engine = QualityEngine(
        defect_threshold=args.defect_thresh,
        uncertainty_threshold=args.uncertainty_thresh,
        good_class_ids=[1],
        defect_class_ids=[0, 2]
    )
    overall_status, quality_score, reason, conf_category, defect_count = engine.evaluate_inspection(raw_detections)

    # Save outputs
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_img_path = out_dir / f"{input_path.stem}_annotated.jpg"
    out_json_path = out_dir / f"{input_path.stem}_prediction.json"

    cv2.imwrite(str(out_img_path), annotated_img)

    prediction_result = {
        "image": str(input_path.name),
        "overall_status": overall_status,
        "quality_score": quality_score,
        "decision_reason": reason,
        "confidence_category": conf_category,
        "defect_count": defect_count,
        "processing_time_ms": elapsed_ms,
        "model_version": "weld-yolo-v1",
        "image_width": orig_w,
        "image_height": orig_h,
        "detections": raw_detections
    }

    if args.save_json:
        with open(out_json_path, "w") as f:
            json.dump(prediction_result, f, indent=2)

    # Print Clean CLI Output
    print("\n" + "=" * 55)
    print("           WELDING INSPECTION REPORT")
    print("=" * 55)
    print(f"Source Image:       {input_path.name} ({orig_w}x{orig_h})")
    print(f"Overall Result:     [{overall_status}]")
    print(f"Quality Score:      {quality_score} / 100")
    print(f"Confidence Level:   {conf_category}")
    print(f"Decision Reason:    {reason}")
    print(f"Defects Detected:   {defect_count}")
    print(f"Processing Time:    {elapsed_ms} ms")
    print(f"Annotated Image:    {out_img_path}")
    if args.save_json:
        print(f"JSON Output:        {out_json_path}")
    print("-" * 55)
    if raw_detections:
        print("Detections Breakdown:")
        for idx, d in enumerate(raw_detections, 1):
            tag = "DEFECT" if d["is_defect"] else "OK"
            print(f"  [{idx}] {d['class_name']:<15} | Conf: {d['confidence']*100:.1f}% | Type: {tag} | Box: {d['bbox']['x1']},{d['bbox']['y1']} -> {d['bbox']['x2']},{d['bbox']['y2']}")
    else:
        print("No bounding boxes detected above threshold.")
    print("=" * 55 + "\n")

    if args.view:
        cv2.imshow("Welding Inspection Result", annotated_img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
