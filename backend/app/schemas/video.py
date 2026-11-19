from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class VideoResponse(BaseModel):
    id: int
    video_id: str
    filename: str
    camera_id: str
    camera_name: Optional[str] = None
    duration_seconds: float
    total_frames: int
    fps: float
    resolution: str
    file_size_bytes: int
    status: str
    progress_pct: Optional[float] = 0.0
    current_step: Optional[str] = "Ready"
    detected_vehicles_count: Optional[int] = 0
    error_message: Optional[str] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class VideoProcessingStatus(BaseModel):
    video_id: str
    status: str
    progress_pct: float
    current_step: str
    total_frames: int
    detected_vehicles_count: int
    error_message: Optional[str] = None
