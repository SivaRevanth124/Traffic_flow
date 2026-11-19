from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime, timezone
from backend.app.database.session import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. VID-2026-001
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    camera_id = Column(String(50), nullable=False, index=True)
    camera_name = Column(String(150), nullable=True)
    duration_seconds = Column(Float, default=0.0)
    total_frames = Column(Integer, default=0)
    fps = Column(Float, default=30.0)
    resolution = Column(String(30), default="1920x1080")
    file_size_bytes = Column(Integer, default=0)
    status = Column(String(30), default="pending", nullable=False) # pending, processing, completed, failed
    progress_pct = Column(Float, default=0.0)
    current_step = Column(String(100), default="Uploaded & Validated")
    detected_vehicles_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime, nullable=True)
