/**
 * Map configuration for Google Maps based features.
 */
import env from "../env";

export const GOOGLE_MAPS_API_KEY = env.external.googleMapsApiKey;
export const GOOGLE_MAPS_MAP_ID = env.external.googleMapsMapId;
export const HAS_GOOGLE_MAPS_API_KEY = Boolean(GOOGLE_MAPS_API_KEY);

/**
 * Mexico bounding box [southwest, northeast] as [lng, lat].
 */
export const MEXICO_BOUNDS = [
  [-118.45, 14.53],
  [-86.71, 32.72],
];

export const DEFAULT_COUNTRY = "mx";

export const DEFAULT_CENTER = {
  lat: 20.6534,
  lng: -105.2253,
};

export const DEFAULT_ZOOM = 13;

export const MAX_RESULTS = 5;

export const MIN_QUERY_LENGTH = 3;

export const DEBOUNCE_MS = 400;

export const GOOGLE_DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1220" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1f2937" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#082f49" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  },
];

export const GOOGLE_LIGHT_MAP_STYLE = null;
