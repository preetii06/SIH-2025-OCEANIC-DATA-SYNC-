
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


@app.get("/data/")
def get_data() -> List[Dict[str, Any]]:
    return database




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