from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Index
from datetime import datetime, timezone
from backend.app.database.session import Base

class Trajectory(Base):
    __tablename__ = "trajectories"

    id = Column(Integer, primary_key=True, index=True)
    trajectory_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. TRJ-801
    vehicle_category = Column(String(30), nullable=False, index=True) # car, motorcycle, bus, truck
    vehicle_description = Column(String(100), nullable=False)
    camera_sequence = Column(Text, nullable=False) # JSON list e.g. ["CAM-001", "CAM-002"]
    camera_names = Column(Text, nullable=False) # JSON list e.g. ["Main St", "Ring Road North"]
    start_timestamp = Column(DateTime, nullable=False)
    end_timestamp = Column(DateTime, nullable=False)
    start_time_str = Column(String(30), nullable=False)
    end_time_str = Column(String(30), nullable=False)
    duration_seconds = Column(Float, nullable=False)
    duration_str = Column(String(30), nullable=False) # e.g. 14m 13s
    total_observations = Column(Integer, nullable=False, default=1)
    distance_km = Column(Float, nullable=False, default=0.0)
    confidence_score = Column(Float, nullable=False, default=0.85) # 0.0 - 1.0
    cluster_label = Column(String(100), nullable=False, default="Unassigned")
    cluster_id = Column(Integer, nullable=False, default=-1, index=True) # -1 for unclustered/noise
    geojson_path = Column(Text, nullable=False, default="{}") # GeoJSON LineString
    observations_json = Column(Text, nullable=False, default="[]") # Detailed observations
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_trajectory_category", "vehicle_category"),
        Index("idx_trajectory_cluster", "cluster_id"),
    )
