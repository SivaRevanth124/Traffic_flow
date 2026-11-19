from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.database.session import get_db
from backend.app.services.clustering_service import ClusteringService
from backend.app.schemas.clustering import (
    ClusteringRunRequest,
    ClusteringRunResponse,
    AlgorithmComparisonItem,
    ClusterBreakdownItem
)

router = APIRouter(prefix="/clustering", tags=["Machine Learning Route Clustering"])

@router.post("/run", response_model=ClusteringRunResponse)
def execute_clustering(payload: ClusteringRunRequest, db: Session = Depends(get_db)):
    """Executes unsupervised clustering (K-Means, DBSCAN, or Agglomerative) on trajectory feature vectors."""
    try:
        params = {
            "k": payload.k,
            "eps": payload.eps,
            "min_samples": payload.min_samples,
            "linkage": payload.linkage
        }
        result = ClusteringService.execute_clustering(
            algorithm=payload.algorithm,
            params=params,
            db=db
        )
        return ClusteringRunResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Clustering execution failure: {str(e)}")

@router.get("/compare", response_model=List[AlgorithmComparisonItem])
def compare_clustering_algorithms(db: Session = Depends(get_db)):
    """Benchmarking studio: compares DBSCAN, K-Means, and Agglomerative Clustering on the same trajectory space."""
    comparison = ClusteringService.compare_all_algorithms(db)
    return [AlgorithmComparisonItem(**item) for item in comparison]
