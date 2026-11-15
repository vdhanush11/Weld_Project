# Production-Grade YOLO Welding Quality Detection Android App

Act as a senior **Computer Vision Engineer, YOLO specialist, Android developer, backend engineer, ML deployment engineer, and software architect**.

Build a complete production-grade **Welding Quality Inspection Android application** using a YOLO-based computer vision model.

## 1. PROJECT OBJECTIVE

The application must allow a user to:

1. Capture a welding image using the Android camera.
2. Upload an existing welding image from the gallery.
3. Send the image to the YOLO inference system.
4. Detect whether the welding is:

   * GOOD
   * BAD
5. If BAD, identify the detected welding defect(s).
6. Draw bounding boxes around detected defects.
7. Display confidence scores.
8. Calculate an overall welding-quality result.
9. Save every inspection result.
10. Provide backend accessibility so inspection results can be stored and retrieved later.
11. Display inspection history.
12. Store the original image and inspection metadata.
13. Make the system reliable enough for real-world deployment.

The application should be designed so that the YOLO model can later be replaced or retrained without rewriting the entire Android application.

---

# 2. RECOMMENDED SYSTEM ARCHITECTURE

Use the following architecture:

Android App
|
| Image
v
Backend REST API
|
v
YOLO Welding Detection Model
|
v
Prediction Processing
|
+---- Overall Result: GOOD / BAD
|
+---- Defect Classes
|
+---- Confidence Scores
|
+---- Bounding Boxes
|
v
Database
|
v
Android App
|
v
Inspection Result + History

Use a clean separation between:

* Android frontend
* Backend API
* YOLO inference service
* Database
* Model files

Do NOT tightly couple the YOLO model directly to the Android UI.

---

# 3. YOLO MODEL

Use a modern Ultralytics YOLO implementation.

The model must be trained specifically on a welding-quality dataset.

Do not assume that a pretrained generic YOLO model can accurately determine welding quality.

The model should be trained using welding images containing both acceptable and defective welds.

Recommended classes should be configurable.

Example classes:

GOOD_WELD
CRACK
POROSITY
UNDERCUT
SPATTER
INCOMPLETE_FUSION
INCOMPLETE_PENETRATION
OVERLAP
BURN_THROUGH
SLAG_INCLUSION
OTHER_DEFECT

The exact classes must be configurable through the dataset configuration file.

If the dataset contains only:

GOOD
BAD

then implement the system using those two classes.

If the dataset contains defect-level annotations, use the defect classes and derive the final GOOD/BAD decision from them.

---

# 4. VERY IMPORTANT: MODEL PREDICTION LOGIC

The system must clearly distinguish between:

### Detection

What did YOLO detect?

Example:

class = POROSITY
confidence = 0.94
bounding_box = [x1, y1, x2, y2]

### Quality Decision

What is the overall welding quality?

Example:

overall_status = BAD

reason:

POROSITY detected with confidence 0.94.

The application must NOT simply assume:

confidence > 0.5 = GOOD.

Instead, implement configurable business logic.

Example:

If no defect is detected above the configured defect threshold:

```
overall_status = GOOD
```

If one or more defects are detected above the configured threshold:

```
overall_status = BAD
```

Example:

DEFECT_CONFIDENCE_THRESHOLD = 0.50

This threshold must be configurable.

---

# 5. MODEL OUTPUT

For every uploaded/captured image, the inference API must return structured JSON similar to:

{
"inspection_id": "unique-id",
"overall_status": "BAD",
"quality_score": 72.5,
"model_version": "weld-yolo-v1",
"image_width": 1920,
"image_height": 1080,
"detections": [
{
"class_name": "POROSITY",
"class_id": 1,
"confidence": 0.94,
"bbox": {
"x1": 420,
"y1": 230,
"x2": 680,
"y2": 470
}
}
],
"defect_count": 1,
"processing_time_ms": 84,
"timestamp": "ISO-8601 timestamp"
}

The API must return consistent JSON.

---

# 6. QUALITY SCORE

Implement an optional quality score between:

0 and 100.

Example:

100 = excellent weld

90–99 = very good

75–89 = acceptable

50–74 = questionable

