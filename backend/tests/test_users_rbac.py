import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def get_auth_token(username: str, password: str) -> str:
    res = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password}
    )
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]

def test_admin_can_list_users():
    token = get_auth_token("admin", "admin123")
    res = client.get(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 3
    usernames = [u["username"] for u in users]
    assert "admin" in usernames
    assert "operator" in usernames
    assert "analyst" in usernames

def test_admin_can_create_user_and_toggle_status():
    admin_token = get_auth_token("admin", "admin123")
    unique_suffix = uuid.uuid4().hex[:6]
    test_username = f"officer_{unique_suffix}"
    test_email = f"officer_{unique_suffix}@traffic.city.gov"
    test_password = f"pass_{unique_suffix}"
    
    # 1. Create a test operator
    create_payload = {
        "username": test_username,
        "email": test_email,
        "full_name": f"Patrol Officer {unique_suffix}",
        "password": test_password,
        "role": "operator"
    }
    res = client.post(
        "/api/v1/auth/users",
        json=create_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 201
    user_data = res.json()
    user_id = user_data["id"]
    assert user_data["username"] == test_username
    assert user_data["role"] == "operator"
    assert user_data["is_active"] is True

    # 2. Officer can login successfully
    officer_token = get_auth_token(test_username, test_password)
    assert officer_token is not None

    # 3. Duplicate creation fails with 400
    dup_res = client.post(
        "/api/v1/auth/users",
        json=create_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert dup_res.status_code == 400
    assert "already registered" in dup_res.json()["detail"]

    # 4. Deactivate officer
    deactivate_res = client.put(
        f"/api/v1/auth/users/{user_id}/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert deactivate_res.status_code == 200
    assert deactivate_res.json()["is_active"] is False

    # 5. Deactivated user cannot login
    blocked_res = client.post(
        "/api/v1/auth/login",
        json={"username": test_username, "password": test_password}
    )
    assert blocked_res.status_code == 400
    assert "deactivated" in blocked_res.json()["detail"]

def test_operator_cannot_create_user():
    operator_token = get_auth_token("operator", "operator123")
    
    res = client.post(
        "/api/v1/auth/users",
        json={
            "username": "unauthorized_user",
            "email": "unauth@city.gov",
            "password": "password123",
            "role": "operator"
        },
        headers={"Authorization": f"Bearer {operator_token}"}
    )
    assert res.status_code == 403
    assert "Administrator privileges" in res.json()["detail"]

def test_audit_logs_endpoint():
    token = get_auth_token("admin", "admin123")
    res = client.get(
        "/api/v1/auth/audit-logs?limit=20",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)
    assert len(logs) > 0
    first_log = logs[0]
    assert "actor_username" in first_log
    assert "action" in first_log
    assert "timestamp" in first_log
