import os
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database.session import get_db
from backend.app.models.video import Video
from backend.app.models.detection import VehicleDetection
from backend.app.schemas.detection import (
    DetectionResponse,
    DetectionSummaryResponse,
    DetectionProcessRequest
)
from backend.app.services.detection_service import DetectionService
from backend.app.services.video_service import VideoService
from backend.app.core.config import settings

router = APIRouter(prefix="/detection", tags=["AI Vehicle Detection (YOLO)"])

@router.post("/process/{video_id}", response_model=DetectionSummaryResponse)
def run_vehicle_detection(
    video_id: str,
    req: DetectionProcessRequest = DetectionProcessRequest(),
    db: Session = Depends(get_db)
):
    """
    Execute AI Vehicle Detection (YOLOv8 + OpenCV) on recorded video.
    Extracts vehicles (cars, motorcycles, buses, trucks), computes bounding boxes,
    draws visual overlays, and persists observations to the database.
    """
    video = db.query(Video).filter(Video.video_id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail=f"Video '{video_id}' not found.")
    if not os.path.exists(video.filepath):
        raise HTTPException(status_code=404, detail=f"Video file missing on disk: {video.filepath}")

    try:
        summary = DetectionService.process_video_detections(
            video=video,
            db=db,
            confidence_threshold=req.confidence_threshold,
            frame_stride=req.frame_stride,
            model_name=req.model_name
        )
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference pipeline error: {str(e)}")

@router.get("/videos/{video_id}", response_model=List[DetectionResponse])
def get_video_detections(
    video_id: str,
    category: Optional[str] = Query(None, description="Filter by vehicle class: car, motorcycle, bus, truck"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Query persisted vehicle observations for a video run."""
    query = db.query(VehicleDetection).filter(VehicleDetection.video_id == video_id)
    if category and category != "all":
        query = query.filter(VehicleDetection.category == category)
    if min_confidence is not None:
        query = query.filter(VehicleDetection.confidence >= min_confidence)

    return query.order_by(VehicleDetection.frame_number.asc()).offset(offset).limit(limit).all()

@router.get("/videos/{video_id}/summary", response_model=DetectionSummaryResponse)
def get_detection_summary(video_id: str, db: Session = Depends(get_db)):
    """Retrieve aggregate detection metrics and vehicle category distribution."""
    try:
        return DetectionService.get_detection_summary(video_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/videos/{video_id}/annotated")
def stream_annotated_video(
    video_id: str,
    range: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Stream processed video with visual bounding box overlays.
    Supports HTTP 206 Range requests for scrubbing.
    """
    annotated_path = os.path.join(settings.PROCESSED_DIR, f"{video_id}_annotated.mp4")
    if not os.path.exists(annotated_path):
        # Fall back to original video if not yet annotated
        video = db.query(Video).filter(Video.video_id == video_id).first()
        if not video or not os.path.exists(video.filepath):
            raise HTTPException(status_code=404, detail=f"Annotated video for '{video_id}' not found. Run inference first.")
        annotated_path = video.filepath

    generator, start, end, total, status_code = VideoService.get_range_stream(annotated_path, range)
    headers = {
        "Content-Range": f"bytes {start}-{end}/{total}",
        "Accept-Ranges": "bytes",
        "Content-Length": str((end - start) + 1),
        "Content-Type": "video/mp4",
    }
    return StreamingResponse(generator, status_code=status_code, headers=headers)

@router.get("/vehicle-photos")
def get_vehicle_photos():
    """
    Returns high-resolution optical CCTV vehicle detection photos.
    Includes metadata on vehicle classification, detection confidence, timecode, speed,
    and telematics status (e.g. Municipal GNSS/GPS fleet vs Optical CCTV only).
    """
    from backend.app.services.cctv_frame_service import CCTVFrameService
    items = CCTVFrameService.get_vehicle_photos()
    photos = []
    for v in items:
        pid = v.get("photo_id") or v.get("id")
        photos.append({
            "id": pid,
            "category": v.get("vehicle_class") or v.get("category", "car"),
            "title": v.get("title", f"Vehicle Observation {pid}"),
            "camera_id": v.get("camera_id", "CAM-001"),
            "camera_name": v.get("camera_name", "Surveillance Sensor"),
            "confidence": v.get("confidence", 0.90),
            "speed_kmh": v.get("speed_kmh", 45.0),
            "time_str": v.get("time_str", "10:00:00 AM"),
            "telematics": v.get("telematics_provider") or v.get("telematics", "Optical CCTV Only"),
            "telematics_type": v.get("telematics_type", "optical"),
            "description": v.get("description", "Vehicle detected on road corridor."),
            "photo_url": f"/api/v1/detection/photos/{pid}.jpg"
        })
    return photos

@router.get("/photos/{photo_id}.jpg")
def get_vehicle_photo_file(photo_id: str):
    """
    Serves the actual JPEG image for a detected vehicle CCTV photo capture.
    """
    from fastapi.responses import Response
    from backend.app.services.cctv_frame_service import CCTVFrameService
    
    jpeg_bytes = CCTVFrameService.get_vehicle_photo_jpeg(photo_id)
    return Response(content=jpeg_bytes, media_type="image/jpeg")
