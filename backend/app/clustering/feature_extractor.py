"""
Trajectory Feature Vector Extraction & Normalization Module.
Transforms variable-length time-stamped camera sequences and spatial coordinates
into fixed-dimensional feature vectors for unsupervised machine learning clustering.
"""

import json
import numpy as np
from typing import List, Tuple, Dict, Any
from sklearn.preprocessing import StandardScaler

from backend.app.models.trajectory import Trajectory
from backend.app.models.camera import Camera

class TrajectoryFeatureExtractor:
    @staticmethod
    def extract_features(trajectories: List[Trajectory]) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Extracts fixed-dimensional spatial-temporal feature vectors from trajectory entities.
        
        Features per trajectory:
        0: Origin latitude
        1: Origin longitude
        2: Destination latitude
        3: Destination longitude
        4: Spatial displacement dx (lon diff)
        5: Spatial displacement dy (lat diff)
        6: Route distance in kilometers
        7: Travel duration in seconds
        8: Average transit velocity (km/h)
        9: Number of camera hops (sequence length)
        10: Start hour of day (0.0 to 24.0)
        """
        if not trajectories:
            return np.empty((0, 11)), []

        raw_features = []
        meta_info = []

        for t in trajectories:
            try:
                coords = json.loads(t.geojson_path).get("coordinates", [])
            except Exception:
                coords = []

            if coords and len(coords) >= 2:
                orig_lon, orig_lat = coords[0]
                dest_lon, dest_lat = coords[-1]
            else:
                orig_lon, orig_lat = -74.0060, 40.7128
                dest_lon, dest_lat = -73.9352, 40.7306

            dx = dest_lon - orig_lon
            dy = dest_lat - orig_lat
            dur_sec = max(1.0, float(t.duration_seconds))
            dist_km = max(0.1, float(t.distance_km))
            speed_kmh = (dist_km / (dur_sec / 3600.0))

            try:
                seq = json.loads(t.camera_sequence)
                hops = len(seq)
            except Exception:
                hops = 2

            start_hour = float(t.start_timestamp.hour) + (float(t.start_timestamp.minute) / 60.0)

            vec = [
                orig_lat,
                orig_lon,
                dest_lat,
                dest_lon,
                dx,
                dy,
                dist_km,
                dur_sec,
                speed_kmh,
                float(hops),
                start_hour
            ]
            raw_features.append(vec)
            meta_info.append({
                "trajectory_id": t.trajectory_id,
                "category": t.vehicle_category,
                "description": t.vehicle_description,
                "distance_km": dist_km,
                "duration_sec": dur_sec,
                "duration_str": t.duration_str,
                "camera_sequence": seq if 'seq' in locals() else []
            })

        X = np.array(raw_features, dtype=float)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        return X_scaled, meta_info
