import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../../services/auth'

export default function Signup() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      signup({ name, email, password })
      nav('/dashboard')
    } catch (err) {
      setError(err.message || 'Signup failed')
    }
  }

  return (
    <div className="app-root" style={{display:'grid', placeItems:'center', minHeight:'100vh'}}>
      <div className="container" style={{width:'100%'}}>
        <div style={{display:'grid', placeItems:'center', marginBottom:24}}>
          <div className="brand">Oceanic Data Sync</div>
        </div>
        <form onSubmit={onSubmit} className="card" style={{width: '100%', maxWidth: 460, margin:'0 auto'}}>
          <div className="card-body">
            <h2 className="card-title">Create account</h2>
            <p style={{color:'#9fb3cd', marginTop:4}}>Start exploring oceanic insights</p>
            {error && <div style={{background:'#3b1d2a', color:'#ffb4c8', padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,0.06)', marginTop:12}}>{error}</div>}
            <div className="mt-8">
              <label>Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} type="text" required style={inputStyle} placeholder="Your Name" />
            </div>
            <div className="mt-8">
              <label>Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required style={inputStyle} placeholder="you@example.com" />
            </div>
            <div className="mt-8">
              <label>Password</label>
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required style={inputStyle} placeholder="At least 6 characters" />
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16}}>
              <button className="btn" type="submit">Sign up</button>
              <span style={{color:'#9fb3cd'}}>Have an account? <Link to="/" style={{color:'#cfe2ff'}}>Log in</Link></span>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  width:'100%',
  boxSizing:'border-box',
  background:'#0f172a',
  color:'#e9f0fb',
  border:'1px solid rgba(255,255,255,0.08)',
  borderRadius:10,
  padding:'12px 12px',
  marginTop:6
}


