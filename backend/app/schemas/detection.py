from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict
from datetime import datetime

class DetectionResponse(BaseModel):
    id: int
    detection_id: str
    video_id: str
    camera_id: str
    frame_number: int
    timestamp_seconds: float
    timestamp_str: str
    category: str
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float
    tracking_id: Optional[int] = None
    speed_kmh: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DetectionCategoryCount(BaseModel):
    category: str
    count: int
    percentage: float
    color: str

class DetectionSummaryResponse(BaseModel):
    video_id: str
    camera_id: str
    total_detections: int
    total_frames_analyzed: int
    fps: float
    average_confidence: float
    categories: List[DetectionCategoryCount]
    processed_at: datetime
    annotated_video_available: bool

class DetectionProcessRequest(BaseModel):
    confidence_threshold: float = Field(0.40, ge=0.1, le=0.99)
    frame_stride: int = Field(2, ge=1, le=10)
    model_name: str = Field("yolov8n", example="yolov8n")
