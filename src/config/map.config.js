/**
 * Map configuration — centralized constants for Mapbox geocoding and map rendering.
 * Mexico-focused defaults with bounding box, tile URLs, and default center.
 */
import env from "../env";

/**
 * Mapbox access token from environment configuration.
 * Never hardcode — always sourced from MAPBOX_ACCESS_TOKEN env var.
 */
export const MAPBOX_TOKEN = env.external.mapboxToken;

/**
 * Mexico bounding box [southwest, northeast] for biased geocoding results.
 */
export const MEXICO_BOUNDS = [
  [-118.45, 14.53],
  [-86.71, 32.72],
];

/**
 * Default country filter for geocoding queries.
 */
export const DEFAULT_COUNTRY = "mx";

/**
 * Mapbox Geocoding API v5 base URL.
 */
export const GEOCODING_BASE_URL =
  "https://api.mapbox.com/geocoding/v5/mapbox.places";

/**
 * Default map center — Puerto Vallarta, Jalisco, Mexico.
 */
export const DEFAULT_CENTER = {
  lat: 20.6534,
  lng: -105.2253,
};

/**
 * Default zoom level for map views.
 */
export const DEFAULT_ZOOM = 13;

/**
 * Maximum number of autocomplete results returned.
 */
export const MAX_RESULTS = 5;

/**
 * Minimum characters required before triggering a geocoding search.
 */
export const MIN_QUERY_LENGTH = 3;

/**
 * Debounce delay in milliseconds for search input.
 */
export const DEBOUNCE_MS = 400;

/**
 * Tile layer configurations for light and dark mode.
 * Uses Mapbox static tiles with the access token.
 */
export const TILE_LAYERS = {
  light: {
    url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
    attribution:
      '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  dark: {
    url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
    attribution:
      '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
};

/**
 * Leaflet tile layer options shared across all map instances.
 */
export const TILE_OPTIONS = {
  tileSize: 512,
  zoomOffset: -1,
  maxZoom: 18,
};
