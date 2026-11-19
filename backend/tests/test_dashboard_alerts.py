from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_dashboard_stats():
    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["registered_cameras"] >= 6
    assert stats["online_cameras"] >= 1
    assert "system_status" in stats

def test_alerts_lifecycle():
    # Login as operator
    auth_res = client.post(
        "/api/v1/auth/login",
        json={"username": "operator", "password": "operator123"}
    )
    headers = {"Authorization": f"Bearer {auth_res.json()['access_token']}"}

    # List alerts
    list_res = client.get("/api/v1/alerts")
    assert list_res.status_code == 200
    alerts = list_res.json()
    assert len(alerts) >= 2

    # Update alert
    first_alert = alerts[0]
    update_res = client.put(
        f"/api/v1/alerts/{first_alert['alert_id']}",
        json={"status": "under_review", "assigned_operator": "Central Operator", "resolution_notes": "Inspection in progress"},
        headers=headers
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["status"] == "under_review"
    assert updated["assigned_operator"] == "Central Operator"
