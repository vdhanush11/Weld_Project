"""
Training Pipeline for YOLO Welding Quality Detection Model.
Usage:
    python scripts/train.py --data data.yaml --epochs 100 --batch 16 --imgsz 640
"""
import argparse
from pathlib import Path
from ultralytics import YOLO
import torch

def parse_args():
    parser = argparse.ArgumentParser(description="Train YOLO Welding Defect Detection Model")
    parser.add_argument("--data", type=str, default="data.yaml", help="Path to data.yaml dataset config")
    parser.add_argument("--model", type=str, default="yolov8n.pt", help="Pretrained base model (yolov8n.pt, yolov8s.pt, etc.)")
    parser.add_argument("--epochs", type=int, default=100, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Image resolution")
    parser.add_argument("--device", type=str, default="0" if torch.cuda.is_available() else "cpu", help="CUDA device or cpu")
    parser.add_argument("--project", type=str, default="runs/detect/YOLO Weld Detection project", help="Project output folder")
    parser.add_argument("--name", type=str, default="weld_yolo_training", help="Experiment name")
    parser.add_argument("--patience", type=int, default=30, help="Early stopping patience")
    parser.add_argument("--lr0", type=float, default=0.01, help="Initial learning rate")
    return parser.parse_args()

def main():
    args = parse_args()
    print("=" * 60)
    print("Starting YOLO Welding Model Training Pipeline")
    print(f"Dataset config: {args.data}")
    print(f"Base model:     {args.model}")
    print(f"Target Device:  {args.device}")
    print(f"Epochs:         {args.epochs} | Batch size: {args.batch} | Image Size: {args.imgsz}")
    print("=" * 60)

    model = YOLO(args.model)

    # Train the model with domain-specific augmentations
    results = model.train(
        data=args.data,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        project=args.project,
        name=args.name,
        patience=args.patience,
        lr0=args.lr0,
        # Augmentations suitable for welding joints without unrealistic distortions
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=10.0,
        translate=0.1,
        scale=0.2,
        shear=2.0,
        perspective=0.0005,
        flipud=0.2,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.1,
        save=True,
        save_period=10,
        plots=True,
        verbose=True
    )

    print("\nTraining completed successfully!")
    print(f"Best model weights saved at: {args.project}/{args.name}/weights/best.pt")

if __name__ == "__main__":
    main()
