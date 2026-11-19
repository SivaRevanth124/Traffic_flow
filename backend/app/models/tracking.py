from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, Index
from datetime import datetime, timezone
from backend.app.database.session import Base

class Tracklet(Base):
    __tablename__ = "tracklets"

    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(Integer, nullable=False, index=True) # Intra-camera tracking ID (isolated per camera)
    video_id = Column(String(50), nullable=False, index=True)
    camera_id = Column(String(50), nullable=False, index=True)
    category = Column(String(30), nullable=False, index=True) # car, motorcycle, bus, truck
    start_frame = Column(Integer, nullable=False)
    end_frame = Column(Integer, nullable=False)
    start_time_sec = Column(Float, nullable=False)
    end_time_sec = Column(Float, nullable=False)
    duration_sec = Column(Float, nullable=False)
    total_detections = Column(Integer, nullable=False, default=1)
    avg_confidence = Column(Float, nullable=False)
    trajectory_points = Column(Text, nullable=False, default="[]") # JSON list of [frame, time_sec, cx, cy, w, h]
    avg_speed_kmh = Column(Float, nullable=True)
    primary_direction = Column(String(50), nullable=True) # e.g. Northbound, Southbound
    appearance_color = Column(String(50), nullable=True) # Dominant color heuristic
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_tracklet_video_track", "video_id", "track_id"),
        Index("idx_tracklet_camera", "camera_id"),
    )


class CrossCameraAssociation(Base):
    __tablename__ = "cross_camera_associations"

    id = Column(Integer, primary_key=True, index=True)
    association_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. ASSOC-401
    source_camera_id = Column(String(50), nullable=False, index=True)
    source_track_id = Column(Integer, nullable=False)
    source_video_id = Column(String(50), nullable=True)
    source_time_str = Column(String(30), nullable=False)
    dest_camera_id = Column(String(50), nullable=False, index=True)
    dest_track_id = Column(Integer, nullable=False)
    dest_video_id = Column(String(50), nullable=True)
    dest_time_str = Column(String(30), nullable=False)
    vehicle_category = Column(String(30), nullable=False)
    vehicle_description = Column(String(100), nullable=False)
    travel_time_seconds = Column(Float, nullable=False)
    travel_time_str = Column(String(30), nullable=False) # e.g. 8m 13s
    expected_min_seconds = Column(Float, nullable=False)
    expected_max_seconds = Column(Float, nullable=False)
    expected_transit_str = Column(String(30), nullable=False) # e.g. 7m - 10m
    distance_meters = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False) # 0.00 to 1.00
    appearance_similarity = Column(Float, nullable=False) # cosine/histogram similarity
    topology_valid = Column(Boolean, nullable=False, default=True)
    status = Column(String(30), nullable=False, default="review_required") # verified, review_required, rejected
    reviewed_by = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_assoc_source_dest", "source_camera_id", "dest_camera_id"),
        Index("idx_assoc_status", "status"),
    )
