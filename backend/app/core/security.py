import os
from fastapi import HTTPException, UploadFile, status
from PIL import Image
import io
from backend.app.core.config import settings

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal or dangerous characters."""
    clean_name = os.path.basename(filename)
    return "".join(c for c in clean_name if c.isalnum() or c in (".", "_", "-"))

async def validate_image_file(file: UploadFile) -> bytes:
    """
    Validate uploaded image:
    1. Check filename extension
    2. Check MIME type
    3. Check file size limits
    4. Check image integrity & dimensions using Pillow
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing or empty."
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    if file.content_type and file.content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported MIME type '{file.content_type}'. Allowed: {', '.join(settings.ALLOWED_MIME_TYPES)}"
        )

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
        )

    # Validate image decoding and dimensions
    try:
        with Image.open(io.BytesIO(contents)) as img:
            img.verify()
            width, height = img.size
            if width < 32 or height < 32:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Image resolution too small ({width}x{height}). Minimum required is 32x32."
                )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image file: {str(e)}"
        )

    return contents
