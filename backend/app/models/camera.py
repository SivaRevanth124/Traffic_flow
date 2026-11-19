from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.database.session import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. CAM-001
    name = Column(String(150), nullable=False) # e.g. Main St & 4th Ave Intersection
    location = Column(String(255), nullable=False) # Descriptive location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    camera_type = Column(String(50), default="Fixed Dome", nullable=False) # Fixed, PTZ, Dome, Thermal, ANPR
    camera_group = Column(String(100), default="Downtown Core", nullable=False)
    rtsp_url = Column(String(500), nullable=True) # Protected stream URI
    status = Column(String(30), default="testing", nullable=False) # online, offline, degraded, testing
    fps = Column(Integer, default=30)
    resolution = Column(String(30), default="1920x1080")
    detection_active = Column(Boolean, default=True)
    last_ping = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    health_records = relationship("CameraHealthHistory", back_populates="camera", cascade="all, delete-orphan")

class CameraHealthHistory(Base):
    __tablename__ = "camera_health_history"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    status = Column(String(30), nullable=False)
    ping_ms = Column(Float, nullable=True)
    fps_measured = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    camera = relationship("Camera", back_populates="health_records")
