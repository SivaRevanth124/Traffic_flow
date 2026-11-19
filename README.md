# TrafficFlow — City-Wide Vehicle Trajectory Clustering
> **Tagline:** Connecting cameras. Tracking vehicles. Discovering city-wide traffic patterns.  
> **Platform Category:** City Traffic Intelligence Platform *(Strictly branded as City Traffic Intelligence Platform)*

---

## 1. System Architecture Overview

TrafficFlow is a production-grade full-stack traffic intelligence system built for municipal transportation authorities, police departments, and urban traffic analysts. It ingests optical camera streams (RTSP and surveillance video files), performs high-speed vehicle detection using **YOLOv8-Nano** (with an OpenCV MOG2 optical motion fallback for synthetic and low-light surveillance test footage), tracks vehicles with **ByteTrack** (8D Kalman filter state vector with two-stage Hungarian association), associates trajectories across camera corridors using spatial-temporal road topology gating, and discovers urban mobility corridors via unsupervised machine learning (**K-Means**, **DBSCAN**, **Agglomerative Clustering**).

```
traffic-road/
├── frontend/                               # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/                     # Header, Sidebar, MetricCard, StatusBadge
│   │   ├── layouts/                        # MainLayout with dark navy & charcoal tech aesthetic
│   │   ├── pages/                          # 16 Interactive operational pages
│   │   │   ├── CommandCenter.tsx           # Macro-level urban traffic telemetry
│   │   │   ├── CameraManagement.tsx        # CCTV/ANPR sensor catalog & socket ping
│   │   │   ├── LiveVideoWall.tsx           # 1x1, 2x2, 3x3, 4x4 matrix with HTTP 206 streaming
│   │   │   ├── RecordedVideos.tsx          # 5-stage async ingestion & video player
│   │   │   ├── VehicleDetection.tsx        # YOLOv8-Nano confidence & bounding box inspector
│   │   │   ├── VehicleTracking.tsx         # ByteTrack tracklets & cross-camera verification
│   │   │   ├── TrajectoryExplorer.tsx      # Multi-hop trajectory search & GeoJSON/CSV exports
│   │   │   ├── RouteClustering.tsx         # ML Studio comparing K-Means, DBSCAN, Agglomerative
│   │   │   ├── CityTrafficMap.tsx          # MapLibre GL dark-matter vector map
│   │   │   ├── CongestionMonitoring.tsx    # Level of Service (LOS A–E) density analysis
│   │   │   ├── IncidentAlerts.tsx          # Alert triage inbox (acknowledge, assign, resolve)
│   │   │   ├── TrafficAnalytics.tsx        # Diurnal volume curves & vehicle class ratios
│   │   │   ├── DatasetManagement.tsx       # CityFlowV2 MTMC benchmark dataset staging
│   │   │   ├── UsersRoles.tsx              # 4-tier RBAC & immutable audit trail viewer
│   │   │   ├── Reports.tsx                 # Real-time CSV and printable summary generator
│   │   │   └── SystemSettings.tsx          # Inference tuning & video retention rules
│   │   ├── services/
│   │   │   └── api.ts                      # Fully typed API client connecting to FastAPI
│   │   ├── types/                          # Strict TypeScript domain interfaces
│   │   ├── App.tsx                         # Client-side router & navigation controller
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── backend/                                # Python 3.12 + FastAPI + SQLAlchemy 2.0 ORM
│   ├── app/
│   │   ├── api/
│   │   │   ├── routers/                    # Auth, Cameras, Videos, Tracking, Trajectories, Clustering, Analytics
│   │   │   └── deps.py                     # JWT token verification & RBAC dependency guards
│   │   ├── clustering/
│   │   │   ├── clustering_engine.py        # K-Means, DBSCAN, Agglomerative clustering models
│   │   │   └── feature_extractor.py        # 11-feature trajectory vectorization & scaling
│   │   ├── core/
│   │   │   ├── config.py                   # Environment settings & directory initialization
│   │   │   └── security.py                 # PBKDF2 hashing, PyJWT tokens, RTSP URL masking
│   │   ├── database/
│   │   │   └── session.py                  # SQLite database engine (PostgreSQL-ready)
│   │   ├── models/                         # User, Camera, Video, Detection, Tracklet, Trajectory, Alert, AuditLog
│   │   ├── schemas/                        # Pydantic v2 validation contracts
│   │   ├── services/                       # Business logic for video ingestion, auth, streaming, clustering
│   │   ├── tracking/
│   │   │   ├── bytetrack.py                # ByteTrack tracker & Kalman 8D filter
│   │   │   └── cross_camera.py             # Spatial-temporal road topology gating engine
│   │   └── main.py                         # FastAPI application entry point
│   └── tests/                              # Automated pytest suite (35/35 passing tests)
├── data/
│   ├── uploads/                            # Stored raw surveillance video recordings
│   └── processed/                          # Annotated output videos with visual bounding boxes
├── yolov8n.pt                              # Ultralytics YOLOv8-Nano neural network weights (6.2 MB)
├── trafficflow.db                          # Auto-seeded SQLite database
├── start_trafficflow.bat                   # Windows batch one-click launcher
├── start_trafficflow.ps1                   # Windows PowerShell one-click launcher
└── README.md
```

