import pytest
import json
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.services.trajectory_service import TrajectoryService

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_trajectories():
    db = SessionLocal()
    TrajectoryService.seed_initial_trajectories(db)
    db.close()

def test_list_trajectories():
    """Verifies listing of trajectories."""
    res = client.get("/api/v1/trajectories")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    first = data[0]
    assert "trajectory_id" in first
    assert "vehicle_category" in first
    assert "camera_sequence" in first
    assert "duration_seconds" in first

def test_filter_trajectories_by_category():
    """Verifies category filtering (e.g. car, truck)."""
    res = client.get("/api/v1/trajectories?category=truck")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert all(d["vehicle_category"] == "truck" for d in data)

def test_search_trajectories():
    """Verifies keyword search across IDs and corridor names."""
    res = client.get("/api/v1/trajectories?search=Harbor")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert any("Harbor" in str(d["camera_names"]) for d in data)

def test_get_trajectory_detail():
    """Verifies detailed trajectory inspection with observations and GeoJSON line geometry."""
    res = client.get("/api/v1/trajectories/TRJ-801")
    assert res.status_code == 200
    detail = res.json()
    assert detail["trajectory_id"] == "TRJ-801"
    assert "geojson_path" in detail
    assert detail["geojson_path"]["type"] == "LineString"
    assert len(detail["geojson_path"]["coordinates"]) >= 2
    assert "observations" in detail
    assert len(detail["observations"]) >= 2

def test_export_geojson():
    """Verifies standard GeoJSON FeatureCollection export."""
    res = client.get("/api/v1/trajectories/export/geojson")
    assert res.status_code == 200
    assert "application/geo+json" in res.headers.get("content-type", "")
    geojson = json.loads(res.text)
    assert geojson["type"] == "FeatureCollection"
    assert "features" in geojson
    assert len(geojson["features"]) >= 5
    assert geojson["features"][0]["geometry"]["type"] == "LineString"

def test_export_csv():
    """Verifies tabular CSV export format and columns."""
    res = client.get("/api/v1/trajectories/export/csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers.get("content-type", "")
    lines = res.text.strip().split("\n")
    assert len(lines) >= 6
    header = lines[0]
    assert "trajectory_id" in header
    assert "vehicle_category" in header
    assert "distance_km" in header
