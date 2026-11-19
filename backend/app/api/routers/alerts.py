from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from backend.app.database.session import get_db
from backend.app.models.alert import IncidentAlert
from backend.app.schemas.alert import AlertCreate, AlertUpdate, AlertResponse
from backend.app.api.deps import require_operator, get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/alerts", tags=["Incident & Anomaly Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity: critical, high, medium, low"),
    status: Optional[str] = Query(None, description="Filter by status: active, under_review, resolved"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve decision-support alerts for traffic control dispatchers."""
    query = db.query(IncidentAlert)
    if severity and severity != "all":
        query = query.filter(IncidentAlert.severity == severity)
    if status and status != "all":
        query = query.filter(IncidentAlert.status == status)
    return query.order_by(IncidentAlert.created_at.desc()).limit(limit).all()

@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    data: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """Generate a candidate incident alert (system or operator triggered)."""
    count = db.query(IncidentAlert).count()
    alert_id = data.alert_id or f"ALT-{1083 + count}"
    
    alert = IncidentAlert(
        alert_id=alert_id,
        category=data.category,
        severity=data.severity,
        title=data.title,
        description=data.description,
        camera_id=data.camera_id,
        location=data.location,
        status="active",
        assigned_operator="Unassigned",
        created_at=datetime.now(timezone.utc)
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

@router.put("/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: str,
    data: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """
    Update alert operational status (Acknowledge, Assign, Resolve, Add operator notes).
    Decision-support alerts require explicit human operator confirmation.
    """
    alert = db.query(IncidentAlert).filter(IncidentAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")

    if data.status:
        alert.status = data.status
        if data.status == "resolved":
            alert.resolved_at = datetime.now(timezone.utc)
    if data.assigned_operator:
        alert.assigned_operator = data.assigned_operator
    if data.resolution_notes:
        alert.resolution_notes = data.resolution_notes

    db.commit()
    db.refresh(alert)
    return alert
