import {
  DEFAULT_COUNTRY,
  MAX_RESULTS,
  MEXICO_BOUNDS,
} from "../config/map.config";
import { loadGoogleMaps } from "./googleMaps.loader";

const EMPTY_NORMALIZED = {
  city: "",
  state: "",
  postalCode: "",
  country: "",
  neighborhood: "",
  streetAddress: "",
  streetNumber: "",
  route: "",
  formattedAddress: "",
  placeId: "",
  components: {
    streetNumber: "",
    route: "",
    neighborhood: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  },
};

let geocoderInstance = null;

const ensureNotAborted = (signal) => {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
};

const toLatLngBounds = (google, bounds) => {
  if (!bounds || bounds.length !== 2) return undefined;
  const [sw, ne] = bounds;
  return new google.maps.LatLngBounds(
    { lat: sw[1], lng: sw[0] },
    { lat: ne[1], lng: ne[0] },
  );
};

const getComponentByTypes = (addressComponents, wantedTypes) => {
  if (!Array.isArray(addressComponents)) return "";
  const match = addressComponents.find((component) =>
    wantedTypes.some((wantedType) => component.types?.includes(wantedType)),
  );
  return match?.long_name || "";
};

const normalizeAddressComponents = (addressComponents = []) => {
  const streetNumber = getComponentByTypes(addressComponents, [
    "street_number",
  ]);
  const route = getComponentByTypes(addressComponents, ["route"]);
  const neighborhood = getComponentByTypes(addressComponents, [
    "sublocality_level_1",
    "sublocality",
    "neighborhood",
  ]);
  const city = getComponentByTypes(addressComponents, ["locality"]);
  const state = getComponentByTypes(addressComponents, [
    "administrative_area_level_1",
  ]);
  const country = getComponentByTypes(addressComponents, ["country"]);
  const postalCode = getComponentByTypes(addressComponents, ["postal_code"]);

  return {
    streetNumber,
    route,
    neighborhood,
    city,
    state,
    country,
    postalCode,
  };
};

const normalizeGeocoderResult = (result, lat, lng) => {
  if (!result) return null;
  const geometryLocation = result.geometry?.location;
  const nextLat =
    typeof lat === "number" ? lat : Number(geometryLocation?.lat?.() || 0);
  const nextLng =
    typeof lng === "number" ? lng : Number(geometryLocation?.lng?.() || 0);
  const components = normalizeAddressComponents(
    result.address_components || [],
  );

  return {
    lat: nextLat,
    lng: nextLng,
    formattedAddress: result.formatted_address || "",
    city: components.city,
    state: components.state,
    postalCode: components.postalCode,
    country: components.country,
    neighborhood: components.neighborhood,
    streetAddress: [components.route, components.streetNumber]
      .filter(Boolean)
      .join(" ")
      .trim(),
    streetNumber: components.streetNumber,
    route: components.route,
    placeId: result.place_id || "",
    components,
  };
};

// Uses the new Place API (replaces deprecated PlacesService.getDetails).
// Maps the result back to the legacy geocoder shape so normalizeGeocoderResult works unchanged.
const wrapPlaceDetails = async (google, placeId) => {
  if (!placeId) return null;

  const place = new google.maps.places.Place({ id: placeId });
  await place.fetchFields({
    fields: [
      "id",
      "formattedAddress",
      "addressComponents",
      "location",
      "displayName",
    ],
  });

  // Remap new API field names to the legacy geocoder-result shape
  const addressComponents = (place.addressComponents || []).map((c) => ({
    long_name: c.longText || "",
    short_name: c.shortText || "",
    types: c.types || [],
  }));

  return {
    place_id: place.id,
    formatted_address: place.formattedAddress || "",
    address_components: addressComponents,
    geometry: { location: place.location },
  };
};

