from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from datetime import datetime, timezone
from backend.app.database.session import Base

class VehicleDetection(Base):
    __tablename__ = "vehicle_detections"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. DET-0001
    video_id = Column(String(50), index=True, nullable=False)
    camera_id = Column(String(50), index=True, nullable=False)
    frame_number = Column(Integer, nullable=False, index=True)
    timestamp_seconds = Column(Float, nullable=False)
    timestamp_str = Column(String(30), nullable=False) # e.g. 00:01:24
    category = Column(String(30), nullable=False, index=True) # car, motorcycle, bus, truck
    confidence = Column(Float, nullable=False)
    bbox_x = Column(Float, nullable=False) # Normalized or pixel X
    bbox_y = Column(Float, nullable=False) # Normalized or pixel Y
    bbox_w = Column(Float, nullable=False) # Normalized or pixel Width
    bbox_h = Column(Float, nullable=False) # Normalized or pixel Height
    tracking_id = Column(Integer, nullable=True, index=True) # Linked in Phase 5 ByteTrack
    speed_kmh = Column(Float, nullable=True) # Estimated on calibrated cameras
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_detection_video_frame", "video_id", "frame_number"),
        Index("idx_detection_category", "category"),
    )
