import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import get_password_hash, verify_password, mask_stream_url

client = TestClient(app)

def test_password_hashing():
    pw = "SecretTrafficPassword2026"
    hashed = get_password_hash(pw)
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_mask_stream_url():
    raw_url = "rtsp://traffic_admin:SecurePass99@10.200.1.45:554/live"
    masked = mask_stream_url(raw_url)
    assert masked == "rtsp://***:***@10.200.1.45:554/live"
    assert "SecurePass99" not in masked

def test_auth_login_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "administrator"

def test_auth_login_invalid_password():
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "incorrect_password"}
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]
