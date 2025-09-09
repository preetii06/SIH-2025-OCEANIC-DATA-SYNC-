import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import ObisTable from '../components/Dashboard/ObisTable'
import ObisDepthChart from '../components/Charts/ObisDepthChart'
import EmptyStateIngest from '../components/common/EmptyStateIngest'

export default function ObisRecordsPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [obisQuery, setObisQuery] = useState('')
  const [obisDepthMin, setObisDepthMin] = useState('')
  const [obisDepthMax, setObisDepthMax] = useState('')
  const [obisDateFrom, setObisDateFrom] = useState('')
  const [obisDateTo, setObisDateTo] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.getData()
        if (mounted) setRecords(data)
      } catch (e) {
        setError('Failed to load OBIS data')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const obisRecords = useMemo(
    () => records.filter(r => r.source?.toLowerCase().startsWith('obis')),
    [records]
  )

  const filteredObisRecords = useMemo(() => {
    const query = (obisQuery || '').toLowerCase()
    const minD = obisDepthMin === '' ? -Infinity : Number(obisDepthMin)
    const maxD = obisDepthMax === '' ? Infinity : Number(obisDepthMax)
    const from = obisDateFrom ? new Date(obisDateFrom) : null
    const to = obisDateTo ? new Date(obisDateTo) : null
    return obisRecords.filter(r => {
      const nameMatch = !query || (r.species || '').toLowerCase().includes(query)
      const depthVal = typeof r.depth === 'number' ? r.depth : Number.isFinite(Number(r.depth)) ? Number(r.depth) : null
      const depthMatch = depthVal === null ? true : (depthVal >= minD && depthVal <= maxD)
      const dateVal = r.eventDate ? new Date(r.eventDate) : null
      const dateMatch = (!from || (dateVal && dateVal >= from)) && (!to || (dateVal && dateVal <= to))
      return nameMatch && depthMatch && dateMatch
    })
  }, [obisRecords, obisQuery, obisDepthMin, obisDepthMax, obisDateFrom, obisDateTo])

  return (
    <div className="container">
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">OBIS Oceanic Records</h2>
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <div className="flex" style={{ gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <label className="label" style={{ marginBottom: 6, marginRight: 62 }}>Species</label>
              <input type="text" value={obisQuery} onChange={(e) => setObisQuery(e.target.value)} placeholder="e.g., Sardinella" className="input bg-slate-900/40 text-slate-200 placeholder-slate-400 ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-500 rounded-md px-3 py-2" style={{ minWidth: 220 }} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: 6, marginRight: 14 }}>Min depth (m)</label>
              <input type="number" value={obisDepthMin} onChange={(e) => setObisDepthMin(e.target.value)} placeholder="Min" className="input bg-slate-900/40 text-slate-200 ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-500 rounded-md px-3 py-2" style={{ width: 130 }} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: 6, marginRight: 11 }}>Max depth (m)</label>
              <input type="number" value={obisDepthMax} onChange={(e) => setObisDepthMax(e.target.value)} placeholder="Max" className="input bg-slate-900/40 text-slate-200 ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-500 rounded-md px-3 py-2" style={{ width: 130 }} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: 6, marginRight: 43 }}>From date</label>
              <input type="date" value={obisDateFrom} onChange={(e) => setObisDateFrom(e.target.value)} className="input bg-slate-900/40 text-slate-200 ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-500 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="label" style={{ marginBottom: 6, marginRight: 62 }}>To date</label>
              <input type="date" value={obisDateTo} onChange={(e) => setObisDateTo(e.target.value)} className="input bg-slate-900/40 text-slate-200 ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-500 rounded-md px-3 py-2" />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <button className="btn bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md shadow-sm" style={{ marginLeft: 4 }} onClick={() => { setObisQuery(''); setObisDepthMin(''); setObisDepthMax(''); setObisDateFrom(''); setObisDateTo(''); }}>Clear</button>
              <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-1 text-xs">{filteredObisRecords.length} results</span>
            </div>
          </div>
          {filteredObisRecords.length === 0 ? (
            <EmptyStateIngest title="No OBIS data found" description="Ingest OBIS data to view results and depth chart." onAfterIngest={async () => setRecords(await api.getData())} />
          ) : (
            <>
              <ObisTable records={filteredObisRecords} />
              <ObisDepthChart records={filteredObisRecords} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}


