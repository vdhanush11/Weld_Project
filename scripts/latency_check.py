"""
Latency & Throughput Benchmark Script for Welding YOLO Model.
Usage:
    python scripts/latency_check.py --iterations 100
"""
import time
import argparse
from pathlib import Path
import numpy as np
import cv2
import torch
from ultralytics import YOLO

def parse_args():
    parser = argparse.ArgumentParser(description="Benchmark YOLO inference latency and FPS")
    parser.add_argument(
        "--weights",
        type=str,
        default="runs/detect/YOLO Weld Detection project/weld_yolo_training/weights/best.pt",
        help="Model weights path"
    )
    parser.add_argument("--iterations", type=int, default=50, help="Number of benchmark iterations")
    parser.add_argument("--warmup", type=int, default=10, help="Warmup iterations")
    parser.add_argument("--imgsz", type=int, default=640, help="Image resolution")
    return parser.parse_args()

def main():
    args = parse_args()
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    print("=" * 60)
    print("YOLO Inference Latency Benchmark")
    print(f"Device:     {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")
    print(f"Weights:    {args.weights}")
    print(f"Image Size: {args.imgsz}x{args.imgsz}")
    print("=" * 60)

    model = YOLO(args.weights)
    dummy_frame = np.random.randint(0, 255, (args.imgsz, args.imgsz, 3), dtype=np.uint8)

    # Warmup
    print(f"Warming up for {args.warmup} iterations...")
    for _ in range(args.warmup):
        _ = model(dummy_frame, device=device, verbose=False)

    # Benchmark runs
    latencies = []
    print(f"Running benchmark across {args.iterations} iterations...")
    for _ in range(args.iterations):
        if torch.cuda.is_available():
            torch.cuda.synchronize()
        t0 = time.perf_counter()
        _ = model(dummy_frame, device=device, verbose=False)
        if torch.cuda.is_available():
            torch.cuda.synchronize()
        t1 = time.perf_counter()
        latencies.append((t1 - t0) * 1000.0)  # ms

    latencies = np.array(latencies)
    avg_lat = np.mean(latencies)
    p50 = np.percentile(latencies, 50)
    p95 = np.percentile(latencies, 95)
    p99 = np.percentile(latencies, 99)
    fps = 1000.0 / avg_lat

    print("\n" + "=" * 60)
    print("BENCHMARK RESULTS")
    print("=" * 60)
    print(f"Average Latency:  {avg_lat:.2f} ms")
    print(f"Median (p50):     {p50:.2f} ms")
    print(f"95th Percentile:  {p95:.2f} ms")
    print(f"99th Percentile:  {p99:.2f} ms")
    print(f"Throughput (FPS): {fps:.2f} FPS")
    print("=" * 60)

if __name__ == "__main__":
    main()
