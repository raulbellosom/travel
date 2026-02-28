/**
 * MapPicker - interactive Google Map for selecting a location.
 * Supports click-to-place marker, draggable marker, and reverse geocoding.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  GOOGLE_DARK_MAP_STYLE,
  GOOGLE_LIGHT_MAP_STYLE,
  GOOGLE_MAPS_MAP_ID,
  MEXICO_BOUNDS,
} from "../../../../config/map.config";
import {
  emptyNormalizedLocation,
  reverseGeocode,
} from "../../../../services/googleMaps.service";
import { loadGoogleMaps } from "../../../../services/googleMaps.loader";

const isDarkMode = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

const boundsToRestriction = () => {
  const [sw, ne] = MEXICO_BOUNDS;
  return {
    north: ne[1],
    south: sw[1],
    east: ne[0],
    west: sw[0],
  };
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

  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const listenersRef = useRef([]);
  const abortRef = useRef(null);

  // Track the last lat/lng we received from props so we only reset
  // position when the PARENT explicitly changes the coordinates —
  // NOT when position changes internally from a user click.
  const lastExternalLatRef = useRef(parseFloat(latitude));
  const lastExternalLngRef = useRef(parseFloat(longitude));

  useEffect(() => {
    const newLat = parseFloat(latitude);
    const newLng = parseFloat(longitude);
    if (
      !Number.isNaN(newLat) &&
      !Number.isNaN(newLng) &&
      (newLat !== lastExternalLatRef.current ||
        newLng !== lastExternalLngRef.current)
    ) {
      lastExternalLatRef.current = newLat;
      lastExternalLngRef.current = newLng;
      setPosition({ lat: newLat, lng: newLng });
    }
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

  // Options used only when the map is first created (include center + zoom).
  // Never passed to setOptions — that would reset the user's current zoom level.
  const initMapOptions = useMemo(
    () => ({
      center: position,
      zoom,
      gestureHandling: "greedy",
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      mapId: GOOGLE_MAPS_MAP_ID || undefined,
      styles: GOOGLE_MAPS_MAP_ID
        ? undefined
        : dark
          ? GOOGLE_DARK_MAP_STYLE
          : GOOGLE_LIGHT_MAP_STYLE,
      restriction: restrictToBounds
        ? {
            latLngBounds: boundsToRestriction(),
            strictBounds: false,
          }
        : undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dark, position, restrictToBounds, zoom],
  );

  // Options safe to pass to setOptions on subsequent renders.
  // Intentionally excludes `center` and `zoom` so existing camera state is preserved.
  const updateMapOptions = useMemo(
    () => ({
      gestureHandling: "greedy",
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      mapId: GOOGLE_MAPS_MAP_ID || undefined,
      styles: GOOGLE_MAPS_MAP_ID
        ? undefined
        : dark
          ? GOOGLE_DARK_MAP_STYLE
          : GOOGLE_LIGHT_MAP_STYLE,
      restriction: restrictToBounds
        ? {
            latLngBounds: boundsToRestriction(),
            strictBounds: false,
          }
        : undefined,
    }),
    [dark, restrictToBounds],
  );

  const clearListeners = () => {
    listenersRef.current.forEach((listener) => listener.remove());
    listenersRef.current = [];
  };

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
          onSelect?.(emptyNormalizedLocation(lat, lng));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [onSelect, readOnly],
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const google = await loadGoogleMaps();
      if (!mounted || !mapNodeRef.current) return;

      if (!mapRef.current) {
        // First mount — use full options including center + zoom
        mapRef.current = new google.maps.Map(
          mapNodeRef.current,
          initMapOptions,
        );
      } else {
        // Subsequent renders — only update style/controls/restriction, NOT zoom or center
        mapRef.current.setOptions(updateMapOptions);
      }

      if (!markerRef.current) {
        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position,
          gmpDraggable: !readOnly,
        });
      } else {
        markerRef.current.map = mapRef.current;
        markerRef.current.position = position;
        markerRef.current.gmpDraggable = !readOnly;
      }

      clearListeners();

      if (!readOnly) {
        listenersRef.current.push(
          mapRef.current.addListener("click", (event) => {
            const lat = event.latLng?.lat?.();
            const lng = event.latLng?.lng?.();
            if (typeof lat === "number" && typeof lng === "number") {
              handleReverseGeocode(lat, lng);
            }
          }),
        );

        listenersRef.current.push(
          markerRef.current.addListener("dragend", () => {
            const pos = markerRef.current?.position;
            if (!pos) return;
            const lat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
            const lng = typeof pos.lng === "function" ? pos.lng() : pos.lng;
            if (typeof lat === "number" && typeof lng === "number") {
              handleReverseGeocode(lat, lng);
            }
          }),
        );
      }
    };

    init().catch(() => {});

    return () => {
      mounted = false;
    };
    // position intentionally excluded — marker/pan updates are handled by the effect below
    // initMapOptions excluded — only needed on first mount (mapRef.current guard handles it)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleReverseGeocode, updateMapOptions, readOnly]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.position = position;
    // panTo keeps the current zoom — only pans the camera to the new pin
    mapRef.current.panTo(position);
  }, [position]);

  useEffect(() => {
    return () => {
      clearListeners();
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (markerRef.current) {
        markerRef.current.map = null;
      }
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ height }}>
      <div ref={mapNodeRef} className="h-full w-full" />

      {loading && (
        <div className="absolute left-3 top-3 z-10 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow backdrop-blur dark:bg-slate-800/90 dark:text-slate-200">
          Obteniendo direccion...
        </div>
      )}
    </div>
  );
};

export default MapPicker;
