/**
 * LocationPicker — Self-contained geolocation component combining autocomplete search,
 * interactive Google map with draggable marker and reverse geocoding.
 *
 * Designed as a reusable, standalone component for property forms or any context
 * requiring location selection with geocoded address data.
 *
 * Props:
 *   value            - initial location object { lat, lng }
 *   onChange          - callback(NormalizedLocation) on location change
 *   height           - map height CSS string (default "400px")
 *   zoom             - initial zoom level (default from config)
 *   restrictToBounds - restrict panning to Mexico bounds
 *   className        - extra wrapper classes
 *   placeholder      - search input placeholder text
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Search, X, LocateFixed } from "lucide-react";
import MapPicker from "../common/molecules/MapPicker";
import useGeocoding from "../../hooks/useGeocoding";
import {
  emptyNormalizedLocation,
  reverseGeocode,
} from "../../services/googleMaps.service";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "../../config/map.config";

const LocationPicker = ({
  value,
  onChange,
  height = "400px",
  zoom = DEFAULT_ZOOM,
  restrictToBounds = false,
  className = "",
  placeholder,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState(null);
  const [selected, setSelected] = useState(null);
  const [geolocating, setGeolocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const dropdownRef = useRef(null);

  const {
    results: searchResults,
    search,
    loading: searching,
    clearResults,
  } = useGeocoding();

  const initialLat = value?.lat || DEFAULT_CENTER.lat;
  const initialLng = value?.lng || DEFAULT_CENTER.lng;

  const handleSearchChange = useCallback(
    (e) => {
      const val = e.target.value;
      setSearchQuery(val);
      search(val);
    },
    [search],
  );

  const handleResultClick = useCallback(
    (result) => {
      setMapCenter({ lat: result.lat, lng: result.lng });
      clearResults();
      setSearchQuery(result.formattedAddress || "");
      setSelected(result);
      onChange?.(result);
    },
    [clearResults, onChange],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    clearResults();
  }, [clearResults]);

  const handleMapSelect = useCallback(
    (location) => {
      setSelected(location);
      onChange?.(location);
    },
    [onChange],
  );

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError(t("mapPicker.geoNotSupported"));
      return;
    }
    setGeolocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapCenter({ lat, lng });

        try {
          const location = await reverseGeocode(lat, lng);
          if (location) {
            setSelected(location);
            onChange?.(location);
          }
        } catch {
          const fallback = emptyNormalizedLocation(lat, lng);
          setSelected(fallback);
          onChange?.(fallback);
        }
        setGeolocating(false);
      },
      () => {
        setGeoError(t("mapPicker.geoError"));
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [t, onChange]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        clearResults();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clearResults]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search bar + geolocation button */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative flex-1" ref={dropdownRef}>
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={placeholder || t("mapPicker.searchPlaceholder")}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pr-8 pl-9 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            aria-label={t("mapPicker.searchPlaceholder")}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}

          {searchResults.length > 0 && (
            <ul
              className="absolute top-full right-0 left-0 z-1100 mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
              role="listbox"
              aria-label={t("mapPicker.searchPlaceholder")}
            >
              {searchResults.map((result, index) => (
                <li key={`${result.lat}-${result.lng}-${index}`} role="option">
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => handleResultClick(result)}
                  >
                    <MapPin
                      size={14}
                      className="mt-0.5 shrink-0 text-cyan-600"
                    />
                    <span className="line-clamp-2">
                      {result.formattedAddress}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {searching && (
            <div className="absolute top-full right-0 left-0 z-1100 mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              {t("common.loading")}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGeolocate}
          disabled={geolocating}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          aria-label={t("mapPicker.useMyLocation")}
        >
          <LocateFixed
            size={16}
            className={geolocating ? "animate-pulse" : ""}
          />
          <span className="hidden sm:inline">
            {t("mapPicker.useMyLocation")}
          </span>
        </button>
      </div>

      {geoError && (
        <span className="text-xs text-red-600 dark:text-red-400">
          {geoError}
        </span>
      )}

      {/* Interactive Map */}
      <MapPicker
        latitude={mapCenter?.lat ?? initialLat}
        longitude={mapCenter?.lng ?? initialLng}
        onSelect={handleMapSelect}
        height={height}
        zoom={zoom}
        restrictToBounds={restrictToBounds}
      />

      {/* Selected location summary */}
      {selected && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
            <MapPin size={14} className="text-cyan-600" />
            {t("mapPicker.selectedLocation")}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {selected.formattedAddress ||
              `${selected.lat.toFixed(6)}, ${selected.lng.toFixed(6)}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
