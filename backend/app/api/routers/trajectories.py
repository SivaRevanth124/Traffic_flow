from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from backend.app.database.session import get_db
from backend.app.services.auth_service import AuthService
from backend.app.models.user import User
from backend.app.services.trajectory_service import TrajectoryService
from backend.app.schemas.trajectory import (
    TrajectoryResponse,
    TrajectoryDetailResponse,
    TrajectoryObservation,
    TrajectoryReconstructRequest
)

router = APIRouter(prefix="/trajectories", tags=["Trajectory Reconstruction & Exploration"])

def _format_trajectory_response(t) -> TrajectoryResponse:
    cams = []
    names = []
    try:
        cams = json.loads(t.camera_sequence) if t.camera_sequence else []
    except Exception:
        cams = []
    try:
        names = json.loads(t.camera_names) if t.camera_names else []
    except Exception:
        names = []

    return TrajectoryResponse(
        id=t.id,
        trajectory_id=t.trajectory_id,
        vehicle_category=t.vehicle_category,
        vehicle_description=t.vehicle_description,
        camera_sequence=cams,
        camera_names=names,
        start_timestamp=t.start_timestamp,
        end_timestamp=t.end_timestamp,
        start_time_str=t.start_time_str,
        end_time_str=t.end_time_str,
        duration_seconds=t.duration_seconds,
        duration_str=t.duration_str,
        total_observations=t.total_observations,
        distance_km=t.distance_km,
        confidence_score=t.confidence_score,
        cluster_label=t.cluster_label,
        cluster_id=t.cluster_id,
        created_at=t.created_at
    )

@router.get("", response_model=List[TrajectoryResponse])
def list_trajectories(
    category: Optional[str] = Query(None, description="Vehicle category filter (car, truck, bus, motorcycle)"),
    cluster_id: Optional[int] = Query(None, description="Filter by ML cluster assignment ID"),
    search: Optional[str] = Query(None, description="Search by ID, route name, or camera"),
    db: Session = Depends(get_db)
):
    """Lists reconstructed vehicle trajectories with search and category filters."""
    trajectories = TrajectoryService.list_trajectories(
        db=db,
        category=category,
        cluster_id=cluster_id,
        search=search
    )
    return [_format_trajectory_response(t) for t in trajectories]

@router.get("/export/geojson")
def export_trajectories_geojson(db: Session = Depends(get_db)):
    """Exports all trajectories as standard GeoJSON FeatureCollection."""
    geojson_data = TrajectoryService.export_geojson(db)
    return Response(
        content=json.dumps(geojson_data, indent=2),
        media_type="application/geo+json",
        headers={"Content-Disposition": "attachment; filename=trafficflow_trajectories.geojson"}
    )

@router.get("/export/csv")
def export_trajectories_csv(db: Session = Depends(get_db)):
    """Exports reconstructed trajectories in tabular CSV format."""
    csv_data = TrajectoryService.export_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trafficflow_trajectories.csv"}
    )

@router.get("/{trajectory_id}", response_model=TrajectoryDetailResponse)
def get_trajectory_detail(trajectory_id: str, db: Session = Depends(get_db)):
    """Retrieves full trajectory record including observations and GeoJSON line geometry."""
    trj = TrajectoryService.get_trajectory_by_id(db, trajectory_id)
    if not trj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trajectory {trajectory_id} not found"
        )

    base = _format_trajectory_response(trj)

    geojson_path = {}
    try:
        geojson_path = json.loads(trj.geojson_path)
    except Exception:
        geojson_path = {}

    obs = []
    try:
        obs_raw = json.loads(trj.observations_json)
        obs = [TrajectoryObservation(**o) for o in obs_raw]
    except Exception:
        obs = []

    return TrajectoryDetailResponse(
        **base.model_dump(),
        geojson_path=geojson_path,
        observations=obs
    )
