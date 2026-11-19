from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class TrajectoryObservation(BaseModel):
    camera_id: str
    camera_name: str
    timestamp_str: str
    track_id: int
    confidence: float

class TrajectoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    trajectory_id: str
    vehicle_category: str
    vehicle_description: str
    camera_sequence: List[str]
    camera_names: List[str]
    start_timestamp: datetime
    end_timestamp: datetime
    start_time_str: str
    end_time_str: str
    duration_seconds: float
    duration_str: str
    total_observations: int
    distance_km: float
    confidence_score: float
    cluster_label: str
    cluster_id: int
    created_at: datetime

class TrajectoryDetailResponse(TrajectoryResponse):
    geojson_path: Dict[str, Any]
    observations: List[TrajectoryObservation] = []

class TrajectoryReconstructRequest(BaseModel):
    min_confidence: float = Field(0.70, ge=0.0, le=1.0)
    time_window_minutes: int = Field(60, ge=5, le=1440)
