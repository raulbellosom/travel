import { Loader } from "@googlemaps/js-api-loader";
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  HAS_GOOGLE_MAPS_API_KEY,
} from "../config/map.config";

// Always include "places" and "marker" so the Loader is never recreated with
// different library options. @googlemaps/js-api-loader is a singleton — creating
// it again with different options silently breaks Places autocomplete.
// "marker" is required for AdvancedMarkerElement (replaces deprecated Marker).
const BASE_LIBRARIES = ["places", "marker"];

// Persist the singleton on `window` so Vite HMR module reloads don't reset it
// and trigger the "Loader must not be called again with different options" warning.
const LOADER_KEY = "__googleMapsLoaderInstance";

const ensureLoader = () => {
  if (!HAS_GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key is not configured");
  }

  if (!window[LOADER_KEY]) {
    window[LOADER_KEY] = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: BASE_LIBRARIES,
      language: "es",
      region: "MX",
      mapIds: GOOGLE_MAPS_MAP_ID ? [GOOGLE_MAPS_MAP_ID] : undefined,
    });
  }

  return window[LOADER_KEY];
};

export const loadGoogleMaps = async (_options = {}) => {
  const loader = ensureLoader();
  await loader.load();

  if (!window.google?.maps) {
    throw new Error("Google Maps script loaded but API is unavailable");
  }

  return window.google;
};
