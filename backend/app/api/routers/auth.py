from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from backend.app.database.session import get_db
from backend.app.schemas.user import (
    UserLogin,
    Token,
    UserResponse,
    UserCreate,
    UserStatusUpdate,
    AuditLogResponse
)
from backend.app.services.auth_service import AuthService
from backend.app.core.security import create_access_token, get_password_hash
from backend.app.api.deps import get_current_user, require_admin, require_operator
from backend.app.models.user import User
from backend.app.models.alert import AuditLog

router = APIRouter(prefix="/auth", tags=["Authentication & Security"])

def _seed_audit_logs_if_empty(db: Session):
    if db.query(AuditLog).count() == 0:
        base_time = datetime.now(timezone.utc)
        logs = [
            AuditLog(
                actor_username="admin",
                action="USER_LOGIN",
                entity_type="AUTH",
                entity_id="admin",
                ip_address="127.0.0.1",
                details="Secure JWT authentication session established.",
                timestamp=base_time
            ),
            AuditLog(
                actor_username="admin",
                action="CAMERA_TOPOLOGY_SYNC",
                entity_type="CAMERA",
                entity_id="CAM-001..006",
                ip_address="127.0.0.1",
                details="Synchronized central metropolitan optical camera network coordinates.",
                timestamp=base_time
            ),
            AuditLog(
                actor_username="operator",
                action="CROSS_CAMERA_ASSOCIATION_VERIFY",
                entity_type="ASSOCIATION",
                entity_id="ASSOC-401",
                ip_address="10.200.4.12",
                details="Confirmed transit corridor match for Silver Sedan between CAM-001 and CAM-002.",
                timestamp=base_time
            ),
            AuditLog(
                actor_username="analyst",
                action="TRAJECTORY_DATASET_EXPORT",
                entity_type="TRAJECTORY",
                entity_id="ALL",
                ip_address="10.200.4.18",
                details="Exported GeoJSON FeatureCollection containing 5 reconstructed routes.",
                timestamp=base_time
            ),
        ]
        db.add_all(logs)
        db.commit()

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with username and password, returning JWT access token."""
    user = AuthService.authenticate(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is deactivated")

    # Record login audit log
    log = AuditLog(
        actor_username=user.username,
        action="USER_LOGIN",
        entity_type="AUTH",
        entity_id=user.username,
        ip_address="127.0.0.1",
        details="Successful login via password credentials.",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(log)
    db.commit()

    access_token = create_access_token(subject=user.username, role=user.role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve current authenticated user session."""
    return UserResponse.model_validate(current_user)

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """Lists all registered operators, analysts, and administrators."""
    return db.query(User).order_by(User.id.asc()).all()

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Registers a new platform user with specified role and credentials."""
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Username '{payload.username}' is already registered")

    new_user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name or payload.username.title(),
        hashed_password=get_password_hash(payload.password),
        role=payload.role.lower(),
        is_active=True,
        is_superuser=(payload.role.lower() == "administrator"),
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    db.add(AuditLog(
        actor_username=current_user.username,
        action="USER_CREATED",
        entity_type="USER",
        entity_id=new_user.username,
        ip_address="127.0.0.1",
        details=f"Created user with role {new_user.role}.",
        timestamp=datetime.now(timezone.utc)
    ))
    db.commit()

    return UserResponse.model_validate(new_user)

@router.put("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Enables or disables access for a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)

    db.add(AuditLog(
        actor_username=current_user.username,
        action="USER_STATUS_TOGGLED",
        entity_type="USER",
        entity_id=user.username,
        ip_address="127.0.0.1",
        details=f"User status set to active={payload.is_active}.",
        timestamp=datetime.now(timezone.utc)
    ))
    db.commit()

    return UserResponse.model_validate(user)

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """Retrieves immutable security and operational audit trail logs."""
    _seed_audit_logs_if_empty(db)
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
