import React from "react";


export default function WormsTable({ records }) {
  if (!records || records.length === 0) {
    return <p className="text-gray-500">No records available</p>;
  }

  return (
    <div className="overflow-x-auto shadow-lg rounded-2xl border border-gray-200 mt-4">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-blue-100 text-gray-700 font-semibold">
          <tr>
            <th className="px-4 py-2">AphiaID</th>
            <th className="px-4 py-2">Scientific Name</th>
            <th className="px-4 py-2">Rank</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Valid Name</th>
            <th className="px-4 py-2">Family</th>
            <th className="px-4 py-2">Genus</th>
            <th className="px-4 py-2">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec, i) => (
            <tr
              key={rec.aphiaID || i}
              className="border-b hover:bg-gray-50 transition"
            >
              <td className="px-4 py-2">{rec.aphiaID}</td>
              <td className="px-4 py-2 font-medium">{rec.scientificName}</td>
              <td className="px-4 py-2">{rec.rank}</td>
              <td className="px-4 py-2">{rec.status}</td>
              <td className="px-4 py-2">{rec.valid_name}</td>
              <td className="px-4 py-2">{rec.family}</td>
              <td className="px-4 py-2">{rec.genus}</td>
              <td className="px-4 py-2 text-gray-500">
                {new Date(rec.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
