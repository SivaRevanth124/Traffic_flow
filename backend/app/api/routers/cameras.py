from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from backend.app.database.session import get_db
from backend.app.schemas.camera import (
    CameraCreate,
    CameraUpdate,
    CameraResponse,
    CameraTestResult,
    CameraHealthHistoryResponse
)
from backend.app.services.camera_service import CameraService
from backend.app.api.deps import require_operator, get_current_user
from backend.app.models.user import User
from backend.app.models.camera import CameraHealthHistory

router = APIRouter(prefix="/cameras", tags=["CCTV Camera Management"])

@router.get("", response_model=List[CameraResponse])
def list_cameras(
    group: Optional[str] = Query(None, description="Filter by camera group"),
    status: Optional[str] = Query(None, description="Filter by status (online, offline, degraded)"),
    db: Session = Depends(get_db)
):
    """
    List all registered CCTV and ANPR optical camera sensors.
    RTSP stream credentials are automatically masked for privacy.
    """
    cameras = CameraService.get_cameras(db)
    if group and group != "all":
        cameras = [c for c in cameras if c.camera_group == group]
    if status and status != "all":
        cameras = [c for c in cameras if c.status == status]
    return [CameraService.to_response_schema(c) for c in cameras]

@router.get("/{camera_id}", response_model=CameraResponse)
def get_camera(camera_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific camera by camera_id."""
    camera = CameraService.get_camera_by_id(db, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera '{camera_id}' not found.")
    return CameraService.to_response_schema(camera)

@router.post("", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
def register_camera(
    data: CameraCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """
    Register a new CCTV/ANPR camera sensor.
    Credentials are encrypted at rest and validated before activation.
    """
    try:
        camera = CameraService.create_camera(db, data)
        return CameraService.to_response_schema(camera)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{camera_id}", response_model=CameraResponse)
def update_camera(
    camera_id: str,
    data: CameraUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """Update camera configuration details (location, coordinates, stream endpoint)."""
    camera = CameraService.get_camera_by_id(db, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera '{camera_id}' not found.")
    updated = CameraService.update_camera(db, camera, data)
    return CameraService.to_response_schema(updated)

@router.delete("/{camera_id}")
def delete_camera(
    camera_id: str,
    soft_delete: bool = Query(True, description="Soft-delete sensor to preserve historical telemetry"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """Decommission and remove a CCTV sensor from active dispatch."""
    camera = CameraService.get_camera_by_id(db, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera '{camera_id}' not found.")
    CameraService.delete_camera(db, camera, soft_delete=soft_delete)
    return {"message": f"Camera '{camera_id}' successfully decommissioned.", "success": True}

@router.post("/{camera_id}/test", response_model=CameraTestResult)
def test_camera_connection(
    camera_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute active connection probe against authorized RTSP/ONVIF endpoint.
    Guarantees that a camera is never flagged online without verified handshake.
    """
    camera = CameraService.get_camera_by_id(db, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera '{camera_id}' not found.")

    is_reachable, new_status, latency, error = CameraService.test_connection(camera, db)
    return CameraTestResult(
        camera_id=camera.camera_id,
        status=new_status,
        is_reachable=is_reachable,
        latency_ms=latency,
        fps_measured=float(camera.fps) if is_reachable else 0.0,
        resolution=camera.resolution,
        error_message=error,
        tested_at=datetime.now(timezone.utc)
    )

@router.get("/{camera_id}/health", response_model=List[CameraHealthHistoryResponse])
def get_camera_health_history(
    camera_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve historical ping, latency, and uptime health trail for a sensor."""
    camera = CameraService.get_camera_by_id(db, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera '{camera_id}' not found.")
    records = db.query(CameraHealthHistory)\
        .filter(CameraHealthHistory.camera_id == camera.id)\
        .order_by(CameraHealthHistory.checked_at.desc())\
        .limit(limit)\
        .all()
    return records

@router.get("/{camera_id}/live-stream")
@router.head("/{camera_id}/live-stream")
def get_camera_live_stream(
    camera_id: str,
    range: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    RTSP-to-HTTP Streaming Gateway.
    Streams playable video feed for online cameras, or returns 503 if sensor is offline/unreachable.
    """
    from backend.app.services.streaming_service import StreamingGatewayService
    from backend.app.services.video_service import VideoService
    from fastapi.responses import StreamingResponse

    filepath, error = StreamingGatewayService.get_camera_stream_source(camera_id, db)
    if not filepath:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error or f"Sensor {camera_id} stream unavailable."
        )

    generator, start, end, total, status_code = VideoService.get_range_stream(filepath, range)
    headers = {
        "Content-Range": f"bytes {start}-{end}/{total}",
        "Accept-Ranges": "bytes",
        "Content-Length": str((end - start) + 1),
        "Content-Type": "video/mp4",
    }
    return StreamingResponse(generator, status_code=status_code, headers=headers)

@router.get("/{camera_id}/snapshot")
def get_camera_snapshot(camera_id: str, db: Session = Depends(get_db)):
    """
    Returns an immediate high-resolution CCTV JPEG photo snapshot for a sensor.
    Returns HTTP 503 if the sensor is offline.
    """
    from fastapi.responses import Response
    from backend.app.services.cctv_frame_service import CCTVFrameService
    from backend.app.models.camera import Camera

    camera = db.query(Camera).filter(Camera.camera_id == camera_id, Camera.is_deleted == False).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    if camera.status == "offline":
        raise HTTPException(status_code=503, detail=f"Camera {camera_id} is offline")

    jpeg_bytes = CCTVFrameService.get_camera_snapshot_jpeg(camera_id)
    return Response(content=jpeg_bytes, media_type="image/jpeg")

@router.get("/{camera_id}/mjpeg")
def stream_camera_mjpeg(camera_id: str, db: Session = Depends(get_db)):
    """
    Live continuous MJPEG video stream (15 FPS).
    Natively supported across 100% of web browsers via standard <img> elements.
    """
    from fastapi.responses import StreamingResponse
    from backend.app.services.cctv_frame_service import CCTVFrameService
    from backend.app.models.camera import Camera

    camera = db.query(Camera).filter(Camera.camera_id == camera_id, Camera.is_deleted == False).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    if camera.status == "offline":
        raise HTTPException(status_code=503, detail=f"Camera {camera_id} is offline")

    return StreamingResponse(
        CCTVFrameService.stream_mjpeg(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

