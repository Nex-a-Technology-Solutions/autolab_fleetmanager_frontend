import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const homeIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const vehicleIcon = (heading, engineOn) => {
  const color = engineOn ? '#16a34a' : '#ef4444'; // green for on, red for off
  return new L.DivIcon({
    html: `<div style="transform: rotate(${heading || 0}deg);"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation-2"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg></div>`,
    className: 'bg-transparent border-0',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, {
        animate: true,
        duration: 1
      });
    }
  }, [center]);
  return null;
};

export default function TrackingMap({ vehicles, homeBase, selectedVehicle }) {
  const mapCenter = selectedVehicle 
    ? [selectedVehicle.gps_latitude, selectedVehicle.gps_longitude]
    : [homeBase.lat, homeBase.lng];

  return (
    <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Home Base Marker */}
      <Marker position={[homeBase.lat, homeBase.lng]} icon={homeIcon}>
        <Popup>
          <div className="font-bold">Home Base</div>
        </Popup>
      </Marker>

      {/* Vehicle Markers */}
      {vehicles.map(vehicle => (
        <Marker 
          key={vehicle.id} 
          position={[vehicle.gps_latitude, vehicle.gps_longitude]}
          icon={vehicleIcon(vehicle.gps_heading, vehicle.gps_engine_on)}
        >
          <Popup>
            <div className="font-bold text-base" style={{color: 'var(--wwfh-navy)'}}>Fleet {vehicle.fleet_id}</div>
            <div className="text-sm">
              <p><strong>Status:</strong> {vehicle.status.replace(/_/g, ' ')}</p>
              <p><strong>Speed:</strong> {vehicle.gps_speed?.toFixed(1) || 0} km/h</p>
              <p><strong>Engine:</strong> {vehicle.gps_engine_on ? 'On' : 'Off'}</p>
              <p><strong>Last Update:</strong> {new Date(vehicle.gps_last_update).toLocaleTimeString()}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      <MapUpdater center={mapCenter} />
    </MapContainer>
  );
}