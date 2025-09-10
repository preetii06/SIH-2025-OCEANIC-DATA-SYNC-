from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Tuple
class TrainBatchRequest(BaseModel):
    species: List[str] = Field(..., description="List of scientific names to train, e.g., ['Pseudanchialina pusilla', 'Thunnus albacares']")
    max_records: int = Field(5000, ge=200, le=50000)
    test_size: float = Field(0.2, ge=0.05, le=0.5)
    random_state: int = 42

class PredictRequest(BaseModel):
    scientific_name: str
    latitude: float
    longitude: float
    depth_m: Optional[float] = None
    event_date: Optional[str] = None  # ISO date

class PredictGridRequest(BaseModel):
    scientific_name: str
    # bbox as [minLon, minLat, maxLon, maxLat]
    bbox: List[float] = Field(..., min_items=4, max_items=4)
    # grid_resolution in degrees (e.g., 0.25 ~ ~25km at equator). Keep modest for speed.
    grid_resolution: float = Field(0.25, gt=0.01, le=2.0)
    depth_m: Optional[float] = None
    event_date: Optional[str] = None  # ISO date