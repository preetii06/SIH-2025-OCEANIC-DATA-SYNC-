// components/tables/ObisTable.jsx
import React from "react";

export default function ObisTable({ records }) {
  if (!records || records.length === 0) {
    return <p className="text-gray-500">No OBIS records available</p>;
  }

  return (
    <div className="overflow-x-auto shadow-lg rounded-2xl border border-gray-200 mt-4">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-green-100 text-gray-700 font-semibold">
          <tr>
            <th className="px-4 py-2">Species</th>
            <th className="px-4 py-2">Family</th>
            <th className="px-4 py-2">Order</th>
            <th className="px-4 py-2">Class</th>
            <th className="px-4 py-2">Depth (m)</th>
            <th className="px-4 py-2">Event Date</th>
            <th className="px-4 py-2">Lat</th>
            <th className="px-4 py-2">Lon</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec, i) => (
            <tr
              key={i}
              className="border-b hover:bg-gray-50 transition"
            >
              <td className="px-4 py-2 font-medium">{rec.species}</td>
              <td className="px-4 py-2">{rec.family}</td>
              <td className="px-4 py-2">{rec.order}</td>
              <td className="px-4 py-2">{rec.class}</td>
              <td className="px-4 py-2">{rec.depth ?? "–"}</td>
              <td className="px-4 py-2">{new Date(rec.eventDate).toLocaleDateString()}</td>
              <td className="px-4 py-2">{rec.latitude?.toFixed(2)}</td>
              <td className="px-4 py-2">{rec.longitude?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
