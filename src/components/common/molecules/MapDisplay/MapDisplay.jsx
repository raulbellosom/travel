/**
 * MapDisplay — Read-only Leaflet map that shows a property location marker.
 * Uses free OpenStreetMap tiles. No interaction needed.
 *
 * Props:
 *   latitude   – (number|string) required
 *   longitude  – (number|string) required
 *   height     – CSS height string (default "280px")
 *   zoom       – initial zoom (default 15)
 *   className  – extra wrapper classes
 */
import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Fix Leaflet default icons in bundlers */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MapDisplay = ({
  latitude,
  longitude,
  label,
  height = "280px",
  zoom = 15,
  className = "",
}) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  const center = useMemo(() => [lat, lng], [lat, lng]);

  if (isNaN(lat) || isNaN(lng)) return null;

  return (
    <div
      className={`overflow-hidden rounded-2xl ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center}>
          {label && <Popup>{label}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapDisplay;
