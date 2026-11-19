import pytest
import numpy as np
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.services.trajectory_service import TrajectoryService
from backend.app.clustering.feature_extractor import TrajectoryFeatureExtractor
from backend.app.clustering.clustering_engine import ClusteringEngine

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_trajectories():
    db = SessionLocal()
    TrajectoryService.seed_initial_trajectories(db)
    db.close()

def test_feature_extractor():
    """Verifies that trajectory features are correctly extracted and normalized."""
    db = SessionLocal()
    trajectories = TrajectoryService.list_trajectories(db)
    db.close()

    assert len(trajectories) >= 5
    X, meta = TrajectoryFeatureExtractor.extract_features(trajectories)

    assert X.shape[0] == len(trajectories)
    assert X.shape[1] == 11
    assert len(meta) == len(trajectories)
    # Check that scaled data has approx zero mean
    assert np.allclose(np.mean(X, axis=0), 0.0, atol=1e-1)

def test_kmeans_clustering():
    """Verifies K-Means partitioning and metric calculations."""
    db = SessionLocal()
    trajectories = TrajectoryService.list_trajectories(db)
    db.close()

    X, _ = TrajectoryFeatureExtractor.extract_features(trajectories)
    labels, metrics = ClusteringEngine.run_kmeans(X, n_clusters=3)

    assert len(labels) == len(trajectories)
    assert metrics["algorithm"] == "K-Means"
    assert metrics["clusters"] >= 2
    assert "silhouette" in metrics
    assert "davies_bouldin" in metrics
    assert "calinski_harabasz" in metrics
    assert metrics["runtime_ms"] > 0

def test_dbscan_clustering():
    """Verifies DBSCAN density clustering and noise identification."""
    db = SessionLocal()
    trajectories = TrajectoryService.list_trajectories(db)
    db.close()

    X, _ = TrajectoryFeatureExtractor.extract_features(trajectories)
    labels, metrics = ClusteringEngine.run_dbscan(X, eps=0.8, min_samples=2)

    assert len(labels) == len(trajectories)
    assert metrics["algorithm"] == "DBSCAN"
    assert "noise_points" in metrics
    assert "noise_ratio_pct" in metrics

def test_agglomerative_clustering():
    """Verifies Agglomerative hierarchical dendrogram clustering."""
    db = SessionLocal()
    trajectories = TrajectoryService.list_trajectories(db)
    db.close()

    X, _ = TrajectoryFeatureExtractor.extract_features(trajectories)
    labels, metrics = ClusteringEngine.run_agglomerative(X, n_clusters=3, linkage="ward")

    assert len(labels) == len(trajectories)
    assert metrics["algorithm"] == "Agglomerative"
    assert metrics["clusters"] >= 2

def test_clustering_run_api():
    """Verifies POST /api/v1/clustering/run endpoint for K-Means and DBSCAN."""
    # 1. K-Means
    res_km = client.post(
        "/api/v1/clustering/run",
        json={"algorithm": "kmeans", "k": 3}
    )
    assert res_km.status_code == 200
    data_km = res_km.json()
    assert data_km["algorithm"] == "K-Means"
    assert "metrics" in data_km
    assert len(data_km["cluster_breakdown"]) >= 2

    # 2. DBSCAN
    res_db = client.post(
        "/api/v1/clustering/run",
        json={"algorithm": "dbscan", "eps": 0.5, "min_samples": 2}
    )
    assert res_db.status_code == 200
    data_db = res_db.json()
    assert data_db["algorithm"] == "DBSCAN"
    assert "outliers" in data_db

def test_clustering_compare_api():
    """Verifies GET /api/v1/clustering/compare comparison studio endpoint."""
    res = client.get("/api/v1/clustering/compare")
    assert res.status_code == 200
    comparison = res.json()
    assert len(comparison) == 3
    algs = [c["algorithm"] for c in comparison]
    assert any("DBSCAN" in a for a in algs)
    assert any("K-Means" in a for a in algs)
    assert any("Agglomerative" in a for a in algs)
