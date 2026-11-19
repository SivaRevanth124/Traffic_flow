import os
import io
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

@pytest.fixture
def auth_headers():
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_video_bytes():
    """Create a 30-frame synthetic test video file in memory."""
    temp_file = "temp_synthetic_traffic.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_file, fourcc, 30.0, (320, 240))
    for i in range(30):
        # Frame with moving white rectangle simulating a vehicle
        frame = np.zeros((240, 320, 3), dtype=np.uint8)
        x = 20 + i * 5
        cv2.rectangle(frame, (x, 100), (x + 40, 140), (255, 255, 255), -1)
        out.write(frame)
    out.release()

    with open(temp_file, "rb") as f:
        data = f.read()
    os.remove(temp_file)
    return data

def test_video_upload_and_lifecycle(auth_headers, sample_video_bytes):
    # 1. Upload
    files = {"file": ("synthetic_corridor.mp4", sample_video_bytes, "video/mp4")}
    data = {"camera_id": "CAM-001", "frame_stride": "2"}

    res = client.post("/api/v1/videos/upload", files=files, data=data, headers=auth_headers)
    assert res.status_code == 201
    video_data = res.json()
    video_id = video_data["video_id"]
    assert video_data["filename"] == "synthetic_corridor.mp4"
    assert video_data["camera_id"] == "CAM-001"
    assert video_data["total_frames"] == 30
    assert video_data["fps"] == 30.0
    assert video_data["duration_seconds"] == 1.0
    assert video_data["resolution"] == "320x240"
    assert video_data["status"] in ["pending", "processing", "completed"]

    # 2. List
    list_res = client.get("/api/v1/videos")
    assert list_res.status_code == 200
    vids = list_res.json()
    assert any(v["video_id"] == video_id for v in vids)

    # 3. Stream with Range Request (Scrubbing / Seeking)
    stream_res = client.get(
        f"/api/v1/videos/{video_id}/stream",
        headers={"Range": "bytes=0-499"}
    )
    assert stream_res.status_code == 206
    assert stream_res.headers["Accept-Ranges"] == "bytes"
    assert stream_res.headers["Content-Length"] == "500"
    assert "bytes 0-499/" in stream_res.headers["Content-Range"]

    # 4. Reprocess
    reprocess_res = client.post(
        f"/api/v1/videos/{video_id}/reprocess",
        data={"frame_stride": "1"},
        headers=auth_headers
    )
    assert reprocess_res.status_code == 200
    assert reprocess_res.json()["video_id"] == video_id

    # 5. Delete
    del_res = client.delete(f"/api/v1/videos/{video_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Verify deleted
    get_res = client.get(f"/api/v1/videos/{video_id}")
    assert get_res.status_code == 404
