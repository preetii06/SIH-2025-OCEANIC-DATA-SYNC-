
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import os
from dotenv import load_dotenv
# from providers import fetch_open_meteo, fetch_fisheries, fetch_noaa , fetch_obis , fetch_worms , fetch_bold, fetch_csv, fetch_ftp
from providers.fetch_open_meteo import fetch_open_meteo
from providers.fetch_csv import fetch_csv
from providers.fetch_fisheries import fetch_fisheries
from providers.fetch_noaa import fetch_noaa
from providers.fetch_obis import fetch_obis
from providers.fetch_worms import fetch_worms
from providers.fetch_bold import fetch_bold
from providers.fetch_ftp import fetch_ftp
# from providers.fetch_cmfri import display_report
from fastapi import APIRouter, Body 

import datetime
import requests 
load_dotenv()

from fastapi.middleware.cors import CORSMiddleware
# uvicorn main:app --reload

app = FastAPI(
    title="Scalable Data Ingestion API",
    description="Backend to fetch and standardize data from multiple providers",
    version="1.0.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to ["http://localhost:5173"] for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

database: List[Dict[str, Any]] = []

router = APIRouter()


# 🔹 NOAA fetch wrapper (singular product)
def get_noaa_record(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Payload example:
    {
        "station": "8723214",
        "product": "water_temperature",
        "begin_date": "20250101",
        "end_date": "20250105"
    }
    """
    product = payload.get("product")
    if not product or not isinstance(product, str):
        raise HTTPException(status_code=400, detail="Must provide 'product' as a string")

    records = fetch_noaa(payload)  # assumes fetch_noaa handles one product
    return records


PROVIDERS = {
    "open-meteo": fetch_open_meteo,
    "noaa": get_noaa_record,  # 🔹 now singular product
    "obis": fetch_obis,
    "worms": fetch_worms,
    "bold": fetch_bold,
    "fisheries": lambda payload: fetch_fisheries(
        payload, api_key=os.environ.get("DATA_GOV_API_KEY")
    ),
    "csv": fetch_csv,
    "ftp": fetch_ftp,
    # "cmfri": display_report,
}


# Request model
class IngestRequest(BaseModel):
    provider: str
    payload: Dict[str, Any]


@router.post("/providers/noaa")
def noaa_endpoint(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    return get_noaa_record(payload)


@app.post("/ingest/")
def ingest(req: IngestRequest):
    provider = req.provider
    payload = req.payload

    if provider not in PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    try:
        records = PROVIDERS[provider](payload)
        database.extend(records)
        return {"status": "success", "records": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")


import json
from datetime import datetime
from dateutil import parser as dtparser
from models.aidata_models import TrainBatchRequest, PredictRequest, PredictGridRequest  
import numpy as np
import pandas as pd
import math
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


from aimodel import (
    features_from_df,
    build_geojson_grid,
    render_heatmap_to_png,
    train_single_species,
    load_model_meta,
    interpret_prob ,
    safe_float 
)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models_cache")
DATA_CACHE = os.path.join(BASE_DIR, "data_cache")
STATIC_DIR = os.path.join(BASE_DIR, "static")
@app.get("/data/")
def get_data() -> List[Dict[str, Any]]:
    return database

# Model end-points 
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

 
# ---------- Update predict endpoint to echo coords + interpretation ----------
@app.post("/predict")
def predict_point(req: PredictRequest):
    model, meta = load_model_meta(req.scientific_name)
    if req.event_date:
        try:
            dt = dtparser.parse(req.event_date)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid event_date. Use ISO format e.g. '2020-03-01'.")
    else:
        dt = datetime.utcnow()

    lat = safe_float(req.latitude)
    lon = safe_float(req.longitude)
    depth = safe_float(req.depth_m)

    row = pd.DataFrame([{
        "lat": lat,
        "lon": lon,
        "depth_m": depth,
        "eventDate_parsed": dt
    }])
    X = features_from_df(row)
    proba = safe_float(model.predict_proba(X)[:, 1][0])
    label = interpret_prob(proba)

    return {
        "scientific_name": req.scientific_name,
        "probability": proba,
        "interpretation": label,
        "query": {
            "latitude": lat,
            "longitude": lon,
            "depth_m": depth,
            "event_date": dt.isoformat()
        },
        "meta": meta
    }


# ---------- Add endpoint to remove a model (delete files) ----------
@app.post("/remove_model")
def remove_model(body: Dict[str, str] = Body(...)):
    """
    Remove a trained model and its metadata from the cache.
    Body: {"scientific_name": "Thunnus albacares"}
    """
    name = body.get("scientific_name")
    if not name:
        raise HTTPException(status_code=400, detail="scientific_name is required")
    mfile = os.path.join(MODELS_DIR, f"{name.replace(' ', '_') }_rf.pkl")
    metaf = os.path.join(MODELS_DIR, f"{name.replace(' ', '_')}_meta.json")
    removed = []
    for f in (mfile, metaf):
        try:
            if os.path.exists(f):
                os.remove(f)
                removed.append(os.path.basename(f))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to remove {f}: {e}")
    return {"removed": removed, "scientific_name": name}


@app.get("/list_models")
def list_models():
    results = []
    files = os.listdir(MODELS_DIR)
    print("Listed Models are :", files) 
    for f in os.listdir(MODELS_DIR):
        if f.endswith("_meta.json"):
            path = os.path.join(MODELS_DIR, f)
            try:
                with open(path, "r") as fp:
                    meta = json.load(fp)
                results.append(meta)
            except Exception as e:
                print(f"Failed to load {f}: {e}")
    print("DEBUG: Found meta files:", os.listdir(MODELS_DIR))  # <-- add this
    results.sort(key=lambda m: m.get("trained_at", ""), reverse=True)
    return {"models": results}

@app.post("/predict_grid")
def predict_grid(req: PredictGridRequest):
    model, meta = load_model_meta(req.scientific_name)
    minLon, minLat, maxLon, maxLat = req.bbox
    if not (minLon < maxLon and minLat < maxLat):
        raise HTTPException(status_code=400, detail="Invalid bbox. Use [minLon, minLat, maxLon, maxLat].")
    res = float(req.grid_resolution)

    cols = int(math.ceil((maxLon - minLon) / res))
    rows = int(math.ceil((maxLat - minLat) / res))
    if cols * rows > 40000:
        raise HTTPException(status_code=400, detail="Grid too large. Increase grid_resolution or shrink bbox.")

    lons = np.linspace(minLon + res/2.0, maxLon - res/2.0, num=cols)
    lats = np.linspace(maxLat - res/2.0, minLat + res/2.0, num=rows)
    lon_grid, lat_grid = np.meshgrid(lons, lats)

    dt = dtparser.parse(req.event_date) if req.event_date else datetime.utcnow()
    depth_val = safe_float(req.depth_m)

    df_pts = pd.DataFrame({
        "lat": lat_grid.ravel(),
        "lon": lon_grid.ravel(),
        "depth_m": depth_val,
        "eventDate_parsed": [dt]* (rows*cols)
    })

    X = features_from_df(df_pts)
    probs_flat = model.predict_proba(X)[:, 1]
    probs = probs_flat.reshape(rows, cols)

    features = []
    hotspot_centroids = []
    prob_values = []
    prob_threshold_hotspot = 0.7
    prob_threshold_cold = 0.3

    for r in range(rows):
        for c in range(cols):
            south = maxLat - (r+1)*res
            north = maxLat - r*res
            west = minLon + c*res
            east = minLon + (c+1)*res

            p_val = safe_float(probs[r, c])
            prob_values.append(p_val if p_val is not None else 0.0)

            poly = [
                [west, south],
                [east, south],
                [east, north],
                [west, north],
                [west, south]
            ]
            features.append({
                "type": "Feature",
                "properties": {"prob": p_val},
                "geometry": {"type": "Polygon", "coordinates": [poly]}
            })
            if p_val is not None and p_val >= prob_threshold_hotspot:
                hotspot_centroids.append({
                    "lat": safe_float((north + south)/2.0),
                    "lon": safe_float((west + east)/2.0),
                    "prob": p_val
                })

    geojson = {"type": "FeatureCollection", "features": features}

    png_name = f"{req.scientific_name.replace(' ', '_')}_{abs(hash((tuple(req.bbox), res, depth_val, dt.isoformat())))}.png"
    png_path = os.path.join(STATIC_DIR, png_name)
    render_heatmap_to_png(probs, png_path)
    png_url = f"/static/{png_name}"

    avg_prob = safe_float(np.nanmean(probs))
    hotspots = int(np.sum(probs > prob_threshold_hotspot))
    coldspots = int(np.sum(probs < prob_threshold_cold))

    hist_counts, bin_edges = np.histogram(prob_values, bins=5, range=(0.0, 1.0))
    bin_edges = [safe_float(x) for x in bin_edges]

    return {
        "scientific_name": req.scientific_name,
        "bbox": req.bbox,
        "grid_resolution": res,
        "heatmap_png_url": png_url,
        "geojson": geojson,
        "summary": {
            "average_probability": avg_prob,
            "hotspots_cells": hotspots,
            "coldspots_cells": coldspots,
            "total_cells": rows * cols
        },
        "prob_breaks": {
            "hotspot_threshold": prob_threshold_hotspot,
            "coldspot_threshold": prob_threshold_cold,
            "bin_edges": bin_edges,
            "hist_counts": [int(x) for x in hist_counts.tolist()]
        },
        "hotspot_centroids": hotspot_centroids,
        "meta": meta
    }



# from tools.cmfritool import scrape_technical_reports
# print(scrape_technical_reports(year="2023", limit=2)) # here year is not working

# from tools.cmfritool import download_pdf
# fp = download_pdf("https://eprints.cmfri.org.in/18344/1/Marine%20Fish%20Landings%20in%20India_2023.pdf")
# print(fp)  # path

# from tools.parsetool import extract_text, extract_tables, split_sections_from_text, clean_tables
# res = extract_text(fp)
# print("pages:", res['page_count'], "charlen:", len(res['full_text']))
# if res['pages'] and len(res['pages']) > 0:
#     print("page0 preview:", res['pages'][0][:300])
# else:
#     print("No pages extracted from PDF.")
    
# print("page0 preview:", res['pages'][0][:300])
# sections = split_sections_from_text(res['full_text'])
# print("sections:", sections.keys())
# tables_raw = extract_tables(fp)
# print("tables found:", len(tables_raw))
# tables = clean_tables(tables_raw)
# print("clean tables:", tables[:2])