"""
Export YOLO Welding Detection Model to Deployment Formats (ONNX, TFLite, TensorRT, TorchScript).
Usage:
    python scripts/export_model.py --format onnx --imgsz 640
"""
import argparse
from pathlib import Path
from ultralytics import YOLO

def parse_args():
    parser = argparse.ArgumentParser(description="Export YOLO Model to edge and server deployment formats")
    parser.add_argument(
        "--weights",
        type=str,
        default="runs/detect/YOLO Weld Detection project/weld_yolo_training/weights/best.pt",
        help="Path to trained weights"
    )
    parser.add_argument(
        "--format",
        type=str,
        default="onnx",
        choices=["onnx", "torchscript", "tflite", "engine", "saved_model", "coreml"],
        help="Target export format"
    )
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--half", action="store_true", help="FP16 quantization")
    parser.add_argument("--dynamic", action="store_true", help="Dynamic input shape for ONNX")
    return parser.parse_args()

def main():
    args = parse_args()
    print("=" * 60)
    print("Exporting YOLO Welding Model")
    print(f"Source Weights: {args.weights}")
    print(f"Target Format:  {args.format}")
    print(f"Image Size:     {args.imgsz}")
    print(f"FP16 Half:      {args.half}")
    print("=" * 60)

    model = YOLO(args.weights)
    exported_path = model.export(
        format=args.format,
        imgsz=args.imgsz,
        half=args.half,
        dynamic=args.dynamic
    )

    print(f"\nModel exported successfully to: {exported_path}")

if __name__ == "__main__":
    main()
