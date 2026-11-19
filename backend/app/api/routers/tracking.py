from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from backend.app.database.session import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User
from backend.app.services.tracking_service import TrackingService
from backend.app.schemas.tracking import (
    TrackletResponse,
    CrossCameraAssociationResponse,
    AssociationVerifyRequest,
    TrackingStatsResponse
)

router = APIRouter(prefix="/tracking", tags=["Vehicle Tracking & Cross-Camera Association"])

def _format_tracklet_response(t) -> TrackletResponse:
    pts = []
    if t.trajectory_points:
        try:
            pts = json.loads(t.trajectory_points)
        except Exception:
            pts = []
    return TrackletResponse(
        id=t.id,
        track_id=t.track_id,
        video_id=t.video_id,
        camera_id=t.camera_id,
        category=t.category,
        start_frame=t.start_frame,
        end_frame=t.end_frame,
        start_time_sec=t.start_time_sec,
        end_time_sec=t.end_time_sec,
        duration_sec=t.duration_sec,
        total_detections=t.total_detections,
        avg_confidence=t.avg_confidence,
        avg_speed_kmh=t.avg_speed_kmh,
        primary_direction=t.primary_direction,
        appearance_color=t.appearance_color,
        trajectory_points=pts,
        created_at=t.created_at
    )

@router.get("/stats", response_model=TrackingStatsResponse)
def get_tracking_statistics(db: Session = Depends(get_db)):
    """Returns global tracking KPIs and cross-camera performance statistics."""
    stats = TrackingService.get_tracking_stats(db)
    return TrackingStatsResponse(**stats)

@router.post("/videos/{video_id}/run", response_model=List[TrackletResponse])
def run_tracking_on_video(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Executes ByteTrack on persisted detections for a video and returns generated tracklets."""
    try:
        tracklets = TrackingService.track_video_detections(video_id, db)
        return [_format_tracklet_response(t) for t in tracklets]
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Tracking failure: {str(e)}")

@router.get("/videos/{video_id}/tracks", response_model=List[TrackletResponse])
def get_video_tracks(video_id: str, db: Session = Depends(get_db)):
    """Fetches intra-camera tracklets for a specified video."""
    try:
        tracklets = TrackingService.get_video_tracks(video_id, db)
        return [_format_tracklet_response(t) for t in tracklets]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/associations", response_model=List[CrossCameraAssociationResponse])
def get_cross_camera_associations(
    status: Optional[str] = Query(None, description="Filter by status: verified, review_required, rejected, or all"),
    db: Session = Depends(get_db)
):
    """Lists cross-camera vehicle association candidate pairs."""
    assocs = TrackingService.get_associations(db, status=status)
    return [CrossCameraAssociationResponse.model_validate(a) for a in assocs]

@router.post("/associations/{association_id}/verify", response_model=CrossCameraAssociationResponse)
def verify_association(
    association_id: str,
    payload: AssociationVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Human-in-the-loop verification or rejection of an uncertain cross-camera match."""
    try:
        updated = TrackingService.verify_association(
            association_id=association_id,
            action=payload.action,
            username=current_user.username,
            notes=payload.notes,
            db=db
        )
        return CrossCameraAssociationResponse.model_validate(updated)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
