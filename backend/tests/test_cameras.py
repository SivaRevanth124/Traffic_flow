import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

@pytest.fixture
def auth_headers():
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_list_cameras():
    response = client.get("/api/v1/cameras")
    assert response.status_code == 200
    cameras = response.json()
    assert len(cameras) >= 6
    # Verify stream credentials masked
    for cam in cameras:
        assert "CAM-" in cam["camera_id"]
        if cam.get("rtsp_url_masked"):
            assert "@" not in cam["rtsp_url_masked"] or "***" in cam["rtsp_url_masked"]

def test_register_and_delete_camera(auth_headers):
    new_camera_data = {
        "camera_id": "CAM-TEST-99",
        "name": "Test Express Crossing",
        "location": "Sector 9 Test Highway",
        "latitude": 40.7500,
        "longitude": -73.9800,
        "camera_type": "PTZ",
        "camera_group": "Highways",
        "rtsp_url": "rtsp://user:secret@127.0.0.1:8554/test_feed",
        "fps": 30,
        "resolution": "1920x1080",
        "detection_active": True
    }
    # Create
    create_res = client.post("/api/v1/cameras", json=new_camera_data, headers=auth_headers)
    assert create_res.status_code == 201
    created_cam = create_res.json()
    assert created_cam["camera_id"] == "CAM-TEST-99"
    assert created_cam["rtsp_url_masked"] == "rtsp://***:***@127.0.0.1:8554/test_feed"

    # Test connection on unreachable endpoint (guarantees offline status)
    test_res = client.post("/api/v1/cameras/CAM-TEST-99/test", headers=auth_headers)
    assert test_res.status_code == 200
    test_data = test_res.json()
    assert test_data["camera_id"] == "CAM-TEST-99"
    assert test_data["is_reachable"] is False
    assert test_data["status"] == "offline"

    # Delete
    del_res = client.delete("/api/v1/cameras/CAM-TEST-99", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

def test_camera_live_stream_offline():
    """Verifies that offline sensors return 503 instead of pretending a stream is live."""
    res = client.get("/api/v1/cameras/CAM-006/live-stream")
    assert res.status_code == 503
    assert "offline" in res.json()["detail"].lower()

def test_camera_live_stream_online():
    """Verifies that online sensors with footage stream HTTP 206 bytes for HTML5 playback."""
    res = client.get("/api/v1/cameras/CAM-001/live-stream", headers={"Range": "bytes=0-1024"})
    assert res.status_code in (206, 200)
    assert "video/mp4" in res.headers.get("content-type", "")

