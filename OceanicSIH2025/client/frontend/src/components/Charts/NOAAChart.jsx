import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'

const NOAAChart = ({ records }) => {
  if (!records.length) return <p>No NOAA data yet</p>

  // Group records by timestamp, one row = one point in time, with multiple parameters as columns
  const dataMap = {}
  records.forEach(r => {
    const ts = new Date(r.timestamp).toLocaleString() // x-axis label
    if (!dataMap[ts]) dataMap[ts] = { timestamp: ts }
    dataMap[ts][r.parameter] = Number(r.value)
  })

  const chartData = Object.values(dataMap).sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  )

  // Extract unique parameters for dynamic Line components
  const parameters = [...new Set(records.map(r => r.parameter))]

  return (
    <div className="card mb-4">
       <div className="card-body">
      <ResponsiveContainer width="100%" height={400}>

        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          {parameters.map((param, idx) => (
            <Line
              key={param}
              type="monotone"
              dataKey={param}
              stroke={["#8884d8", "#82ca9d", "#ff7300", "#387908"][idx % 4]}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
    </div>
  )
}

export default NOAAChart


