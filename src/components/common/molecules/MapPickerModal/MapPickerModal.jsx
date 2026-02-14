/**
 * MapPickerModal — Modal wrapper around MapPicker for selecting a property location.
 * Opens a large modal with the interactive map. On confirm, returns lat, lng, and
 * reverse-geocoded address data to auto-fill the form fields.
 *
 * Props:
 *   isOpen       – controls visibility
 *   onClose      – called to dismiss the modal
 *   onConfirm    – callback({ lat, lng, address }) when user confirms
 *   latitude     – initial lat
 *   longitude    – initial lng
 */
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Check, LocateFixed, Search, X } from "lucide-react";
import Modal, { ModalFooter } from "../../organisms/Modal";
import { Button } from "../../atoms";
import MapPicker, { reverseGeocode, parseAddress } from "../MapPicker";

/**
 * Forward-geocode via Nominatim (free, no API key).
 * Returns an array of { lat, lon, display_name, address } results.
 * Includes retry logic for 425/429 errors.
 */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const searchAddress = async (query, retries = 2) => {
  if (!query || query.length < 3) return [];
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) await delay(1200 * attempt);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=es`,
        { cache: "no-store" },
      );
      if (res.status === 425 || res.status === 429) {
        if (attempt < retries - 1) continue;
        return [];
      }
      if (!res.ok) return [];
      return await res.json();
    } catch {
      if (attempt < retries - 1) continue;
      return [];
    }
  }
  return [];
};

const MapPickerModal = ({
  isOpen,
  onClose,
  onConfirm,
  latitude,
  longitude,
}) => {
  const { t } = useTranslation();

  const [selected, setSelected] = useState(null);
  const [geolocating, setGeolocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  // Track user's first interaction so we can update the map center
  const [mapCenter, setMapCenter] = useState(null);

  // Address search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  const handleSelect = useCallback((data) => {
    setSelected(data);
  }, []);

  const handleConfirm = () => {
    if (selected) {
      onConfirm?.(selected);
    }
    onClose();
  };

  /** Debounced address search */
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    clearTimeout(searchTimeout.current);

    if (value.length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchAddress(value);
      setSearchResults(results);
      setSearching(false);
    }, 400);
  }, []);

  /** When user picks a search result, center the map and use address data directly */
  const handleSearchResultClick = useCallback((result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapCenter({ lat, lng });
    setSearchResults([]);
    setSearchQuery(result.display_name);

    // The /search endpoint already returns addressdetails — use them directly
    // instead of making a second reverse-geocode request
    const address = parseAddress({ address: result.address });
    setSelected({ lat, lng, address });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  /** Use browser geolocation to center map on user's real position */
  const handleGeolocate = () => {
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

        // Auto-select: reverse geocode the user's position
        const data = await reverseGeocode(lat, lng);
        const address = parseAddress(data);
        setSelected({ lat, lng, address });
        setGeolocating(false);
      },
      () => {
        setGeoError(t("mapPicker.geoError"));
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const footer = (
    <ModalFooter>
      <Button variant="ghost" size="md" onClick={onClose}>
        {t("common.cancel")}
      </Button>
      <Button
        variant="primary"
        size="md"
        leftIcon={Check}
        disabled={!selected}
        onClick={handleConfirm}
      >
        {t("mapPicker.confirm")}
      </Button>
    </ModalFooter>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("mapPicker.title")}
      description={t("mapPicker.description")}
      size="2xl"
      closeOnBackdrop={false}
      footer={footer}
    >
      <div className="space-y-3">
        {/* Search input + geolocate button */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t("mapPicker.searchPlaceholder")}
              className="min-h-[38px] w-full rounded-lg border border-slate-300 bg-white py-2 pr-8 pl-9 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <ul className="absolute top-full right-0 left-0 z-[1100] mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {searchResults.map((result) => (
                  <li key={result.place_id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => handleSearchResultClick(result)}
                    >
                      <MapPin
                        size={14}
                        className="mt-0.5 shrink-0 text-cyan-600"
                      />
                      <span className="line-clamp-2">
                        {result.display_name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {searching && (
              <div className="absolute top-full right-0 left-0 z-[1100] mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                {t("common.loading")}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={LocateFixed}
            loading={geolocating}
            onClick={handleGeolocate}
            className="shrink-0"
          >
            {t("mapPicker.useMyLocation")}
          </Button>
        </div>

        {geoError && (
          <span className="text-xs text-red-600 dark:text-red-400">
            {geoError}
          </span>
        )}

        {/* Interactive Map */}
        <MapPicker
          latitude={mapCenter?.lat ?? latitude}
          longitude={mapCenter?.lng ?? longitude}
          onSelect={handleSelect}
          height="420px"
          zoom={14}
        />

        {/* Selected coordinates preview */}
        {selected && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-1 flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
              <MapPin size={14} className="text-cyan-600" />
              {t("mapPicker.selectedLocation")}
            </div>
            <div className="grid gap-1 text-xs text-slate-600 dark:text-slate-300">
              <p>
                <span className="font-medium">{t("mapPicker.coordinates")}:</span>{" "}
                {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
              </p>
              {selected.address?.streetAddress && (
                <p>
                  <span className="font-medium">{t("propertyForm.fields.streetAddress")}:</span>{" "}
                  {selected.address.streetAddress}
                </p>
              )}
              {selected.address?.neighborhood && (
                <p>
                  <span className="font-medium">{t("propertyForm.fields.neighborhood")}:</span>{" "}
                  {selected.address.neighborhood}
                </p>
              )}
              {selected.address?.city && (
                <p>
                  <span className="font-medium">{t("propertyForm.fields.city")}:</span>{" "}
                  {selected.address.city}
                </p>
              )}
              {selected.address?.state && (
                <p>
                  <span className="font-medium">{t("propertyForm.fields.state")}:</span>{" "}
                  {selected.address.state}
                </p>
              )}
              {selected.address?.postalCode && (
                <p>
                  <span className="font-medium">{t("propertyForm.fields.postalCode")}:</span>{" "}
                  {selected.address.postalCode}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MapPickerModal;
