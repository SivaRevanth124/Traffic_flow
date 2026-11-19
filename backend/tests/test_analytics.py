import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.services.auth_service import AuthService

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_analytics():
    db = SessionLocal()
    AuthService.seed_initial_data(db)
    db.close()

def test_get_congestion_monitoring():
    """Verifies junction-level congestion calculations and Level of Service (LOS)."""
    res = client.get("/api/v1/analytics/congestion")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 6
    for item in data:
        assert "camera_id" in item
        assert "occupancy_pct" in item
        assert "level_of_service" in item
        assert "status_label" in item
        assert "estimated_queue_m" in item

    # Verify that CAM-002 (congested overpass) has LOS E or D
    cam2 = next(c for c in data if c["camera_id"] == "CAM-002")
    assert "LOS E" in cam2["level_of_service"]
    assert cam2["occupancy_pct"] > 75.0

def test_get_analytics_overview():
    """Verifies peak hours, vehicle class breakdown, and weekly profiles."""
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "vehicle_breakdown" in data
    assert "weekly_profile" in data
    assert "top_corridors_by_volume" in data
    assert len(data["vehicle_breakdown"]) == 4
    assert len(data["weekly_profile"]) == 7
