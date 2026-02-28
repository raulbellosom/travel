/**
 * MapDisplay - read-only Google Map showing a resource location.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GOOGLE_DARK_MAP_STYLE,
  GOOGLE_LIGHT_MAP_STYLE,
  GOOGLE_MAPS_MAP_ID,
} from "../../../../config/map.config";
import { loadGoogleMaps } from "../../../../services/googleMaps.loader";

const isDarkMode = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

const MapDisplay = ({
  latitude,
  longitude,
  label,
  height = "280px",
  zoom = 15,
  className = "",
}) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const [dark, setDark] = useState(isDarkMode);

  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markerClickListenerRef = useRef(null);

  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

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

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (Number.isNaN(lat) || Number.isNaN(lng) || !mapNodeRef.current) {
        return;
      }

      const google = await loadGoogleMaps();
      if (!mounted) return;

      const mapOptions = {
        center,
        zoom,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
        keyboardShortcuts: false,
        clickableIcons: false,
        mapId: GOOGLE_MAPS_MAP_ID || undefined,
        // styles cannot be set together with mapId — cloud console controls styling
        styles: GOOGLE_MAPS_MAP_ID
          ? undefined
          : dark
            ? GOOGLE_DARK_MAP_STYLE
            : GOOGLE_LIGHT_MAP_STYLE,
      };

      if (!mapRef.current) {
        mapRef.current = new google.maps.Map(mapNodeRef.current, mapOptions);
      } else {
        mapRef.current.setOptions(mapOptions);
      }

      if (!markerRef.current) {
        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position: center,
        });
      } else {
        markerRef.current.map = mapRef.current;
        markerRef.current.position = center;
      }

      if (label) {
        if (!infoWindowRef.current) {
          infoWindowRef.current = new google.maps.InfoWindow({
            content: label,
          });
        } else {
          infoWindowRef.current.setContent(label);
        }

        markerClickListenerRef.current?.remove();
        markerClickListenerRef.current = markerRef.current.addListener(
          "gmp-click",
          () => {
            infoWindowRef.current?.open({
              map: mapRef.current,
              anchor: markerRef.current,
            });
          },
        );
      }

      mapRef.current.setCenter(center);
    };

    init().catch(() => {});

    return () => {
      mounted = false;
    };
  }, [center, dark, label, lat, lng, zoom]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
      }
      markerClickListenerRef.current?.remove();
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return (
    <div
      className={`overflow-hidden rounded-2xl ${className}`}
      style={{ height }}
    >
      <div ref={mapNodeRef} className="h-full w-full" />
    </div>
  );
};

export default MapDisplay;
