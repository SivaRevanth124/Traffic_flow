import socket
import time
from urllib.parse import urlparse
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
import cv2

from backend.app.models.camera import Camera, CameraHealthHistory
from backend.app.schemas.camera import CameraCreate, CameraUpdate, CameraResponse
from backend.app.core.security import mask_stream_url

class CameraService:
    @staticmethod
    def get_cameras(db: Session, include_deleted: bool = False) -> List[Camera]:
        query = db.query(Camera)
        if not include_deleted:
            query = query.filter(Camera.is_deleted == False)
        return query.order_by(Camera.camera_id).all()

    @staticmethod
    def get_camera_by_id(db: Session, camera_id: str) -> Optional[Camera]:
        return db.query(Camera).filter(Camera.camera_id == camera_id, Camera.is_deleted == False).first()

    @staticmethod
    def get_camera_by_pk(db: Session, pk: int) -> Optional[Camera]:
        return db.query(Camera).filter(Camera.id == pk, Camera.is_deleted == False).first()

    @staticmethod
    def create_camera(db: Session, data: CameraCreate) -> Camera:
        existing = db.query(Camera).filter(Camera.camera_id == data.camera_id).first()
        if existing:
            if existing.is_deleted:
                # Reactivate soft-deleted camera
                for key, val in data.model_dump().items():
                    setattr(existing, key, val)
                existing.is_deleted = False
                existing.status = "testing"
                db.commit()
                db.refresh(existing)
                return existing
            raise ValueError(f"Camera with ID '{data.camera_id}' already exists.")

        camera = Camera(
            camera_id=data.camera_id,
            name=data.name,
            location=data.location,
            latitude=data.latitude,
            longitude=data.longitude,
            camera_type=data.camera_type,
            camera_group=data.camera_group,
            rtsp_url=data.rtsp_url,
            status="testing", # Initial state until explicitly verified
            fps=data.fps,
            resolution=data.resolution,
            detection_active=data.detection_active,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(camera)
        db.commit()
        db.refresh(camera)
        return camera

    @staticmethod
    def update_camera(db: Session, camera: Camera, data: CameraUpdate) -> Camera:
        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(camera, key, value)
        camera.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(camera)
        return camera

    @staticmethod
    def delete_camera(db: Session, camera: Camera, soft_delete: bool = True) -> bool:
        if soft_delete:
            camera.is_deleted = True
            camera.status = "offline"
            camera.updated_at = datetime.now(timezone.utc)
            db.commit()
        else:
            db.delete(camera)
            db.commit()
        return True

    @staticmethod
    def test_connection(camera: Camera, db: Session) -> Tuple[bool, str, Optional[float], Optional[str]]:
        """
        Verify stream connectivity.
        Does not falsely report online unless a socket probe or frame capture verifies signal.
        """
        start_time = time.time()
        url = camera.rtsp_url

        if not url:
            status = "offline"
            error = "No RTSP stream URI configured for sensor."
            latency = None
            is_reachable = False
        else:
            try:
                parsed = urlparse(url)
                host = parsed.hostname
                port = parsed.port or 554

                if not host:
                    raise ValueError("Invalid RTSP URI host")

                # Step 1: TCP Socket probe (timeout 2.0s)
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2.0)
                s.connect((host, port))
                s.close()
                latency = round((time.time() - start_time) * 1000, 1)
                status = "online"
                error = None
                is_reachable = True
            except Exception as e:
                latency = round((time.time() - start_time) * 1000, 1)
                status = "offline"
                error = f"Socket connection failed to {url}: {str(e)}"
                is_reachable = False

        # Update camera record
        camera.status = status
        camera.last_ping = datetime.now(timezone.utc) if is_reachable else camera.last_ping
        camera.last_error = error
        camera.updated_at = datetime.now(timezone.utc)

        # Log to health history
        health_record = CameraHealthHistory(
            camera_id=camera.id,
            status=status,
            ping_ms=latency if is_reachable else None,
            fps_measured=float(camera.fps) if is_reachable else 0.0,
            error_message=error,
            checked_at=datetime.now(timezone.utc)
        )
        db.add(health_record)
        db.commit()
        db.refresh(camera)

        return is_reachable, status, latency, error

    @staticmethod
    def to_response_schema(camera: Camera) -> CameraResponse:
        """Convert Camera ORM object to CameraResponse with masked credentials."""
        return CameraResponse(
            id=camera.id,
            camera_id=camera.camera_id,
            name=camera.name,
            location=camera.location,
            latitude=camera.latitude,
            longitude=camera.longitude,
            camera_type=camera.camera_type,
            camera_group=camera.camera_group,
            fps=camera.fps,
            resolution=camera.resolution,
            detection_active=camera.detection_active,
            status=camera.status,
            rtsp_url_masked=mask_stream_url(camera.rtsp_url),
            last_ping=camera.last_ping,
            last_error=camera.last_error,
            created_at=camera.created_at,
            updated_at=camera.updated_at
        )
