// components/charts/ObisDepthChart.jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ObisDepthChart({ records }) {
  if (!records || records.length === 0) return null;

  const data = records
    .filter(r => r.depth != null)
    .map(r => ({ depth: r.depth }));

  return (
    <div className="shadow-lg rounded-2xl border border-gray-200 p-4 mt-4">
      <h3 className="text-lg font-semibold mb-2">Depth Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="depth" label={{ value: "Depth (m)", position: "insideBottom", offset: -5 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="depth" fill="#4ade80" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