0–49 = defective

However, do not claim that this score represents a scientifically validated welding standard unless the scoring system has been validated against properly labeled inspection data.

Make the scoring algorithm configurable.

---

# 7. ANDROID APPLICATION

Build a clean modern Android application.

Recommended stack:

* Kotlin
* Jetpack Compose
* MVVM architecture
* Retrofit/OkHttp
* Coroutines
* ViewModel
* CameraX
* Coil or equivalent image loader
* Room database for local caching if appropriate

Screens:

## Home Screen

Show:

* App name
* Capture Welding Image
* Upload Welding Image
* Inspection History

## Camera Screen

Allow the user to:

* Open camera
* Capture welding image
* Preview image
* Retake image
* Confirm image

## Upload Screen

Allow:

* Gallery selection
* Image preview
* Analyze button

## Analysis Screen

Display:

* Original image
* Detection bounding boxes
* Detected defect names
* Confidence percentages
* Overall result

Example:

WELDING RESULT

BAD

Confidence:
94%

Defect:
POROSITY

Defects detected:
1

Model:
weld-yolo-v1

Processing time:
84 ms

## Good Result

Show:

GOOD WELD

No significant defects detected.

## Bad Result

Show:

BAD WELD

Defects detected:

* Porosity — 94%
* Undercut — 87%

Draw the detected defects on the image.

---

# 8. COLOR AND UI LOGIC

Use clear visual feedback.

GOOD:

Green indicator

BAD:

Red indicator

UNKNOWN / LOW CONFIDENCE:

Orange/yellow indicator

Do not hide uncertainty.

If the model confidence is too low, show:

"UNCERTAIN — IMAGE REQUIRES MANUAL INSPECTION"

Do not force a GOOD/BAD decision when the model is not sufficiently confident.

---

# 9. BACKEND

Build a production-ready REST API.

Recommended backend:

Python + FastAPI.

Backend responsibilities:

1. Receive uploaded image.
2. Validate image.
3. Preprocess image.
4. Run YOLO inference.
5. Post-process detections.
6. Calculate overall quality.
7. Save inspection result.
8. Save metadata.
9. Return JSON response.
10. Provide inspection-history endpoints.

Recommended endpoints:

POST /api/v1/inspections

GET /api/v1/inspections

GET /api/v1/inspections/{inspection_id}

DELETE /api/v1/inspections/{inspection_id}

GET /api/v1/health

GET /api/v1/model-info

---

# 10. DATABASE

Store:

inspection_id

timestamp

image_path

overall_status

quality_score

model_version

defect_count

processing_time

image_width

image_height

detections

confidence

bounding boxes

defect class

user/device identifier if required

Database technology can be:

PostgreSQL for production.

SQLite can be used for local development/testing.

Do not store sensitive information unnecessarily.

---

# 11. IMAGE STORAGE

Do not put large image binary data directly into normal database fields unless there is a specific reason.

Use:

object/file storage

and store the image path/reference in the database.

For local development, a structured uploads directory is acceptable.

Example:

uploads/
2026/
08/
inspection_001.jpg

---

# 12. MODEL VERSIONING

Every prediction must record the model version.

Example:

model_version:

weld-yolo-v1

When the model is retrained:

weld-yolo-v2

The historical prediction must continue to show which model generated the result.

---

# 13. CONFIDENCE HANDLING

Implement three prediction states:

HIGH_CONFIDENCE

LOW_CONFIDENCE

UNCERTAIN

Example:

confidence >= 0.80

HIGH_CONFIDENCE

0.50–0.79

MEDIUM_CONFIDENCE

< 0.50

LOW_CONFIDENCE

The exact values must be configurable.

Never hard-code thresholds throughout the application.

Keep them in one configuration file.

---

# 14. IMAGE VALIDATION

Before inference:

Validate:

* File type
* File size
* Image dimensions
* Corrupted image
* Empty file

Allowed formats:

JPEG

JPG

PNG

Reject unsupported files with a clear error message.

---

# 15. ERROR HANDLING

Implement proper error handling.

Examples:

Network unavailable

Server unavailable

Invalid image

Model unavailable

Inference failure

