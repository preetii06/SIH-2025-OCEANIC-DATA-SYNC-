import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

export default function BiodiversityMap({ points, center }) {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Biodiversity Map (OBIS)</h2>
        <div className="map-container">
          <MapContainer center={center} zoom={4} scrollWheelZoom={false} style={{height: '100%', width: '100%'}}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.slice(0, 300).map((p, idx) => (
              <Marker position={[p.latitude, p.longitude]} key={idx}>
                <Popup>
                  <div style={{fontSize: 12}}>
                    <div><strong>{p.species || 'Unknown species'}</strong></div>
                    <div>{p.eventDate || 'No date'}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}