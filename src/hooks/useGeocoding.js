/**
 * useGeocoding — custom hook for Mapbox forward and reverse geocoding.
 * Handles loading state, error state, debounced search, and request cancellation
 * to avoid race conditions from outdated requests.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { searchPlaces, reverseGeocode } from "../services/mapbox.service";
import debounce from "../utils/debounce";
import { DEBOUNCE_MS, MIN_QUERY_LENGTH } from "../config/map.config";

/**
 * @param {Object} [options]
 * @param {number} [options.debounceMs] - Custom debounce delay
 * @param {number} [options.minLength] - Minimum query length to trigger search
 * @returns {{ results, search, reverse, loading, error, clearResults }}
 */
const useGeocoding = (options = {}) => {
  const { debounceMs = DEBOUNCE_MS, minLength = MIN_QUERY_LENGTH } = options;

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const debouncedRef = useRef(null);

  /**
   * Cancel any in-flight request.
   */
  const cancelPending = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  /**
   * Execute a forward geocoding search immediately (no debounce).
   */
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
        const data = await searchPlaces(query, {
          ...searchOptions,
          signal: controller.signal,
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
    [minLength, cancelPending],
  );

  /**
   * Debounced forward geocoding search.
   * Cancels previous timer and in-flight requests automatically.
   */
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
        return;
      }
      setLoading(true);
      debouncedRef.current?.(query, searchOptions);
    },
    [minLength],
  );

  /**
   * Reverse geocoding — get address from coordinates.
   * Not debounced, executes immediately.
   */
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

  /**
   * Clear the current results list.
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  /**
   * Cleanup on unmount — cancel pending requests and debounce timers.
   */
  useEffect(() => {
    return () => {
      cancelPending();
      debouncedRef.current?.cancel();
    };
  }, [cancelPending]);

  return {
    results,
    search,
    reverse,
    loading,
    error,
    clearResults,
  };
};

export default useGeocoding;