Timeout

Database failure

Low-confidence prediction

Return meaningful messages.

Do not expose internal Python stack traces to Android users.

---

# 16. SECURITY

Implement:

* API validation
* File-size limits
* MIME-type validation
* Input sanitization
* Request timeout
* Rate limiting where appropriate
* Authentication if required
* HTTPS in production
* Secure image storage

Never expose model files unnecessarily.

Never store API keys directly inside Android source code.

Use environment variables for backend secrets.

---

# 17. PERFORMANCE

Optimize inference.

Requirements:

* Load YOLO model once when the server starts.
* Do NOT load the model for every request.
* Use appropriate image resizing.
* Use GPU when available.
* Support CPU fallback.
* Measure inference time.
* Return processing time.
* Avoid blocking the Android main thread.

---

# 18. MODEL TRAINING PIPELINE

Create a complete training workflow.

Dataset structure:

dataset/
images/
train/
val/
test/

```
labels/
    train/
    val/
    test/
```

Create a data.yaml configuration.

Training pipeline must include:

1. Dataset validation
2. Train/validation/test split
3. YOLO training
4. Validation
5. Testing
6. Metrics
7. Confusion matrix
8. Precision
9. Recall
10. mAP50
11. mAP50-95
12. Per-class performance

Do not claim "good accuracy" simply because training accuracy is high.

Evaluate on a separate test dataset.

---

# 19. DATASET QUALITY

The model's performance depends heavily on the welding dataset.

The dataset should contain:

* Different welding machines
* Different materials
* Different lighting
* Different camera angles
* Different weld positions
* Different backgrounds
* Different weld sizes
* Good welds
* Multiple defect types
* Difficult examples
* Real-world images

Avoid data leakage.

Images from the same physical weld should not appear in both training and testing datasets.

---

# 20. AUGMENTATION

Use appropriate augmentation such as:

* brightness changes
* contrast changes
* scaling
* rotation
* cropping
* blur
* noise
* perspective changes

Do not use augmentations that create unrealistic welding defects.

---

# 21. TRAINING COMMANDS

Provide clear commands for:

Dataset preparation

Training

Validation

Testing

Export

Inference

Example:

python train.py

python validate.py

python predict.py --source image.jpg

The commands must work inside a Python virtual environment.

---

# 22. MODEL EXPORT

Support model export where appropriate.

Possible deployment formats:

.pt

ONNX

TensorRT

TFLite

NCNN

Choose the deployment format based on whether inference happens:

A. On the backend/server

or

B. Directly on the Android device.

For the first production version, prefer backend inference because it makes model updates easier and avoids Android-specific model conversion complexity.

---

# 23. PREDICTION SCRIPT

Create a standalone prediction script.

Example:

python predict.py --source test.jpg

The output should clearly show:

Image:

test.jpg

Overall Result:

BAD

Detected defects:

POROSITY
Confidence: 94%

UNDERCUT
Confidence: 86%

Model:

weld-yolo-v1

Inference time:

84 ms

Also save an annotated image.

Example:

runs/
predictions/
test_annotated.jpg

---

# 24. EXACT MODEL PREDICTION EXPLANATION

The application must have a clear "Prediction Details" section explaining exactly what the model predicted.

Example:

MODEL PREDICTION

Overall:
BAD

Detected object:
POROSITY

Class ID:
1

Confidence:
94.2%

Bounding box:
x1 = 420
y1 = 230
x2 = 680
y2 = 470

Decision:
BAD WELD

Reason:
A welding defect was detected above the configured confidence threshold.

This is important because the user must be able to understand what the YOLO model actually detected instead of only seeing "BAD".

---

# 25. IMPORTANT DISTINCTION

Never confuse:

MODEL PREDICTION

with

BUSINESS DECISION.

Example:

YOLO:

POROSITY = 0.94

Business logic:

POROSITY confidence > 0.50

Therefore:

BAD WELD

The UI should make this distinction clear.

---

# 26. INSPECTION HISTORY

Create a history screen.

Each record should display:

Inspection ID

Date/time

GOOD/BAD

Quality score

Number of defects

Model version

Thumbnail

