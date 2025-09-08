import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";

export default function OpenMeteo({ records }) {
  if (!records?.length) return <p>No Open-Meteo data yet</p>;

  // Group by parameter
  const grouped = {};
  records.forEach(r => {
    if (!grouped[r.parameter]) grouped[r.parameter] = [];
    grouped[r.parameter].push({
      timestamp: new Date(r.timestamp).toLocaleString(),
      value: r.value,
      unit: r.unit || ""
    });
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        {Object.entries(grouped).map(([param, values], idx) => (
          <Line
            key={param}
            type="monotone"
            data={values}
            dataKey="value"
            name={`${param} (${values[0]?.unit || ""})`}
            stroke={`hsl(${idx * 60}, 70%, 50%)`}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