// Uses the new AutocompleteSuggestion API (replaces deprecated AutocompleteService).
// Returns objects shaped as { place_id, description } so callers remain unchanged.
const wrapPredictions = async (google, request) => {
  const newRequest = {
    input: request.input,
    language: request.language,
  };

  if (request.region) newRequest.region = request.region;
  if (request.sessionToken) newRequest.sessionToken = request.sessionToken;

  // componentRestrictions.country → includedRegionCodes
  if (request.componentRestrictions?.country) {
    newRequest.includedRegionCodes = [
      String(request.componentRestrictions.country).toLowerCase(),
    ];
  }

  // bounds → locationBias (accepts LatLngBounds directly)
  if (request.bounds) {
    newRequest.locationBias = request.bounds;
  }

  try {
    const { suggestions = [] } =
      await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
        newRequest,
      );

    return suggestions
      .filter((s) => s.placePrediction?.placeId)
      .map((s) => ({
        place_id: s.placePrediction.placeId,
        description: s.placePrediction.text?.text ?? "",
      }));
  } catch (error) {
    // Surface ZERO_RESULTS as an empty array instead of an error
    const msg = String(error?.message || "");
    if (msg.includes("ZERO_RESULTS") || msg.includes("NOT_FOUND")) return [];
    throw error;
  }
};

const geocodeByRequest = (google, request) =>
  new Promise((resolve, reject) => {
    if (!geocoderInstance) {
      geocoderInstance = new google.maps.Geocoder();
    }

    geocoderInstance.geocode(request, (results, status) => {
      const okStatus = google.maps.GeocoderStatus.OK;
      const zeroResults = google.maps.GeocoderStatus.ZERO_RESULTS;

      if (status === zeroResults) {
        resolve([]);
        return;
      }

      if (status !== okStatus) {
        reject(new Error(`Geocoder failed: ${status}`));
        return;
      }

      resolve(results || []);
    });
  });

export const createPlacesSessionToken = async () => {
  const google = await loadGoogleMaps({ libraries: ["places"] });
  return new google.maps.places.AutocompleteSessionToken();
};

export const searchPlaces = async (query, options = {}) => {
  const trimmed = String(query || "").trim();
  if (trimmed.length < 2) return [];

  const {
    country = DEFAULT_COUNTRY,
    bounds = MEXICO_BOUNDS,
    limit = MAX_RESULTS,
    signal,
    sessionToken,
  } = options;

  ensureNotAborted(signal);

  const google = await loadGoogleMaps({ libraries: ["places"] });
  ensureNotAborted(signal);

  const request = {
    input: trimmed,
    language: "es",
    region: country ? String(country).toLowerCase() : undefined,
    componentRestrictions: country
      ? { country: String(country).toLowerCase() }
      : undefined,
    bounds: toLatLngBounds(google, bounds),
    strictBounds: false,
    sessionToken,
  };

  const predictions = await wrapPredictions(google, request);
  ensureNotAborted(signal);

  const topPredictions = predictions.slice(0, Math.max(1, limit));

  const detailed = await Promise.all(
    topPredictions.map(async (prediction) => {
      try {
        const details = await wrapPlaceDetails(google, prediction.place_id);
        ensureNotAborted(signal);
        return normalizeGeocoderResult(details);
      } catch {
        return null;
      }
    }),
  );

  return detailed.filter(Boolean);
};

export const reverseGeocode = async (lat, lng, options = {}) => {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const { signal } = options;

  ensureNotAborted(signal);
  const google = await loadGoogleMaps();
  ensureNotAborted(signal);

  const results = await geocodeByRequest(google, {
    location: { lat, lng },
    language: "es",
  });

  ensureNotAborted(signal);
  if (!results.length) return null;
  return normalizeGeocoderResult(results[0], lat, lng);
};

export const geocodeAddress = async (address, options = {}) => {
  const trimmed = String(address || "").trim();
  if (!trimmed) return [];

  const { country = DEFAULT_COUNTRY, signal } = options;

  ensureNotAborted(signal);
  const google = await loadGoogleMaps();
  ensureNotAborted(signal);

  const componentRestrictions = country
    ? { country: String(country).toLowerCase() }
    : undefined;

  const results = await geocodeByRequest(google, {
    address: trimmed,
    componentRestrictions,
    language: "es",
  });

  ensureNotAborted(signal);
  return results.map((item) => normalizeGeocoderResult(item)).filter(Boolean);
};

export const emptyNormalizedLocation = (lat = null, lng = null) => ({
  ...EMPTY_NORMALIZED,
  lat,
  lng,
});
