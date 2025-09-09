// components/tables/ObisTable.jsx
import React from "react";

export default function ObisTable({ records }) {
  if (!records || records.length === 0) {
    return <p className="text-gray-500">No OBIS records available</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Species</th>
            <th>Family</th>
            <th>Order</th>
            <th>Class</th>
            <th>Depth (m)</th>
            <th>Event Date</th>
            <th>Lat</th>
            <th>Lon</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec, i) => (
            <tr key={i}>
              <td>{rec.species || '—'}</td>
              <td>{rec.family || '—'}</td>
              <td>{rec.order || '—'}</td>
              <td>{rec.class || '—'}</td>
              <td>{rec.depth ?? '—'}</td>
              <td>{rec.eventDate ? new Date(rec.eventDate).toLocaleDateString() : '—'}</td>
              <td>{typeof rec.latitude === 'number' ? rec.latitude.toFixed(2) : '—'}</td>
              <td>{typeof rec.longitude === 'number' ? rec.longitude.toFixed(2) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
