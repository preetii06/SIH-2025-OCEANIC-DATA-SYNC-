import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'

import Navbar from './Navbar'
import StatsPanel from './StatsPanel'
import FisheriesChart from './FisheriesChart'
import BiodiversityMap from './BiodiversityMap'
import ProviderButtons from './ProviderButtons'
import NOAAChart from '../Charts/NOAAChart'

export default function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [records, setRecords] = useState([])
  // -----------------------------
  // Derived provider-specific data
  // -----------------------------
  const obisPoints = useMemo(
    () => records.filter(r => r.source?.toLowerCase().startsWith('obis') && r.latitude && r.longitude),
    [records]
  )

  const fisheries = useMemo(
    () => records.filter(r => r.source === 'data.gov.in' && r.year),
    [records]
  )

  const noaaRecords = useMemo(
    () => records.filter(r => r.source?.toLowerCase().includes('noaa')),
    [records]
  )

  // -----------------------------
  // KPIs
  // -----------------------------
  const kpis = useMemo(() => {
    const total = records.length
    const providers = new Set(records.map(r => (r.source || '').split('/')[0]))
    const speciesCount = new Set(records.filter(r => r.species).map(r => r.species)).size
    const latestYear = fisheries.reduce(
      (acc, v) => Math.max(acc, Number(String(v.year).slice(0, 4)) || 0),
      0
    )
    return { total, providers: providers.size, speciesCount, latestYear }
  }, [records, fisheries])

  // -----------------------------
  // Fetch + Ingest
  // -----------------------------
  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      // NOAA configs: one product per ingest
      const noaaConfigs = [
        { station: '8723214', product: 'water_temperature', begin_date: '20250101', end_date: '20250105' },
        { station: '8723214', product: 'air_pressure', begin_date: '20250101', end_date: '20250105' },
        { station: '8724580', product: 'water_temperature', begin_date: '20250101', end_date: '20250105' },
      ]

      // Ingest all configs sequentially
      for (const cfg of noaaConfigs) {
        await api.ingest('noaa', cfg)
      }

      const data = await api.getData()
      console.log("Fetched records:", data) // debug log
      setRecords(data)
    } catch (e) {
      console.error(e)
      setError('Failed to load data. Try ingesting providers below.')
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------
  // Chart Data
  // -----------------------------
  const fisheriesChartData = useMemo(() => {
    return [...fisheries]
      .map(d => ({
        year: String(d.year),
        total: Number(d.total_fish_production_lakh_tonnes ?? d.total) || 0,
        marine: Number(d.marine_fish_production_lakh_tonnes ?? d.marine) || 0,
        inland: Number(d.inland_fish_production_lakh_tonnes ?? d.inland) || 0,
      }))
      .sort((a, b) => a.year.localeCompare(b.year))
  }, [fisheries])

  const center = obisPoints.length
    ? [obisPoints[0].latitude, obisPoints[0].longitude]
    : [20.5937, 78.9629]

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="container">
      <Navbar />
      <StatsPanel kpis={kpis} />

      <div className="grid grid-3" style={{ gap: 24 }}>
        {/* Records Table */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-body">
            <h2 className="card-title">Data Records</h2>
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Timestamp</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td>{r.source}</td>
                      <td>{new Date(r.timestamp).toLocaleString()}</td>
                      <td>
                        {r.parameter ? (
                          <>
                            <strong>{r.parameter}</strong>: {r.value} {r.unit || ''}
                            <br />
                            Station: {r.station}
                          </>
                        ) : (
                          r.species || r.year || '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Provider Ingestion Panel */}
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">Ingest Providers</h2>
            {error && (
              <div
                style={{
                  background: '#3b1d2a',
                  color: '#ffb4c8',
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 8,
                }}
              >
                {error}
              </div>
            )}
            <ProviderButtons onAfterIngest={fetchData} />
          </div>
        </div>

        {/* NOAA Chart */}
        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="card-body">
            <h2 className="card-title">NOAA Parameters</h2>
            <NOAAChart records={noaaRecords} />
          </div>
        </div>
      </div>
    </div>
  )
}