---

## 2. Core Functional Modules

### I. Operations & Monitoring
1. **Command Center:** Real-time city traffic pulse displaying online sensor ratio, classified detections today, active ByteTrack sessions, Level of Service congestion index, and critical alerts.
2. **Camera Management:** Optical sensor catalog managing camera locations, IP/RTSP stream credentials (always masked in frontend/API), frame rates, and socket ping health.
3. **Live Video Wall:** Operator surveillance grid supporting 1x1, 2x2, 3x3, and 4x4 matrix views with live HTTP 206 stream transcoding and graceful offline error handling for disconnected sensors.
4. **Recorded Videos:** Surveillance footage ingestion with an asynchronous 5-stage pipeline: Validation $\rightarrow$ Frame Extraction $\rightarrow$ YOLO Detection $\rightarrow$ ByteTrack Association $\rightarrow$ Complete.

### II. AI Intelligence & Computer Vision
5. **Vehicle Detection:** Ultralytics YOLOv8-Nano inference with COCO classifications (Cars, Buses, Trucks, Motorcycles) and resilient OpenCV MOG2 optical motion fallback for synthetic/low-light surveillance footage.
6. **Vehicle Tracking:** Intra-camera ByteTrack with 8D Kalman filter state vector (`[x, y, a, h, vx, vy, va, vh]`) and two-stage Hungarian association, maintaining continuous tracklet IDs across frame occlusions.
7. **Cross-Camera Association:** Multi-camera spatial-temporal association engine that pairs tracklets across physical camera locations using road network topology gating, velocity bounds, travel-time windows, and visual appearance cosine similarity.
8. **Trajectory Explorer:** Spatial-temporal observation ledger for reconstructed vehicle routes, searchable by vehicle category, duration, distance, and camera hop sequences, with instant GeoJSON and CSV exports.
9. **Route Clustering Studio:** Unsupervised machine learning studio executing and comparing **K-Means**, **DBSCAN**, and **Agglomerative Clustering** across an 11-dimensional trajectory feature space, evaluated with **Silhouette**, **Davies-Bouldin**, and **Calinski-Harabasz** validation metrics.

### III. Traffic Management & Decision Support
10. **City Traffic Map:** WebGL dark-matter vector map powered by MapLibre GL, displaying camera radar markers, glowing trajectory corridor paths, congestion density circles, and detailed camera telemetry drawers.
11. **Congestion Monitoring:** Density-based Level of Service (LOS A through E) evaluation displaying junction occupancy percentages, queue lengths, and signal delays.
12. **Incident Alerts:** Triage inbox for traffic anomalies (Accidents, Stationary Vehicles, Wrong-Way Transit, Congestion Spikes) with operator acknowledge/resolve workflows.
13. **Traffic Analytics:** Macro-level urban volume distributions, peak hour morning/evening curves, weekly trends, and vehicle class breakdowns.

