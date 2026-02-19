/**
 * MapPicker — Interactive Leaflet map with Mapbox tiles for selecting a location.
 * Supports click-to-place marker, draggable marker, and Mapbox reverse geocoding.
 *
 * Props:
 *   latitude         - initial lat (number|string, default: Puerto Vallarta)
 *   longitude        - initial lng (number|string, default: Puerto Vallarta)
 *   onSelect         - callback(NormalizedLocation) when user picks or drags
 *   readOnly         - if true, disables click-to-move and drag
 *   height           - CSS height string (default "400px")
 *   zoom             - initial zoom level (default from config)
 *   restrictToBounds - if true, restricts panning to Mexico bounds
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { reverseGeocode } from "../../../../services/mapbox.service";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  FALLBACK_TILE_OPTIONS,
  HAS_MAPBOX_TOKEN,
  TILE_LAYERS,
  TILE_OPTIONS,
  MEXICO_BOUNDS,
} from "../../../../config/map.config";

/* -- Fix Leaflet default marker icon in bundlers (Vite, Webpack) -- */
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

/**
 * Sub-component: handles map click events.
 */
const ClickHandler = ({ onClick }) => {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
};

/**
 * Sub-component: smoothly fly to new position when marker changes.
 */
const FlyToMarker = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, map.getZoom(), { duration: 0.5 });
  }, [position, map]);
  return null;
};

/**
 * Sub-component: draggable marker that reports its new position.
 */
const DraggableMarker = ({ position, onDragEnd }) => {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const { lat, lng } = marker.getLatLng();
          onDragEnd({ lat, lng });
        }
      },
    }),
    [onDragEnd],
  );

  return (
    <Marker
      position={position}
      draggable
      ref={markerRef}
      eventHandlers={eventHandlers}
    />
  );
};

const MapPicker = ({
  latitude,
  longitude,
  onSelect,
  readOnly = false,
  height = "400px",
  zoom = DEFAULT_ZOOM,
  restrictToBounds = false,
}) => {
  const initLat = parseFloat(latitude) || DEFAULT_CENTER.lat;
  const initLng = parseFloat(longitude) || DEFAULT_CENTER.lng;

  const [position, setPosition] = useState({ lat: initLat, lng: initLng });
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(isDarkMode);
  const [useFallbackTiles, setUseFallbackTiles] = useState(!HAS_MAPBOX_TOKEN);
  const abortRef = useRef(null);

  useEffect(() => {
    const newLat = parseFloat(latitude);
    const newLng = parseFloat(longitude);
    if (
      !isNaN(newLat) &&
      !isNaN(newLng) &&
      (newLat !== position.lat || newLng !== position.lng)
    ) {
      setPosition({ lat: newLat, lng: newLng });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

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

  const center = useMemo(() => [position.lat, position.lng], [position]);

  const tileConfig = useFallbackTiles
    ? TILE_LAYERS.fallback
    : dark
      ? TILE_LAYERS.dark
      : TILE_LAYERS.light;
  const tileOptions = useFallbackTiles ? FALLBACK_TILE_OPTIONS : TILE_OPTIONS;

  const maxBounds = restrictToBounds
    ? L.latLngBounds(
        [MEXICO_BOUNDS[0][1], MEXICO_BOUNDS[0][0]],
        [MEXICO_BOUNDS[1][1], MEXICO_BOUNDS[1][0]],
      )
    : undefined;

  const handleReverseGeocode = useCallback(
    async (lat, lng) => {
      if (readOnly) return;

      if (abortRef.current) {
        abortRef.current.abort();
      }

      setPosition({ lat, lng });
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const location = await reverseGeocode(lat, lng, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted && location) {
          onSelect?.(location);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          onSelect?.({
            lat,
            lng,
            formattedAddress: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
            neighborhood: "",
            streetAddress: "",
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [readOnly, onSelect],
  );

  const handleClick = useCallback(
    (latlng) => {
      handleReverseGeocode(latlng.lat, latlng.lng);
    },
    [handleReverseGeocode],
  );

  const handleDragEnd = useCallback(
    ({ lat, lng }) => {
      handleReverseGeocode(lat, lng);
    },
    [handleReverseGeocode],
  );

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        maxBounds={maxBounds}
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
        {readOnly ? (
          <Marker position={center} />
        ) : (
          <DraggableMarker position={center} onDragEnd={handleDragEnd} />
        )}
        {!readOnly && <ClickHandler onClick={handleClick} />}
        <FlyToMarker position={center} />
      </MapContainer>

      {loading && (
        <div className="absolute top-3 left-3 z-[1000] rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow backdrop-blur dark:bg-slate-800/90 dark:text-slate-200">
          Obteniendo direccion...
        </div>
      )}
    </div>
  );
};

export default MapPicker;
