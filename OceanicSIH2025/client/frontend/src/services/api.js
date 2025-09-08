// import axios from 'axios'

// const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// const client = axios.create({
//   baseURL: BASE_URL,
//   timeout: 20000,
// })

// async function ingest(provider, payload) {
//   const { data } = await client.post('/ingest/', { provider, payload })
//   return data
// }

// async function getData() {
//   const { data } = await client.get('/data/')
//   return data
// }

// export default { ingest, getData }

// src/services/api.js
// src/services/api.js
const API_URL = "http://localhost:8000"; // change to deployed backend later

// 🔹 Generic: get all stored records
async function getData() {
  const res = await fetch(`${API_URL}/data/`);
  if (!res.ok) throw new Error("Failed to fetch data");
  return await res.json();
}

// 🔹 Generic: ingest any provider
async function ingest(provider, payload) {
  const res = await fetch(`${API_URL}/ingest/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, payload }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Ingest failed");
  }
  return await res.json();
}

// 🔹 NOAA: dedicated function (singular product)
async function getNOAARecord({ station, product, begin_date, end_date }) {
  if (!station || !product) {
    throw new Error("Station and product are required");
  }

  const res = await fetch(`${API_URL}/providers/noaa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      station,
      product,
      begin_date,
      end_date,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch NOAA data");
  }

  return await res.json();
}

export default { getData, ingest, getNOAARecord };


