from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.models.user import User
from backend.app.models.camera import Camera
from backend.app.models.alert import IncidentAlert
from backend.app.core.security import verify_password, get_password_hash

class AuthService:
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def authenticate(db: Session, username: str, password: str) -> Optional[User]:
        user = AuthService.get_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        return user

    @staticmethod
    def seed_initial_data(db: Session):
        """Seed initial administrative accounts and foundational camera network if database is empty."""
        # 1. Seed Users
        if db.query(User).count() == 0:
            admin = User(
                username="admin",
                email="admin@traffic.city.gov",
                full_name="TrafficFlow Administrator",
                hashed_password=get_password_hash("admin123"),
                role="administrator",
                is_active=True,
                is_superuser=True
            )
            operator = User(
                username="operator",
                email="operator@traffic.city.gov",
                full_name="Central Traffic Controller",
                hashed_password=get_password_hash("operator123"),
                role="operator",
                is_active=True,
                is_superuser=False
            )
            analyst = User(
                username="analyst",
                email="analyst@traffic.city.gov",
                full_name="Urban Transit Analyst",
                hashed_password=get_password_hash("analyst123"),
                role="analyst",
                is_active=True,
                is_superuser=False
            )
            db.add_all([admin, operator, analyst])
            db.commit()

        # 2. Seed Base Camera Network Topology
        if db.query(Camera).count() == 0:
            seed_cameras = [
                Camera(
                    camera_id="CAM-001",
                    name="Main St & 4th Ave Intersection",
                    location="Downtown Intersection Sector 1",
                    latitude=40.7128,
                    longitude=-74.0060,
                    camera_type="Fixed Dome",
                    camera_group="Downtown Core",
                    rtsp_url="rtsp://edge-cam01.traffic.local:554/live",
                    status="online",
                    fps=30,
                    resolution="1920x1080",
                    detection_active=True,
                    last_ping=datetime.now(timezone.utc)
                ),
                Camera(
                    camera_id="CAM-002",
                    name="Ring Road Northern Overpass",
                    location="Northern Arterial Highway KM 12",
                    latitude=40.7306,
                    longitude=-73.9352,
                    camera_type="Fixed ANPR",
                    camera_group="Highways",
                    rtsp_url="rtsp://edge-cam02.traffic.local:554/live",
                    status="online",
                    fps=25,
                    resolution="1920x1080",
                    detection_active=True,
                    last_ping=datetime.now(timezone.utc)
                ),
                Camera(
                    camera_id="CAM-003",
                    name="Commercial Harbor Toll Gate A",
                    location="Industrial Logistics Port Sector",
                    latitude=40.6892,
                    longitude=-74.0445,
                    camera_type="Fixed ANPR",
                    camera_group="Logistics",
                    rtsp_url="rtsp://edge-cam03.traffic.local:554/live",
                    status="online",
                    fps=30,
                    resolution="2560x1440",
                    detection_active=True,
                    last_ping=datetime.now(timezone.utc)
                ),
                Camera(
                    camera_id="CAM-004",
                    name="Airport Express Connector West",
                    location="Airport Express Highway Junction",
                    latitude=40.6413,
                    longitude=-73.7781,
                    camera_type="PTZ 360",
                    camera_group="Highways",
                    rtsp_url="rtsp://edge-cam04.traffic.local:554/live",
                    status="online",
                    fps=28,
                    resolution="1920x1080",
                    detection_active=True,
                    last_ping=datetime.now(timezone.utc)
                ),
                Camera(
                    camera_id="CAM-005",
                    name="City Hospital Emergency Access",
                    location="Hospital Trauma Center Corridor",
                    latitude=40.7420,
                    longitude=-73.9780,
                    camera_type="Fixed Thermal",
                    camera_group="Special Zones",
                    rtsp_url="rtsp://edge-cam05.traffic.local:554/live",
                    status="degraded",
                    fps=14,
                    resolution="1280x720",
                    detection_active=False,
                    last_ping=datetime.now(timezone.utc)
                ),
                Camera(
                    camera_id="CAM-006",
                    name="University Blvd Southbound",
                    location="University Campus South Crossing",
                    latitude=40.7290,
                    longitude=-73.9960,
                    camera_type="Fixed Dome",
                    camera_group="Downtown Core",
                    rtsp_url="rtsp://edge-cam06.traffic.local:554/live",
                    status="offline",
                    fps=0,
                    resolution="1920x1080",
                    detection_active=False,
                    last_error="Socket timeout 5000ms"
                ),
            ]
            db.add_all(seed_cameras)
            db.commit()

        # 3. Seed Initial Operational Alerts
        if db.query(IncidentAlert).count() == 0:
            seed_alerts = [
                IncidentAlert(
                    alert_id="ALT-1082",
                    category="High Traffic Density / Congestion",
                    severity="high",
                    title="Heavy Queue Forming on Northern Arterial",
                    description="Optical occupancy threshold exceeded (88%) on Northern Overpass.",
                    camera_id="CAM-002",
                    location="Ring Road Northern Overpass",
                    status="active",
                    assigned_operator="Unassigned"
                ),
                IncidentAlert(
                    alert_id="ALT-1081",
                    category="Camera Stream Offline",
                    severity="critical",
                    title="Stream Connection Lost",
                    description="Sensor heartbeat failed. Edge device unreachable on port 554.",
                    camera_id="CAM-006",
                    location="University Blvd Southbound",
                    status="active",
                    assigned_operator="Unassigned"
                )
            ]
            db.add_all(seed_alerts)
            db.commit()
