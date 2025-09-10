# 🌊 OCEANIC SIH 2025 — Project Setup Guide

```
Sardinella longiceps (Indian oil sardine) – very common in Indian Ocean fisheries.
Thunnus albacares (Yellowfin tuna) – globally distributed, lots of OBIS records.
Delphinus delphis (Common dolphin) – plenty of marine mammal sightings.
Epinephelus coioides (Orange-spotted grouper) – strong fisheries + ecological data.
Charybdis feriata (Crab species, Indo-Pacific) – also present in OBIS.
```
# colab link
```
https://colab.research.google.com/drive/1LSPirUEpJHhjRHbhm7g2mbZys41bDBAi?usp=sharing
```
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


## api.js 
Add this : 
```bash
export async function ingestNOAA(station, product, begin_date, end_date) {
  const res = await fetch(`${API_URL}/ingest/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "noaa",
      payload: {
        station,
        product,
        begin_date,
        end_date,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "NOAA ingestion failed");
  }

  const data = await res.json();
  return data.records || [];
}
```
- export default mein ingestNOAA add krna
-  NOAAChart.jsx :-
  
```bash

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  Legend, CartesianGrid, ResponsiveContainer
} from 'recharts';

const NOAAChart = ({ records }) => {
  if (!records.length) return <p className="text-gray-500 italic">No NOAA data yet</p>;

  // Group records by timestamp
  const dataMap = {};
  records.forEach(r => {
    const ts = new Date(r.timestamp).toLocaleString();
    if (!dataMap[ts]) dataMap[ts] = { timestamp: ts };
    dataMap[ts][r.parameter] = Number(r.value);
  });

  const chartData = Object.values(dataMap).sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  const parameters = [...new Set(records.map(r => r.parameter))];

  // Compute summary stats
  const summary = parameters.map(param => {
    const values = records.filter(r => r.parameter === param).map(r => Number(r.value));
    return {
      parameter: param,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
    };
  });

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h3 className="text-lg font-semibold mb-2">NOAA Parameter Trends</h3>

        {/* Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {summary.map(({ parameter, min, max, avg }) => (
            <div key={parameter} className="bg-blue-50 p-3 rounded shadow-sm border">
              <h4 className="font-medium text-blue-700 capitalize">{parameter.replace("_", " ")}</h4>
              <p className="text-sm text-gray-600">Min: {min}</p>
              <p className="text-sm text-gray-600">Max: {max}</p>
              <p className="text-sm text-gray-600">Avg: {avg}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            {parameters.map((param, idx) => (
              <Line
                key={param}
                type="monotone"
                dataKey={param}
                stroke={["#8884d8", "#82ca9d", "#ff7300", "#387908", "#00bcd4", "#e91e63"][idx % 6]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NOAAChart;

```
- NOAAControl.jsx

```bash
import { useState } from "react";
import api from "../../services/api";

const paramsList = [
  "water_level", "water_temperature", "air_temperature",
  "wind", "air_pressure", "visibility", "salinity"
];

export default function NOAAControls({ onFetched }) {
  const [station, setStation] = useState("8723214");
  const [selected, setSelected] = useState(["salinity"]);
  const [begin, setBegin] = useState("20250101");
  const [end, setEnd] = useState("20250105");
  const [loading, setLoading] = useState(false);

  const toggleParam = (p) =>
    setSelected((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  async function fetchNOAA() {
    setLoading(true);
    try {
      if (!station || selected.length === 0) {
        alert("Please enter a station ID and select at least one parameter.");
        setLoading(false);
        return;
      }

      const allRecords = [];

      for (const product of selected) {
        const records = await api.ingestNOAA(station, product, begin, end);
        const tagged = records.map(r => ({
          ...r,
          source: "noaa",
          station,
          parameter: product,
          fetchedAt: new Date().toISOString(),
        }));
        allRecords.push(...tagged);
      }

      onFetched(allRecords);
    } catch (e) {
      console.error(e);
      alert("Failed to fetch NOAA data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        className="input mb-2"
        placeholder="Station ID (e.g., 8723214)"
        value={station}
        onChange={(e) => setStation(e.target.value)}
      />
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          className="input"
          placeholder="Begin (YYYYMMDD)"
          value={begin}
          onChange={(e) => setBegin(e.target.value)}
        />
        <input
          type="text"
          className="input"
          placeholder="End (YYYYMMDD)"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-1 mb-3">
        {paramsList.map((p) => (
          <label key={p} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={selected.includes(p)}
              onChange={() => toggleParam(p)}
            />
            {p}
          </label>
        ))}
      </div>
      <button className="btn btn-primary w-full" onClick={fetchNOAA} disabled={loading}>
        {loading ? "Loading..." : "Fetch NOAA Data"}
      </button>
    </div>
  );
}
```
