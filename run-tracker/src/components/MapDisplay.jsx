import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon not showing up in React
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A component to auto-recenter the map on the user when they move
function RecenterAutomatically({ currentPosition }) {
  const map = useMap();
  useEffect(() => {
    if (currentPosition) {
      map.setView(currentPosition, map.getZoom());
    }
  }, [currentPosition, map]);
  return null;
}

export default function MapDisplay({ path, currentPosition }) {
  // Default bounds mostly cover the Middle East/World to start
  const defaultPosition = [26.3927, 50.1971]; // Default to Eastern Province roughly

  const positionToUse = currentPosition || defaultPosition;

  return (
    <MapContainer 
      center={positionToUse} 
      zoom={16} 
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {path.length > 0 && (
        <Polyline pathOptions={{ color: '#ccff00', weight: 5, opacity: 0.8 }} positions={path} />
      )}
      {currentPosition && (
        <>
          <Marker position={currentPosition} />
          <RecenterAutomatically currentPosition={currentPosition} />
        </>
      )}
    </MapContainer>
  );
}
