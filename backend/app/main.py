import time
import uuid
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.app.core.config import settings
from backend.app.core.logging_config import setup_logging
from backend.app.database.session import init_db
from backend.app.services.yolo_service import yolo_service
from backend.app.api.v1.api import api_router

# Setup logger
logger = setup_logging(debug=settings.DEBUG)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown routines."""
    logger.info("Initializing %s v%s...", settings.APP_NAME, settings.APP_VERSION)
    
    # 1. Initialize SQLite/PostgreSQL Database
    try:
        await init_db()
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error("Failed to initialize database: %s", str(e), exc_info=True)

    # 2. Initialize and warm up YOLO Model (Loaded once into memory)
    try:
        yolo_service.initialize(settings.MODEL_PATH)
        logger.info("YOLO inference service initialized successfully.")
    except Exception as e:
        logger.error("Failed to initialize YOLO service: %s", str(e), exc_info=True)

    yield

    logger.info("Shutting down %s...", settings.APP_NAME)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production-Grade REST API for Welding Quality Detection and Industrial Inspection.\n\n"
        "Features YOLO-based defect localization, deterministic quality business logic (GOOD / BAD / UNCERTAIN), "
        "quality scoring (0-100), SQLite/PostgreSQL persistence, and live inspection analytics."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json"
)

# Request ID & Latency Middleware
@app.middleware("http")
async def add_process_time_and_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.perf_counter()
    
    response = await call_next(request)
    
    process_time = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-MS"] = f"{process_time:.2f}"
    return response

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads (Original & Annotated Images)
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include API Router
app.include_router(api_router, prefix="/api/v1")

# Global Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "message": "Invalid request payload or parameters.",
            "details": exc.errors()
        }
    )

# Global Unexpected Exception Handler (Prevents stack trace leaks to client)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": "An internal server error occurred while processing your inspection request."
        }
    )

@app.get("/", tags=["Root"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs_url": "/docs",
        "api_v1": "/api/v1"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
