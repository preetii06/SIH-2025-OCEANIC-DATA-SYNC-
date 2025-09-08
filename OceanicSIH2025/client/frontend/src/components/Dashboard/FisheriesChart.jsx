import { ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export default function FisheriesChart({ data }) {
  return (
    <div className="card" style={{gridColumn: 'span 2'}}>
      <div className="card-body">
        <h2 className="card-title">Fisheries Production (Lakh Tonnes)</h2>
        <div style={{width: '100%', height: 288}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="total" stroke="#10b981" fill="url(#colorTotal)" name="Total" />
              <Line type="monotone" dataKey="marine" stroke="#3b82f6" name="Marine" />
              <Line type="monotone" dataKey="inland" stroke="#f59e0b" name="Inland" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}