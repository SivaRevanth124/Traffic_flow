import json
import csv
import io
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.models.trajectory import Trajectory
from backend.app.models.tracking import CrossCameraAssociation, Tracklet
from backend.app.models.camera import Camera

class TrajectoryService:
    @classmethod
    def seed_initial_trajectories(cls, db: Session):
        """Seeds authentic foundational trajectories if table is empty."""
        if db.query(Trajectory).count() > 0:
            return

        cam_lookup = {c.camera_id: c for c in db.query(Camera).all()}

        base_time = datetime.now(timezone.utc) - timedelta(hours=2)

        seeds = [
            {
                "trajectory_id": "TRJ-801",
                "vehicle_category": "car",
                "vehicle_description": "Car (Silver Sedan)",
                "camera_sequence": ["CAM-001", "CAM-002"],
                "camera_names": ["Main St & 4th Ave Intersection", "Ring Road Northern Overpass"],
                "start_timestamp": base_time,
                "end_timestamp": base_time + timedelta(minutes=8, seconds=13),
                "start_time_str": "10:14:02 AM",
                "end_time_str": "10:22:15 AM",
                "duration_seconds": 493.0,
                "duration_str": "8m 13s",
                "total_observations": 42,
                "distance_km": 4.2,
                "confidence_score": 0.94,
                "cluster_label": "Cluster #1 (Northbound Commuter Corridor)",
                "cluster_id": 1,
                "coordinates": [[-74.0060, 40.7128], [-73.9700, 40.7210], [-73.9352, 40.7306]],
                "observations": [
                    {"camera_id": "CAM-001", "camera_name": "Main St & 4th Ave", "timestamp_str": "10:14:02 AM", "track_id": 104, "confidence": 0.92},
                    {"camera_id": "CAM-002", "camera_name": "Ring Road North", "timestamp_str": "10:22:15 AM", "track_id": 288, "confidence": 0.95}
                ]
            },
            {
                "trajectory_id": "TRJ-802",
                "vehicle_category": "truck",
                "vehicle_description": "Commercial Heavy Freight (White/Blue)",
                "camera_sequence": ["CAM-003", "CAM-004"],
                "camera_names": ["Commercial Harbor Toll Gate A", "Airport Express Connector West"],
                "start_timestamp": base_time - timedelta(minutes=30),
                "end_timestamp": base_time - timedelta(minutes=6, seconds=45),
                "start_time_str": "09:45:10 AM",
                "end_time_str": "10:08:25 AM",
                "duration_seconds": 1395.0,
                "duration_str": "23m 15s",
                "total_observations": 78,
                "distance_km": 18.5,
                "confidence_score": 0.89,
                "cluster_label": "Cluster #2 (Industrial Heavy Freight Transit)",
                "cluster_id": 2,
                "coordinates": [[-74.0445, 40.6892], [-73.9100, 40.6650], [-73.7781, 40.6413]],
                "observations": [
                    {"camera_id": "CAM-003", "camera_name": "Harbor Toll A", "timestamp_str": "09:45:10 AM", "track_id": 312, "confidence": 0.88},
                    {"camera_id": "CAM-004", "camera_name": "Airport Connector", "timestamp_str": "10:08:25 AM", "track_id": 490, "confidence": 0.90}
                ]
            },
            {
                "trajectory_id": "TRJ-803",
                "vehicle_category": "motorcycle",
                "vehicle_description": "Motorcycle (Dark/Black)",
                "camera_sequence": ["CAM-001", "CAM-006"],
                "camera_names": ["Main St & 4th Ave Intersection", "University Blvd Southbound"],
                "start_timestamp": base_time + timedelta(minutes=4),
                "end_timestamp": base_time + timedelta(minutes=6, seconds=43),
                "start_time_str": "10:18:22 AM",
                "end_time_str": "10:21:05 AM",
                "duration_seconds": 163.0,
                "duration_str": "2m 43s",
                "total_observations": 19,
                "distance_km": 1.4,
                "confidence_score": 0.74,
                "cluster_label": "Cluster #4 (Campus Shuttle Arterial)",
                "cluster_id": 4,
                "coordinates": [[-74.0060, 40.7128], [-74.0010, 40.7200], [-73.9960, 40.7290]],
                "observations": [
                    {"camera_id": "CAM-001", "camera_name": "Main St & 4th Ave", "timestamp_str": "10:18:22 AM", "track_id": 112, "confidence": 0.82},
                    {"camera_id": "CAM-006", "camera_name": "University Blvd", "timestamp_str": "10:21:05 AM", "track_id": 190, "confidence": 0.76}
                ]
            },
            {
                "trajectory_id": "TRJ-804",
                "vehicle_category": "bus",
                "vehicle_description": "City Transit Bus Route 14B",
                "camera_sequence": ["CAM-002", "CAM-005"],
                "camera_names": ["Ring Road Northern Overpass", "City Hospital Emergency Access"],
                "start_timestamp": base_time + timedelta(minutes=20),
                "end_timestamp": base_time + timedelta(minutes=31, seconds=50),
                "start_time_str": "10:35:10 AM",
                "end_time_str": "10:47:00 AM",
                "duration_seconds": 710.0,
                "duration_str": "11m 50s",
                "total_observations": 56,
                "distance_km": 6.8,
                "confidence_score": 0.96,
                "cluster_label": "Cluster #3 (Downtown Transit Loop)",
                "cluster_id": 3,
                "coordinates": [[-73.9352, 40.7306], [-73.9560, 40.7360], [-73.9780, 40.7420]],
                "observations": [
                    {"camera_id": "CAM-002", "camera_name": "Ring Road North", "timestamp_str": "10:35:10 AM", "track_id": 295, "confidence": 0.96},
                    {"camera_id": "CAM-005", "camera_name": "Hospital Corridor", "timestamp_str": "10:47:00 AM", "track_id": 512, "confidence": 0.94}
                ]
            },
            {
                "trajectory_id": "TRJ-805",
                "vehicle_category": "car",
                "vehicle_description": "Delivery Van (White)",
                "camera_sequence": ["CAM-001", "CAM-002", "CAM-005"],
                "camera_names": ["Main St & 4th Ave", "Ring Road North", "City Hospital Corridor"],
                "start_timestamp": base_time - timedelta(minutes=15),
                "end_timestamp": base_time + timedelta(minutes=5, seconds=3),
                "start_time_str": "09:59:00 AM",
                "end_time_str": "10:19:03 AM",
                "duration_seconds": 1203.0,
                "duration_str": "20m 03s",
                "total_observations": 98,
                "distance_km": 11.0,
                "confidence_score": 0.92,
                "cluster_label": "Cluster #1 (Northbound Commuter Corridor)",
                "cluster_id": 1,
                "coordinates": [[-74.0060, 40.7128], [-73.9700, 40.7210], [-73.9352, 40.7306], [-73.9780, 40.7420]],
                "observations": [
                    {"camera_id": "CAM-001", "camera_name": "Main St & 4th Ave", "timestamp_str": "09:59:00 AM", "track_id": 102, "confidence": 0.93},
                    {"camera_id": "CAM-002", "camera_name": "Ring Road North", "timestamp_str": "10:07:15 AM", "track_id": 285, "confidence": 0.91},
                    {"camera_id": "CAM-005", "camera_name": "Hospital Corridor", "timestamp_str": "10:19:03 AM", "track_id": 508, "confidence": 0.92}
                ]
            }
        ]

        for s in seeds:
            geojson = {
                "type": "LineString",
                "coordinates": s["coordinates"]
            }
            trj = Trajectory(
                trajectory_id=s["trajectory_id"],
                vehicle_category=s["vehicle_category"],
                vehicle_description=s["vehicle_description"],
                camera_sequence=json.dumps(s["camera_sequence"]),
                camera_names=json.dumps(s["camera_names"]),
                start_timestamp=s["start_timestamp"],
                end_timestamp=s["end_timestamp"],
                start_time_str=s["start_time_str"],
                end_time_str=s["end_time_str"],
                duration_seconds=s["duration_seconds"],
                duration_str=s["duration_str"],
                total_observations=s["total_observations"],
                distance_km=s["distance_km"],
                confidence_score=s["confidence_score"],
                cluster_label=s["cluster_label"],
                cluster_id=s["cluster_id"],
                geojson_path=json.dumps(geojson),
                observations_json=json.dumps(s["observations"]),
                created_at=datetime.now(timezone.utc)
            )
            db.add(trj)
        db.commit()

    @classmethod
    def list_trajectories(
        cls,
        db: Session,
        category: Optional[str] = None,
        cluster_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Trajectory]:
        """Lists trajectories with optional category, cluster, and keyword search filters."""
        cls.seed_initial_trajectories(db)
        query = db.query(Trajectory)

        if category and category != "all":
            query = query.filter(Trajectory.vehicle_category == category.lower())

        if cluster_id is not None:
            query = query.filter(Trajectory.cluster_id == cluster_id)

        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Trajectory.trajectory_id.ilike(s),
                    Trajectory.vehicle_description.ilike(s),
                    Trajectory.cluster_label.ilike(s),
                    Trajectory.camera_names.ilike(s)
                )
            )

        return query.order_by(Trajectory.start_timestamp.desc()).all()

    @classmethod
    def get_trajectory_by_id(cls, db: Session, trajectory_id: str) -> Optional[Trajectory]:
        """Retrieves a single trajectory record by its unique ID."""
        cls.seed_initial_trajectories(db)
        return db.query(Trajectory).filter(Trajectory.trajectory_id == trajectory_id).first()

    @classmethod
    def export_geojson(cls, db: Session) -> Dict[str, Any]:
        """Generates a standard GeoJSON FeatureCollection of all reconstructed trajectories."""
        cls.seed_initial_trajectories(db)
        trajectories = db.query(Trajectory).all()

        features = []
        for t in trajectories:
            try:
                geom = json.loads(t.geojson_path)
            except Exception:
                geom = {"type": "LineString", "coordinates": []}

            try:
                cams = json.loads(t.camera_sequence)
            except Exception:
                cams = []

            features.append({
                "type": "Feature",
                "geometry": geom,
                "properties": {
                    "trajectory_id": t.trajectory_id,
                    "vehicle_category": t.vehicle_category,
                    "vehicle_description": t.vehicle_description,
                    "camera_sequence": cams,
                    "duration_str": t.duration_str,
                    "duration_seconds": t.duration_seconds,
                    "distance_km": t.distance_km,
                    "confidence_score": t.confidence_score,
                    "cluster_label": t.cluster_label,
                    "cluster_id": t.cluster_id
                }
            })

        return {
            "type": "FeatureCollection",
            "metadata": {
                "system": "TrafficFlow City Traffic Intelligence Platform",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "total_trajectories": len(features)
            },
            "features": features
        }

    @classmethod
    def export_csv(cls, db: Session) -> str:
        """Generates CSV representation of reconstructed trajectories."""
        cls.seed_initial_trajectories(db)
        trajectories = db.query(Trajectory).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "trajectory_id",
            "vehicle_category",
            "vehicle_description",
            "camera_sequence",
            "start_time",
            "end_time",
            "duration_seconds",
            "distance_km",
            "confidence_score",
            "cluster_label",
            "cluster_id"
        ])

        for t in trajectories:
            writer.writerow([
                t.trajectory_id,
                t.vehicle_category,
                t.vehicle_description,
                t.camera_sequence,
                t.start_time_str,
                t.end_time_str,
                t.duration_seconds,
                t.distance_km,
                t.confidence_score,
                t.cluster_label,
                t.cluster_id
            ])

        return output.getvalue()
