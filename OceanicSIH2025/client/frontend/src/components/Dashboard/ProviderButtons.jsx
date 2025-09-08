import { useState } from 'react'
import api from '../../services/api'

export default function ProviderButtons({ onAfterIngest }) {
  const [busy, setBusy] = useState(false)

  async function run(provider, payload) {
    setBusy(true)
    try {
      await api.ingest(provider, payload)
      await onAfterIngest()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      <button className="btn" disabled={busy} onClick={() => run('fisheries', {})}>Ingest Fisheries</button>
      <button className="btn secondary" disabled={busy} onClick={() => run('obis', { endpoint: 'occurrence', params: { scientificname: 'Sardinella', size: 50 } })}>Ingest OBIS</button>
      <button className="btn neutral" disabled={busy} onClick={() => run('open-meteo', { latitude: 20.5, longitude: 78.9 })}>Ingest Open-Meteo</button>
      <button className="btn neutral" disabled={busy} onClick={() => run('noaa', { station: '8723214', product: 'water_temperature', date: 'latest' })}>Ingest NOAA</button>
      <button className="btn neutral" disabled={busy} onClick={() => run('worms', { scientificname: 'Sardinella' })}>Ingest WoRMS</button>
      <button className="btn neutral" disabled={busy} onClick={() => run('bold', { taxon: 'Sardinella' })}>Ingest BOLD</button>
      <button className="btn neutral" disabled={busy} onClick={() => run('cmfri', { year: '2023' })}>Ingest CMFRI PDFs</button>
    </div>
  )
}