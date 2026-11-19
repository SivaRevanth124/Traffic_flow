from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class CameraBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Main St & 4th Ave Intersection"})
    location: str = Field(..., json_schema_extra={"example": "Downtown Intersection Sector 1"})
    latitude: float = Field(..., json_schema_extra={"example": 40.7128})
    longitude: float = Field(..., json_schema_extra={"example": -74.0060})
    camera_type: str = Field("Fixed Dome", json_schema_extra={"example": "Fixed Dome"})
    camera_group: str = Field("Downtown Core", json_schema_extra={"example": "Downtown Core"})
    fps: int = Field(30, ge=0, le=120)
    resolution: str = Field("1920x1080", json_schema_extra={"example": "1920x1080"})
    detection_active: bool = True

class CameraCreate(CameraBase):
    camera_id: str = Field(..., json_schema_extra={"example": "CAM-001"})
    rtsp_url: Optional[str] = Field(None, json_schema_extra={"example": "rtsp://edge-cam01.local:554/live"})

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    camera_type: Optional[str] = None
    camera_group: Optional[str] = None
    rtsp_url: Optional[str] = None
    fps: Optional[int] = None
    resolution: Optional[str] = None
    detection_active: Optional[bool] = None
    status: Optional[str] = None

class CameraResponse(CameraBase):
    id: int
    camera_id: str
    status: str
    rtsp_url_masked: Optional[str] = None
    last_ping: Optional[datetime] = None
    last_error: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CameraTestResult(BaseModel):
    camera_id: str
    status: str # online, offline, degraded
    is_reachable: bool
    latency_ms: Optional[float] = None
    fps_measured: Optional[float] = None
    resolution: Optional[str] = None
    error_message: Optional[str] = None
    tested_at: datetime

class CameraHealthHistoryResponse(BaseModel):
    id: int
    camera_id: int
    status: str
    ping_ms: Optional[float] = None
    fps_measured: Optional[float] = None
    error_message: Optional[str] = None
    checked_at: datetime

    model_config = ConfigDict(from_attributes=True)
