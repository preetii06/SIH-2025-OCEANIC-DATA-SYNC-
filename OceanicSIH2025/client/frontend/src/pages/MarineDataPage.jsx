import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import OpenMeteo from '../components/Dashboard/OpenMeteo'
import EmptyStateIngest from '../components/common/EmptyStateIngest'

export default function MarineDataPage() {
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
        setError('Failed to load Open-Meteo data')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const openMeteoRecords = useMemo(() => records.filter(r => r.source?.toLowerCase().includes('open-meteo')), [records])

  return (
    <div className="container">
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">Marine Data (Open-Meteo)</h2>
          {error && <div className="text-red-400 mb-2">{error}</div>}
          {openMeteoRecords.length === 0 ? (
            <EmptyStateIngest title="No Open-Meteo data found" description="Ingest Open-Meteo data to view climate visualizations." onAfterIngest={async () => setRecords(await api.getData())} />
          ) : (
            <OpenMeteo records={openMeteoRecords} />
          )}
        </div>
      </div>
    </div>
  )
}


