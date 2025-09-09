import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import EmptyStateIngest from '../components/common/EmptyStateIngest'

export default function FisheriesPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.getData()
        if (mounted) setRecords(data)
      } catch (e) {
        setError('Failed to load fisheries data')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const fisheries = useMemo(() => records.filter(r => r.source === 'data.gov.in' && r.year), [records])

  return (
    <div className="container">
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">Fisheries Data</h2>
          {error && <div className="text-red-400 mb-2">{error}</div>}
          {loading ? (
            <div>Loading...</div>
          ) : fisheries.length === 0 ? (
            <EmptyStateIngest title="No Fisheries data found" description="Ingest Fisheries to view data here." onAfterIngest={async () => setRecords(await api.getData())} />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Total (Lakh Tonnes)</th>
                    <th>Marine</th>
                    <th>Inland</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {fisheries.map((d, i) => (
                    <tr key={i}>
                      <td>{String(d.year)}</td>
                      <td>{d.total_fish_production_lakh_tonnes ?? d.total ?? '—'}</td>
                      <td>{d.marine_fish_production_lakh_tonnes ?? d.marine ?? '—'}</td>
                      <td>{d.inland_fish_production_lakh_tonnes ?? d.inland ?? '—'}</td>
                      <td>{d.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


