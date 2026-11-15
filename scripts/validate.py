"""
Validation & Evaluation Pipeline for YOLO Welding Quality Detection Model.
Computes mAP50, mAP50-95, Precision, Recall, and per-class performance metrics.
Usage:
    python scripts/validate.py --weights "runs/detect/YOLO Weld Detection project/weld_yolo_training/weights/best.pt" --data data.yaml
"""
import argparse
from pathlib import Path
from ultralytics import YOLO

def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate YOLO Welding Model on Validation / Test set")
    parser.add_argument(
        "--weights",
        type=str,
        default="runs/detect/YOLO Weld Detection project/weld_yolo_training/weights/best.pt",
        help="Path to trained model weights"
    )
    parser.add_argument("--data", type=str, default="data.yaml", help="Path to data.yaml dataset config")
    parser.add_argument("--split", type=str, default="val", choices=["val", "test"], help="Dataset split to evaluate")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold")
    parser.add_argument("--iou", type=float, default=0.5, help="NMS IoU threshold")
    return parser.parse_args()

def main():
    args = parse_args()
    print("=" * 60)
    print("Evaluating YOLO Welding Quality Model")
    print(f"Weights: {args.weights}")
    print(f"Data:    {args.data} (Split: {args.split})")
    print("=" * 60)

    model = YOLO(args.weights)
    metrics = model.val(
        data=args.data,
        split=args.split,
        imgsz=args.imgsz,
        batch=args.batch,
        conf=args.conf,
        iou=args.iou,
        plots=True
    )

    print("\n" + "=" * 60)
    print("EVALUATION SUMMARY RESULTS")
    print("=" * 60)
    print(f"Mean Precision (P):       {metrics.box.mp:.4f}")
    print(f"Mean Recall (R):          {metrics.box.mr:.4f}")
    print(f"Mean AP @ 50 (mAP50):     {metrics.box.map50:.4f}")
    print(f"Mean AP @ 50-95 (mAP):    {metrics.box.map:.4f}")
    print("=" * 60)

    # Per-Class Metrics
    if hasattr(metrics.box, "ap50") and metrics.box.ap50 is not None:
        print("\nPer-Class Performance (AP50):")
        for i, class_name in enumerate(model.names.values()):
            if i < len(metrics.box.ap50):
                print(f"  - {class_name:<20}: AP50 = {metrics.box.ap50[i]:.4f}")

if __name__ == "__main__":
    main()
