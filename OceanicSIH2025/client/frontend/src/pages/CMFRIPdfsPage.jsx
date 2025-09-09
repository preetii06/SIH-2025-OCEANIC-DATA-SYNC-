import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import EmptyStateIngest from '../components/common/EmptyStateIngest'

export default function CMFRIPdfsPage() {
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
        setError('Failed to load CMFRI data')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const cmfri = useMemo(() => records.filter(r => (r.source || '').toLowerCase().includes('cmfri')), [records])

  return (
    <div className="container">
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">CMFRI PDFs</h2>
          {error && <div className="text-red-400 mb-2">{error}</div>}
          {loading ? (
            <div>Loading...</div>
          ) : cmfri.length === 0 ? (
            <EmptyStateIngest title="No CMFRI data found" description="Ingest CMFRI PDFs to parse and show tabular data." onAfterIngest={async () => setRecords(await api.getData())} />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Year</th>
                    <th>Region</th>
                    <th>Metric</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {cmfri.map((r, i) => (
                    <tr key={i}>
                      <td>{r.report || r.file || '—'}</td>
                      <td>{r.year || '—'}</td>
                      <td>{r.region || r.state || '—'}</td>
                      <td>{r.metric || r.parameter || '—'}</td>
                      <td>{r.value ?? '—'}</td>
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


