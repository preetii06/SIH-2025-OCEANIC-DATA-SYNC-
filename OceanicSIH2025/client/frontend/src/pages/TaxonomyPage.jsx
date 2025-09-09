import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import WormsTable from '../components/Dashboard/WormsTable'
import EmptyStateIngest from '../components/common/EmptyStateIngest'

export default function TaxonomyPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wormsNameQuery, setWormsNameQuery] = useState('')
  const [wormsRank, setWormsRank] = useState('')
  const [wormsStatus, setWormsStatus] = useState('')
  const [wormsFamily, setWormsFamily] = useState('')
  const [wormsGenus, setWormsGenus] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.getData()
        if (mounted) setRecords(data)
      } catch (e) {
        setError('Failed to load WoRMS data')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const wormsBase = useMemo(() => {
    return records.filter(r => r.source?.toLowerCase().includes('worms'))
  }, [records])

  const wormsFacets = useMemo(() => {
    const ranks = Array.from(new Set(wormsBase.map(r => r.rank).filter(Boolean))).sort()
    const statuses = Array.from(new Set(wormsBase.map(r => r.status).filter(Boolean))).sort()
    const families = Array.from(new Set(wormsBase.map(r => r.family).filter(Boolean))).sort()
    const genera = Array.from(new Set(wormsBase.map(r => r.genus).filter(Boolean))).sort()
    return { ranks, statuses, families, genera }
  }, [wormsBase])

  const wormsRecords = useMemo(() => {
    const nameQ = (wormsNameQuery || '').toLowerCase()
    return wormsBase.filter(r => {
      const nameMatch = !nameQ || (r.scientificName || '').toLowerCase().includes(nameQ)
      const rankMatch = !wormsRank || r.rank === wormsRank
      const statusMatch = !wormsStatus || r.status === wormsStatus
      const familyMatch = !wormsFamily || r.family === wormsFamily
      const genusMatch = !wormsGenus || r.genus === wormsGenus
      return nameMatch && rankMatch && statusMatch && familyMatch && genusMatch
    })
  }, [wormsBase, wormsNameQuery, wormsRank, wormsStatus, wormsFamily, wormsGenus])

  return (
    <div className="container">
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">WoRMS Taxonomy</h2>
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <div className="flex" style={{ gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <label className="label" style={{ marginBottom: 10, marginRight: 12 }}>Scientific name</label>
              <input type="text" value={wormsNameQuery} onChange={(e) => setWormsNameQuery(e.target.value)} placeholder="e.g., Sardinella longiceps" className="input bg-slate-900/40 text-slate-200 placeholder-slate-400 ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-md px-3 py-2" style={{ minWidth: 240 }} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: 6, marginRight: 19 }}>Rank</label>
              <select className="select bg-slate-900/40 text-slate-200 ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-md px-3 py-2" value={wormsRank} onChange={(e) => setWormsRank(e.target.value)}>
                <option value="">All</option>
                {wormsFacets.ranks.map(v => (<option key={v} value={v}>{v}</option>))}
              </select>
            </div>
            <div>
              <label className="label" style={{ marginBottom: 6, marginRight: 11 }}>Status</label>
              <select className="select bg-slate-900/40 text-slate-200 ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-md px-3 py-2" value={wormsStatus} onChange={(e) => setWormsStatus(e.target.value)}>
                <option value="">All</option>
                {wormsFacets.statuses.map(v => (<option key={v} value={v}>{v}</option>))}
              </select>
            </div>
            <div>
              <label className="label" style={{ marginBottom: 6, marginRight: 11 }}>Family</label>
              <select className="select bg-slate-900/40 text-slate-200 ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-md px-3 py-2" value={wormsFamily} onChange={(e) => setWormsFamily(e.target.value)}>
                <option value="">All</option>
                {wormsFacets.families.map(v => (<option key={v} value={v}>{v}</option>))}
              </select>
            </div>
            <div>
              <label className="label" style={{ marginBottom: 6, marginRight: 11 }}>Genus</label>
              <select className="select bg-slate-900/40 text-slate-200 ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-md px-3 py-2" value={wormsGenus} onChange={(e) => setWormsGenus(e.target.value)}>
                <option value="">All</option>
                {wormsFacets.genera.map(v => (<option key={v} value={v}>{v}</option>))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <button className="btn bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md shadow-sm" style={{ marginLeft: 4 }} onClick={() => { setWormsNameQuery(''); setWormsRank(''); setWormsStatus(''); setWormsFamily(''); setWormsGenus(''); }}>Clear</button>
              <span className="badge bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full px-2 py-1 text-xs">{wormsRecords.length} results</span>
            </div>
          </div>
          {wormsRecords.length === 0 ? (
            <EmptyStateIngest title="No WoRMS data found" description="Ingest WoRMS data to see taxonomy results." onAfterIngest={async () => setRecords(await api.getData())} />
          ) : (
            <WormsTable records={wormsRecords} />
          )}
        </div>
      </div>
    </div>
  )
}


