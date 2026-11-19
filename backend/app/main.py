from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.database.session import engine, Base, SessionLocal
from backend.app.services.auth_service import AuthService
from backend.app.tracking.cross_camera import CrossCameraAssociationEngine
from backend.app.services.trajectory_service import TrajectoryService
from backend.app.api.routers import auth, cameras, dashboard, alerts, websocket, videos, detection, tracking, trajectories, clustering, analytics

# Ensure tables and seed data are initialized
Base.metadata.create_all(bind=engine)
_db = SessionLocal()
try:
    AuthService.seed_initial_data(_db)
    CrossCameraAssociationEngine.seed_initial_associations(_db)
    TrajectoryService.seed_initial_trajectories(_db)
finally:
    _db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="City-Wide Vehicle Trajectory Clustering & Traffic Intelligence Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins including localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(cameras.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(videos.router, prefix=settings.API_V1_STR)
app.include_router(detection.router, prefix=settings.API_V1_STR)
app.include_router(tracking.router, prefix=settings.API_V1_STR)
app.include_router(trajectories.router, prefix=settings.API_V1_STR)
app.include_router(clustering.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(websocket.router)

@app.get("/health", tags=["Health"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "database": "connected (SQLite/SQLAlchemy)",
        "gateway": "ready"
    }

@app.get(settings.API_V1_STR, tags=["Metadata"])
def api_metadata():
    """API version metadata."""
    return {
        "version": "v1",
        "project": "TrafficFlow",
        "description": "City Traffic Intelligence & Vehicle Trajectory Platform",
        "docs_url": "/docs"
    }
