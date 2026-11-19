from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ClusteringRunRequest(BaseModel):
    algorithm: str = Field(..., description="'kmeans', 'dbscan', or 'agglomerative'")
    k: Optional[int] = Field(5, ge=2, le=20)
    eps: Optional[float] = Field(0.45, ge=0.05, le=5.0)
    min_samples: Optional[int] = Field(2, ge=1, le=20)
    linkage: Optional[str] = Field("ward", description="'ward', 'complete', or 'average'")

class ClusterMetrics(BaseModel):
    algorithm: str
    clusters: int
    total_samples: int
    noise_points: int
    noise_ratio_pct: float
    silhouette: float
    davies_bouldin: float
    calinski_harabasz: float
    runtime_ms: float
    memory_dim: int

class ClusterBreakdownItem(BaseModel):
    cluster_id: int
    name: str
    count: int
    avgTime: str
    dominantClass: str

class OutlierTrajectoryItem(BaseModel):
    trajectory_id: str
    vehicle_category: str
    description: str
    duration_str: str
    distance_km: float
    camera_sequence: List[str]

class ClusteringRunResponse(BaseModel):
    algorithm: str
    parameters: Dict[str, Any]
    metrics: ClusterMetrics
    cluster_breakdown: List[ClusterBreakdownItem]
    outliers_count: int
    outliers: List[OutlierTrajectoryItem]

class AlgorithmComparisonItem(BaseModel):
    algorithm: str
    clusters: int
    noisePoints: int
    noiseRatio: str
    silhouette: float
    daviesBouldin: float
    calinskiHarabasz: float
    runtime: str
