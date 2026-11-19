import pytest
import numpy as np
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database.session import SessionLocal, Base, engine
from backend.app.models.tracking import Tracklet, CrossCameraAssociation
from backend.app.models.camera import Camera
from backend.app.tracking.bytetrack import KalmanFilter, ByteTracker, STrack
from backend.app.tracking.cross_camera import CrossCameraAssociationEngine
from backend.app.services.auth_service import AuthService

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_header():
    """Provides valid JWT Bearer token for protected tracking endpoints."""
    db = SessionLocal()
    AuthService.seed_initial_data(db)
    CrossCameraAssociationEngine.seed_initial_associations(db)
    db.close()

    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_kalman_filter_state_cycle():
    """Verifies Kalman filter state initialization, prediction and measurement update."""
    kf = KalmanFilter()
    measurement = np.array([100.0, 150.0, 1.25, 40.0]) # [cx, cy, a, h]
    mean, cov = kf.initiate(measurement)

    assert mean.shape == (8,)
    assert cov.shape == (8, 8)
    assert np.isclose(mean[0], 100.0)
    assert np.isclose(mean[1], 150.0)

    # Predict
    pred_mean, pred_cov = kf.predict(mean, cov)
    assert pred_mean.shape == (8,)

    # Update with shifted measurement
    next_meas = np.array([105.0, 152.0, 1.25, 40.0])
    upd_mean, upd_cov = kf.update(pred_mean, pred_cov, next_meas)
    assert upd_mean[0] > 100.0

def test_bytetrack_trajectory_continuity():
    """Verifies ByteTrack maintains a consistent track ID across successive video frames."""
    tracker = ByteTracker(track_thresh=0.40, match_thresh=0.75, low_thresh=0.15)
    STrack.reset_counter(100)

    # Simulate a car moving along X axis across 5 frames
    track_ids_observed = []
    for f in range(5):
        dets = [{
            "x": 200.0 + (f * 10.0),
            "y": 300.0 + (f * 2.0),
            "w": 60.0,
            "h": 40.0,
            "confidence": 0.88,
            "category": "car"
        }]
        active_tracks = tracker.update(dets, f)
        assert len(active_tracks) == 1
        track_ids_observed.append(active_tracks[0].track_id)

    # All 5 frames must share the exact same track_id
    assert len(set(track_ids_observed)) == 1
    assert track_ids_observed[0] == 101

def test_bytetrack_low_confidence_two_stage_recovery():
    """Verifies that ByteTrack recovers a track during low-confidence occlusions in stage 2."""
    tracker = ByteTracker(track_thresh=0.40, match_thresh=0.75, low_thresh=0.15)
    STrack.reset_counter(200)

    # Frame 0: High confidence
    dets_0 = [{"x": 100.0, "y": 100.0, "w": 50.0, "h": 50.0, "confidence": 0.90, "category": "car"}]
    t0 = tracker.update(dets_0, 0)
    assert len(t0) == 1
    orig_id = t0[0].track_id

    # Frame 1: Low confidence (0.25) simulating rain/lighting drop
    dets_1 = [{"x": 104.0, "y": 102.0, "w": 50.0, "h": 50.0, "confidence": 0.25, "category": "car"}]
    t1 = tracker.update(dets_1, 1)
    assert len(t1) == 1
    # ID must be preserved via stage 2 IoU matching
    assert t1[0].track_id == orig_id

def test_cross_camera_topology_gating():
    """Verifies spatial-temporal gating across the city camera network graph."""
    cam1 = Camera(camera_id="CAM-001", latitude=40.7128, longitude=-74.0060)
    cam2 = Camera(camera_id="CAM-002", latitude=40.7300, longitude=-73.9950)

    track1 = Tracklet(
        track_id=101, video_id="VID-001", camera_id="CAM-001", category="car",
        start_frame=0, end_frame=30, start_time_sec=0.0, end_time_sec=1.0, duration_sec=1.0,
        total_detections=15, avg_confidence=0.90, primary_direction="Northbound", appearance_color="Silver/Grey"
    )

    track2_valid = Tracklet(
        track_id=205, video_id="VID-002", camera_id="CAM-002", category="car",
        start_frame=0, end_frame=30, start_time_sec=480.0, end_time_sec=481.0, duration_sec=1.0,
        total_detections=15, avg_confidence=0.90, primary_direction="Northbound", appearance_color="Silver/Grey"
    )

    # Transit time: 480 seconds (within CAM-001 -> CAM-002 window 360-720s)
    match = CrossCameraAssociationEngine.evaluate_candidate_pair(
        source_track=track1,
        dest_track=track2_valid,
        source_cam=cam1,
        dest_cam=cam2,
        delta_time_sec=480.0
    )
    assert match is not None
    assert match["status"] == "verified"
    assert match["confidence_score"] >= 0.85

    # Case: Impossible transit time (e.g. 50 seconds for 4.2 km corridor)
    impossible_match = CrossCameraAssociationEngine.evaluate_candidate_pair(
        source_track=track1,
        dest_track=track2_valid,
        source_cam=cam1,
        dest_cam=cam2,
        delta_time_sec=50.0
    )
    assert impossible_match is None

    # Case: Mismatched vehicle categories (car vs motorcycle)
    track2_bike = Tracklet(
        track_id=206, video_id="VID-002", camera_id="CAM-002", category="motorcycle",
        start_frame=0, end_frame=30, start_time_sec=480.0, end_time_sec=481.0, duration_sec=1.0,
        total_detections=15, avg_confidence=0.90, primary_direction="Northbound", appearance_color="Silver/Grey"
    )
    mismatched_match = CrossCameraAssociationEngine.evaluate_candidate_pair(
        source_track=track1,
        dest_track=track2_bike,
        source_cam=cam1,
        dest_cam=cam2,
        delta_time_sec=480.0
    )
    assert mismatched_match is None

def test_tracking_api_endpoints(auth_header):
    """Verifies tracking statistics, association listing, and human review verification."""
    # 1. Stats endpoint
    stats_res = client.get("/api/v1/tracking/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "active_byte_track_sessions" in stats
    assert "cross_camera_reconstructed" in stats
    assert stats["cross_camera_reconstructed"] >= 4

    # 2. Associations listing
    assocs_res = client.get("/api/v1/tracking/associations")
    assert assocs_res.status_code == 200
    assocs = assocs_res.json()
    assert len(assocs) >= 4
    first_assoc = assocs[0]
    assert "association_id" in first_assoc
    assert "source_camera_id" in first_assoc
    assert "dest_camera_id" in first_assoc

    # 3. Human verification of ASSOC-403 (pending review)
    verify_res = client.post(
        "/api/v1/tracking/associations/ASSOC-403/verify",
        headers=auth_header,
        json={"action": "verify", "notes": "Confirmed by traffic operator after visual check"}
    )
    assert verify_res.status_code == 200
    updated = verify_res.json()
    assert updated["status"] == "verified"
    assert updated["reviewed_by"] == "admin"
