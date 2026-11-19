from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AlertBase(BaseModel):
    category: str
    severity: str = "medium"
    title: str
    description: str
    camera_id: str
    location: str

class AlertCreate(AlertBase):
    alert_id: Optional[str] = None

class AlertUpdate(BaseModel):
    status: Optional[str] = None # active, under_review, resolved, dismissed
    assigned_operator: Optional[str] = None
    resolution_notes: Optional[str] = None

class AlertResponse(AlertBase):
    id: int
    alert_id: str
    status: str
    assigned_operator: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class DashboardStats(BaseModel):
    registered_cameras: int
    online_cameras: int
    offline_cameras: int
    degraded_cameras: int
    total_detections_today: int
    active_tracking_sessions: int
    active_alerts: int
    congestion_index: int
    processing_jobs: int
    system_status: str
