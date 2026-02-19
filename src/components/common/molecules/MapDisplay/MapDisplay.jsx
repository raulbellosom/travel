/**
 * MapDisplay — Read-only Leaflet map with Mapbox tiles showing a property location.
 * Supports dark mode tiles. No user interaction enabled.
 *
 * Props:
 *   latitude   - (number|string) required
 *   longitude  - (number|string) required
 *   label      - optional popup text for the marker
 *   height     - CSS height string (default "280px")
 *   zoom       - initial zoom (default 15)
 *   className  - extra wrapper classes
 */
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FALLBACK_TILE_OPTIONS,
  HAS_MAPBOX_TOKEN,
  TILE_LAYERS,
  TILE_OPTIONS,
} from "../../../../config/map.config";

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

/**
 * Detect if dark mode is active by checking the document root element.
 */
const isDarkMode = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

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
  const [dark, setDark] = useState(isDarkMode);
  const [useFallbackTiles, setUseFallbackTiles] = useState(!HAS_MAPBOX_TOKEN);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(isDarkMode());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const center = useMemo(() => [lat, lng], [lat, lng]);

  if (isNaN(lat) || isNaN(lng)) return null;

  const tileConfig = useFallbackTiles
    ? TILE_LAYERS.fallback
    : dark
      ? TILE_LAYERS.dark
      : TILE_LAYERS.light;
  const tileOptions = useFallbackTiles ? FALLBACK_TILE_OPTIONS : TILE_OPTIONS;

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
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          eventHandlers={{
            tileerror: () => {
              setUseFallbackTiles(true);
            },
          }}
          tileSize={tileOptions.tileSize}
          zoomOffset={tileOptions.zoomOffset}
          maxZoom={tileOptions.maxZoom}
        />
        <Marker position={center}>{label && <Popup>{label}</Popup>}</Marker>
      </MapContainer>
    </div>
  );
};

export default MapDisplay;
