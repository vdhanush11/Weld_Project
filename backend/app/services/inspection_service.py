import os
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any
import cv2
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, delete
from fastapi import UploadFile, HTTPException, status

from backend.app.core.config import settings
from backend.app.core.security import validate_image_file, sanitize_filename
from backend.app.models.inspection import Inspection, Detection
from backend.app.schemas.inspection import (
    InspectionResponse,
    DetectionOut,
    BoundingBox,
    InspectionListItem,
    InspectionHistoryResponse,
    InspectionStatsResponse,
    DefectClassCount
)
from backend.app.services.yolo_service import yolo_service
from backend.app.services.quality_engine import QualityEngine

logger = logging.getLogger("weld_app.inspection_service")

class InspectionService:
    def __init__(self):
        self.quality_engine = QualityEngine()

    async def process_inspection(
        self,
        file: UploadFile,
        db: AsyncSession,
        device_id: Optional[str] = None,
        notes: Optional[str] = None,
        base_url: str = ""
    ) -> InspectionResponse:
        """Execute complete inspection pipeline for an uploaded image."""
        # 1. Validate file
        image_bytes = await validate_image_file(file)
        
        # 2. Generate unique identifiers and directory paths
        now = datetime.now(timezone.utc)
        year_str = now.strftime("%Y")
        month_str = now.strftime("%m")
        inspection_id = str(uuid.uuid4())
        
        orig_dir = Path(settings.ORIGINAL_DIR) / year_str / month_str
        annot_dir = Path(settings.ANNOTATED_DIR) / year_str / month_str
        orig_dir.mkdir(parents=True, exist_ok=True)
        annot_dir.mkdir(parents=True, exist_ok=True)

        orig_filename = f"{inspection_id}.jpg"
        annot_filename = f"{inspection_id}_annotated.jpg"
        orig_filepath = orig_dir / orig_filename
        annot_filepath = annot_dir / annot_filename

        # Save original image file
        with open(orig_filepath, "wb") as f:
            f.write(image_bytes)

        # 3. Run YOLO inference
        try:
            detections, annotated_image, proc_time_ms, width, height = yolo_service.predict(
                image_bytes
            )
        except Exception as e:
            logger.error("YOLO inference failed for inspection %s: %s", inspection_id, str(e), exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Inference error: {str(e)}"
            )

        # Save annotated image
        cv2.imwrite(str(annot_filepath), annotated_image)

        # 4. Evaluate with Quality Engine
        overall_status, quality_score, reason, conf_category, defect_count = self.quality_engine.evaluate_inspection(
            detections
        )

        # Relative paths stored in DB
        rel_orig_path = f"uploads/original/{year_str}/{month_str}/{orig_filename}"
        rel_annot_path = f"uploads/annotated/{year_str}/{month_str}/{annot_filename}"

        # 5. Persist to Database
        db_inspection = Inspection(
            id=inspection_id,
            timestamp=now,
            original_image_path=rel_orig_path,
            annotated_image_path=rel_annot_path,
            original_filename=sanitize_filename(file.filename or "captured_image.jpg"),
            image_width=width,
            image_height=height,
            overall_status=overall_status,
            quality_score=quality_score,
            decision_reason=reason,
            confidence_category=conf_category,
            model_version=settings.MODEL_VERSION,
            defect_count=defect_count,
            processing_time_ms=proc_time_ms,
            device_id=device_id,
            notes=notes
        )
        db.add(db_inspection)
        await db.flush()

        # Add detections
        detection_out_list: List[DetectionOut] = []
        for d in detections:
            bbox = d["bbox"]
            db_det = Detection(
                inspection_id=inspection_id,
                class_id=d["class_id"],
                class_name=d["class_name"],
                confidence=d["confidence"],
                is_defect=1 if d["is_defect"] else 0,
                x1=bbox["x1"],
                y1=bbox["y1"],
                x2=bbox["x2"],
                y2=bbox["y2"],
                norm_x1=bbox["norm_x1"],
                norm_y1=bbox["norm_y1"],
                norm_x2=bbox["norm_x2"],
                norm_y2=bbox["norm_y2"]
            )
            db.add(db_det)
            detection_out_list.append(
                DetectionOut(
                    class_name=d["class_name"],
                    class_id=d["class_id"],
                    confidence=d["confidence"],
                    is_defect=d["is_defect"],
                    bbox=BoundingBox(**bbox)
                )
            )

        await db.commit()

        # 6. Format Response URLs
        clean_base = base_url.rstrip("/")
        orig_url = f"{clean_base}/static/{rel_orig_path}"
        annot_url = f"{clean_base}/static/{rel_annot_path}"

        return InspectionResponse(
            inspection_id=inspection_id,
            timestamp=now,
            original_image_url=orig_url,
            annotated_image_url=annot_url,
            original_filename=db_inspection.original_filename,
            image_width=width,
            image_height=height,
            overall_status=overall_status,
            quality_score=quality_score,
            decision_reason=reason,
            confidence_category=conf_category,
            model_version=settings.MODEL_VERSION,
            defect_count=defect_count,
            processing_time_ms=proc_time_ms,
            detections=detection_out_list
        )

    async def get_history(
        self,
        db: AsyncSession,
        status_filter: Optional[str] = None,
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
        base_url: str = ""
    ) -> InspectionHistoryResponse:
        """Retrieve paginated inspection history with optional filtering."""
        query = select(Inspection)
        count_query = select(func.count(Inspection.id))

        if status_filter and status_filter.upper() != "ALL":
            query = query.where(Inspection.overall_status == status_filter.upper())
            count_query = count_query.where(Inspection.overall_status == status_filter.upper())

        if sort_order.lower() == "asc":
            query = query.order_by(Inspection.timestamp.asc())
        else:
            query = query.order_by(Inspection.timestamp.desc())

        # Total count
        total_res = await db.execute(count_query)
        total = total_res.scalar() or 0

        # Pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        rows = result.scalars().all()

        clean_base = base_url.rstrip("/")
        items: List[InspectionListItem] = []
        for r in rows:
            orig_url = f"{clean_base}/static/{r.original_image_path}"
            annot_url = f"{clean_base}/static/{r.annotated_image_path}"
            items.append(
                InspectionListItem(
                    inspection_id=r.id,
                    timestamp=r.timestamp,
                    original_image_url=orig_url,
                    annotated_image_url=annot_url,
                    overall_status=r.overall_status,
                    quality_score=r.quality_score,
                    defect_count=r.defect_count,
                    confidence_category=r.confidence_category,
                    model_version=r.model_version,
                    processing_time_ms=r.processing_time_ms
                )
            )

        total_pages = max(1, (total + limit - 1) // limit)
        return InspectionHistoryResponse(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
            items=items
        )

    async def get_inspection_by_id(
        self,
        inspection_id: str,
        db: AsyncSession,
        base_url: str = ""
    ) -> Optional[InspectionResponse]:
        """Fetch single inspection with full detection details."""
        query = select(Inspection).where(Inspection.id == inspection_id)
        result = await db.execute(query)
        r = result.scalar_one_or_none()

        if not r:
            return None

        clean_base = base_url.rstrip("/")
        orig_url = f"{clean_base}/static/{r.original_image_path}"
        annot_url = f"{clean_base}/static/{r.annotated_image_path}"

        detections_out = [
            DetectionOut(
                class_name=d.class_name,
                class_id=d.class_id,
                confidence=d.confidence,
                is_defect=bool(d.is_defect),
                bbox=BoundingBox(
                    x1=d.x1,
                    y1=d.y1,
                    x2=d.x2,
                    y2=d.y2,
                    norm_x1=d.norm_x1,
                    norm_y1=d.norm_y1,
                    norm_x2=d.norm_x2,
                    norm_y2=d.norm_y2
                )
            )
            for d in r.detections
        ]

        return InspectionResponse(
            inspection_id=r.id,
            timestamp=r.timestamp,
            original_image_url=orig_url,
            annotated_image_url=annot_url,
            original_filename=r.original_filename,
            image_width=r.image_width,
            image_height=r.image_height,
            overall_status=r.overall_status,
            quality_score=r.quality_score,
            decision_reason=r.decision_reason,
            confidence_category=r.confidence_category,
            model_version=r.model_version,
            defect_count=r.defect_count,
            processing_time_ms=r.processing_time_ms,
            detections=detections_out
        )

    async def delete_inspection(self, inspection_id: str, db: AsyncSession) -> bool:
        """Delete inspection record and remove disk image files."""
        query = select(Inspection).where(Inspection.id == inspection_id)
        result = await db.execute(query)
        inspection = result.scalar_one_or_none()

        if not inspection:
            return False

        # Attempt to remove disk files
        try:
            orig_p = settings.BASE_DIR / "backend" / inspection.original_image_path
            annot_p = settings.BASE_DIR / "backend" / inspection.annotated_image_path
            if orig_p.exists():
                orig_p.unlink()
            if annot_p.exists():
                annot_p.unlink()
        except Exception as e:
            logger.warning("Error deleting image files for %s: %s", inspection_id, str(e))

        await db.delete(inspection)
        await db.commit()
        return True

    async def get_stats_summary(self, db: AsyncSession) -> InspectionStatsResponse:
        """Aggregate inspection statistics and defect distribution."""
        total_q = await db.execute(select(func.count(Inspection.id)))
        total = total_q.scalar() or 0

        if total == 0:
            return InspectionStatsResponse(
                total_inspections=0,
                good_count=0,
                bad_count=0,
                uncertain_count=0,
                defect_rate_percent=0.0,
                avg_quality_score=0.0,
                avg_processing_time_ms=0.0,
                defect_distribution=[]
            )

        good_q = await db.execute(select(func.count(Inspection.id)).where(Inspection.overall_status == "GOOD"))
        good_count = good_q.scalar() or 0

        bad_q = await db.execute(select(func.count(Inspection.id)).where(Inspection.overall_status == "BAD"))
        bad_count = bad_q.scalar() or 0

        unc_q = await db.execute(select(func.count(Inspection.id)).where(Inspection.overall_status == "UNCERTAIN"))
        uncertain_count = unc_q.scalar() or 0

        avg_score_q = await db.execute(select(func.avg(Inspection.quality_score)))
        avg_score = round(avg_score_q.scalar() or 0.0, 1)

        avg_proc_q = await db.execute(select(func.avg(Inspection.processing_time_ms)))
        avg_proc = round(avg_proc_q.scalar() or 0.0, 2)

        defect_rate = round((bad_count / total) * 100.0, 1)

        # Defect class counts
        defect_classes_q = await db.execute(
            select(Detection.class_name, func.count(Detection.id))
            .where(Detection.is_defect == 1)
            .group_by(Detection.class_name)
        )
        defect_rows = defect_classes_q.all()
        total_defect_instances = sum(r[1] for r in defect_rows) or 1

        dist = [
            DefectClassCount(
                class_name=r[0],
                count=r[1],
                percentage=round((r[1] / total_defect_instances) * 100.0, 1)
            )
            for r in defect_rows
        ]

        return InspectionStatsResponse(
            total_inspections=total,
            good_count=good_count,
            bad_count=bad_count,
            uncertain_count=uncertain_count,
            defect_rate_percent=defect_rate,
            avg_quality_score=avg_score,
            avg_processing_time_ms=avg_proc,
            defect_distribution=dist
        )

inspection_service = InspectionService()
