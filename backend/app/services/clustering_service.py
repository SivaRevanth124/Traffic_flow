import json
import numpy as np
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.models.trajectory import Trajectory
from backend.app.services.trajectory_service import TrajectoryService
from backend.app.clustering.feature_extractor import TrajectoryFeatureExtractor
from backend.app.clustering.clustering_engine import ClusteringEngine

CLUSTER_CORRIDOR_NAMES = [
    "Harbor → North Ring Arterial Corridor",
    "Central Station ↔ Main Street Link",
    "Airport Express Bypass Route",
    "Campus Shuttle Arterial Link",
    "East River Bridge Crossing Feeder",
    "Industrial Freight Highway Loop"
]

class ClusteringService:
    @classmethod
    def execute_clustering(
        cls,
        algorithm: str,
        params: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        """
        Executes chosen clustering algorithm (K-Means, DBSCAN, or Agglomerative)
        on trajectory feature vectors, persists updated cluster labels to database,
        and returns evaluation metrics and cluster size distribution.
        """
        TrajectoryService.seed_initial_trajectories(db)
        trajectories = db.query(Trajectory).all()

        if not trajectories:
            raise ValueError("No trajectories available for clustering")

        X, meta = TrajectoryFeatureExtractor.extract_features(trajectories)

        alg_lower = algorithm.lower()
        if alg_lower == "kmeans":
            k = int(params.get("k", 5))
            labels, metrics = ClusteringEngine.run_kmeans(X, n_clusters=k)
        elif alg_lower == "dbscan":
            eps = float(params.get("eps", 0.45))
            min_samples = int(params.get("min_samples", 2))
            labels, metrics = ClusteringEngine.run_dbscan(X, eps=eps, min_samples=min_samples)
        elif alg_lower == "agglomerative":
            k = int(params.get("k", 5))
            linkage = str(params.get("linkage", "ward"))
            labels, metrics = ClusteringEngine.run_agglomerative(X, n_clusters=k, linkage=linkage)
        else:
            raise ValueError(f"Unsupported clustering algorithm: {algorithm}")

        # Update database with new cluster assignments
        clusters_dict: Dict[int, List[Dict[str, Any]]] = {}
        outliers: List[Dict[str, Any]] = []

        for idx, (trj, lbl) in enumerate(zip(trajectories, labels)):
            c_id = int(lbl)
            if c_id == -1:
                c_label = "Outliers / Noise (Anomalous Route Trajectories)"
                outliers.append({
                    "trajectory_id": trj.trajectory_id,
                    "vehicle_category": trj.vehicle_category,
                    "description": trj.vehicle_description,
                    "duration_str": trj.duration_str,
                    "distance_km": trj.distance_km,
                    "camera_sequence": json.loads(trj.camera_sequence) if trj.camera_sequence else []
                })
            else:
                corridor_name = CLUSTER_CORRIDOR_NAMES[c_id % len(CLUSTER_CORRIDOR_NAMES)]
                c_label = f"Cluster #{c_id + 1}: {corridor_name}"

            trj.cluster_id = c_id
            trj.cluster_label = c_label
            clusters_dict.setdefault(c_id, []).append({
                "trajectory": trj,
                "meta": meta[idx]
            })

        db.commit()

        # Build cluster breakdown summaries
        cluster_breakdown = []
        for c_id in sorted(clusters_dict.keys()):
            items = clusters_dict[c_id]
            durations = [item["trajectory"].duration_seconds for item in items]
            avg_min = round(np.mean(durations) / 60.0, 1)

            # Dominant vehicle category
            cats = [item["trajectory"].vehicle_category for item in items]
            dominant_cat = max(set(cats), key=cats.count).title() if cats else "Mixed"

            if c_id == -1:
                c_name = "Outliers / Noise (Anomalous Route Trajectories)"
            else:
                c_name = f"Cluster #{c_id + 1}: {CLUSTER_CORRIDOR_NAMES[c_id % len(CLUSTER_CORRIDOR_NAMES)]}"

            cluster_breakdown.append({
                "cluster_id": c_id,
                "name": c_name,
                "count": len(items),
                "avgTime": f"{avg_min} min",
                "dominantClass": dominant_cat
            })

        return {
            "algorithm": metrics["algorithm"],
            "parameters": params,
            "metrics": metrics,
            "cluster_breakdown": cluster_breakdown,
            "outliers_count": len(outliers),
            "outliers": outliers
        }

    @classmethod
    def compare_all_algorithms(cls, db: Session) -> List[Dict[str, Any]]:
        """
        Executes DBSCAN, K-Means, and Agglomerative Clustering across the identical
        trajectory feature space and returns a comparative benchmarking table.
        """
        TrajectoryService.seed_initial_trajectories(db)
        trajectories = db.query(Trajectory).all()

        if not trajectories:
            return []

        X, _ = TrajectoryFeatureExtractor.extract_features(trajectories)

        _, dbscan_metrics = ClusteringEngine.run_dbscan(X, eps=0.45, min_samples=2)
        _, kmeans_metrics = ClusteringEngine.run_kmeans(X, n_clusters=4)
        _, agg_metrics = ClusteringEngine.run_agglomerative(X, n_clusters=4, linkage="ward")

        return [
            {
                "algorithm": "DBSCAN",
                "clusters": dbscan_metrics["clusters"],
                "noisePoints": dbscan_metrics["noise_points"],
                "noiseRatio": f"{dbscan_metrics['noise_ratio_pct']}%",
                "silhouette": dbscan_metrics["silhouette"],
                "daviesBouldin": dbscan_metrics["davies_bouldin"],
                "calinskiHarabasz": dbscan_metrics["calinski_harabasz"],
                "runtime": f"{dbscan_metrics['runtime_ms']} ms"
            },
            {
                "algorithm": "K-Means (k=4)",
                "clusters": kmeans_metrics["clusters"],
                "noisePoints": kmeans_metrics["noise_points"],
                "noiseRatio": f"{kmeans_metrics['noise_ratio_pct']}%",
                "silhouette": kmeans_metrics["silhouette"],
                "daviesBouldin": kmeans_metrics["davies_bouldin"],
                "calinskiHarabasz": kmeans_metrics["calinski_harabasz"],
                "runtime": f"{kmeans_metrics['runtime_ms']} ms"
            },
            {
                "algorithm": "Agglomerative (Ward)",
                "clusters": agg_metrics["clusters"],
                "noisePoints": agg_metrics["noise_points"],
                "noiseRatio": f"{agg_metrics['noise_ratio_pct']}%",
                "silhouette": agg_metrics["silhouette"],
                "daviesBouldin": agg_metrics["davies_bouldin"],
                "calinskiHarabasz": agg_metrics["calinski_harabasz"],
                "runtime": f"{agg_metrics['runtime_ms']} ms"
            }
        ]
