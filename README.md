# 🌊 OCEANIC SIH 2025 — Project Setup Guide
# colab link
` https://colab.research.google.com/drive/1LSPirUEpJHhjRHbhm7g2mbZys41bDBAi?usp=sharing `
## 🖥️ Frontend (ReactJS)
**Directory:** `OcenicSIH2025/client/frontend`

### Steps to Run:
```bash
cd OcenicSIH2025/client/frontend
npm install
npm run dev
```

🧠 Backend (FastAPI) 
Directory: server
{From the root directory}
```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

uvicorn main:app --reload

```

- Access SWAGGER UI {TO TEST API'S}:
- Open your browser and visit: `http://127.0.0.1:8000/docs`

- Deactivate the virtual environment when done:`deactivate`


# TO TRY ON THE API PROVIDERS WE ARE USING :
on swaggerUI :http://127.0.0.1:8000/docs 

Body of req :

# NOAA :
```
{
  "provider": "noaa",
  "payload": {
    "station": "8723214",
    "product": "air_pressure",
    "begin_date": "20250801",
    "end_date": "20250803"
  }
}

```
# WORMS
```

{
  "provider": "worms",
  "payload": {
    "endpoint": "AphiaRecordsByName",
    "params": {
      "scientificname": "Panulirus homarus"
    },
    "limit": 5
  }
}
```

# OPEN-METEO
```
{
  "provider": "open-meteo",
  "payload": {
    "latitude": 15.0,
    "longitude": 73.0,
    "hourly": [
      "wave_height",
      "wave_direction",
      "wave_period",
      "sea_surface_temperature",
      "ocean_current_velocity",
      "ocean_current_direction",
      "swell_wave_height",
      "swell_wave_period"
    ]
  }
}
```
# OBIS 
```
{
  "provider": "obis",
  "payload": {
    "endpoint": "occurrence",
    "params": {
      "scientificname": "Sardinella",
      "size": 5
    }
  }
}

```

