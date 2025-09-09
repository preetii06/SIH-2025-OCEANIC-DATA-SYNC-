import React from "react";


export default function WormsTable({ records }) {
  if (!records || records.length === 0) {
    return <p className="text-gray-500">No records available</p>;
  } 

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>AphiaID</th>
            <th>Scientific Name</th>
            <th>Rank</th>
            <th>Status</th>
            <th>Valid Name</th>
            <th>Family</th>
            <th>Genus</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec, i) => (
            <tr key={rec.aphiaID || i}>
              <td>{rec.aphiaID ?? '—'}</td>
              <td>{rec.scientificName || '—'}</td>
              <td>{rec.rank || '—'}</td>
              <td>{rec.status || '—'}</td>
              <td>{rec.valid_name || '—'}</td>
              <td>{rec.family || '—'}</td>
              <td>{rec.genus || '—'}</td>
              <td>{rec.timestamp ? new Date(rec.timestamp).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
