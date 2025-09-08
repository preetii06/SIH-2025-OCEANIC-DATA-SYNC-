import { getCurrentUser, logout } from '../../services/auth'

export default function Navbar({ onRefresh, onSync, loading }) {
  return (
    <div className="navbar mb-24">
      <div>
        <span className="brand">Oceanic Data Sync</span>
      </div>
      <div>
        <span style={{color:'#9fb3cd', marginRight:12}}>{getCurrentUser()?.email}</span>
        <button className="btn neutral" onClick={onRefresh} disabled={loading} style={{marginRight:8}}>Refresh</button>
        <button className="btn" onClick={onSync} disabled={loading}>Sync All</button>
        <button className="btn neutral" style={{marginLeft:8}} onClick={()=>{ logout(); window.location.href='/' }}>Logout</button>
      </div>
    </div>
  )
}
