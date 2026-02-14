/**
 * Mapbox Geocoding Service — forward and reverse geocoding via Mapbox Geocoding API v5.
 * Returns normalized location objects with structured address components.
 */
import {
  MAPBOX_TOKEN,
  GEOCODING_BASE_URL,
  MEXICO_BOUNDS,
  DEFAULT_COUNTRY,
  MAX_RESULTS,
} from "../config/map.config";

/**
 * Normalized location object returned by all geocoding methods.
 * @typedef {Object} NormalizedLocation
 * @property {number} lat
 * @property {number} lng
 * @property {string} formattedAddress
 * @property {string} city
 * @property {string} state
 * @property {string} postalCode
 * @property {string} country
 * @property {string} neighborhood
 * @property {string} streetAddress
 */

/**
 * Extract a specific context type from Mapbox context array.
 * Context entries have an id like "place.12345", "region.67890", etc.
 */
const extractContext = (context, type) => {
  if (!Array.isArray(context)) return "";
  const entry = context.find((c) => c.id?.startsWith(`${type}.`));
  return entry?.text || "";
};

/**
 * Normalize a Mapbox Geocoding API feature into a consistent location object.
 * Handles both forward and reverse geocoding responses.
 */
const normalizeFeature = (feature) => {
  if (!feature) return null;

  const [lng, lat] = feature.center || [0, 0];
  const context = feature.context || [];

  const country = extractContext(context, "country") || "";
  const state = extractContext(context, "region") || "";
  const city =
    extractContext(context, "place") ||
    extractContext(context, "locality") ||
    "";
  const postalCode = extractContext(context, "postcode") || "";
  const neighborhood =
    extractContext(context, "neighborhood") ||
    extractContext(context, "locality") ||
    "";
  const streetAddress = feature.place_name
    ? feature.place_name.split(",")[0] || ""
    : feature.text || "";

  return {
    lat,
    lng,
    formattedAddress: feature.place_name || "",
    city,
    state,
    postalCode,
    country,
    neighborhood,
    streetAddress,
  };
};

/**
 * Build the bounding box query parameter string.
 */
const buildBboxParam = (bounds) => {
  if (!bounds || bounds.length !== 2) return "";
  const [sw, ne] = bounds;
  return `${sw[0]},${sw[1]},${ne[0]},${ne[1]}`;
};

/**
 * Forward geocoding — search places by text query.
 * Returns an array of normalized location objects.
 *
 * @param {string} query - Search text (address, city, place name)
 * @param {Object} [options]
 * @param {string} [options.country] - ISO country code filter
 * @param {Array} [options.bounds] - Bounding box [[sw_lng, sw_lat], [ne_lng, ne_lat]]
 * @param {number} [options.limit] - Max results
 * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
 * @returns {Promise<NormalizedLocation[]>}
 */
export const searchPlaces = async (query, options = {}) => {
  if (!query || query.trim().length < 2) return [];
  if (!MAPBOX_TOKEN) {
    throw new Error("Mapbox token is not configured");
  }

  const {
    country = DEFAULT_COUNTRY,
    bounds = MEXICO_BOUNDS,
    limit = MAX_RESULTS,
    signal,
  } = options;

  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    autocomplete: "true",
    language: "es",
    limit: String(limit),
    types: "address,poi,place,locality,neighborhood",
  });

  if (country) params.set("country", country);

  const bbox = buildBboxParam(bounds);
  if (bbox) params.set("bbox", bbox);

  const url = `${GEOCODING_BASE_URL}/${encodeURIComponent(query.trim())}.json?${params.toString()}`;

  const response = await fetch(url, { signal });

  if (response.status === 429) {
    throw new Error("Rate limit exceeded. Please wait and try again.");
  }

  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.features || !Array.isArray(data.features)) return [];

  return data.features.map(normalizeFeature).filter(Boolean);
};

/**
 * Reverse geocoding — get address from coordinates.
 * Returns a single normalized location object or null.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
 * @returns {Promise<NormalizedLocation|null>}
 */
export const reverseGeocode = async (lat, lng, options = {}) => {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!MAPBOX_TOKEN) {
    throw new Error("Mapbox token is not configured");
  }

  const { signal } = options;

  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    language: "es",
    types: "address,poi,place,locality,neighborhood",
  });

  const url = `${GEOCODING_BASE_URL}/${lng},${lat}.json?${params.toString()}`;

  const response = await fetch(url, { signal });

  if (response.status === 429) {
    throw new Error("Rate limit exceeded. Please wait and try again.");
  }

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.features || data.features.length === 0) return null;

  return normalizeFeature(data.features[0]);
};
