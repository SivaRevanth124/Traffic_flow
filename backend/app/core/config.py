import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "TrafficFlow — City Traffic Intelligence Platform"
    TAGLINE: str = "Connecting cameras. Tracking vehicles. Discovering city-wide traffic patterns."
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "trafficflow-city-intelligence-secret-key-2026-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./trafficflow.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Storage
    UPLOAD_DIR: str = os.path.join(os.getcwd(), "data", "uploads")
    PROCESSED_DIR: str = os.path.join(os.getcwd(), "data", "processed")
    MODELS_DIR: str = os.path.join(os.getcwd(), "data", "models")
    
    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()

# Ensure critical directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
os.makedirs(settings.MODELS_DIR, exist_ok=True)
