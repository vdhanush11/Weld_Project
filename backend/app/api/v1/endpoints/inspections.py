from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.schemas.inspection import (
    InspectionResponse,
    InspectionHistoryResponse,
    InspectionStatsResponse
)
from backend.app.services.inspection_service import inspection_service

router = APIRouter()

@router.post(
    "",
    response_model=InspectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit welding image for quality inspection",
    description="Uploads a welding image (JPG/PNG), runs YOLO defect detection, computes quality score and business status (GOOD/BAD/UNCERTAIN), persists the record, and returns the annotated result."
)
async def create_inspection(
    request: Request,
    file: UploadFile = File(..., description="Welding image file (JPEG, PNG, WEBP)"),
    device_id: Optional[str] = Form(None, description="Optional device/station identifier"),
    notes: Optional[str] = Form(None, description="Optional inspector notes"),
    db: AsyncSession = Depends(get_db)
):
    base_url = str(request.base_url)
    return await inspection_service.process_inspection(
        file=file,
        db=db,
        device_id=device_id,
        notes=notes,
        base_url=base_url
    )

@router.get(
    "",
    response_model=InspectionHistoryResponse,
    summary="Get paginated inspection history",
    description="Retrieve inspection history with optional status filtering (ALL, GOOD, BAD, UNCERTAIN) and sorting."
)
async def list_inspections(
    request: Request,
    status: Optional[str] = Query(None, description="Filter by status: ALL, GOOD, BAD, UNCERTAIN"),
    sort: str = Query("desc", pattern="^(asc|desc)$", description="Sort by timestamp (asc or desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    base_url = str(request.base_url)
    return await inspection_service.get_history(
        db=db,
        status_filter=status,
        sort_order=sort,
        page=page,
        limit=limit,
        base_url=base_url
    )

@router.get(
    "/stats/summary",
    response_model=InspectionStatsResponse,
    summary="Get overall inspection analytics",
    description="Returns total inspection counts, defect rates, average quality scores, and defect class distributions."
)
async def get_inspection_stats(
    db: AsyncSession = Depends(get_db)
):
    return await inspection_service.get_stats_summary(db=db)

@router.get(
    "/{inspection_id}",
    response_model=InspectionResponse,
    summary="Get inspection details by ID",
    description="Retrieve full inspection details including bounding boxes and individual defect detections."
)
async def get_inspection(
    inspection_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    base_url = str(request.base_url)
    result = await inspection_service.get_inspection_by_id(
        inspection_id=inspection_id,
        db=db,
        base_url=base_url
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection with ID '{inspection_id}' not found."
        )
    return result

@router.delete(
    "/{inspection_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete inspection record",
    description="Permanently delete an inspection record and associated uploaded images."
)
async def delete_inspection(
    inspection_id: str,
    db: AsyncSession = Depends(get_db)
):
    success = await inspection_service.delete_inspection(
        inspection_id=inspection_id,
        db=db
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection with ID '{inspection_id}' not found."
        )
    return {"status": "success", "message": f"Inspection '{inspection_id}' deleted successfully."}