Clicking an inspection should open the complete result.

Allow filtering:

ALL

GOOD

BAD

UNCERTAIN

Allow sorting by newest/oldest.

---

# 27. API DOCUMENTATION

FastAPI should automatically expose Swagger/OpenAPI documentation.

The backend should provide clear API documentation.

Document:

Request format

Response format

Error responses

Authentication if used

Example requests

Example responses

---

# 28. PROJECT STRUCTURE

Create a clean project structure similar to:

welding_detection/
│
├── android_app/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database/
│   │   ├── core/
│   │   └── utils/
│   │
│   ├── uploads/
│   ├── requirements.txt
│   └── .env.example
│
├── model/
│   ├── best.pt
│   ├── data.yaml
│   └── training/
│
├── scripts/
│   ├── train.py
│   ├── validate.py
│   └── predict.py
│
├── tests/
│
├── README.md
└── .gitignore

Adapt the structure if required, but maintain clean separation of responsibilities.

---

# 29. TESTING

Create tests for:

Backend API

Image upload

Model inference

Prediction parsing

GOOD/BAD decision logic

Database operations

Invalid images

Low-confidence predictions

Android UI

Network failure

History retrieval

---

# 30. LOGGING

Implement structured logging.

Log:

request ID

inspection ID

model version

inference time

prediction classes

confidence

errors

Do not log sensitive image data unnecessarily.

---

# 31. PRODUCTION DEPLOYMENT

Provide deployment instructions.

Backend should be deployable using:

Docker

Docker Compose

or a suitable cloud environment.

Provide:

Dockerfile

docker-compose.yml

environment configuration

database configuration

health check

production startup command

---

# 32. README

Create a complete README containing:

Project overview

Architecture

Requirements

Installation

Virtual environment setup

Dataset preparation

Training

Validation

Testing

Prediction

Backend setup

Android setup

API usage

Model replacement

Deployment

Troubleshooting

---

# 33. IMPORTANT MACHINE-LEARNING SAFETY REQUIREMENT

Do not claim that the application provides certified welding inspection or replaces a qualified welding inspector unless the system has been appropriately validated and certified for the intended industrial use.

Clearly communicate:

"AI prediction — manual inspection recommended for uncertain cases."

The application must not present uncertain predictions as guaranteed facts.

---

# 34. FINAL USER FLOW

The complete user flow must be:

User opens app

↓

User selects:

"Capture Image"

OR

"Upload Image"

↓

Image preview

↓

User taps:

"Analyze Welding"

↓

Android sends image to backend

↓

Backend validates image

↓

YOLO model performs inference

↓

YOLO detects welding class/defects

↓

Prediction processor calculates:

* detected defects
* confidence
* bounding boxes
* overall status
* quality score

↓

Result saved to database

↓

Backend returns JSON

↓

Android displays:

GOOD / BAD / UNCERTAIN

↓

Bounding boxes shown

↓

Defect names shown

↓

Confidence shown

↓

Quality score shown

↓

Inspection saved to history

---

# 35. MOST IMPORTANT REQUIREMENT

Do not generate a superficial demo.

Build the application as a real, maintainable project.

Provide complete runnable code rather than pseudocode.

Do not leave major sections as:

"implement this later"

"add your own code"

"TODO"

or

"example only"

When a decision is required, choose a sensible production-grade default and explain the choice briefly.

Make all important configuration values configurable.

The final system must allow me to train my welding YOLO model, run predictions, expose the model through a backend API, connect the Android application to the backend, save inspection results, and clearly show exactly what the YOLO model predicted.

At the end, provide:

1. Complete project structure
2. Complete backend code
3. Complete Android code
4. Complete YOLO training code
5. Complete validation code
6. Complete prediction/inference code
7. Database implementation
8. API implementation
9. Model configuration
10. Requirements files
11. Environment configuration example
12. Testing instructions
13. Local run instructions
14. Production deployment instructions
15. Example API request/response
16. Example prediction output
17. Explanation of exactly how GOOD/BAD is determined
18. Explanation of exactly what YOLO predicts
19. Troubleshooting guide

The final result should be suitable as the foundation for a production-grade welding-quality inspection application.
