export default function StatsPanel({ kpis, onTotalClick }) {
  return (
    <div className="stats grid grid-4 mb-24">
      <div className="stat" style={{ cursor: onTotalClick ? 'pointer' : 'default' }} onClick={onTotalClick}>
        <div className="stat-title">Total Records</div>
        <div className="stat-value">{kpis.total}</div>
        <div className="stat-desc">From all providers</div>
      </div>
      <div className="stat">
        <div className="stat-title">Providers Ingested</div>
        <div className="stat-value">{kpis.providers}</div>
        <div className="stat-desc">Active sources</div>
      </div>
      <div className="stat">
        <div className="stat-title">Unique Species</div>
        <div className="stat-value">{kpis.speciesCount}</div>
        <div className="stat-desc">From OBIS</div>
      </div>
      <div className="stat">
        <div className="stat-title">Latest Year (Fisheries)</div>
        <div className="stat-value">{kpis.latestYear || '-'}</div>
        <div className="stat-desc">data.gov.in</div>
      </div>
    </div>
  )
}
