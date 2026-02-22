/**
 * useGeocoding - custom hook for Google Places/Geocoding.
 * Handles loading state, error state, debounced search, and request cancellation.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPlacesSessionToken,
  reverseGeocode,
  searchPlaces,
} from "../services/googleMaps.service";
import debounce from "../utils/debounce";
import { DEBOUNCE_MS, MIN_QUERY_LENGTH } from "../config/map.config";

/**
 * @param {Object} [options]
 * @param {number} [options.debounceMs] - Custom debounce delay
 * @param {number} [options.minLength] - Minimum query length to trigger search
 * @returns {{ results, search, reverse, loading, error, clearResults, resetSession }}
 */
const useGeocoding = (options = {}) => {
  const { debounceMs = DEBOUNCE_MS, minLength = MIN_QUERY_LENGTH } = options;

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const debouncedRef = useRef(null);
  const sessionTokenRef = useRef(null);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
  }, []);

  const ensureSessionToken = useCallback(async () => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = await createPlacesSessionToken();
    }
    return sessionTokenRef.current;
  }, []);

  const cancelPending = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const executeSearch = useCallback(
    async (query, searchOptions = {}) => {
      if (!query || query.trim().length < minLength) {
        setResults([]);
        setLoading(false);
        return;
      }

      cancelPending();

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const sessionToken = await ensureSessionToken();
        const data = await searchPlaces(query, {
          ...searchOptions,
          signal: controller.signal,
          sessionToken,
        });

        if (!controller.signal.aborted) {
          setResults(data);
          setLoading(false);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setError(err.message);
          setResults([]);
          setLoading(false);
        }
      }
    },
    [minLength, cancelPending, ensureSessionToken],
  );

  useEffect(() => {
    debouncedRef.current = debounce(executeSearch, debounceMs);
    return () => {
      debouncedRef.current?.cancel();
    };
  }, [executeSearch, debounceMs]);

  const search = useCallback(
    (query, searchOptions = {}) => {
      if (!query || query.trim().length < minLength) {
        setResults([]);
        setLoading(false);
        debouncedRef.current?.cancel();
        resetSession();
        return;
      }
      setLoading(true);
      debouncedRef.current?.(query, searchOptions);
    },
    [minLength, resetSession],
  );

  const reverse = useCallback(
    async (lat, lng) => {
      cancelPending();

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const location = await reverseGeocode(lat, lng, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setLoading(false);
          return location;
        }
        return null;
      } catch (err) {
        if (err.name === "AbortError") return null;
        if (!controller.signal.aborted) {
          setError(err.message);
          setLoading(false);
        }
        return null;
      }
    },
    [cancelPending],
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    resetSession();
  }, [resetSession]);

  useEffect(() => {
    return () => {
      cancelPending();
      debouncedRef.current?.cancel();
      resetSession();
    };
  }, [cancelPending, resetSession]);

  return {
    results,
    search,
    reverse,
    loading,
    error,
    clearResults,
    resetSession,
  };
};

export default useGeocoding;
