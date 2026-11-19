from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime, timezone
from backend.app.database.session import Base

class IncidentAlert(Base):
    __tablename__ = "incident_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. ALT-1082
    category = Column(String(100), nullable=False) # Camera offline, Congestion, Stopped vehicle, etc.
    severity = Column(String(30), default="medium", nullable=False) # critical, high, medium, low
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    camera_id = Column(String(50), nullable=False)
    location = Column(String(255), nullable=False)
    status = Column(String(30), default="active", nullable=False) # active, under_review, resolved, dismissed
    assigned_operator = Column(String(100), default="Unassigned")
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_username = Column(String(50), nullable=False)
    action = Column(String(200), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(50), nullable=True)
    ip_address = Column(String(45), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