### IV. Administration & Security
14. **Users & Roles (RBAC):** 4-tier Role-Based Access Control (**Administrator**, **Traffic Operator**, **Analyst**, **Viewer**) backed by PBKDF2 password hashing and PyJWT tokens.
15. **Immutable Audit Trail:** Append-only log recording administrative actions, camera configuration changes, user logins, and route exports with actor username, action type, IP address, and timestamps.
16. **Reports & Exports:** Real-time generation of CSV and printable summary documentation for city traffic authorities.
17. **System Settings:** Control panel for computer vision model checkpoints, ByteTrack hyperparameters, video retention windows, and inference hardware device settings.

---

## 3. Quick Start & Execution

### Option A: One-Click Launcher (Windows)
Run either of the provided launch scripts from the project root:
- **Batch:** Double-click or run `.\start_trafficflow.bat`
- **PowerShell:** Run `.\start_trafficflow.ps1`

Both scripts will automatically configure the path to Node.js, start the FastAPI backend on port 8000, and launch the Vite development server on port 5173.

### Option B: Manual Startup

#### Step 1: Start the FastAPI Backend
```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Redoc Documentation: `http://127.0.0.1:8000/redoc`

#### Step 2: Start the React Frontend
```powershell
$env:Path += ";C:\Users\kodavalisravya\AppData\Local\Programs\nodejs"
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- Web Application Console: `http://127.0.0.1:5173`

---

## 4. Automated Testing & Verification

The project includes an automated test suite verifying all 12 platform phases:

```powershell
python -m pytest backend/tests/ -v
```

### Test Suite Summary (35 Tests, 100% Passing)
- **Authentication & Security (`test_auth.py`, `test_users_rbac.py`):** PBKDF2 password hashing, dynamic RTSP credential masking, JWT token validation, 4-tier role permission enforcement, user deactivation, immutable audit trails.
- **Camera Network & Gateway (`test_cameras.py`):** Sensor catalog listing, dynamic camera registration/deletion, offline sensor HTTP 503 error handling, online camera HTTP 206 byte streaming.
- **Video Processing & Streaming (`test_videos.py`):** Video upload handling, OpenCV metadata extraction, 5-stage asynchronous pipeline, HTTP 206 Partial Content byte-range seeking.
- **Detection & Tracking (`test_detection.py`, `test_tracking.py`):** YOLOv8-Nano inference + MOG2 fallback, 8D Kalman filter state cycle, ByteTrack two-stage Hungarian recovery, cross-camera topology gating and travel-time validation.
- **Trajectory Management (`test_trajectories.py`):** Trajectory storage, category filtering, search, detail retrieval, GeoJSON FeatureCollection export, CSV export.
- **Machine Learning Clustering (`test_clustering.py`):** 11-feature trajectory extraction and standard scaling, K-Means clustering, DBSCAN noise handling, Agglomerative hierarchical clustering, comparison benchmark studio API.
- **Traffic Analytics & Alerts (`test_analytics.py`, `test_dashboard_alerts.py`):** LOS A–E density computation, diurnal curves, dashboard statistics, incident alert lifecycle (triage, acknowledge, resolve).

---

## 5. Security & Architectural Principles

1. **Brand Identity:** Explicitly designated as **City Traffic Intelligence Platform** (strictly never "Smart City").
2. **Credential Confidentiality:** RTSP camera passwords and stream credentials are encrypted at rest and dynamically masked as `rtsp://***:***@...` in all API responses.
3. **No Sensor Spoofing:** Offline sensors (`CAM-006`) actively return HTTP 503 Service Unavailable with descriptive status. The platform never pretends an offline optical sensor is online.
4. **Intra-Camera Tracking ID Isolation:** A tracking ID in camera `CAM-001` is strictly isolated from `CAM-002`. Cross-camera association is performed exclusively through verified spatial-temporal topological gating, velocity bounds, travel-time windows, and visual cosine similarity.
5. **Standardized ML Metrics:** Trajectory route clusters are evaluated mathematically using Silhouette Score ($s \in [-1, 1]$), Davies-Bouldin Index (lower is better), and Calinski-Harabasz Variance Ratio (higher is better).

---

## 6. Default Credentials

The platform database seeds authentic default administrative accounts upon initial launch:

| Role | Username | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full system control, user management, settings |
| **Traffic Operator** | `operator` | `operator123` | Triage, stream monitoring, tracklet verification |
| **Analyst** | `analyst` | `analyst123` | Trajectory analysis, ML clustering, report export |
