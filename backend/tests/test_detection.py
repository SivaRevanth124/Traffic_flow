import os
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
def synthetic_traffic_video():
    """Create a 30-frame synthetic traffic video with distinct moving vehicle rectangles."""
    filepath = "temp_detection_test.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(filepath, fourcc, 30.0, (640, 360))
    for i in range(30):
        frame = np.full((360, 640, 3), (25, 20, 15), dtype=np.uint8)
        # Road lane
        cv2.line(frame, (0, 180), (640, 180), (80, 80, 80), 2)
        # Simulated Car 1
        x1 = 40 + i * 8
        cv2.rectangle(frame, (x1, 130), (x1 + 60, 170), (220, 180, 40), -1)
        # Simulated Truck 2
        x2 = 500 - i * 6
        cv2.rectangle(frame, (x2, 200), (x2 + 90, 260), (60, 140, 240), -1)
        out.write(frame)
    out.release()

    with open(filepath, "rb") as f:
        data = f.read()
    os.remove(filepath)
    return data

def test_vehicle_detection_pipeline(auth_headers, synthetic_traffic_video):
    # 1. Upload video
    files = {"file": ("detection_test.mp4", synthetic_traffic_video, "video/mp4")}
    data = {"camera_id": "CAM-001", "frame_stride": "2"}
    upload_res = client.post("/api/v1/videos/upload", files=files, data=data, headers=auth_headers)
    assert upload_res.status_code == 201
    video_id = upload_res.json()["video_id"]

    # 2. Run Vehicle Detection
    process_res = client.post(
        f"/api/v1/detection/process/{video_id}",
        json={"confidence_threshold": 0.40, "frame_stride": 2, "model_name": "yolov8n"}
    )
    assert process_res.status_code == 200
    summary = process_res.json()
    assert summary["video_id"] == video_id
    assert summary["total_detections"] > 0
    assert summary["annotated_video_available"] is True
    assert len(summary["categories"]) > 0

    # 3. Query individual observations
    dets_res = client.get(f"/api/v1/detection/videos/{video_id}")
    assert dets_res.status_code == 200
    dets = dets_res.json()
    assert len(dets) > 0
    sample_det = dets[0]
    assert "DET-" in sample_det["detection_id"]
    assert sample_det["category"] in ["car", "motorcycle", "bus", "truck"]
    assert sample_det["confidence"] >= 0.40
    assert sample_det["bbox_w"] > 0
    assert sample_det["bbox_h"] > 0

    # 4. Filter by vehicle class
    filter_res = client.get(f"/api/v1/detection/videos/{video_id}?category=car")
    assert filter_res.status_code == 200
    for d in filter_res.json():
        assert d["category"] == "car"

    # 5. Summary Endpoint
    sum_res = client.get(f"/api/v1/detection/videos/{video_id}/summary")
    assert sum_res.status_code == 200
    assert sum_res.json()["total_detections"] == summary["total_detections"]

    # 6. Stream Annotated Video with Overlays
    stream_res = client.get(
        f"/api/v1/detection/videos/{video_id}/annotated",
        headers={"Range": "bytes=0-999"}
    )
    assert stream_res.status_code == 206
    assert stream_res.headers["Accept-Ranges"] == "bytes"
    assert "bytes 0-999/" in stream_res.headers["Content-Range"]

    # 7. Cleanup
    client.delete(f"/api/v1/videos/{video_id}", headers=auth_headers)
