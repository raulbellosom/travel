/**
 * MapPicker — Interactive Leaflet map that lets users pick a location by clicking.
 * Uses OpenStreetMap tiles (free) + Nominatim reverse-geocoding (free).
 *
 * Props:
 *   latitude    – initial lat (number|string, default 20.6597)
 *   longitude   – initial lng (number|string, default -103.3496)
 *   onSelect    – callback({ lat, lng, address }) when user confirms a location
 *   readOnly    – if true, disables click-to-move marker
 *   height      – CSS height string (default "400px")
 *   zoom        – initial zoom level (default 13)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Fix Leaflet default marker icon in bundlers (Vite, Webpack) ── */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* ── Helper: delay for rate-limiting ── */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Nominatim reverse-geocode (free, no API key) ── */
/* Includes retry logic for 425 "Too Early" errors and rate-limit compliance */
const reverseGeocode = async (lat, lng, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Nominatim asks for max 1 req/s; small delay on retries
      if (attempt > 0) await delay(1200 * attempt);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=es`,
        { cache: "no-store" },
      );

      // 425 Too Early or 429 Too Many Requests → retry
      if (res.status === 425 || res.status === 429) {
        if (attempt < retries - 1) continue;
        return null;
      }

      if (!res.ok) return null;
      return await res.json();
    } catch {
      if (attempt < retries - 1) continue;
      return null;
    }
  }
  return null;
};

/**
 * Parse Nominatim address components into our field format.
 */
const parseAddress = (data) => {
  if (!data?.address) return {};
  const a = data.address;
  return {
    country: a.country_code?.toUpperCase() || "",
    state: a.state || a.region || "",
    city: a.city || a.town || a.village || a.municipality || "",
    streetAddress: [a.road, a.house_number].filter(Boolean).join(" ") || "",
    neighborhood: a.suburb || a.neighbourhood || a.hamlet || "",
    postalCode: a.postcode || "",
  };
};

/* ── Sub-component: clickable layer ── */
const ClickHandler = ({ onClick }) => {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
};

/* ── Sub-component: fly to new position when marker changes ── */
const FlyToMarker = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, map.getZoom(), { duration: 0.5 });
  }, [position, map]);
  return null;
};

/* ── Main component ── */
const MapPicker = ({
  latitude,
  longitude,
  onSelect,
  readOnly = false,
  height = "400px",
  zoom = 13,
}) => {
  // Default center: Guadalajara, MX
  const defaultLat = 20.6597;
  const defaultLng = -103.3496;

  const initLat = parseFloat(latitude) || defaultLat;
  const initLng = parseFloat(longitude) || defaultLng;

  const [position, setPosition] = useState({ lat: initLat, lng: initLng });
  const [loading, setLoading] = useState(false);
  const lastGeocode = useRef(null);

  // React to external prop changes (search result, geolocation, etc.)
  useEffect(() => {
    const newLat = parseFloat(latitude);
    const newLng = parseFloat(longitude);
    if (!isNaN(newLat) && !isNaN(newLng) && (newLat !== position.lat || newLng !== position.lng)) {
      setPosition({ lat: newLat, lng: newLng });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const center = useMemo(() => [position.lat, position.lng], [position]);

  const handleClick = useCallback(
    async (latlng) => {
      if (readOnly) return;
      const { lat, lng } = latlng;
      setPosition({ lat, lng });
      setLoading(true);

      const data = await reverseGeocode(lat, lng);
      const address = parseAddress(data);
      lastGeocode.current = address;
      setLoading(false);

      onSelect?.({ lat, lng, address });
    },
    [readOnly, onSelect],
  );

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} />
        {!readOnly && <ClickHandler onClick={handleClick} />}
        <FlyToMarker position={center} />
      </MapContainer>

      {loading && (
        <div className="absolute top-3 left-3 z-[1000] rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow backdrop-blur dark:bg-slate-800/90 dark:text-slate-200">
          Obteniendo dirección…
        </div>
      )}
    </div>
  );
};

export { reverseGeocode, parseAddress };
export default MapPicker;
