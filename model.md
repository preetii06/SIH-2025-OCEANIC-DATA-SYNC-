# MODEL
```bash
# main.py
"""
IndOBIS Multi-species SDM service (lightweight, end-to-end)

Features
- /train_batch : Train RandomForest SDMs for multiple species (IndOBIS node UUID)
- /predict     : Point probability for a species
- /predict_grid: Probability map for a species (GeoJSON grid + PNG heatmap)
- /status      : List trained models

Keep it light:
- No parquet (uses CSV cache) -> avoids needing pyarrow/fastparquet
- No geopandas/shapely/rasterio
- Minimal deps: fastapi, uvicorn, pyobis, pandas, scikit-learn, joblib, python-dateutil, pillow

Run:
  pip install fastapi uvicorn pyobis pandas scikit-learn joblib python-dateutil pillow
  uvicorn main:app --reload --port 8000

Swagger:
  http://localhost:8000/docs
"""

import os
import io
import json
import math
import joblib
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from dateutil import parser as dtparser

import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# ML
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# Image rendering
from PIL import Image, ImageDraw

# -------------------------
# Config / Paths
# -------------------------
INDOBIS_NODE_UUID = "1a3b0f1a-4474-4d73-9ee1-d28f92a83996"

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models_cache")
DATA_CACHE = os.path.join(BASE_DIR, "data_cache")
STATIC_DIR = os.path.join(BASE_DIR, "static")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATA_CACHE, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# -------------------------
# FastAPI app
# -------------------------
app = FastAPI(title="IndOBIS SDM (Multi-species, Lightweight)")

# CORS for your dashboard/frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for PNG heatmaps
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# -------------------------
# Pydantic Schemas
# -------------------------
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

# -------------------------
# OBIS fetch (via pyobis)
# -------------------------
def fetch_occurrences_indobis(scientific_name: str, max_records: int = 5000, cache=True) -> pd.DataFrame:
    """
    Fetch IndOBIS occurrences for a species and cache as CSV (to keep deps light).
    """
    cache_file = os.path.join(DATA_CACHE, f"{scientific_name.replace(' ', '_')}_node_{INDOBIS_NODE_UUID}.csv")
    if cache and os.path.exists(cache_file):
        return pd.read_csv(cache_file)

    try:
        from pyobis import occurrences
    except Exception as e:
        raise HTTPException(status_code=500, detail="pyobis is required. pip install pyobis")

    resp = occurrences.search(scientificname=scientific_name, nodeid=INDOBIS_NODE_UUID, size=max_records).execute()

    # pyobis may return dict with "results", list, or DF-like
    if isinstance(resp, dict) and "results" in resp:
        df = pd.DataFrame(resp["results"])
    else:
        try:
            df = pd.DataFrame(resp)
        except Exception:
            raise HTTPException(status_code=500, detail="Unable to parse OBIS response for occurrences.")

    # Keep important columns if present
    keep_cols = [
        "decimalLatitude", "decimalLongitude",
        "eventDate", "year", "month",
        "minimumDepthInMeters", "maximumDepthInMeters", "depth", "depthInMeters",
        "scientificName", "basisOfRecord"
    ]
    cols = [c for c in keep_cols if c in df.columns]
    if not cols:
        raise HTTPException(status_code=500, detail="OBIS response missing essential columns.")
    df = df[cols].copy()

    # Normalize
    if "decimalLatitude" not in df.columns or "decimalLongitude" not in df.columns:
        raise HTTPException(status_code=500, detail="OBIS response missing latitude/longitude.")
    df = df.rename(columns={"decimalLatitude": "lat", "decimalLongitude": "lon"})

    # Depth
    def _depth(row):
        for col in ["minimumDepthInMeters", "maximumDepthInMeters", "depth", "depthInMeters"]:
            if col in row and pd.notna(row[col]):
                try:
                    v = float(row[col])
                    if v >= 0:
                        return v
                except:
                    pass
        return np.nan
    df["depth_m"] = df.apply(_depth, axis=1)

    # Dates
    def _parse_date(v, yr, mo):
        if pd.isna(v):
            try:
                y = int(yr) if pd.notna(yr) else 2000
                m = int(mo) if pd.notna(mo) else 1
                return datetime(y, m, 15)
            except:
                return pd.NaT
        try:
            return dtparser.parse(str(v))
        except:
            return pd.NaT

    yr = df["year"] if "year" in df.columns else pd.Series([np.nan]*len(df))
    mo = df["month"] if "month" in df.columns else pd.Series([np.nan]*len(df))
    df["eventDate_parsed"] = [
        _parse_date(df["eventDate"][i] if "eventDate" in df.columns else np.nan, yr[i], mo[i])
        for i in range(len(df))
    ]

    # Cache as CSV (no parquet dep)
    df.to_csv(cache_file, index=False)
    return df

# -------------------------
# ML helpers
# -------------------------
def make_background(df_presence: pd.DataFrame, n_background: int, seed: int = 42) -> pd.DataFrame:
    rng = np.random.RandomState(seed)
    lat_min, lat_max = df_presence["lat"].min(), df_presence["lat"].max()
    lon_min, lon_max = df_presence["lon"].min(), df_presence["lon"].max()
    if not np.isfinite([lat_min, lat_max, lon_min, lon_max]).all():
        raise HTTPException(status_code=500, detail="Presence data has invalid coordinates.")

    lats = rng.uniform(lat_min, lat_max, n_background)
    lons = rng.uniform(lon_min, lon_max, n_background)
    depths = rng.uniform(0, 500, n_background)  # naive; replace with bathymetry in prod
    dates = [datetime(2000,1,1) + pd.to_timedelta(rng.randint(0, 365*20), unit='D') for _ in range(n_background)]
    return pd.DataFrame({"lat": lats, "lon": lons, "depth_m": depths, "eventDate_parsed": dates})

def features_from_df(df: pd.DataFrame) -> pd.DataFrame:
    X = pd.DataFrame()
    X["lat"] = df["lat"].astype(float)
    X["lon"] = df["lon"].astype(float)
    X["depth_m"] = df["depth_m"].fillna(df["depth_m"].median()).astype(float)
    X["year"] = df["eventDate_parsed"].apply(lambda d: d.year if (pd.notna(d)) else 2000).astype(int)
    X["month"] = df["eventDate_parsed"].apply(lambda d: d.month if (pd.notna(d)) else 1).astype(int)
    return X

def train_single_species(scientific_name: str, max_records: int, test_size: float, random_state: int) -> Dict[str, Any]:
    df = fetch_occurrences_indobis(scientific_name, max_records=max_records, cache=True)
    # Basic QC
    df = df[(df["lat"].between(-90, 90)) & (df["lon"].between(-180, 180))]
    df = df.dropna(subset=["lat", "lon"])
    if len(df) < 30:
        return {"scientific_name": scientific_name, "status": "skipped", "reason": f"Not enough presence records ({len(df)})."}

    pres = df[["lat", "lon", "depth_m", "eventDate_parsed"]].copy()
    pres["presence"] = 1
    n_bg = max(len(pres) * 2, 1000)
    bg = make_background(pres, n_background=n_bg, seed=random_state)
    bg["presence"] = 0

    full = pd.concat([pres, bg], ignore_index=True).sample(frac=1.0, random_state=random_state)
    X = features_from_df(full)
    y = full["presence"].values

    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)
    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("rf", RandomForestClassifier(n_estimators=200, random_state=random_state, n_jobs=-1))
    ])
    pipe.fit(Xtr, ytr)
    yprob = pipe.predict_proba(Xte)[:, 1]
    try:
        auc = float(roc_auc_score(yte, yprob))
    except Exception:
        auc = None

    model_file = os.path.join(MODELS_DIR, f"{scientific_name.replace(' ', '_')}_rf.pkl")
    joblib.dump(pipe, model_file)

    meta = {
        "status": "ok",
        "scientific_name": scientific_name,
        "model_file": model_file,
        "n_presence": int(len(pres)),
        "n_background": int(len(bg)),
        "auc_test": auc,
        "trained_at": datetime.utcnow().isoformat() + "Z"
    }
    with open(os.path.join(MODELS_DIR, f"{scientific_name.replace(' ', '_')}_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)
    return meta

def load_model_meta(scientific_name: str):
    mfile = os.path.join(MODELS_DIR, f"{scientific_name.replace(' ', '_')}_rf.pkl")
    metaf = os.path.join(MODELS_DIR, f"{scientific_name.replace(' ', '_')}_meta.json")
    if not (os.path.exists(mfile) and os.path.exists(metaf)):
        raise HTTPException(status_code=404, detail=f"Model for '{scientific_name}' not found. Train it first.")
    model = joblib.load(mfile)
    with open(metaf, "r") as f:
        meta = json.load(f)
    return model, meta

# -------------------------
# Heatmap rendering (PNG)
# -------------------------
def render_heatmap_to_png(grid_probs: np.ndarray, out_path: str) -> str:
    """
    grid_probs: 2D array [rows, cols] with values in [0,1] or NaN
    Renders grayscale heatmap: darker = higher probability.
    """
    arr = grid_probs.copy()
    arr = np.nan_to_num(arr, nan=0.0)
    arr = np.clip(arr, 0.0, 1.0)
    # Convert to 0..255 (invert so high prob is dark, good for basemaps)
    img_arr = (255 * (1.0 - arr)).astype(np.uint8)
    img = Image.fromarray(img_arr, mode="L")
    img = img.resize((img.width*2, img.height*2), Image.NEAREST)  # simple upscale for visibility
    img.save(out_path)
    return out_path

def build_geojson_grid(bbox: List[float], res: float, probs: np.ndarray) -> Dict[str, Any]:
    """
    Build a simple GeoJSON FeatureCollection of square cells with a 'prob' property.
    bbox = [minLon, minLat, maxLon, maxLat]
    probs shape = [rows, cols], indexed [row(lat), col(lon)] with row 0 = north or south? We'll define:
      rows go from north->south (top to bottom),
      cols go from west->east (left to right).
    """
    minLon, minLat, maxLon, maxLat = bbox
    # Determine grid shape
    cols = int(math.ceil((maxLon - minLon) / res))
    rows = int(math.ceil((maxLat - minLat) / res))

    features = []
    for r in range(rows):
        for c in range(cols):
            # cell bounds
            south = maxLat - (r+1)*res
            north = maxLat - (r)*res
            west  = minLon + c*res
            east  = minLon + (c+1)*res
            p = float(probs[r, c]) if np.isfinite(probs[r, c]) else None
            poly = [
                [west, south],
                [east, south],
                [east, north],
                [west, north],
                [west, south]
            ]
            features.append({
                "type": "Feature",
                "properties": {"prob": p},
                "geometry": {"type": "Polygon", "coordinates": [poly]}
            })
    return {"type": "FeatureCollection", "features": features}

# -------------------------
# API Endpoints
# -------------------------
@app.get("/")
def root():
    return {"service": "IndOBIS SDM (multi-species)", "docs": "/docs"}

@app.get("/status")
def status():
    out = []
    for f in os.listdir(MODELS_DIR):
        if f.endswith("_meta.json"):
            with open(os.path.join(MODELS_DIR, f), "r") as fh:
                out.append(json.load(fh))
    return {"models": out}

@app.post("/train_batch")
def train_batch(req: TrainBatchRequest):
    """
    Train models for multiple species (one model per species).
    Returns an array of per-species results.
    """
    results = []
    for sp in req.species:
        try:
            meta = train_single_species(
                scientific_name=sp,
                max_records=req.max_records,
                test_size=req.test_size,
                random_state=req.random_state
            )
            results.append(meta)
        except HTTPException as e:
            results.append({"scientific_name": sp, "status": "error", "detail": e.detail})
        except Exception as e:
            results.append({"scientific_name": sp, "status": "error", "detail": str(e)})
    return {"status": "done", "results": results}

@app.post("/predict")
def predict_point(req: PredictRequest):
    """
    Predict probability of occurrence for a species at a single point.
    """
    model, meta = load_model_meta(req.scientific_name)
    if req.event_date:
        try:
            dt = dtparser.parse(req.event_date)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid event_date. Use ISO format e.g. '2020-03-01'.")
    else:
        dt = datetime.utcnow()

    row = pd.DataFrame([{
        "lat": float(req.latitude),
        "lon": float(req.longitude),
        "depth_m": float(req.depth_m) if req.depth_m is not None else np.nan,
        "eventDate_parsed": dt
    }])
    X = features_from_df(row)
    proba = float(model.predict_proba(X)[:, 1][0])
    return {"scientific_name": req.scientific_name, "probability": proba, "meta": meta}

@app.post("/predict_grid")
def predict_grid(req: PredictGridRequest):
    """
    Produce a probability map for a species over a bounding box.
    Returns:
      - geojson (FeatureCollection of square cells with 'prob')
      - heatmap_png_url (static path to PNG)
      - meta
    """
    model, meta = load_model_meta(req.scientific_name)
    minLon, minLat, maxLon, maxLat = req.bbox
    if not (minLon < maxLon and minLat < maxLat):
        raise HTTPException(status_code=400, detail="Invalid bbox. Use [minLon, minLat, maxLon, maxLat].")
    res = float(req.grid_resolution)

    # Compute grid shape
    cols = int(math.ceil((maxLon - minLon) / res))
    rows = int(math.ceil((maxLat - minLat) / res))
    if cols * rows > 40000:
        # keep it light; ~<=40k cells
        raise HTTPException(status_code=400, detail="Grid too large. Increase grid_resolution or shrink bbox.")

    # Build cell centers for prediction
    lons = np.linspace(minLon + res/2.0, maxLon - res/2.0, num=cols)
    lats = np.linspace(maxLat - res/2.0, minLat + res/2.0, num=rows)  # north->south
    lon_grid, lat_grid = np.meshgrid(lons, lats)  # shapes [rows, cols]

    if req.event_date:
        try:
            dt = dtparser.parse(req.event_date)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid event_date.")
    else:
        dt = datetime.utcnow()

    depth_val = float(req.depth_m) if (req.depth_m is not None) else np.nan

    df_pts = pd.DataFrame({
        "lat": lat_grid.ravel(),
        "lon": lon_grid.ravel(),
        "depth_m": depth_val,
        "eventDate_parsed": [dt]* (rows*cols)
    })

    X = features_from_df(df_pts)
    probs = model.predict_proba(X)[:, 1].reshape(rows, cols)

    # Build GeoJSON
    geojson = build_geojson_grid(req.bbox, res, probs)

    # Save PNG heatmap
    png_name = f"{req.scientific_name.replace(' ', '_')}_{abs(hash((tuple(req.bbox), res, depth_val, dt.isoformat())))}.png"
    png_path = os.path.join(STATIC_DIR, png_name)
    render_heatmap_to_png(probs, png_path)
    png_url = f"/static/{png_name}"

    return {
        "scientific_name": req.scientific_name,
        "bbox": req.bbox,
        "grid_resolution": res,
        "heatmap_png_url": png_url,
        "geojson": geojson,
        "meta": meta
    }

```
