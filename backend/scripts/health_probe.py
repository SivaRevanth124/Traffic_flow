"""
TrafficFlow — City Traffic Intelligence Platform
Comprehensive Live Production Health Probe
"""
import urllib.request
import urllib.parse
import json
import sys
import time

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:5173"

class ProbeRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.token = None

    def log_result(self, name: str, success: bool, detail: str = ""):
        status_text = "PASS" if success else "FAIL"
        color = "\033[92m" if success else "\033[91m"
        reset = "\033[0m"
        print(f"[{color}{status_text}{reset}] {name:50s} {detail}")
        if success:
            self.passed += 1
        else:
            self.failed += 1

    def request(self, method: str, path: str, data: dict = None, headers: dict = None, expected_status: int = 200):
        url = f"{BASE_URL}{path}"
        req_headers = {"User-Agent": "TrafficFlowProbe/1.0"}
        if self.token:
            req_headers["Authorization"] = f"Bearer {self.token}"
        if headers:
            req_headers.update(headers)

        body_bytes = None
        if data is not None:
            body_bytes = json.dumps(data).encode("utf-8")
            req_headers["Content-Type"] = "application/json"

        req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                status = response.getcode()
                body = response.read().decode("utf-8")
                return status, body
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8") if e.fp else ""
            return e.code, body
        except Exception as e:
            return 0, str(e)

    def run_all(self):
        print("=" * 75)
        print(" TrafficFlow: City Traffic Intelligence Platform — Live Health Probe")
        print("=" * 75)

        # 1. Frontend Check
        try:
            with urllib.request.urlopen(FRONTEND_URL, timeout=5) as r:
                self.log_result("Vite Frontend Server (:5173)", r.getcode() == 200, f"Status: {r.getcode()}")
        except Exception as e:
            self.log_result("Vite Frontend Server (:5173)", False, str(e))

        # 2. Backend Docs & OpenAPI
        status, _ = self.request("GET", "/docs")
        self.log_result("FastAPI Interactive Documentation (/docs)", status == 200, f"HTTP {status}")

        status, _ = self.request("GET", "/openapi.json")
        self.log_result("OpenAPI JSON Schema (/openapi.json)", status == 200, f"HTTP {status}")

        # 3. Authentication & JWT Token
        status, body = self.request("POST", "/api/v1/auth/login", data={"username": "admin", "password": "admin123"})
        if status == 200:
            parsed = json.loads(body)
            self.token = parsed.get("access_token")
            self.log_result("Auth Login (admin:admin123)", True, "Issued JWT Bearer Token")
        else:
            self.log_result("Auth Login (admin:admin123)", False, f"HTTP {status}: {body}")

        status, body = self.request("GET", "/api/v1/auth/me")
        self.log_result("Authenticated User Profile (/auth/me)", status == 200, f"HTTP {status}")

        status, body = self.request("GET", "/api/v1/auth/users")
        self.log_result("RBAC User Directory (/auth/users)", status == 200, f"HTTP {status}")

        status, body = self.request("GET", "/api/v1/auth/audit-logs?limit=5")
        self.log_result("Immutable Audit Trail (/auth/audit-logs)", status == 200, f"HTTP {status}")

        # 4. Dashboard Telemetry
        status, body = self.request("GET", "/api/v1/dashboard/stats")
        self.log_result("Macro Dashboard Telemetry (/dashboard/stats)", status == 200, f"HTTP {status}")

        status, body = self.request("GET", "/api/v1/dashboard/hourly-volumes")
        self.log_result("Diurnal Hourly Volumes (/dashboard/hourly-volumes)", status == 200, f"HTTP {status}")

        # 5. Camera Management
        status, body = self.request("GET", "/api/v1/cameras")
        self.log_result("CCTV Camera Sensor Catalog (/cameras)", status == 200, f"HTTP {status}")

        status, body = self.request("POST", "/api/v1/cameras/CAM-001/test")
        self.log_result("Camera Socket Connection Ping (CAM-001)", status == 200, f"HTTP {status}")

        status, body = self.request("GET", "/api/v1/cameras/CAM-006/live-stream")
        self.log_result("Offline Sensor Guard (CAM-006 -> HTTP 503)", status == 503, f"HTTP {status} (Expected Service Unavailable)")

        # 6. Video Ingestion & Telemetry
        status, body = self.request("GET", "/api/v1/videos/")
        self.log_result("Recorded Video Pipeline Queue (/videos)", status == 200, f"HTTP {status}")

        # 7. Tracking & Cross-Camera Re-ID
        status, body = self.request("GET", "/api/v1/tracking/stats")
        self.log_result("Tracking Telemetry Statistics (/tracking/stats)", status == 200, f"HTTP {status}")

        status, body = self.request("GET", "/api/v1/tracking/associations")
        self.log_result("Cross-Camera Spatial-Temporal Pairs", status == 200, f"HTTP {status}")

        # 8. Trajectory Storage & Exports
        status, body = self.request("GET", "/api/v1/trajectories")
        self.log_result("Reconstructed Trajectories Ledger (/trajectories)", status == 200, f"HTTP {status}")

        status, body = self.request("GET", "/api/v1/trajectories/export/geojson")
        self.log_result("GeoJSON LineString Export", status == 200, f"HTTP {status}")

        status, body = self.request("GET", "/api/v1/trajectories/export/csv")
        self.log_result("Tabular CSV Dataset Export", status == 200, f"HTTP {status}")

        # 9. Unsupervised ML Route Clustering
        status, body = self.request("POST", "/api/v1/clustering/run", data={"algorithm": "kmeans", "k": 3})
        self.log_result("K-Means Trajectory Clustering (k=3)", status == 200, f"HTTP {status}")

        status, body = self.request("POST", "/api/v1/clustering/run", data={"algorithm": "dbscan", "eps": 0.5, "min_samples": 2})
        self.log_result("DBSCAN Anomaly Clustering (eps=0.5)", status == 200, f"HTTP {status}")

        status, body = self.request("GET", "/api/v1/clustering/compare")
        self.log_result("ML Multi-Algorithm Comparison Studio", status == 200, f"HTTP {status}")

        # 10. Operations, Congestion & Incident Alerts
        status, body = self.request("GET", "/api/v1/analytics/congestion")
        self.log_result("LOS A-E Density Congestion Monitor", status == 200, f"HTTP {status}")

        status, body = self.request("GET", "/api/v1/analytics/overview")
        self.log_result("City Traffic Analytics Overview", status == 200, f"HTTP {status}")

        status, body = self.request("GET", "/api/v1/alerts/")
        self.log_result("Incident Alert Triage Inbox (/alerts)", status == 200, f"HTTP {status}")

        print("=" * 75)
        print(f" Summary: {self.passed} Passed, {self.failed} Failed out of {self.passed + self.failed} probes")
        print("=" * 75)
        return self.failed == 0

if __name__ == "__main__":
    runner = ProbeRunner()
    success = runner.run_all()
    sys.exit(0 if success else 1)
