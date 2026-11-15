# Production-Grade YOLO Welding Quality Detection System

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![Ultralytics YOLO](https://img.shields.io/badge/YOLO-v8%2Fv11-FF6F00.svg)](https://docs.ultralytics.com)
[![React + Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg)](https://vitejs.dev)
[![Android](https://img.shields.io/badge/Android-Kotlin%20%2B%20Jetpack%20Compose-3DDC84.svg)](https://developer.android.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A complete, production-grade **Welding Quality Inspection & Anomaly Triaging Ecosystem**. Built with Ultralytics YOLO, FastAPI, async SQLite/PostgreSQL persistence, a cyberpunk/aerospace-themed React web application, and a native Kotlin/Jetpack Compose Android client.

---

## 1. System Architecture

```
                                  +---------------------------------------+
                                  |     Industrial Welding Image Input    |
                                  | (Live Camera HUD / Gallery / Webcam)  |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                     +--------------------------------+--------------------------------+
                     |                                                                 |
                     v                                                                 v
+--------------------+---------------------+                 +-------------------------+--------------------+
|       Modern Web App (React + Vite)      |                 |    Native Android App (Kotlin + Compose)    |
|  - Drag & Drop Upload + Sample Selector  |                 |  - CameraX Live Viewfinder & Snapshot        |
|  - Interactive Bounding Box Canvas       |                 |  - Jetpack Compose Canvas Bounding Boxes     |
|  - Side-by-Side Raw vs AI Comparison     |                 |  - Room Database Offline Cache               |
|  - Live Analytics & CSV/JSON Export      |                 |  - Retrofit HTTP Client                      |
+--------------------+---------------------+                 +-------------------------+--------------------+
                     |                                                                 |
                     +--------------------------------+--------------------------------+
                                                      |  POST /api/v1/inspections (Multipart/Form-Data)
                                                      v
+-----------------------------------------------------+-----------------------------------------------------+
|                              FastAPI High-Performance Backend Service                             |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | Request Validation Middleware (MIME, Magic Bytes, File Size < 25MB, Min Resolution Check)  |  |
|  +----------------------------------------------+----------------------------------------------+  |
|                                                 |                                                 |
|                                                 v                                                 |
|  +---------------------------------------------------------------------------------------------+  |
|  | Singleton YOLO Inference Service (Warmup, CUDA GPU Auto-Detection, Box Annotation Engine)  |  |
|  +----------------------------------------------+----------------------------------------------+  |
|                                                 |                                                 |
|                                                 v                                                 |
|  +---------------------------------------------------------------------------------------------+  |
|  | Deterministic Quality Business Engine (GOOD / BAD / UNCERTAIN decision + 0-100 Quality Score)|  |
|  +----------------------------------------------+----------------------------------------------+  |
|                                                 |                                                 |
|                                                 v                                                 |
|  +---------------------------------------------------------------------------------------------+  |
|  | Database Layer (SQLAlchemy Async ORM -> SQLite / PostgreSQL) & Static Image Artifact Store |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Key Features

- **Decoupled Business Logic**: Clear distinction between raw YOLO computer vision predictions and industrial quality decisions (`GOOD`, `BAD`, `UNCERTAIN`).
- **Dynamic Decision Gates**: Real-time threshold adjustment for defect confidence and manual review triggers without server reboots.
- **Model Warmup & GPU Auto-Detection**: Loads the YOLO weights once on server startup, runs warmup tensor cycles, and enables GPU CUDA acceleration with seamless CPU fallback.
- **Full-Featured Web Studio**: Dark industrial glassmorphism UI with interactive canvas inspection, side-by-side comparison, quality gauge (0-100), paginated audit logs, CSV/JSON report exports, and telemetry charts.
- **Native Android App**: Kotlin + Jetpack Compose, CameraX viewfinder, Retrofit networking, and Room DB offline caching.
- **Complete ML Training Pipeline**: Command-line scripts for training with augmentation, validation (mAP50, mAP50-95, confusion matrices), latency benchmarking, and model export (ONNX, TFLite).

---

## 3. Project Structure

```
Weld_Project/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entrypoint, lifespan, CORS, static mounts
│   │   ├── api/v1/                  # REST API v1 routers & endpoints
│   │   │   ├── api.py
│   │   │   └── endpoints/
│   │   │       ├── inspections.py   # POST /inspections, GET /inspections, GET /stats/summary
│   │   │       └── system.py        # GET /health, GET /model-info, POST /config/thresholds
│   │   ├── core/                    # App settings, structured logging, security validators
│   │   ├── database/                # SQLAlchemy async session manager & base models
│   │   ├── models/                  # Inspection & Detection database schemas
│   │   ├── schemas/                 # Pydantic validation schemas
│   │   └── services/
│   │       ├── yolo_service.py      # Singleton YOLO model wrapper & bounding box drawer
│   │       ├── quality_engine.py    # Business quality decision rules & scoring algorithm
│   │       └── inspection_service.py# Inspection pipeline orchestration
│   ├── uploads/                     # Storage for original and annotated inspection images
│   ├── tests/                       # Pytest test suite (11 unit & integration tests)
│   ├── Dockerfile                   # Production container definition
│   └── requirements.txt             # Python backend dependencies
├── frontend/                        # Production React + Vite Web Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Telemetry header, tabs, and system status badge
│   │   │   ├── ImageUploader.jsx    # Drag & drop upload, preview & sample selector
│   │   │   ├── CameraCapture.jsx    # Live webcam viewfinder with HUD target guides
│   │   │   ├── AnalysisViewer.jsx   # Interactive canvas, side-by-side view, quality gauge
│   │   │   ├── HistoryTable.jsx     # Paginated inspection audit table with filters & search
│   │   │   ├── StatsDashboard.jsx   # Quality KPIs and defect frequency charts
│   │   │   └── ThresholdSettings.jsx# Dynamic threshold adjustment modal
│   │   ├── services/api.js          # REST API client
│   │   └── index.css                # Industrial cyber aesthetic & glassmorphism design system
│   └── package.json
├── android_app/                     # Native Android Kotlin + Jetpack Compose Project
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml
│   │   └── java/com/welding/qualityapp/
│   │       ├── MainActivity.kt
│   │       ├── data/api/            # Retrofit client & DTOs
│   │       ├── data/local/          # Room DB, DAOs, Entities
│   │       ├── data/repository/     # Repository layer
│   │       └── ui/screens/          # Compose screens (Home, Camera, Upload, Analysis, History)
├── scripts/                         # ML Operations Scripts
│   ├── train.py                     # YOLO training with domain-specific augmentation
│   ├── validate.py                  # Evaluation on val/test sets with mAP metrics
│   ├── predict.py                   # Standalone CLI prediction script with annotated JPG & JSON
│   ├── latency_check.py             # Inference latency and FPS throughput profiler
│   └── export_model.py              # Export weights to ONNX, TFLite, etc.
├── docker-compose.yml               # Multi-container orchestration
├── data.yaml                        # Dataset configuration
├── pytest.ini                       # Test suite runner configuration
└── README.md                        # Documentation
```

---

## 4. Quick Start Guide

### Prerequisites
- Python 3.10+ (64-bit)
- Node.js 18+ & npm
- (Optional) CUDA-enabled NVIDIA GPU & Android Studio

### 1. Backend Setup & Startup
```bash
# 1. Activate virtual environment
.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux/macOS

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Run FastAPI Backend Server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **API Root**: `http://localhost:8000/`
- **Swagger / OpenAPI Interactive Docs**: `http://localhost:8000/docs`
- **Health Endpoint**: `http://localhost:8000/api/v1/health`

### 2. Frontend Web Application Setup & Startup
```bash
cd frontend
npm install
npm run dev
```
- Open `http://localhost:5173/` in your browser.

---

## 5. Machine Learning Operations Pipeline

### A. Training YOLO Model
```bash
python scripts/train.py --data data.yaml --epochs 100 --batch 16 --imgsz 640
```

### B. Validating Model Performance (mAP50, Precision, Recall)
```bash
python scripts/validate.py --weights "runs/detect/YOLO Weld Detection project/weld_yolo_training/weights/best.pt" --data data.yaml
```

### C. Running Standalone CLI Predictions
```bash
python scripts/predict.py --source "datasets/The Welding Defect Dataset/train/images/Slag-inclusion-welding-images_10_jpeg_jpg.rf.fabe6926703c8e26c2bd865286c3beb3.jpg"
```
**Example CLI Output:**
```
=======================================================
           WELDING INSPECTION REPORT
=======================================================
Source Image:       Slag-inclusion-welding-images_10.jpg (640x640)
Overall Result:     [BAD]
Quality Score:      16.3 / 100
Confidence Level:   MEDIUM_CONFIDENCE
Decision Reason:    Defect 'Bad Weld' detected with 63.8% confidence (threshold: 50%).
Defects Detected:   1
Processing Time:    38.4 ms
Annotated Image:    runs/predictions/Slag-inclusion..._annotated.jpg
JSON Output:        runs/predictions/Slag-inclusion..._prediction.json
-------------------------------------------------------
Detections Breakdown:
  [1] Good Weld  | Conf: 81.4% | Type: OK     | Box: 35,154 -> 518,272
  [2] Bad Weld   | Conf: 63.8% | Type: DEFECT | Box: 39,332 -> 546,467
=======================================================
```

### D. Profiling Latency & FPS
```bash
python scripts/latency_check.py --iterations 50
```

### E. Exporting Model
```bash
python scripts/export_model.py --format onnx --imgsz 640
```

---

## 6. How Quality Verdict & Scoring Are Determined

### Model Detection vs Business Decision
- **Model Detection**: YOLO localizes features in the image (e.g. `Bad Weld` at 63.8% confidence).
- **Business Decision**: Configurable rules evaluate the detections against industrial quality thresholds:
  1. **BAD WELD**: Any defect detected with confidence $\ge \text{DEFECT\_THRESHOLD}$ (default `0.50`).
  2. **GOOD WELD**: No defects detected above threshold, and acceptable weld detected with confidence $\ge \text{DEFECT\_THRESHOLD}$.
  3. **UNCERTAIN (Manual Review Required)**: Maximum confidence $< \text{UNCERTAINTY\_THRESHOLD}$ (default `0.35`) or ambiguous non-conclusive features.

### Quality Score Calculation (0 – 100)
- **GOOD Welds (75–100)**: $\text{Score} = 75.0 + (\text{GoodConfidence} \times 25.0)$
- **BAD Welds (5–48)**: $\text{Score} = \max(5.0, (1.0 - \text{TopDefectConf}) \times 45.0 - (\text{DefectCount} - 1) \times 5.0)$
- **UNCERTAIN (50)**: Fixed baseline requiring certified manual inspection.

---

## 7. Running Automated Tests

Run the complete Pytest suite (covering unit logic, API endpoints, file validators, error handling, and history persistence):
```bash
pytest backend/tests/ -v
```

---

## 8. Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d --build

# View logs
docker-compose logs -f
```

---

## 9. Industrial Machine Learning Safety Notice

> [!WARNING]
> **Safety Disclaimer:** This automated computer vision application is intended for quality assurance assistance, defect triaging, and inspection logging. It does not replace a certified welding inspector (CWI/CSWIP). Critical load-bearing structures must comply with applicable industrial standards (AWS D1.1, ASME Section IX, ISO 5817) and undergo certified non-destructive testing (NDT).
