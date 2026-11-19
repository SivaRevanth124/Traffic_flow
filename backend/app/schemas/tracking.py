from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class TrajectoryPoint(BaseModel):
    frame: int
    time_sec: float
    cx: float
    cy: float
    w: float
    h: float
    score: float

class TrackletResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    track_id: int
    video_id: str
    camera_id: str
    category: str
    start_frame: int
    end_frame: int
    start_time_sec: float
    end_time_sec: float
    duration_sec: float
    total_detections: int
    avg_confidence: float
    avg_speed_kmh: Optional[float] = None
    primary_direction: Optional[str] = None
    appearance_color: Optional[str] = None
    trajectory_points: List[Dict[str, Any]] = []
    created_at: datetime

class CrossCameraAssociationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    association_id: str
    source_camera_id: str
    source_track_id: int
    source_video_id: Optional[str] = None
    source_time_str: str
    dest_camera_id: str
    dest_track_id: int
    dest_video_id: Optional[str] = None
    dest_time_str: str
    vehicle_category: str
    vehicle_description: str
    travel_time_seconds: float
    travel_time_str: str
    expected_min_seconds: float
    expected_max_seconds: float
    expected_transit_str: str
    distance_meters: float
    confidence_score: float
    appearance_similarity: float
    topology_valid: bool
    status: str
    reviewed_by: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

class AssociationVerifyRequest(BaseModel):
    action: str = Field(..., description="'verify' or 'reject'")
    notes: Optional[str] = None

class TrackingStatsResponse(BaseModel):
    active_byte_track_sessions: int
    cross_camera_reconstructed: int
    pending_operator_review: int
    avg_travel_time_delta_sec: float
    high_confidence_ratio_pct: float
